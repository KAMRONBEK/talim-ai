import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';

const sendMessageSchema = z.object({
  studentIds: z.array(z.string().min(1)).min(1),
  body: z.string().min(1).max(5000),
});

const replyMessageSchema = z.object({
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

/** Resolve display names for a set of user ids (name → username → null). */
async function resolveSenderNames(ids: string[]): Promise<Map<string, string | null>> {
  const unique = [...new Set(ids)].filter(Boolean);
  if (unique.length === 0) return new Map();
  const users = await prisma.user.findMany({
    where: { id: { in: unique } },
    select: { id: true, name: true, username: true },
  });
  return new Map(users.map((u) => [u.id, u.name ?? u.username ?? null]));
}

/** Mark a recipient row read (idempotent). Isolation: only the given recipient's own row within
 *  the given tenant. Shared by the learner (root read) and owner (reply read) paths. */
async function markRecipientRead(tenantId: string, recipientId: string, messageId: string) {
  const recipient = await prisma.tenantMessageRecipient.findFirst({
    where: { messageId, recipientId, message: { tenantId } },
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

/**
 * One-way tutor→student message. Creates a single TenantMessage plus a recipient row per
 * ACTIVE learner (in this tenant) among the given studentIds. Non-members / inactive /
 * cross-tenant ids are silently dropped; if none remain the call 400s. Root messages have a
 * null threadId; learner replies (below) reuse the root id as the thread key.
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

/**
 * The tutor's sent root messages (newest first) grouped with their student replies. Keeps the
 * one-way sent-list fields (recipientCount/readCount) and adds replyCount, unreadReplyCount
 * (the owner's unread recipient rows), and the reply list (oldest→newest).
 */
export async function listTenantMessageThreads(tenantId: string, ownerId: string) {
  const roots = await prisma.tenantMessage.findMany({
    where: { tenantId, senderId: ownerId, threadId: null },
    include: { recipients: { select: { readAt: true } } },
    orderBy: { createdAt: 'desc' },
  });

  const rootIds = roots.map((m) => m.id);
  const replies = rootIds.length
    ? await prisma.tenantMessage.findMany({
        where: { tenantId, threadId: { in: rootIds } },
        include: { recipients: { where: { recipientId: ownerId }, select: { readAt: true } } },
        orderBy: { createdAt: 'asc' },
      })
    : [];

  const names = await resolveSenderNames(replies.map((r) => r.senderId));

  const repliesByThread = new Map<string, typeof replies>();
  for (const reply of replies) {
    const key = reply.threadId as string;
    const list = repliesByThread.get(key) ?? [];
    list.push(reply);
    repliesByThread.set(key, list);
  }

  return roots.map((root) => {
    const threadReplies = repliesByThread.get(root.id) ?? [];
    // A thread now interleaves student replies with the owner's in-thread responses (same
    // threadId, senderId = owner). Tag each so the UI can side them, and only count the
    // student replies (never the owner's own responses) toward the reply/unread stats.
    const replyItems = threadReplies.map((reply) => {
      const fromTutor = reply.senderId === ownerId;
      const readAt = reply.recipients[0]?.readAt ?? null;
      return {
        id: reply.id,
        threadId: root.id,
        body: reply.body,
        senderName: names.get(reply.senderId) ?? null,
        fromTutor,
        createdAt: reply.createdAt.toISOString(),
        readAt: readAt ? readAt.toISOString() : null,
      };
    });
    const studentReplies = replyItems.filter((r) => !r.fromTutor);
    return {
      ...formatSentMessage(root),
      replyCount: studentReplies.length,
      unreadReplyCount: studentReplies.filter((r) => r.readAt == null).length,
      replies: replyItems,
    };
  });
}

/** Unread reply count for the tutor (owner recipient rows only ever belong to student replies).
 *  Drives a polling badge in the tutor UI. */
export async function getOwnerUnreadReplyCount(tenantId: string, ownerId: string) {
  const count = await prisma.tenantMessageRecipient.count({
    where: { recipientId: ownerId, readAt: null, message: { tenantId } },
  });
  return { count };
}

/** Owner marks a student reply read (idempotent). Isolation: only the owner's own recipient row
 *  within their tenant. */
export function markOwnerReplyRead(tenantId: string, ownerId: string, messageId: string) {
  return markRecipientRead(tenantId, ownerId, messageId);
}

/** Messages received by a learner (root tutor messages), each with its thread (root + this
 *  learner's conversation, oldest→newest). Isolation: recipient rows scoped to the tenant; thread
 *  replies scoped to the tutor + this learner so other students' replies stay private. */
export async function listLearnerMessages(tenantId: string, userId: string) {
  // Every message delivered to this student: root broadcasts (threadId null) plus the tutor's
  // in-thread responses (threadId set, one recipient row = this student).
  const allRows = await prisma.tenantMessageRecipient.findMany({
    where: { recipientId: userId, message: { tenantId } },
    include: { message: true },
    orderBy: { message: { createdAt: 'desc' } },
  });

  // Top-level list = root broadcasts only; a tutor response surfaces nested inside its thread
  // (below), never as its own standalone entry.
  const rootRows = allRows.filter((r) => r.message.threadId == null);
  // Threads with an unread tutor response, so a fresh response re-flags the whole thread as
  // unread for the student even after they'd already read the root broadcast.
  const unreadResponseThreadIds = new Set<string>(
    allRows
      .filter((r) => r.message.threadId != null && r.readAt == null)
      .map((r) => r.message.threadId as string),
  );

  const roots = rootRows.map((r) => r.message);
  const rootIds = roots.map((m) => m.id);
  const rootSenderIds = [...new Set(roots.map((m) => m.senderId))];
  const allowedSenders = new Set<string>([...rootSenderIds, userId]);

  const replies = rootIds.length
    ? await prisma.tenantMessage.findMany({
        where: { tenantId, threadId: { in: rootIds }, senderId: { in: [...allowedSenders] } },
        orderBy: { createdAt: 'asc' },
      })
    : [];

  const repliesByThread = new Map<string, typeof replies>();
  for (const reply of replies) {
    const key = reply.threadId as string;
    const list = repliesByThread.get(key) ?? [];
    list.push(reply);
    repliesByThread.set(key, list);
  }

  const names = await resolveSenderNames([...rootSenderIds, userId]);

  return rootRows.map((r) => {
    const root = r.message;
    const threadReplies = repliesByThread.get(root.id) ?? [];
    const thread = [
      {
        id: root.id,
        threadId: root.id,
        body: root.body,
        senderName: names.get(root.senderId) ?? null,
        fromTutor: root.senderId !== userId,
        createdAt: root.createdAt.toISOString(),
      },
      ...threadReplies.map((reply) => ({
        id: reply.id,
        threadId: root.id,
        body: reply.body,
        senderName: names.get(reply.senderId) ?? null,
        fromTutor: reply.senderId !== userId,
        createdAt: reply.createdAt.toISOString(),
      })),
    ];
    // Unread if the root itself is unread OR a newer tutor response in the thread is unread.
    const unread = r.readAt == null || unreadResponseThreadIds.has(root.id);
    return {
      id: root.id,
      body: root.body,
      senderName: names.get(root.senderId) ?? null,
      createdAt: root.createdAt.toISOString(),
      readAt: unread ? null : (r.readAt?.toISOString() ?? null),
      thread,
    };
  });
}

/**
 * A student replies to a message they received. Creates a TenantMessage (senderId=the learner,
 * same tenant, threadId = the target's threadId ?? the target's id) plus a recipient row for the
 * tenant OWNER. Isolation: the learner must own a recipient row for the target message within
 * their tenant, so they can only reply to messages actually delivered to them.
 */
export async function replyToTenantMessage(
  tenantId: string,
  userId: string,
  messageId: string,
  input: unknown,
) {
  const { body } = replyMessageSchema.parse(input ?? {});

  const recipient = await prisma.tenantMessageRecipient.findFirst({
    where: { messageId, recipientId: userId, message: { tenantId } },
    include: { message: true },
  });
  if (!recipient) throw new AppError(404, 'Message not found');

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { ownerId: true },
  });
  if (!tenant) throw new AppError(404, 'Organization not found');

  const threadId = recipient.message.threadId ?? recipient.message.id;

  const reply = await prisma.tenantMessage.create({
    data: {
      tenantId,
      senderId: userId,
      threadId,
      body,
      recipients: { create: [{ recipientId: tenant.ownerId }] },
    },
  });

  const names = await resolveSenderNames([userId]);
  return {
    id: reply.id,
    threadId,
    body: reply.body,
    senderName: names.get(userId) ?? null,
    fromTutor: false,
    createdAt: reply.createdAt.toISOString(),
  };
}

/**
 * A tutor responds in-thread to a specific student reply (the per-student sub-conversation that
 * resolves the "reply to whom" ambiguity of a broadcast). `messageId` must be a student reply
 * delivered to this owner (an owner recipient row exists) within their tenant. Creates a
 * TenantMessage (senderId = owner, same tenant, same threadId as the target reply) plus ONE
 * recipient row for the student who sent that reply, so the response surfaces in that student's
 * thread (fromTutor=true) and bumps their unread badge.
 */
export async function respondToStudentReply(
  tenantId: string,
  ownerId: string,
  messageId: string,
  input: unknown,
) {
  const { body } = replyMessageSchema.parse(input ?? {});

  // Owner recipient rows only ever exist on student replies, so this both scopes to the tenant
  // and proves the target is a reply addressed to this owner.
  const ownerRecipient = await prisma.tenantMessageRecipient.findFirst({
    where: { messageId, recipientId: ownerId, message: { tenantId } },
    include: { message: true },
  });
  if (!ownerRecipient) throw new AppError(404, 'Message not found');

  const targetReply = ownerRecipient.message;
  if (targetReply.threadId == null || targetReply.senderId === ownerId) {
    throw new AppError(400, 'Message is not a student reply');
  }
  const studentId = targetReply.senderId;

  const response = await prisma.tenantMessage.create({
    data: {
      tenantId,
      senderId: ownerId,
      threadId: targetReply.threadId,
      body,
      recipients: { create: [{ recipientId: studentId }] },
    },
  });

  const names = await resolveSenderNames([ownerId]);
  return {
    id: response.id,
    threadId: targetReply.threadId,
    body: response.body,
    senderName: names.get(ownerId) ?? null,
    fromTutor: true as const,
    createdAt: response.createdAt.toISOString(),
  };
}

/** Mark a received message read (idempotent). Isolation: only the learner's own recipient
 *  row within their active membership's tenant. Marking a root read also clears any unread
 *  tutor in-thread responses the student holds in that thread, so opening the conversation
 *  fully clears the badge. */
export async function markLearnerMessageRead(tenantId: string, userId: string, messageId: string) {
  const result = await markRecipientRead(tenantId, userId, messageId);
  const target = await prisma.tenantMessage.findFirst({
    where: { id: messageId, tenantId },
    select: { threadId: true },
  });
  const threadId = target?.threadId ?? messageId;
  await prisma.tenantMessageRecipient.updateMany({
    where: { recipientId: userId, readAt: null, message: { tenantId, threadId } },
    data: { readAt: new Date() },
  });
  return result;
}

/** Unread received-message count for a learner (drives an unread badge; frontend polls this). */
export async function getLearnerUnreadCount(tenantId: string, userId: string) {
  const count = await prisma.tenantMessageRecipient.count({
    where: { recipientId: userId, readAt: null, message: { tenantId } },
  });
  return { count };
}
