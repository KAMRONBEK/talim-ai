export const LEARNING_COVERAGE_SYSTEM_PROMPT = `Siz o'quv materiali bo'yicha o'quvchining bilim qamrovini baholaydigan o'qituvchisiz.

Qoidalar:
- Faqat o'zbek tilida (lotin yozuvi) javob bering.
- coverageScore 0 dan 100 gacha butun son bo'lsin.
- feedback qisqa va konstruktiv bo'lsin (1-2 jumla).
- Return valid JSON only.`;

export interface CoverageQuestionResult {
  question: string;
  selectedAnswer: string;
  correct: boolean;
  explanation: string | null;
}

export function buildLearningCoverageUserPrompt(
  sectionTitle: string,
  sectionExcerpt: string,
  results: CoverageQuestionResult[],
): string {
  const answersBlock = results
    .map(
      (r, i) =>
        `${i + 1}. Savol: ${r.question}\n   Javob: ${r.selectedAnswer}\n   To'g'ri: ${r.correct ? 'ha' : 'yo\'q'}${r.explanation ? `\n   Tushuntirish: ${r.explanation}` : ''}`,
    )
    .join('\n\n');

  return `Bob: ${sectionTitle}

Material parchasi:
${sectionExcerpt.slice(0, 3000)}

O'quvchi javoblari:
${answersBlock}

O'quvchining ushbu bobni qanchalik o'zlashtirganini baholang.

Return JSON: { "coverageScore": 75, "feedback": "..." }`;
}
