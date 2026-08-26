/**
 * Re-measure `PodcastEpisode.durationSec` from the stored audio.
 *
 * Generation now measures the encoded audio, but every episode created before that carries the
 * old `(wordCount / 150) * 60` estimate — measured at 5-18% short across the dev set. Those rows
 * do not heal on their own: nothing rewrites them until someone regenerates the episode, so
 * without this the fix only ever applies to new podcasts.
 *
 * Dry-run by default. Pass --apply to write.
 *
 *   doppler run -- pnpm --filter @talim/api exec tsx src/scripts/backfill-podcast-durations.ts
 *   doppler run -- pnpm --filter @talim/api exec tsx src/scripts/backfill-podcast-durations.ts --apply
 */
import { prisma } from '../lib/prisma.js';
import { storageService } from '../services/storage.service.js';
import { mp3DurationSec } from '../lib/mp3-duration.js';

/** Ignore sub-second rounding noise; only report a row when the label is actually wrong. */
const MIN_DRIFT_SEC = 1;

async function main(): Promise<void> {
  const apply = process.argv.includes('--apply');
  const episodes = await prisma.podcastEpisode.findMany({
    where: { audioPath: { not: null } },
    select: { id: true, audioPath: true, durationSec: true },
  });

  let corrected = 0;
  let unreadable = 0;
  let missing = 0;
  let worst = 0;

  for (const ep of episodes) {
    let audio: Buffer;
    try {
      audio = await storageService.get(ep.audioPath!);
    } catch {
      // Audio deleted from storage while the row survives — leave the label alone rather than
      // replacing a stale number with a wrong one.
      missing += 1;
      continue;
    }

    const measured = mp3DurationSec(audio);
    if (measured === null || measured <= 0) {
      unreadable += 1;
      continue;
    }

    const next = Math.round(measured);
    const drift = Math.abs((ep.durationSec ?? 0) - next);
    if (drift < MIN_DRIFT_SEC) continue;

    worst = Math.max(worst, drift);
    corrected += 1;
    console.log(`${ep.id}  ${ep.durationSec ?? 'null'}s -> ${next}s  (off by ${drift}s)`);
    if (apply) {
      await prisma.podcastEpisode.update({ where: { id: ep.id }, data: { durationSec: next } });
    }
  }

  console.log(
    `\n${apply ? 'updated' : 'would update'} ${corrected}/${episodes.length} episodes; ` +
      `worst drift ${worst}s; ${unreadable} unreadable, ${missing} missing audio`,
  );
  if (!apply && corrected > 0) console.log('re-run with --apply to write these.');
  await prisma.$disconnect();
}

void main();
