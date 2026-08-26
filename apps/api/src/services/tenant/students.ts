import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import { prisma } from '../../lib/prisma.js';
import { AppError, QuotaExceededError, UsernameTakenError } from '../../middleware/error.middleware.js';
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
/**
 * Free alternatives to a taken username.
 *
 * Usernames are global, so a tutor typing a common first name will hit a name some other school
 * already used. Answering with a bare "already taken" leaves them guessing in front of a class;
 * these give them something to click. Availability is checked the same case-insensitive way login
 * resolves a username, so a suggestion is never one that would collide on submit.
 */
async function suggestUsernames(taken: string, name?: string | null): Promise<string[]> {
  const base = taken.replace(/\d+$/, '') || taken;
  const candidates: string[] = [];

  // A surname initial reads more like a real username than a counter, so offer it first.
  const parts = (name ?? '').trim().toLowerCase().split(/\s+/).filter(Boolean);
  const initial = parts.length > 1 ? parts[parts.length - 1]![0] : undefined;
  if (initial && /^[a-z]$/.test(initial)) candidates.push(`${base}.${initial}`);

  for (let n = 2; n <= 9; n += 1) candidates.push(`${base}${n}`);

  const free: string[] = [];
  for (const candidate of candidates) {
    if (free.length >= 3) break;
    const exists = await prisma.user.findFirst({
      where: { username: { equals: candidate, mode: 'insensitive' } },
      select: { id: true },
    });
    if (!exists) free.push(candidate);
  }
  return free;
}

async function provisionStudent(
  tenantId: string,
  params: ProvisionStudentParams,
  opts: { assertSeatBeforeConsume?: boolean; formatRow?: boolean } = {},
): Promise<ProvisionStudentResult> {
  const formatRow = opts.formatRow ?? true;
  // Usernames are stored lowercase because login resolves them case-INSENSITIVELY. Storing
  // what was typed let `ali` and `Ali` both exist while a login for either matched both, so a
  // child's password looked like it simply "didn't work".
  const username = params.username?.trim().toLowerCase();
  let email = params.email?.trim();

  if (username) {
    // Match the way login looks a username up, not the way the column is indexed: any row login
    // could resolve to must block the name here. A case-sensitive findUnique would miss rows
    // created before usernames were normalised.
    const taken = await prisma.user.findFirst({
      where: { username: { equals: username, mode: 'insensitive' } },
      select: { id: true },
    });
    // Checked BEFORE the email lookup below so a case variant reports the conflict the tutor
    // can actually see. It used to slip past this check and collide on the lowercased synthetic
    // email instead, answering "Email already registered" on a form with no email field.
    if (taken) throw new UsernameTakenError(username, await suggestUsernames(username, params.name));
    // Synthesize a stable internal email for username-only (email-less) students.
    if (!email) email = `${username}@students.talim.local`;
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

/**
 * Dependency-free CSV parse for the student importer.
 *
 * Rewritten because three separate defects all came from the same two shortcuts —
 * splitting on newlines before understanding quotes, and assuming a comma and an
 * English header:
 *
 *   #66  a name containing a line break became two students, the second named after
 *        their own email, because the text was split into lines first.
 *   #48  a semicolon file (Excel's default in most of Europe and in ru/uz locales)
 *        parsed as ONE column, so the header row was imported as a student.
 *   #65  exporting a class in Uzbek and importing it back created nobody: the export
 *        writes localized headers, `email` matched so the file looked headered, but
 *        indexOf('name') was -1 and every row failed "Name is required".
 *
 * The export (students page) is the file users most often re-import, so the round trip
 * is treated as the contract: localized headers, a UTF-8 BOM, `@username` in the email
 * column for email-less children, and a status column this importer has no use for.
 */

/** Header labels the export actually writes, per locale, plus the raw field names. */
const HEADER_ALIASES: Record<'name' | 'email' | 'username', readonly string[]> = {
  name: ['name', 'ism', 'имя', 'ф.и.о', 'фио', 'full name'],
  email: ['email', 'e-mail', 'pochta', 'почта', 'эл. почта', 'электронная почта'],
  username: ['username', 'foydalanuvchi nomi', 'foydalanuvchi', 'имя пользователя', 'логин', 'login'],
};

/** Columns the export emits that carry nothing importable. Recognised so their presence
 *  still counts as "this row is a header", rather than being mistaken for data. */
const IGNORED_HEADERS: readonly string[] = ['status', 'holat', 'статус'];

/**
 * Split the whole document into records and fields in one pass.
 *
 * Quotes are honoured across newlines, which is the entire point: a quoted field may
 * legally contain the delimiter, CR, LF, or an escaped quote, and none of that survives
 * a `split('\n')` done first.
 */
function tokenize(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      // Swallow the LF of a CRLF pair so it does not open an empty record.
      if (ch === '\r' && text[i + 1] === '\n') i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }
  row.push(field);
  rows.push(row);

  return rows
    .map((r) => r.map((c) => c.trim()))
    .filter((r) => r.some((c) => c !== ''));
}

/**
 * Pick the delimiter by counting candidates OUTSIDE quotes, so a comma inside a quoted
 * name cannot outvote the real separator. Comma wins ties: it is the format this app
 * exports, and a single-column file has no separator to find.
 */
function detectDelimiter(text: string): string {
  const counts: Record<string, number> = { ',': 0, ';': 0, '\t': 0 };
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') i += 1;
      else inQuotes = !inQuotes;
    } else if (!inQuotes && ch !== undefined && ch in counts) {
      counts[ch] = (counts[ch] ?? 0) + 1;
    }
  }
  const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return best && best[1] > 0 ? best[0] : ',';
}

function headerFieldFor(cell: string): 'name' | 'email' | 'username' | 'ignored' | null {
  const c = cell.trim().toLowerCase();
  if (!c) return null;
  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    if (aliases.includes(c)) return field as 'name' | 'email' | 'username';
  }
  return IGNORED_HEADERS.includes(c) ? 'ignored' : null;
}

export function parseCsv(csv: string): ImportRowInput[] {
  // Excel writes a UTF-8 BOM and this app's own export prepends one; left in place it
  // would corrupt the very first header cell and make the header unrecognisable.
  // \uFEFF rather than the literal character: an inline BOM is invisible in review and
  // trips eslint's no-irregular-whitespace.
  const text = csv.replace(/^\uFEFF/, '');
  if (text.trim() === '') return [];

  const rows = tokenize(text, detectDelimiter(text));
  if (rows.length === 0) return [];

  const headerRow = rows[0] ?? [];
  const mapped = headerRow.map(headerFieldFor);
  // A header must be recognisable as a whole: every non-empty cell is either a field we
  // import or one we knowingly ignore. Requiring only ONE match is what let a localized
  // header pass as English and then yield -1 for every column.
  const isHeader =
    headerRow.length > 0 &&
    mapped.some((m) => m === 'name' || m === 'email' || m === 'username') &&
    mapped.every((m, i) => m !== null || headerRow[i] === '');

  const idx = { name: -1, email: -1, username: -1 };
  if (isHeader) {
    mapped.forEach((m, i) => {
      if (m === 'name' || m === 'email' || m === 'username') {
        if (idx[m] === -1) idx[m] = i;
      }
    });
  }

  const dataRows = isHeader ? rows.slice(1) : rows;

  return dataRows.map((cols) => {
    const at = (i: number) => (i >= 0 && cols[i] ? cols[i] : undefined);

    if (isHeader) {
      const emailCell = at(idx.email);
      // The export writes `@username` in the email column for email-less children, so a
      // re-import must read it back as a username rather than as a malformed address.
      const handle = emailCell?.startsWith('@') ? emailCell.slice(1) : null;
      return {
        name: at(idx.name),
        email: handle === null ? emailCell : undefined,
        username: handle ?? at(idx.username),
      };
    }

    const name = at(0);
    const second = at(1);
    if (second?.startsWith('@')) return { name, username: second.slice(1) };
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
    // `username` is load-bearing here, not decoration: for an email-less child it is the
    // only thing they can type into the sign-in box. Omitting it from the select made
    // formatStudentRow read undefined and emit `username: null`, so the one-time
    // credentials panel showed a password and no way to use it. The row type marks
    // username optional, so nothing failed to compile.
    include: { user: { select: { id: true, email: true, name: true, username: true } } },
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
