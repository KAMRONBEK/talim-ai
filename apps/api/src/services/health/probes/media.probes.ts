import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { env } from '../../../config/env.js';
import type { ProbeDefinition } from '../runner.js';
import { errorMessage } from '../runner.js';

const run = promisify(execFile);

interface BinaryCheck {
  present: boolean;
  version: string | null;
  error: string | null;
}

/**
 * Probe a CLI binary. Several of these (poppler's `pdftoppm`) print their version
 * to stderr and exit non-zero, so "did not fail with ENOENT" is the real signal —
 * a non-zero exit still proves the binary exists and is executable.
 */
async function checkBinary(bin: string, args: string[], timeoutMs: number): Promise<BinaryCheck> {
  try {
    const { stdout, stderr } = await run(bin, args, { timeout: timeoutMs });
    const output = `${stdout} ${stderr}`.trim();
    return { present: true, version: output.split('\n')[0]?.trim() ?? null, error: null };
  } catch (error) {
    const code = (error as { code?: unknown }).code;
    if (code === 'ENOENT') {
      return { present: false, version: null, error: 'not found on PATH' };
    }
    // Non-ENOENT failure (non-zero exit, timeout): the binary exists but misbehaved.
    const stderr = (error as { stderr?: string }).stderr ?? '';
    const stdout = (error as { stdout?: string }).stdout ?? '';
    const output = `${stdout} ${stderr}`.trim();
    if (output) {
      return { present: true, version: output.split('\n')[0]?.trim() ?? null, error: null };
    }
    return { present: false, version: null, error: errorMessage(error) };
  }
}

export const mediaProbes: ProbeDefinition[] = [
  {
    id: 'manim-binary',
    group: 'media',
    label: 'Manim renderer',
    deep: false,
    timeoutMs: 8000,
    timeoutStatus: 'degraded',
    remediation:
      'Manim must be present in the api image — rebuild with `docker compose build api && docker compose up -d api`, or point MANIM_BIN at the real path (`doppler secrets set MANIM_BIN=/usr/local/bin/manim -c prd`). Verify with `docker compose exec api manim --version`.',
    run: async () => {
      const bin = env.MANIM_BIN || 'manim';
      const result = await checkBinary(bin, ['--version'], 7000);
      const detail = { binary: bin, version: result.version };

      if (!result.present) {
        // Not fatal: renderManim.job.ts falls back to an SVG placeholder, so the
        // tutor still answers — the animated visuals just never appear.
        return {
          status: 'degraded' as const,
          message: `Manim binary "${bin}" ${result.error ?? 'unavailable'} — tutor visuals fall back to static placeholders.`,
          detail,
        };
      }
      return { status: 'ok' as const, message: `Available: ${result.version ?? bin}.`, detail };
    },
  },
  {
    id: 'poppler-binaries',
    group: 'media',
    label: 'Poppler (scanned-PDF OCR)',
    deep: false,
    timeoutMs: 8000,
    timeoutStatus: 'degraded',
    remediation:
      'Add poppler-utils to the api Dockerfile (`apt-get install -y poppler-utils`), then `docker compose build api && docker compose up -d api`. Verify with `docker compose exec api pdftoppm -v`.',
    run: async () => {
      const [toppm, separate] = await Promise.all([
        checkBinary('pdftoppm', ['-v'], 7000),
        checkBinary('pdfseparate', ['-v'], 7000),
      ]);
      const detail = {
        pdftoppm: toppm.present,
        pdfseparate: separate.present,
        version: toppm.version ?? separate.version,
      };

      const missing = [
        !toppm.present ? 'pdftoppm' : null,
        !separate.present ? 'pdfseparate' : null,
      ].filter(Boolean);

      if (missing.length > 0) {
        return {
          status: 'degraded' as const,
          message: `Missing ${missing.join(' + ')} — the local OCR fallback for scanned PDFs is unavailable. Text-layer PDFs are unaffected; scanned ones depend entirely on OpenRouter.`,
          detail,
        };
      }
      return {
        status: 'ok' as const,
        message: `Both binaries available${toppm.version ? ` (${toppm.version})` : ''}.`,
        detail,
      };
    },
  },
];
