import OpenAI from 'openai';
import { env } from '../../../config/env.js';
import { generateEmbedding } from '../../embed.service.js';
import type { ProbeDefinition, ProbeOutcome } from '../runner.js';
import { errorMessage, fingerprint, sanitize } from '../runner.js';

const EXPECTED_EMBEDDING_DIMENSIONS = 1536;

/**
 * Probe-only clients. They mirror the construction in ai.service.ts but are kept
 * separate so a probe can never accidentally inherit request-level defaults (or
 * record an ApiUsageEvent) from the production call path.
 */
const openaiProbeClient = new OpenAI({ apiKey: env.OPENAI_API_KEY, maxRetries: 0 });
const deepseekProbeClient = new OpenAI({
  apiKey: env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
  maxRetries: 0,
});

const azureConfigured = Boolean(env.AZURE_SPEECH_KEY && env.AZURE_SPEECH_REGION);

function skipped(reason: string): ProbeOutcome {
  return { status: 'skipped', message: reason };
}

/** Extract an HTTP status from an OpenAI SDK error without depending on its class shape. */
function statusOf(error: unknown): number | undefined {
  const status = (error as { status?: unknown })?.status;
  return typeof status === 'number' ? status : undefined;
}

function isOutOfCredit(error: unknown): boolean {
  const raw = errorMessage(error).toLowerCase();
  return (
    raw.includes('insufficient_quota') ||
    raw.includes('insufficient balance') ||
    raw.includes('exceeded your current quota') ||
    statusOf(error) === 402
  );
}

/**
 * Shared classifier for a real (metered) provider call. Billing and auth failures
 * are `down` because they stop the feature dead; throttling is `degraded` because
 * it usually clears on its own.
 */
function classifyProviderError(error: unknown, provider: string): ProbeOutcome {
  const status = statusOf(error);
  const message = errorMessage(error);

  if (isOutOfCredit(error)) {
    return {
      status: 'down',
      message: `${provider} rejected the call for insufficient credit/quota — the account needs topping up. (${message})`,
    };
  }
  if (status === 401 || status === 403) {
    return { status: 'down', message: `${provider} rejected the key (HTTP ${status}) — it was revoked or rotated. (${message})` };
  }
  if (status === 404) {
    return { status: 'down', message: `${provider} does not recognise the configured model (HTTP 404). (${message})` };
  }
  if (status === 429) {
    return { status: 'degraded', message: `${provider} is rate-limiting (HTTP 429). (${message})` };
  }
  if (typeof status === 'number' && status >= 500) {
    return { status: 'degraded', message: `${provider} server error (HTTP ${status}) — provider-side outage. (${message})` };
  }
  return { status: 'down', message: `${provider} call failed: ${message}` };
}

/** Classify a raw `fetch` Response from a free liveness endpoint. */
async function classifyResponse(response: Response, provider: string): Promise<ProbeOutcome | null> {
  if (response.ok) return null;
  const body = await response.text().catch(() => '');
  // Redact BEFORE truncating. Slicing first can cut a secret in half, leaving a
  // prefix that no longer matches the exact env value, so the later sanitize pass
  // in the runner would let the remnant through.
  const detail = sanitize(body).slice(0, 200);
  if (response.status === 401 || response.status === 403) {
    return {
      status: 'down',
      message: `${provider} rejected the key (HTTP ${response.status}) — rotate it. ${detail}`,
    };
  }
  if (response.status === 404) {
    return { status: 'down', message: `${provider} endpoint returned 404 — the region or URL is misconfigured. ${detail}` };
  }
  if (response.status === 429) {
    return { status: 'degraded', message: `${provider} is rate-limiting (HTTP 429). ${detail}` };
  }
  return { status: 'degraded', message: `${provider} returned HTTP ${response.status}. ${detail}` };
}

const ROTATE_OPENAI =
  'Create a new key at platform.openai.com/api-keys, then `doppler secrets set OPENAI_API_KEY -c prd` (and -c dev), and redeploy with `docker compose up -d api`. If it is a billing problem, add credit at platform.openai.com/settings/organization/billing.';
const ROTATE_DEEPSEEK =
  'Rotate at platform.deepseek.com/api_keys, then `doppler secrets set DEEPSEEK_API_KEY -c prd` and redeploy api. Check the balance on the same page — DeepSeek returns 402 when it is empty.';
const ROTATE_OPENROUTER =
  'Top up at openrouter.ai/credits or rotate the key at openrouter.ai/keys, then `doppler secrets set OPENROUTER_API_KEY -c prd` and redeploy api. Scanned-PDF OCR still works without it via the local pdftoppm + OpenAI vision fallback, just slower.';
const ROTATE_AZURE =
  'Azure portal → your Speech resource → Keys and Endpoint → regenerate Key 1, then `doppler secrets set AZURE_SPEECH_KEY -c prd` (AZURE_SPEECH_REGION must match the resource region exactly) and redeploy api. Podcasts fall back to OpenAI TTS meanwhile, with non-native Uzbek pronunciation.';

export const aiProviderProbes: ProbeDefinition[] = [
  {
    id: 'openai-auth',
    group: 'ai-providers',
    label: 'OpenAI key valid',
    deep: false,
    timeoutMs: 6000,
    timeoutStatus: 'degraded',
    remediation: ROTATE_OPENAI,
    run: async () => {
      if (!env.OPENAI_API_KEY) {
        return skipped('OPENAI_API_KEY is not set — embeddings, the tutor, and OCR fallback are all unavailable.');
      }
      // /v1/models is free and spends no tokens: it proves the key is accepted,
      // though NOT that the account has credit (that is the embedding probe below).
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}` },
        signal: AbortSignal.timeout(5500),
      });
      const failure = await classifyResponse(response, 'OpenAI');
      if (failure) return failure;
      return {
        status: 'ok' as const,
        message: `Key accepted (${fingerprint(env.OPENAI_API_KEY)}).`,
        detail: { key: fingerprint(env.OPENAI_API_KEY) },
      };
    },
  },
  {
    id: 'openai-embedding',
    group: 'ai-providers',
    label: 'OpenAI embeddings live',
    deep: false,
    timeoutMs: 8000,
    timeoutStatus: 'degraded',
    remediation: ROTATE_OPENAI,
    run: async () => {
      if (!env.OPENAI_API_KEY) return skipped('OPENAI_API_KEY is not set — content ingest and RAG cannot run.');
      // A models-list call stays green when the account is out of credit; only a
      // real call surfaces insufficient_quota. This one costs ~2 tokens.
      try {
        const embedding = await generateEmbedding('salom');
        if (embedding.length !== EXPECTED_EMBEDDING_DIMENSIONS) {
          return {
            status: 'down' as const,
            message: `Embedding returned ${embedding.length} dimensions, expected ${EXPECTED_EMBEDDING_DIMENSIONS}. Stored vectors and new queries no longer match — retrieval is broken.`,
            detail: { dimensions: embedding.length, expected: EXPECTED_EMBEDDING_DIMENSIONS },
          };
        }
        return {
          status: 'ok' as const,
          message: `Live embedding call succeeded (${EXPECTED_EMBEDDING_DIMENSIONS} dims) — the account has credit.`,
          detail: { dimensions: embedding.length },
        };
      } catch (error) {
        return classifyProviderError(error, 'OpenAI embeddings');
      }
    },
  },
  {
    id: 'deepseek-auth',
    group: 'ai-providers',
    label: 'DeepSeek key + model',
    deep: false,
    timeoutMs: 6000,
    timeoutStatus: 'degraded',
    remediation: ROTATE_DEEPSEEK,
    run: async () => {
      if (!env.DEEPSEEK_API_KEY) {
        return skipped('DEEPSEEK_API_KEY is not set — quiz, summary, and slide generation are unavailable.');
      }
      const response = await fetch('https://api.deepseek.com/models', {
        headers: { Authorization: `Bearer ${env.DEEPSEEK_API_KEY}` },
        signal: AbortSignal.timeout(5500),
      });
      const failure = await classifyResponse(response, 'DeepSeek');
      if (failure) return failure;

      const body = (await response.json().catch(() => null)) as { data?: { id?: string }[] } | null;
      const models = (body?.data ?? []).map((m) => m.id).filter((id): id is string => Boolean(id));
      const detail = { key: fingerprint(env.DEEPSEEK_API_KEY), model: env.DEEPSEEK_MODEL };

      // A misspelled DEEPSEEK_MODEL passes auth but 400s on every real generation.
      if (models.length > 0 && !models.includes(env.DEEPSEEK_MODEL)) {
        return {
          status: 'degraded' as const,
          message: `Key is valid, but DEEPSEEK_MODEL "${env.DEEPSEEK_MODEL}" is not in the account's model list (${models.slice(0, 4).join(', ')}). Generation will fail.`,
          detail,
        };
      }
      return {
        status: 'ok' as const,
        message: `Key accepted (${fingerprint(env.DEEPSEEK_API_KEY)}) · model ${env.DEEPSEEK_MODEL} available.`,
        detail,
      };
    },
  },
  {
    id: 'openrouter-credits',
    group: 'ai-providers',
    label: 'OpenRouter key + credits',
    deep: false,
    timeoutMs: 6000,
    timeoutStatus: 'degraded',
    remediation: ROTATE_OPENROUTER,
    run: async () => {
      if (!env.OPENROUTER_API_KEY) {
        return skipped('OPENROUTER_API_KEY is not set — scanned-PDF OCR uses the slower local fallback ladder.');
      }
      const response = await fetch('https://openrouter.ai/api/v1/key', {
        headers: { Authorization: `Bearer ${env.OPENROUTER_API_KEY}` },
        signal: AbortSignal.timeout(5500),
      });
      const failure = await classifyResponse(response, 'OpenRouter');
      if (failure) return failure;

      const body = (await response.json().catch(() => null)) as
        | { data?: { limit?: number | null; usage?: number | null } }
        | null;
      const limit = body?.data?.limit ?? null;
      const usage = body?.data?.usage ?? 0;
      // A null limit means an unlimited/pay-as-you-go key — not a failure.
      const remaining = limit === null ? null : limit - usage;
      const detail = {
        key: fingerprint(env.OPENROUTER_API_KEY),
        remainingUsd: remaining,
        model: env.OPENROUTER_OCR_MODEL,
      };

      if (remaining !== null && remaining <= 0) {
        return {
          status: 'down' as const,
          message: 'OpenRouter credit is exhausted — Mistral OCR for scanned PDFs will fail over to the slower local path.',
          detail,
        };
      }
      if (remaining !== null && remaining < 1) {
        return {
          status: 'degraded' as const,
          message: `Only $${remaining.toFixed(2)} of OpenRouter credit left — top up before ingesting more scanned PDFs.`,
          detail,
        };
      }
      return {
        status: 'ok' as const,
        message: `Key accepted${remaining === null ? ' (pay-as-you-go)' : ` · $${remaining.toFixed(2)} credit left`}.`,
        detail,
      };
    },
  },
  {
    id: 'azure-speech-auth',
    group: 'ai-providers',
    label: 'Azure Speech key + voices',
    deep: false,
    timeoutMs: 7000,
    timeoutStatus: 'degraded',
    remediation: ROTATE_AZURE,
    run: async () => {
      if (!azureConfigured) {
        return skipped('AZURE_SPEECH_KEY / AZURE_SPEECH_REGION not set — podcasts use OpenAI TTS (non-native Uzbek voices).');
      }
      const response = await fetch(
        `https://${env.AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/voices/list`,
        {
          headers: { 'Ocp-Apim-Subscription-Key': env.AZURE_SPEECH_KEY },
          signal: AbortSignal.timeout(6500),
        },
      );
      const failure = await classifyResponse(response, 'Azure Speech');
      if (failure) return failure;

      const voices = (await response.json().catch(() => [])) as { ShortName?: string }[];
      const names = new Set(voices.map((v) => v.ShortName).filter(Boolean));
      // All SIX voices tts.service can synthesize with — the `_2` co-host voices are
      // used for the two-person podcast format, so omitting them would let a retired
      // second voice pass this check and fail mid-generation instead.
      const configured = [
        env.AZURE_TTS_VOICE_UZ,
        env.AZURE_TTS_VOICE_UZ_2,
        env.AZURE_TTS_VOICE_RU,
        env.AZURE_TTS_VOICE_RU_2,
        env.AZURE_TTS_VOICE_EN,
        env.AZURE_TTS_VOICE_EN_2,
      ];
      const missing = configured.filter((voice) => names.size > 0 && !names.has(voice));
      const detail = {
        key: fingerprint(env.AZURE_SPEECH_KEY),
        region: env.AZURE_SPEECH_REGION,
        voiceCount: names.size,
        uzVoice: env.AZURE_TTS_VOICE_UZ,
      };

      // A retired/misspelled voice name 400s at synthesis time, deep inside the job.
      if (missing.length > 0) {
        return {
          status: 'degraded' as const,
          message: `Key valid, but ${missing.length} configured voice(s) are unavailable in region ${env.AZURE_SPEECH_REGION}: ${missing.join(', ')}.`,
          detail,
        };
      }
      return {
        status: 'ok' as const,
        message: `Key accepted for region ${env.AZURE_SPEECH_REGION} · ${names.size} voices, all configured voices present.`,
        detail,
      };
    },
  },

  // --- Deep pass: real metered calls. Only run when an operator asks. ----------
  {
    id: 'deepseek-chat-deep',
    group: 'ai-providers',
    label: 'DeepSeek completion round-trip',
    deep: true,
    timeoutMs: 20000,
    timeoutStatus: 'degraded',
    remediation: ROTATE_DEEPSEEK,
    run: async () => {
      if (!env.DEEPSEEK_API_KEY) return skipped('DEEPSEEK_API_KEY is not set.');
      try {
        const completion = await deepseekProbeClient.chat.completions.create(
          { model: env.DEEPSEEK_MODEL, messages: [{ role: 'user', content: 'ping' }], max_tokens: 1 },
          { timeout: 18000 },
        );
        return {
          status: 'ok' as const,
          message: `Real completion succeeded on ${env.DEEPSEEK_MODEL} — quiz/summary/slide generation will work.`,
          detail: { model: completion.model ?? env.DEEPSEEK_MODEL },
        };
      } catch (error) {
        return classifyProviderError(error, 'DeepSeek');
      }
    },
  },
  {
    id: 'openai-tutor-deep',
    group: 'ai-providers',
    label: 'OpenAI tutor model round-trip',
    deep: true,
    timeoutMs: 20000,
    timeoutStatus: 'degraded',
    remediation: `If the model is not found, set a valid one: \`doppler secrets set TUTOR_MODEL=gpt-4o -c prd\`. ${ROTATE_OPENAI}`,
    run: async () => {
      if (!env.OPENAI_API_KEY) return skipped('OPENAI_API_KEY is not set.');
      try {
        const completion = await openaiProbeClient.chat.completions.create(
          { model: env.TUTOR_MODEL, messages: [{ role: 'user', content: 'ping' }], max_tokens: 1 },
          { timeout: 18000 },
        );
        return {
          status: 'ok' as const,
          message: `Real completion succeeded on ${env.TUTOR_MODEL} — the AI tutor will answer.`,
          detail: { model: completion.model ?? env.TUTOR_MODEL },
        };
      } catch (error) {
        return classifyProviderError(error, `OpenAI (${env.TUTOR_MODEL})`);
      }
    },
  },
  {
    id: 'azure-tts-deep',
    group: 'ai-providers',
    label: 'Azure TTS synthesis round-trip',
    deep: true,
    timeoutMs: 20000,
    timeoutStatus: 'degraded',
    remediation: ROTATE_AZURE,
    run: async () => {
      if (!azureConfigured) return skipped('Azure Speech is not configured.');
      // Same endpoint, headers and output format as tts.service.ts, so a success
      // here really does mean podcast synthesis works.
      const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="uz-UZ"><voice name="${env.AZURE_TTS_VOICE_UZ}">Salom</voice></speak>`;
      const response = await fetch(
        `https://${env.AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`,
        {
          method: 'POST',
          headers: {
            'Ocp-Apim-Subscription-Key': env.AZURE_SPEECH_KEY,
            'Content-Type': 'application/ssml+xml',
            'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
            'User-Agent': 'talim-ai',
          },
          body: ssml,
          signal: AbortSignal.timeout(18000),
        },
      );
      const failure = await classifyResponse(response, 'Azure TTS');
      if (failure) return failure;

      const bytes = (await response.arrayBuffer()).byteLength;
      if (bytes === 0) {
        return { status: 'degraded' as const, message: 'Azure TTS returned an empty audio body.' };
      }
      return {
        status: 'ok' as const,
        message: `Synthesized ${bytes} bytes of MP3 with ${env.AZURE_TTS_VOICE_UZ} — podcast generation works.`,
        detail: { bytes, voice: env.AZURE_TTS_VOICE_UZ },
      };
    },
  },
  {
    id: 'openrouter-completion-deep',
    group: 'ai-providers',
    label: 'OpenRouter OCR path round-trip',
    deep: true,
    timeoutMs: 20000,
    timeoutStatus: 'degraded',
    remediation: `If the model is gone, pick a cheap large-context replacement from openrouter.ai/models and set \`doppler secrets set OPENROUTER_OCR_MODEL=<id> -c prd\`. ${ROTATE_OPENROUTER}`,
    run: async () => {
      if (!env.OPENROUTER_API_KEY) return skipped('OPENROUTER_API_KEY is not set.');
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: env.OPENROUTER_OCR_MODEL,
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 1,
        }),
        signal: AbortSignal.timeout(18000),
      });
      const failure = await classifyResponse(response, 'OpenRouter');
      if (failure) return failure;

      // OpenRouter can return HTTP 200 with an error envelope — pdf.service.ts
      // handles this quirk, so the probe must too or it reports a false green.
      const body = (await response.json().catch(() => null)) as
        | { error?: { code?: number; message?: string } }
        | null;
      if (body?.error) {
        const code = body.error.code;
        return {
          status: code === 402 ? ('down' as const) : ('degraded' as const),
          message: `OpenRouter returned HTTP 200 with an error envelope (code ${code ?? 'n/a'}): ${body.error.message ?? ''}`,
        };
      }
      return {
        status: 'ok' as const,
        message: `Real completion succeeded on ${env.OPENROUTER_OCR_MODEL} — Mistral OCR for scanned PDFs is reachable.`,
        detail: { model: env.OPENROUTER_OCR_MODEL },
      };
    },
  },
];
