import type { FeatureReadiness, HealthCheckResult } from '@talim/types';

/**
 * Maps each demo-able feature to the checks it depends on.
 *
 * `requires` — if any of these is down or not configured, the feature visibly fails.
 * `enhances` — if any of these is unavailable, the feature still works but worse.
 *
 * The `enhances` distinction is the point of this file. A raw check list reports a
 * missing Azure key as "not set up", which looks benign; rolled up here it becomes
 * "Podcasts — degraded: non-native Uzbek voice", which is what an operator actually
 * needs to know before standing up in front of an audience.
 */
interface FeatureSpec {
  id: string;
  label: string;
  requires: string[];
  enhances: string[];
  /** Consequence text used when only `enhances` deps are unhealthy. */
  degradedSummary: string;
}

const FEATURES: FeatureSpec[] = [
  {
    id: 'content-ingest',
    label: 'Upload & process a document',
    requires: ['postgres-connectivity', 'storage-writable', 'redis-connectivity', 'openai-embedding'],
    enhances: ['queue-health', 'poppler-binaries', 'openrouter-credits'],
    degradedSummary: 'Text PDFs are fine; scanned/photographed PDFs may be slow or lower quality.',
  },
  {
    id: 'ai-tutor',
    label: 'Ask the AI tutor',
    requires: ['postgres-connectivity', 'openai-auth', 'rag-indexes', 'openai-embedding'],
    enhances: ['rag-retrieval-selftest', 'rag-e2e-deep', 'openai-tutor-deep', 'manim-binary'],
    degradedSummary: 'The tutor answers, but retrieval quality or visual aids may be reduced.',
  },
  {
    id: 'quiz-summary',
    label: 'Generate quizzes & summaries',
    requires: ['postgres-connectivity', 'redis-connectivity', 'deepseek-auth'],
    enhances: ['queue-health', 'deepseek-chat-deep'],
    degradedSummary: 'Generation works but the queue is backed up or unverified.',
  },
  {
    id: 'podcasts',
    label: 'Generate a podcast',
    // OpenAI is the floor: with the Azure fallback in place it alone can synthesize.
    requires: ['postgres-connectivity', 'redis-connectivity', 'storage-writable', 'openai-auth'],
    enhances: ['azure-speech-auth', 'azure-tts-deep', 'tts-provider-config', 'queue-health'],
    degradedSummary:
      'Audio generates, but without Azure Speech the Uzbek/Russian narration uses English-trained voices and sounds non-native.',
  },
  {
    id: 'slides-video',
    label: 'Generate slides & video',
    requires: ['postgres-connectivity', 'redis-connectivity', 'storage-writable', 'deepseek-auth'],
    enhances: ['queue-health', 'deepseek-chat-deep'],
    degradedSummary: 'Generation works but the queue is backed up or unverified.',
  },
  {
    id: 'assessments',
    label: 'Run assessments & game quizzes',
    requires: ['postgres-connectivity'],
    enhances: ['deepseek-auth', 'queue-health', 'plan-limits-drift'],
    degradedSummary: 'Existing assessments run; AI question drafting may be unavailable.',
  },
];

/** A check that is missing from the report is treated as unknown, not as a failure. */
function statusOf(checks: Map<string, HealthCheckResult>, id: string): string | undefined {
  return checks.get(id)?.status;
}

export function computeReadiness(results: HealthCheckResult[]): FeatureReadiness[] {
  const byId = new Map(results.map((check) => [check.id, check]));

  return FEATURES.map((feature) => {
    // A hard dependency that is down — or not configured at all — breaks the feature.
    const broken = feature.requires.filter((id) => {
      const status = statusOf(byId, id);
      return status === 'down' || status === 'skipped';
    });
    if (broken.length > 0) {
      return {
        id: feature.id,
        label: feature.label,
        status: 'down' as const,
        summary: `Will fail — ${broken.map((id) => byId.get(id)?.label ?? id).join(', ')} unavailable.`,
        blockedBy: broken,
      };
    }

    // Degraded hard deps, plus any unhealthy soft dep.
    const weakRequired = feature.requires.filter((id) => statusOf(byId, id) === 'degraded');
    const weakOptional = feature.enhances.filter((id) => {
      const status = statusOf(byId, id);
      return status === 'down' || status === 'degraded' || status === 'skipped';
    });
    const weak = [...weakRequired, ...weakOptional];

    if (weak.length > 0) {
      return {
        id: feature.id,
        label: feature.label,
        status: 'degraded' as const,
        summary: feature.degradedSummary,
        blockedBy: weak,
      };
    }

    return {
      id: feature.id,
      label: feature.label,
      status: 'ok' as const,
      summary: 'Ready to demo.',
      blockedBy: [],
    };
  });
}
