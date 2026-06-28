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
      expected: ['related_extension'],
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
      expected: ['unrelated'],
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
      expected: ['direct'],
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
      expected: ['unrelated'],
    },
    {
      // The reported bug: a vague follow-up after an in-scope answer must NOT be
      // bounced to needs_clarification / unrelated — the conversation makes it clear.
      name: 'follow-up: explain more (uz)',
      input: {
        locale: 'uz' as const,
        contentTitle: 'Kvadratlar va ranglar',
        message: "koproq tuwunting, chizib tushuntiring iloji bolsa",
        context:
          "Bu bo'limda turli rangdagi kvadratlar soni sanaladi: sariq, ko'k, yashil va qizil kvadratlar.",
        recentTurns: [
          { role: 'user' as const, text: 'Oq kvadratlar nechta?' },
          {
            role: 'assistant' as const,
            text: "Sariq 5, ko'k 7, yashil 4, qizil 8. Oq kvadratlar 4 ta bo'ladi.",
          },
        ],
      },
      expected: ['direct', 'related_extension'],
    },
    {
      name: 'follow-up: explain the last solved problem visually (uz)',
      input: {
        locale: 'uz' as const,
        contentTitle: 'Kvadratlar va ranglar',
        message: 'oxirgi yechilgan masalni visual tushuntirib bering',
        context:
          "Bu bo'limda turli rangdagi kvadratlar soni sanaladi: sariq, ko'k, yashil va qizil kvadratlar.",
        recentTurns: [
          { role: 'user' as const, text: 'Oq kvadratlar nechta?' },
          {
            role: 'assistant' as const,
            text: "Sariq 5, ko'k 7, yashil 4, qizil 8. Oq kvadratlar 4 ta bo'ladi.",
          },
        ],
      },
      expected: ['direct', 'related_extension'],
    },
  ];

  let failures = 0;

  for (const testCase of cases) {
    const result = await classifyTutorScope({
      selectedExcerpt: undefined,
      hasSelectedImage: false,
      ...testCase.input,
    });
    const pass = testCase.expected.includes(result.route);
    console.log(
      `${pass ? 'PASS' : 'FAIL'} ${testCase.name}: expected=${testCase.expected.join('|')} actual=${result.route} reason=${result.reason}`,
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
