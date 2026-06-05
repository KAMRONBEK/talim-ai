import type { Response } from 'express';
import type { AppLocale } from '@talim/types';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.middleware.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { getParam } from '../lib/params.js';
import { resolveLocale } from '../lib/locale.js';
import {
  ensureSectionTitlesForLocale,
  getSectionBody,
  resolveSectionTitle,
} from '../services/section.service.js';

function formatSection(
  section: {
    id: string;
    contentId: string;
    title: string;
    order: number;
    startChunk: number;
    endChunk: number;
    readMinutes: number | null;
  },
  title: string,
) {
  return {
    id: section.id,
    contentId: section.contentId,
    title,
    order: section.order,
    startChunk: section.startChunk,
    endChunk: section.endChunk,
    readMinutes: section.readMinutes,
  };
}

async function assertContentAccess(userId: string, contentId: string) {
  const content = await prisma.content.findFirst({
    where: { id: contentId, userId },
  });
  if (!content) throw new AppError(404, 'Content not found');
  return content;
}

export async function listSections(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const contentId = getParam(req, 'id');
  const locale = resolveLocale(req) as AppLocale;
  await assertContentAccess(req.user.userId, contentId);

  const sections = await prisma.contentSection.findMany({
    where: { contentId },
    orderBy: { order: 'asc' },
  });

  await ensureSectionTitlesForLocale(contentId, locale);

  const localized = await Promise.all(
    sections.map(async (section) => {
      const title = await resolveSectionTitle(section, locale);
      return formatSection(section, title);
    }),
  );

  res.json({ sections: localized });
}

export async function getSection(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Unauthorized');
  const contentId = getParam(req, 'id');
  const sectionId = getParam(req, 'sectionId');
  const locale = resolveLocale(req) as AppLocale;
  await assertContentAccess(req.user.userId, contentId);

  const section = await prisma.contentSection.findFirst({
    where: { id: sectionId, contentId },
  });
  if (!section) throw new AppError(404, 'Section not found');

  await ensureSectionTitlesForLocale(contentId, locale);
  const title = await resolveSectionTitle(section, locale);
  const body = await getSectionBody(contentId, sectionId);
  res.json({ section: formatSection(section, title), body });
}
