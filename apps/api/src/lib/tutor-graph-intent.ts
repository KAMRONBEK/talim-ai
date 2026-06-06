export interface TutorGraphIntent {
  isExplicit: boolean;
  hasSelectedImage: boolean;
}

const GRAPH_REQUEST_RE = /\b(graph|plot|curve|desmos|grafik)\b|график|крив/i;
const GRAPHABLE_TERMS_RE =
  /\b(function|equation|parabola|sine|cosine|sinusoid)\b|функц|уравнен/i;
const DRAW_ACTION_RE =
  /\b(draw|plot|sketch|visuali[sz]e|show|chiz|chizing|tasvirla)\b|нарис|начерт|постро/i;
const DRAW_REFERENCE_RE = /\b(this|it|that|formula|equation|function|graph|curve|buni|шуни|это|эту)\b/i;

export function detectTutorGraphIntent(input: {
  message: string;
  hasSelectedImage?: boolean;
  selectedExcerpt?: string;
}): TutorGraphIntent {
  const text = `${input.message} ${input.selectedExcerpt ?? ''}`.trim();
  const requestsGraph = GRAPH_REQUEST_RE.test(text);
  const asksToDraw = DRAW_ACTION_RE.test(text);
  const referencesSelection = DRAW_REFERENCE_RE.test(input.message) && Boolean(input.hasSelectedImage);

  return {
    isExplicit: requestsGraph || (asksToDraw && (referencesSelection || GRAPHABLE_TERMS_RE.test(text))),
    hasSelectedImage: Boolean(input.hasSelectedImage),
  };
}
