const FENCE_RE = /(```[\s\S]*?```)/g;

function normalizeSegment(segment: string): string {
  return segment
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, eq: string) => `$$${eq.trim()}$$`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, eq: string) => `$${eq.trim()}$`);
}

export function preprocessLatex(content: string): string {
  if (!content) return content;

  const parts = content.split(FENCE_RE);
  return parts
    .map((part) => (part.startsWith('```') ? part : normalizeSegment(part)))
    .join('');
}
