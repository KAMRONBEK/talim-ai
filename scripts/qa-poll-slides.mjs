#!/usr/bin/env node
/**
 * Poll a content's slide deck until it leaves GENERATING, printing the slide-id
 * sequence each time. Bounded — never waits on a job forever.
 *
 *   node scripts/qa-poll-slides.mjs <contentId> [maxSeconds]
 */
import { login, call } from './qa-api.mjs';

const [contentId, maxSeconds = '120'] = process.argv.slice(2);
const deadline = Number(maxSeconds) * 1000;
const token = await login('individual');
const startedAt = process.hrtime.bigint();

const elapsed = () => Number(process.hrtime.bigint() - startedAt) / 1e6;

while (elapsed() < deadline) {
  const { body } = await call(token, 'GET', `/content/${contentId}/slides`);
  const deck = body?.slides;
  const ids = deck?.deck ? deck.deck.slides.map((s) => s.id).join(',') : '-';
  console.log(
    `${Math.round(elapsed() / 1000)}s ${deck?.status ?? 'none'} n=${deck?.deck?.slides.length ?? 0} ids=${ids} created=${deck?.createdAt ?? '-'}`,
  );
  if (deck?.status && deck.status !== 'GENERATING') break;
  await new Promise((r) => setTimeout(r, 6000));
}
