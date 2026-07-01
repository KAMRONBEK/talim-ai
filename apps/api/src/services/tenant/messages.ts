import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';

const sendMessageSchema = z.object({
  studentIds: z.array(z.string().min(1)).min(1),
  body: z.string().min(1).max(5000),
});

interface SentMessageShape {
  id: string;
  body: string;
  createdAt: Date;
  recipients: { readAt: Date | null }[];
}

function formatSentMessage(message: SentMessageShape) {
  return {
    id: message.id,
    body: message.body,
    createdAt: message.createdAt.toISOString(),
    recipientCount: message.recipients.length,
    readCount: message.recipients.filter((r) => r.readAt != null).length,
  };
}

/**
 * One-way tutor→student message. Creates a single TenantMessage plus a recipient row per
 * ACTIVE learner (in this tenant) among the given studentIds. Non-members / inactive /
 * cross-tenant ids are silently dropped; if none remain the call 400s.
 */
export async function sendTenantMessage(tenantId: string, senderId: string, input: unknown) {
  const body = sendMessageSchema.parse(input ?? {});
  const uniqueIds = [...new Set(body.studentIds)];

  const memberships = await prisma.tenantMembership.findMany({
    where: { tenantId, role: 'LEARNER', active: true, userId: { in: uniqueIds } },
    select: { userId: true },
  });
  if (memberships.length === 0) {
    throw new AppError(400, 'No valid active students selected');
  }

  const message = await prisma.tenantMessage.create({
    data: {
      tenantId,
      senderId,
      body: body.body,
      recipients: { create: memberships.map((m) => ({ recipientId: m.userId })) },
    },
    include: { recipients: { select: { readAt: true } } },
  });

  return formatSentMessage(message);
}

/** The tutor's sent messages (newest first) with delivery/read counts. */
export async function listSentMessages(tenantId: string, senderId: string) {
  const messages = await prisma.tenantMessage.findMany({
    where: { tenantId, senderId },
    include: { recipients: { select: { readAt: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return messages.map(formatSentMessage);
}

/** Messages received by a learner, scoped to their active membership's tenant. */
export async function listLearnerMessages(tenantId: string, userId: string) {
  const rows = await prisma.tenantMessageRecipient.findMany({
    where: { recipientId: userId, message: { tenantId } },
    include: { message: true },
    orderBy: { message: { createdAt: 'desc' } },
  });

  const senderIds = [...new Set(rows.map((r) => r.message.senderId))];
  const senders = senderIds.length
    ? await prisma.user.findMany({
        where: { id: { in: senderIds } },
        select: { id: true, name: true, username: true },
      })
    : [];
  const nameById = new Map(senders.map((s) => [s.id, s.name ?? s.username ?? null]));

  return rows.map((r) => ({
    id: r.message.id,
    body: r.message.body,
    senderName: nameById.get(r.message.senderId) ?? null,
    createdAt: r.message.createdAt.toISOString(),
    readAt: r.readAt?.toISOString() ?? null,
  }));
}

/** Mark a received message read (idempotent). Isolation: only the learner's own recipient
 *  row within their active membership's tenant. */
export async function markLearnerMessageRead(tenantId: string, userId: string, messageId: string) {
  const recipient = await prisma.tenantMessageRecipient.findFirst({
    where: { messageId, recipientId: userId, message: { tenantId } },
  });
  if (!recipient) throw new AppError(404, 'Message not found');

  const readAt = recipient.readAt ?? new Date();
  if (!recipient.readAt) {
    await prisma.tenantMessageRecipient.update({
      where: { id: recipient.id },
      data: { readAt },
    });
  }
  return { id: messageId, readAt: readAt.toISOString() };
}

/** Unread received-message count for a learner (drives an unread badge; frontend polls this). */
export async function getLearnerUnreadCount(tenantId: string, userId: string) {
  const count = await prisma.tenantMessageRecipient.count({
    where: { recipientId: userId, readAt: null, message: { tenantId } },
  });
  return { count };
}
