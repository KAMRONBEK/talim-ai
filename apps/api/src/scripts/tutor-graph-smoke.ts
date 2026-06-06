import assert from 'node:assert/strict';
import { parseFenceBlock } from '@talim/types';
import { detectTutorGraphIntent } from '../lib/tutor-graph-intent.js';
import { validateGraphPayload } from '../lib/tutor-graph.js';
import { serializeBlockForMessage } from '../lib/tutor-tools.js';

function expectInvalid(name: string, run: () => void): void {
  try {
    run();
  } catch {
    console.log(`PASS ${name}`);
    return;
  }

  console.error(`FAIL ${name}: expected validation to reject payload`);
  process.exitCode = 1;
}

function main(): void {
  const graphIntent = detectTutorGraphIntent({
    message: 'draw this',
    hasSelectedImage: true,
  });
  assert.equal(graphIntent.isExplicit, true);
  console.log('PASS detects selected-image draw intent');

  const payload = validateGraphPayload({
    expressions: [{ id: 'f1', latex: 'y=x^2' }],
    viewport: { xmin: -5, xmax: 5, ymin: -1, ymax: 10 },
  });
  assert.deepEqual(payload.expressions, [{ id: 'f1', latex: 'y=x^2' }]);
  console.log('PASS validates graph payload');

  const serialized = serializeBlockForMessage({ kind: 'desmos', payload });
  const body = serialized.match(/```visual\n([\s\S]*?)\n```/)?.[1];
  assert.ok(body);
  const parsed = parseFenceBlock('visual', body);
  assert.deepEqual(parsed, {
    kind: 'desmos',
    payload: {
      expressions: [{ id: 'f1', latex: 'y=x^2' }],
      viewport: { xmin: -5, xmax: 5, ymin: -1, ymax: 10 },
    },
  });
  console.log('PASS serializes and parses visual graph block');

  expectInvalid('rejects duplicate ids', () => {
    validateGraphPayload({
      expressions: [
        { id: 'same', latex: 'y=x' },
        { id: 'same', latex: 'y=x^2' },
      ],
      viewport: { xmin: -5, xmax: 5, ymin: -5, ymax: 5 },
    });
  });

  expectInvalid('rejects non-finite viewport', () => {
    validateGraphPayload({
      expressions: [{ id: 'f1', latex: 'y=x' }],
      viewport: { xmin: -5, xmax: Number.POSITIVE_INFINITY, ymin: -5, ymax: 5 },
    });
  });

  if (process.exitCode) process.exit(process.exitCode);
}

main();
