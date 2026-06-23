import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

export async function writeAdminAuditLog(params: {
  adminUserId: string;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  // Snapshot the actor's identity so the entry stays attributable even if the
  // admin account is later deleted (the FK is SetNull, not Cascade).
  const admin = await prisma.user.findUnique({
    where: { id: params.adminUserId },
    select: { email: true, name: true },
  });
  await prisma.adminAuditLog.create({
    data: {
      adminUserId: params.adminUserId,
      adminEmail: admin?.email ?? null,
      adminName: admin?.name ?? null,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId ?? null,
      metadata: (params.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
}

export async function listAdminAuditLogs(params: {
  page: number;
  pageSize: number;
  action?: string;
  targetType?: string;
}) {
  const where: Prisma.AdminAuditLogWhereInput = {};
  if (params.action) where.action = params.action;
  if (params.targetType) where.targetType = params.targetType;
  const skip = (params.page - 1) * params.pageSize;

  const [total, items] = await Promise.all([
    prisma.adminAuditLog.count({ where }),
    prisma.adminAuditLog.findMany({
      where,
      skip,
      take: params.pageSize,
      orderBy: { createdAt: 'desc' },
      include: { adminUser: { select: { id: true, email: true, name: true } } },
    }),
  ]);

  return {
    items: items.map((log) => ({
      id: log.id,
      action: log.action,
      targetType: log.targetType,
      targetId: log.targetId,
      metadata: log.metadata,
      createdAt: log.createdAt.toISOString(),
      // Prefer the snapshot; fall back to the live relation for pre-snapshot rows.
      adminEmail: log.adminEmail ?? log.adminUser?.email ?? null,
      adminName: log.adminName ?? log.adminUser?.name ?? null,
    })),
    total,
    page: params.page,
    pageSize: params.pageSize,
  };
}
