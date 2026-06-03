const OPTION_LABELS = ['A', 'B', 'C', 'D'];

function normalize(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

function getOptionLabel(value: string): string | null {
  const match = value.trim().match(/^([A-D])(?:[\).:\s]|$)/i);
  return match?.[1]?.toUpperCase() ?? null;
}

function stripOptionLabel(value: string): string {
  return value.trim().replace(/^[A-D][\).:\s]+/i, '').trim();
}

export function resolveCorrectAnswer(options: string[], correctAnswer: string): string {
  const exactOption = options.find((option) => normalize(option) === normalize(correctAnswer));
  if (exactOption) return exactOption;

  const label = getOptionLabel(correctAnswer);
  if (label) {
    return options[OPTION_LABELS.indexOf(label)] ?? correctAnswer;
  }

  const matchingOption = options.find(
    (option) => normalize(stripOptionLabel(option)) === normalize(correctAnswer),
  );
  return matchingOption ?? correctAnswer;
}

export function isSelectedAnswerCorrect(
  options: string[],
  selectedAnswer: string | undefined,
  correctAnswer: string,
): boolean {
  if (!selectedAnswer) return false;

  const resolvedCorrectAnswer = resolveCorrectAnswer(options, correctAnswer);
  if (normalize(selectedAnswer) === normalize(resolvedCorrectAnswer)) return true;

  return normalize(stripOptionLabel(selectedAnswer)) === normalize(stripOptionLabel(resolvedCorrectAnswer));
}
