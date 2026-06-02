import { YoutubeTranscript } from 'youtube-transcript';

export function extractYoutubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

export async function extractYoutubeTranscript(url: string): Promise<string> {
  const videoId = extractYoutubeVideoId(url);
  if (!videoId) {
    throw new Error('Invalid YouTube URL');
  }
  const transcript = await YoutubeTranscript.fetchTranscript(videoId);
  const text = transcript.map((item) => item.text).join(' ').trim();
  if (!text) {
    throw new Error('No transcript available for this video');
  }
  return text;
}
