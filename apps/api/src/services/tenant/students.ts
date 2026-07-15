import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import { prisma } from '../../lib/prisma.js';
import { AppError, QuotaExceededError } from '../../middleware/error.middleware.js';
import { assertTenantQuota } from '../subscription.service.js';
import { createStudentSchema, formatStudentRow, patchStudentSchema } from './shared.js';

export async function listStudents(tenantId: string) {
  const memberships = await prisma.tenantMembership.findMany({
    where: { tenantId, role: 'LEARNER' },
    include: { user: { select: { id: true, email: true, name: true, username: true } } },
    orderBy: { joinedAt: 'desc' },
  });
  const learnerIds = memberships.map((m) => m.user.id);
  if (learnerIds.length === 0) return [];

  // Aggregate in a fixed number of queries instead of N-per-student (avoids N+1).
  const [assignCounts, progressRows, quizAgg, masteryAgg] = await Promise.all([
    prisma.contentAssignment.groupBy({
      by: ['learnerId'],
      where: { learnerId: { in: learnerIds }, content: { tenantId } },
      _count: { _all: true },
    }),
    prisma.contentProgress.findMany({
      where: { userId: { in: learnerIds }, content: { tenantId } },
      select: { userId: true, lastActivityAt: true },
      orderBy: { lastActivityAt: 'desc' },
    }),
    prisma.quizAttempt.groupBy({
      by: ['userId'],
      where: { userId: { in: learnerIds }, quiz: { content: { tenantId } } },
      _avg: { score: true },
    }),
    prisma.contentProgress.groupBy({
      by: ['userId'],
      where: { userId: { in: learnerIds }, content: { tenantId } },
      _avg: { overallCoverage: true },
    }),
  ]);

  const assignMap = new Map(assignCounts.map((r) => [r.learnerId, r._count._all]));
  const lastActivityMap = new Map<string, Date>();
  for (const p of progressRows) {
    if (!lastActivityMap.has(p.userId)) lastActivityMap.set(p.userId, p.lastActivityAt);
  }
  const avgMap = new Map(quizAgg.map((r) => [r.userId, r._avg.score]));
  const masteryMap = new Map(masteryAgg.map((r) => [r.userId, r._avg.overallCoverage]));

  return memberships.map((m) => {
    const uid = m.user.id;
    const hasUsername = Boolean(m.user.username);
    const rawMastery = masteryMap.get(uid);
    return {
      id: uid,
      email: hasUsername ? null : m.user.email,
      username: m.user.username ?? null,
      name: m.user.name,
      active: m.active,
      joinedAt: m.joinedAt.toISOString(),
      assignedCount: assignMap.get(uid) ?? 0,
      lastActivityAt: lastActivityMap.get(uid)?.toISOString() ?? null,
      avgQuizScore: avgMap.get(uid) ?? null,
      mastery: rawMastery == null ? null : Math.round(rawMastery),
    };
  });
}

export interface ProvisionStudentParams {
  name?: string;
  email?: string;
  username?: string;
  password?: string;
}

export interface ProvisionStudentResult {
  result: 'created' | 'reactivated';
  temporaryPassword: string;
  user: { id: string; email: string; name: string | null; username: string | null };
  student?: Awaited<ReturnType<typeof formatStudentRow>>;
}

/**
 * Core student provisioning shared by single-create and CSV/bulk import. Resolves the
 * username/email, dedupes against existing users, and either reactivates a previously-removed
 * membership or creates a fresh user + membership.
 *
 * Seat quota: NOT checked here unless `assertSeatBeforeConsume` is set. `createStudent`
 * asserts the quota itself, up-front and unconditionally, to preserve its exact original
 * behaviour; bulk import passes `assertSeatBeforeConsume: true` so the seat check runs (and
 * re-queries the live active-student count) only on the seat-consuming create/reactivate
 * paths — giving natural partial-import behaviour at the seat limit.
 */
async function provisionStudent(
  tenantId: string,
  params: ProvisionStudentParams,
  opts: { assertSeatBeforeConsume?: boolean; formatRow?: boolean } = {},
): Promise<ProvisionStudentResult> {
  const formatRow = opts.formatRow ?? true;
  const username = params.username?.trim();
  let email = params.email?.trim();

  if (username) {
    const taken = await prisma.user.findUnique({ where: { username }, select: { id: true } });
    if (taken) throw new AppError(409, 'Username already taken');
    // Synthesize a stable internal email for username-only (email-less) students.
    if (!email) email = `${username.toLowerCase()}@students.talim.local`;
  }
  if (!email) throw new AppError(400, 'Provide an email or a username for the student');

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const membership = await prisma.tenantMembership.findUnique({
      where: { tenantId_userId: { tenantId, userId: existing.id } },
    });
    if (membership) {
      if (membership.active) {
        throw new AppError(409, 'Student already exists in this organization');
      }
      // Re-adding a previously-removed student reactivates the membership and issues fresh
      // credentials. Reactivating consumes a seat, so re-check the quota when asked to.
      if (opts.assertSeatBeforeConsume) await assertTenantQuota(tenantId, 'STUDENT');
      const tempPassword = params.password ?? crypto.randomUUID().slice(0, 12);
      const passwordHash = await bcrypt.hash(tempPassword, 12);
      await prisma.$transaction([
        prisma.tenantMembership.update({ where: { id: membership.id }, data: { active: true } }),
        prisma.user.update({
          where: { id: existing.id },
          data: { passwordHash, mustChangePassword: !params.password },
        }),
      ]);
      const reactivated = await prisma.tenantMembership.findUniqueOrThrow({
        where: { id: membership.id },
        include: { user: { select: { id: true, email: true, name: true, username: true } } },
      });
      return {
        result: 'reactivated',
        temporaryPassword: tempPassword,
        user: reactivated.user,
        student: formatRow ? await formatStudentRow(reactivated, tenantId) : undefined,
      };
    }
    throw new AppError(409, 'Email already registered');
  }

  if (opts.assertSeatBeforeConsume) await assertTenantQuota(tenantId, 'STUDENT');

  const tempPassword = params.password ?? crypto.randomUUID().slice(0, 12);
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  let user;
  try {
    user = await prisma.user.create({
      data: {
        email,
        username: username ?? null,
        passwordHash,
        // Auto-generated passwords should be changed on first login; tutor-set ones need not.
        mustChangePassword: !params.password,
        name: params.name ?? null,
        role: 'TENANT_LEARNER',
        tenantMemberships: {
          create: { tenantId, role: 'LEARNER' },
        },
      },
    });
  } catch (err) {
    // Two simultaneous creates (e.g. a double-click) can both pass the findUnique checks
    // above, then race onto the unique email/username constraint. Surface a clean 409
    // instead of a raw 500 (Prisma P2002 unique-constraint violation).
    if ((err as { code?: string }).code === 'P2002') {
      throw new AppError(409, 'Username already taken');
    }
    throw err;
  }

  const membership = await prisma.tenantMembership.findFirstOrThrow({
    where: { tenantId, userId: user.id },
    include: { user: { select: { id: true, email: true, name: true, username: true } } },
  });

  return {
    result: 'created',
    temporaryPassword: tempPassword,
    user: membership.user,
    student: formatRow ? await formatStudentRow(membership, tenantId) : undefined,
  };
}

export async function createStudent(tenantId: string, assignedById: string, input: unknown) {
  const body = createStudentSchema.parse(input);
  // Assert the seat quota up-front and unconditionally (unchanged behaviour); provisionStudent
  // therefore must NOT re-assert it on the seat-consuming paths.
  await assertTenantQuota(tenantId, 'STUDENT');
  const result = await provisionStudent(tenantId, {
    name: body.name,
    email: body.email,
    username: body.username,
    password: body.password,
  });
  return { student: result.student!, temporaryPassword: result.temporaryPassword };
}

const MAX_IMPORT_ROWS = 1000;

interface ImportRowInput {
  name?: string;
  email?: string;
  username?: string;
}

/** Minimal, dependency-free CSV parse. Supports quoted fields ("a,b", "" escapes) and an
 *  optional header row (columns name/email/username in any order). Without a header, columns
 *  are positional: col0=name, col1=email (if it contains '@') else username. */
function parseCsv(csv: string): ImportRowInput[] {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length === 0) return [];

  const parseLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"') {
          if (line[i + 1] === '"') {
            cur += '"';
            i += 1;
          } else {
            inQuotes = false;
          }
        } else {
          cur += ch;
        }
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        out.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
    out.push(cur);
    return out.map((s) => s.trim());
  };

  const first = parseLine(lines[0] ?? '').map((c) => c.toLowerCase());
  const headerCols = ['name', 'email', 'username'];
  const hasHeader = first.some((c) => headerCols.includes(c));
  const idx = hasHeader
    ? {
        name: first.indexOf('name'),
        email: first.indexOf('email'),
        username: first.indexOf('username'),
      }
    : { name: 0, email: -1, username: -1 };
  const dataLines = hasHeader ? lines.slice(1) : lines;

  return dataLines.map((line) => {
    const cols = parseLine(line);
    const pick = (i: number) => (i >= 0 && cols[i] ? cols[i] : undefined);
    if (hasHeader) {
      return { name: pick(idx.name), email: pick(idx.email), username: pick(idx.username) };
    }
    const name = pick(0);
    const second = pick(1);
    if (second && second.includes('@')) return { name, email: second };
    return { name, username: second };
  });
}

/** Accept either a parsed `rows` array or a raw `csv` string body. */
function normalizeImportInput(input: unknown): ImportRowInput[] {
  if (input && typeof input === 'object') {
    const obj = input as Record<string, unknown>;
    if (Array.isArray(obj.rows)) {
      return obj.rows
        .filter((r): r is Record<string, unknown> => Boolean(r) && typeof r === 'object')
        .map((r) => ({
          name: typeof r.name === 'string' ? r.name : undefined,
          email: typeof r.email === 'string' ? r.email : undefined,
          username: typeof r.username === 'string' ? r.username : undefined,
        }));
    }
    if (typeof obj.csv === 'string') return parseCsv(obj.csv);
  }
  return [];
}

/** Derive a unique username for a name-only import row (email-less student). */
async function generateImportUsername(name: string): Promise<string> {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '')
      .slice(0, 20) || 'student';
  for (let i = 0; i < 10; i += 1) {
    const candidate = `${base}${crypto.randomBytes(3).toString('hex')}`;
    const taken = await prisma.user.findUnique({
      where: { username: candidate },
      select: { id: true },
    });
    if (!taken) return candidate;
  }
  return `${base}${crypto.randomUUID().slice(0, 8)}`;
}

export interface StudentImportRowReport {
  row: number;
  name: string;
  result: 'created' | 'reactivated' | 'skipped_duplicate' | 'error_seat_limit' | 'error';
  message?: string;
  username?: string | null;
  email?: string | null;
  temporaryPassword?: string;
}

/**
 * Bulk-provision students from a CSV string (`{ csv }`) or a parsed list (`{ rows }`), up to the
 * remaining seat limit. Partial import: rows beyond the seat limit are reported as
 * `error_seat_limit` while earlier rows still commit. Never throws for a bad row — every row
 * gets an entry in the returned report.
 */
export async function importStudents(tenantId: string, _assignedById: string, input: unknown) {
  const rows = normalizeImportInput(input);
  if (rows.length === 0) {
    throw new AppError(400, 'No rows to import. Provide a CSV file (csv) or a rows array.');
  }

  const report: StudentImportRowReport[] = [];
  let rowNum = 0;
  for (const raw of rows) {
    rowNum += 1;
    const name = raw.name?.trim() ?? '';
    if (rowNum > MAX_IMPORT_ROWS) {
      report.push({
        row: rowNum,
        name,
        result: 'error',
        message: `Row limit is ${MAX_IMPORT_ROWS}`,
      });
      continue;
    }
    if (!name) {
      report.push({ row: rowNum, name: '', result: 'error', message: 'Name is required' });
      continue;
    }
    const email = raw.email?.trim() || undefined;
    let username = raw.username?.trim() || undefined;
    try {
      // A name-only row has no unique identifier → generate an email-less username student.
      if (!email && !username) username = await generateImportUsername(name);
      const r = await provisionStudent(
        tenantId,
        { name, email, username },
        { assertSeatBeforeConsume: true, formatRow: false },
      );
      report.push({
        row: rowNum,
        name,
        result: r.result,
        username: r.user.username,
        email: r.user.username ? null : r.user.email,
        temporaryPassword: r.temporaryPassword,
      });
    } catch (err) {
      if (err instanceof QuotaExceededError) {
        report.push({
          row: rowNum,
          name,
          result: 'error_seat_limit',
          message: 'Seat limit reached',
        });
      } else if (
        err instanceof AppError &&
        err.statusCode === 409 &&
        /already exists in this organization/i.test(err.message)
      ) {
        report.push({ row: rowNum, name, result: 'skipped_duplicate', message: err.message });
      } else if (err instanceof AppError) {
        report.push({ row: rowNum, name, result: 'error', message: err.message });
      } else {
        report.push({ row: rowNum, name, result: 'error', message: 'Unexpected error' });
      }
    }
  }

  const countBy = (result: StudentImportRowReport['result']) =>
    report.filter((r) => r.result === result).length;
  return {
    report,
    summary: {
      total: report.length,
      created: countBy('created'),
      reactivated: countBy('reactivated'),
      skipped: countBy('skipped_duplicate'),
      seatLimited: countBy('error_seat_limit'),
      errors: countBy('error'),
    },
  };
}

export async function patchStudent(tenantId: string, learnerId: string, input: unknown) {
  const body = patchStudentSchema.parse(input);
  const membership = await prisma.tenantMembership.findFirst({
    where: { tenantId, userId: learnerId, role: 'LEARNER' },
    include: { user: { select: { id: true, email: true, name: true } } },
  });
  if (!membership) throw new AppError(404, 'Student not found');

  if (body.name) {
    await prisma.user.update({ where: { id: learnerId }, data: { name: body.name } });
  }
  if (body.active !== undefined) {
    // Reactivating a student consumes a seat — re-check the quota.
    if (body.active && !membership.active) {
      await assertTenantQuota(tenantId, 'STUDENT');
    }
    await prisma.tenantMembership.update({
      where: { id: membership.id },
      data: { active: body.active },
    });
  }

  const updated = await prisma.tenantMembership.findUniqueOrThrow({
    where: { id: membership.id },
    include: { user: { select: { id: true, email: true, name: true } } },
  });
  return formatStudentRow(updated, tenantId);
}

export async function deleteStudent(tenantId: string, learnerId: string) {
  const membership = await prisma.tenantMembership.findFirst({
    where: { tenantId, userId: learnerId, role: 'LEARNER' },
  });
  if (!membership) throw new AppError(404, 'Student not found');

  await prisma.tenantMembership.update({
    where: { id: membership.id },
    data: { active: false },
  });
}

export async function resetStudentPassword(tenantId: string, learnerId: string) {
  const membership = await prisma.tenantMembership.findFirst({
    where: { tenantId, userId: learnerId, role: 'LEARNER' },
    include: { user: { select: { id: true, email: true, name: true } } },
  });
  if (!membership) throw new AppError(404, 'Student not found');

  const temporaryPassword = crypto.randomUUID().slice(0, 12);
  const passwordHash = await bcrypt.hash(temporaryPassword, 12);
  await prisma.user.update({
    where: { id: learnerId },
    data: { passwordHash, mustChangePassword: true },
  });
  const student = await formatStudentRow(membership, tenantId);
  return { student, temporaryPassword };
}
