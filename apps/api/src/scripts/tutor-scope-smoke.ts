import { classifyTutorScope } from '../lib/tutor-scope.js';

async function main(): Promise<void> {
  const cases = [
    {
      name: 'pendulum related extension',
      input: {
        locale: 'en' as const,
        contentTitle: 'Pendulums somewhat simple',
        message: 'simulate double pendulum',
        context:
          'This chapter introduces a simplified pendulum model: the small amplitude, linearized pendulum. The chapter focuses on the simple pendulum and its periodic motion.',
      },
      expected: 'related_extension',
    },
    {
      name: 'venn unrelated',
      input: {
        locale: 'en' as const,
        contentTitle: 'Venn diagrams',
        message: 'simulate double pendulum',
        context:
          'This chapter explains Venn diagrams, sets, intersections, unions, complements, and how to reason about regions in overlapping circles.',
      },
      expected: 'unrelated',
    },
    {
      name: 'pendulum direct',
      input: {
        locale: 'en' as const,
        contentTitle: 'Pendulums somewhat simple',
        message: 'draw graph of pendulum over time',
        context:
          'The simple pendulum has periodic motion. The angle changes over time and, for small amplitudes, can be approximated by simple harmonic motion.',
      },
      expected: 'direct',
    },
    {
      name: 'pendulum unrelated question',
      input: {
        locale: 'en' as const,
        contentTitle: 'Pendulums somewhat simple',
        message: 'what is the capital of France?',
        context:
          'This chapter introduces a simplified pendulum model: the small amplitude, linearized pendulum. The chapter focuses on the simple pendulum and its periodic motion.',
      },
      expected: 'unrelated',
    },
  ];

  let failures = 0;

  for (const testCase of cases) {
    const result = await classifyTutorScope({
      ...testCase.input,
      selectedExcerpt: undefined,
      hasSelectedImage: false,
    });
    const pass = result.route === testCase.expected;
    console.log(
      `${pass ? 'PASS' : 'FAIL'} ${testCase.name}: expected=${testCase.expected} actual=${result.route} reason=${result.reason}`,
    );
    if (!pass) failures += 1;
  }

  if (failures > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
