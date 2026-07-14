import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { manimQueue, type RenderManimJobData } from '../services/queue.service.js';
import { storageService } from '../services/storage.service.js';
import { jobEvents } from '../services/events/jobEvents.service.js';
import type { ManimPayload, VisualBlock } from '@talim/types';

const execFileAsync = promisify(execFile);

function buildReadyBlock(jobId: string, script: string, url: string): VisualBlock {
  const payload: ManimPayload = { jobId, status: 'ready', script, url };
  return { kind: 'manim', payload };
}

function buildFailedBlock(jobId: string, script: string, error: string): VisualBlock {
  const payload: ManimPayload = { jobId, status: 'failed', script, error };
  return { kind: 'manim', payload };
}

function replaceManimBlockInText(
  text: string,
  jobId: string,
  newBlock: VisualBlock,
): string | null {
  const fenceRe = /```visual\n([\s\S]*?)\n```/g;
  let replaced = false;
  const updated = text.replace(fenceRe, (match, body: string) => {
    try {
      const block = JSON.parse(body.trim()) as VisualBlock;
      if (block.kind === 'manim' && (block.payload as ManimPayload).jobId === jobId) {
        replaced = true;
        return `\`\`\`visual\n${JSON.stringify(newBlock)}\n\`\`\``;
      }
    } catch {
      // keep original
    }
    return match;
  });
  return replaced ? updated : null;
}

/**
 * Push a user-scoped `manim.status` event so the chat UI stops polling the asset
 * endpoint (a failed render 404s identically to a pending one, so without this the
 * client cannot tell them apart). The job payload has no userId — resolve the chat
 * user via the message the job patches. Must NEVER break the job: swallows everything.
 */
async function publishManimStatus(
  jobId: string,
  messageId: string | undefined,
  status: 'READY' | 'FAILED',
): Promise<void> {
  try {
    if (!messageId) return;
    const msg = await prisma.chatMessage.findUnique({
      where: { id: messageId },
      select: { session: { select: { userId: true } } },
    });
    const userId = msg?.session.userId;
    if (!userId) return;
    jobEvents.publish(userId, { type: 'manim.status', jobId, status });
  } catch (err) {
    console.error(`renderManim: failed to publish manim.status for job ${jobId}:`, err);
  }
}

async function renderWithManimCli(jobId: string, script: string): Promise<string> {
  const workDir = path.join(env.UPLOAD_DIR, 'manim-work', jobId);
  await fs.mkdir(workDir, { recursive: true });
  const scriptPath = path.join(workDir, 'scene.py');
  const wrapped = `from manim import *\n\n${script}\n`;
  await fs.writeFile(scriptPath, wrapped, 'utf8');

  await execFileAsync(env.MANIM_BIN || 'manim', ['-ql', scriptPath, 'Scene'], {
    cwd: workDir,
    timeout: 120_000,
  });

  const files = await fs.readdir(workDir, { recursive: true });
  const mp4 = files.find((f) => String(f).endsWith('.mp4'));
  if (!mp4) throw new Error('Manim did not produce output');
  const fullPath = path.join(workDir, String(mp4));
  const buffer = await fs.readFile(fullPath);
  return storageService.save(buffer, `manim-${jobId}.mp4`);
}

async function renderFallbackSvg(jobId: string, script: string): Promise<string> {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="480" height="270" viewBox="0 0 480 270">
  <rect width="480" height="270" fill="#1e1e2e"/>
  <text x="240" y="120" text-anchor="middle" fill="#cdd6f4" font-family="sans-serif" font-size="16">Manim animation</text>
  <text x="240" y="150" text-anchor="middle" fill="#89b4fa" font-family="monospace" font-size="11">job: ${jobId}</text>
  <circle cx="240" cy="200" r="20" fill="#f38ba8">
    <animate attributeName="cx" values="120;360;120" dur="3s" repeatCount="indefinite"/>
  </circle>
</svg>`;
  return storageService.save(Buffer.from(svg, 'utf8'), `manim-${jobId}.svg`);
}

export function registerRenderManimJob(): void {
  manimQueue.process(async (job) => {
    const { jobId, script, messageId } = job.data as RenderManimJobData;

    let storagePath: string;
    try {
      if (env.MANIM_BIN) {
        storagePath = await renderWithManimCli(jobId, script);
      } else {
        storagePath = await renderFallbackSvg(jobId, script);
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Render failed';
      if (messageId) {
        const msg = await prisma.chatMessage.findUnique({ where: { id: messageId } });
        if (msg) {
          const updated = replaceManimBlockInText(
            msg.text,
            jobId,
            buildFailedBlock(jobId, script, error),
          );
          if (updated) {
            await prisma.chatMessage.update({ where: { id: messageId }, data: { text: updated } });
          }
        }
      }
      throw err;
    }

    const url = `/chat/visual/manim/${jobId}/asset`;
    if (messageId) {
      const msg = await prisma.chatMessage.findUnique({ where: { id: messageId } });
      if (msg) {
        const block = buildReadyBlock(jobId, script, url);
        const updated = replaceManimBlockInText(msg.text, jobId, block);
        if (updated) {
          await prisma.chatMessage.update({ where: { id: messageId }, data: { text: updated } });
        }
      }
    }

    void publishManimStatus(jobId, messageId, 'READY');

    return { storagePath, url };
  });

  // The processor rethrows on render failure (after patching the failed block into the
  // message), so this single handler covers every failure path without double-publishing.
  manimQueue.on('failed', async (job, err) => {
    console.error(`Manim job ${job?.id} failed:`, err.message);
    const data = job?.data as RenderManimJobData | undefined;
    if (!data?.jobId) return;
    await publishManimStatus(data.jobId, data.messageId, 'FAILED');
  });
}

export async function resolveManimAsset(
  jobId: string,
): Promise<{ storagePath: string; messageId: string } | null> {
  const jobs = await manimQueue.getJobs(['completed', 'failed', 'active', 'waiting'], 0, 200);
  const match = jobs.find((j) => (j.data as RenderManimJobData).jobId === jobId);
  if (!match) return null;
  const data = match.data as RenderManimJobData & { storagePath?: string };
  const rv = match.returnvalue as { storagePath?: string } | undefined;
  const storagePath = rv?.storagePath ?? data.storagePath ?? null;
  if (!storagePath) return null;
  return { storagePath, messageId: data.messageId };
}
