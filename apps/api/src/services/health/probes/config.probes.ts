import { prisma } from '../../../lib/prisma.js';
import { env } from '../../../config/env.js';
import { EXPECTED_PLAN_LIMIT_KEYS, parseLimits } from '../../subscription/shared.js';
import type { ProbeDefinition } from '../runner.js';
import { fingerprint } from '../runner.js';

const azureConfigured = Boolean(env.AZURE_SPEECH_KEY && env.AZURE_SPEECH_REGION);

export const configProbes: ProbeDefinition[] = [
  {
    id: 'required-api-keys',
    group: 'config',
    label: 'Required secrets present',
    deep: false,
    timeoutMs: 1000,
    timeoutStatus: 'degraded',
    remediation:
      'Set the missing keys in Doppler (`doppler secrets set OPENAI_API_KEY DEEPSEEK_API_KEY -c prd`, and `-c dev` locally), then restart the API — container env is baked at start, so a Doppler change alone changes nothing until you `docker compose up -d api`.',
    run: async () => {
      // Presence only — never the value. Last-4 lets an operator confirm WHICH key
      // is loaded (e.g. after a rotation) without exposing it in an HTTP response.
      const detail = {
        OPENAI_API_KEY: fingerprint(env.OPENAI_API_KEY),
        DEEPSEEK_API_KEY: fingerprint(env.DEEPSEEK_API_KEY),
        OPENROUTER_API_KEY: fingerprint(env.OPENROUTER_API_KEY),
        AZURE_SPEECH_KEY: fingerprint(env.AZURE_SPEECH_KEY),
        ELEVENLABS_API_KEY: fingerprint(env.ELEVENLABS_API_KEY),
      };

      const missing = [
        !env.OPENAI_API_KEY ? 'OPENAI_API_KEY' : null,
        !env.DEEPSEEK_API_KEY ? 'DEEPSEEK_API_KEY' : null,
      ].filter(Boolean);

      if (missing.length > 0) {
        return {
          status: 'down' as const,
          message: `Core secret(s) missing: ${missing.join(', ')}. Without them the tutor, embeddings, and content generation cannot run at all.`,
          detail,
        };
      }
      return {
        status: 'ok' as const,
        message: 'Both required provider keys are loaded (optional keys reported below).',
        detail,
      };
    },
  },
  {
    id: 'tts-provider-config',
    group: 'config',
    label: 'TTS provider consistency',
    deep: false,
    timeoutMs: 1000,
    timeoutStatus: 'degraded',
    remediation:
      'For the Uzbek-first audience, set the Azure pair: `doppler secrets set AZURE_SPEECH_KEY AZURE_SPEECH_REGION -c prd` (Azure portal → Speech resource → Keys and Endpoint), then `docker compose up -d api`. tts.service auto-routes to Azure once both are present.',
    run: async () => {
      const detail = {
        TTS_PROVIDER: env.TTS_PROVIDER,
        azureConfigured,
        region: env.AZURE_SPEECH_REGION || '(not set)',
        effectiveProvider: azureConfigured ? 'azure' : env.OPENAI_API_KEY ? 'openai' : 'none',
      };

      if (env.TTS_PROVIDER === 'elevenlabs' && !env.ELEVENLABS_API_KEY) {
        return {
          status: 'down' as const,
          message: 'TTS_PROVIDER is "elevenlabs" but ELEVENLABS_API_KEY is empty — podcast generation will throw.',
          detail,
        };
      }
      if (!azureConfigured && !env.OPENAI_API_KEY) {
        return {
          status: 'down' as const,
          message: 'No TTS provider is usable — neither the Azure pair nor OPENAI_API_KEY is set. Podcast generation throws immediately.',
          detail,
        };
      }
      if (!azureConfigured) {
        // Works, but wrong: OpenAI TTS has no native Uzbek voice, so podcasts come
        // out with an English accent reading Uzbek text.
        return {
          status: 'degraded' as const,
          message: 'Azure Speech is not configured, so podcasts fall back to OpenAI TTS — no native Uzbek voice, which is audible to an Uzbek-speaking audience.',
          detail,
        };
      }
      return {
        status: 'ok' as const,
        message: `Azure Speech configured (region ${env.AZURE_SPEECH_REGION}) — native Uzbek/Russian neural voices in use.`,
        detail,
      };
    },
  },
  {
    id: 'plan-limits-drift',
    group: 'config',
    label: 'Plan quota-key drift',
    deep: false,
    timeoutMs: 4000,
    timeoutStatus: 'degraded',
    remediation:
      'Re-run the seed so Plan.limits is upserted with the current key names — in the container: `docker compose exec api node dist/prisma/seed.js`; locally: `pnpm db:seed`. Verify afterwards in `pnpm db:studio` → Plan → limits.',
    run: async () => {
      const plans = await prisma.plan.findMany({ select: { code: true, kind: true, limits: true } });

      if (plans.length === 0) {
        return {
          status: 'down' as const,
          message: 'No Plan rows exist — the seed never ran, so every subscription lookup will fail.',
        };
      }

      // The known production failure mode: limits JSON carrying PRE-RENAME keys.
      // Every renamed key reads as undefined, which the quota code treats as
      // "unlimited" — so quotas and file caps are silently switched off.
      const drifted: string[] = [];
      const detail: Record<string, string | number> = { plans: plans.length };
      for (const plan of plans) {
        const limits = parseLimits(plan.limits) as Record<string, unknown>;
        const expected = EXPECTED_PLAN_LIMIT_KEYS[plan.kind];
        const missing = expected.filter((key) => !(key in limits));
        if (missing.length > 0) {
          drifted.push(plan.code);
          detail[plan.code] = `missing: ${missing.join(', ')}`;
        }
      }

      if (drifted.length > 0) {
        return {
          status: 'degraded' as const,
          message: `${drifted.length} of ${plans.length} plans are missing expected limit keys (${drifted.join(', ')}) — those quotas and file caps are silently disabled.`,
          detail,
        };
      }
      return {
        status: 'ok' as const,
        message: `All ${plans.length} plans carry the expected quota keys.`,
        detail,
      };
    },
  },
  {
    id: 'env-summary',
    group: 'config',
    label: 'Runtime configuration',
    deep: false,
    timeoutMs: 1000,
    timeoutStatus: 'degraded',
    remediation:
      'Set CORS_ORIGIN to the real public origins (`doppler secrets set CORS_ORIGIN=https://app.example,https://admin.example -c prd`) and redeploy api — otherwise the browser blocks every request from the deployed web app.',
    run: async () => {
      const origins = env.CORS_ORIGIN.split(',')
        .map((o) => o.trim())
        .filter(Boolean);
      const detail = {
        NODE_ENV: env.NODE_ENV,
        PORT: env.PORT,
        TUTOR_MODEL: env.TUTOR_MODEL,
        DEEPSEEK_MODEL: env.DEEPSEEK_MODEL,
        TTS_PROVIDER: env.TTS_PROVIDER,
        DEFAULT_CONTENT_LOCALE: env.DEFAULT_CONTENT_LOCALE,
        OCR_CONCURRENCY: env.OCR_CONCURRENCY,
        OCR_MAX_PAGES: env.OCR_MAX_PAGES,
        UPLOAD_DIR: env.UPLOAD_DIR,
        CORS_ORIGIN: origins.join(', ') || '(empty)',
        MANIM_BIN: env.MANIM_BIN || '(default: manim)',
      };

      // In production a localhost-only allow-list means the deployed frontends are
      // CORS-blocked — the app looks completely dead from a browser.
      const onlyLocalhost = origins.every((o) => o.includes('localhost') || o.includes('127.0.0.1'));
      if (env.NODE_ENV === 'production' && (origins.length === 0 || onlyLocalhost)) {
        return {
          status: 'degraded' as const,
          message: 'Running in production but CORS_ORIGIN is empty or localhost-only — deployed web and admin apps will be blocked by the browser.',
          detail,
        };
      }
      return {
        status: 'ok' as const,
        message: `${env.NODE_ENV} · tutor ${env.TUTOR_MODEL} · ${origins.length} allowed origin(s).`,
        detail,
      };
    },
  },
];
