import { prisma } from '../lib/prisma.js';
import { storageService } from './storage.service.js';

/**
 * Deleting the blobs a content's generated media owns.
 *
 * This existed twice, inline and byte-for-byte identical, in the INDIVIDUAL and TENANT_OWNER
 * delete handlers — and not at all in the admin ones, which is the whole of issue #35: the admin
 * paths were written as a separate module and never learned the cleanup, so every admin delete
 * left the podcast mp3s on the volume with their rows cascaded away, making the paths
 * unrecoverable. Extracting it means the next delete path cannot be written without it.
 *
 * It also fixes something none of the three paths had right. They deleted `ContentVideo.storagePath`
 * — a column no code ever writes. The generator stores per-slide narration at
 * `segments[].audioPath` (`generateVideo.job.ts:179`), and the schema says so outright: there is no
 * single encoded video file. So *every* delete path was orphaning video audio, not just the admin
 * ones. `storagePath` is still deleted here when set, purely as legacy safety.
 *
 * Every deletion is best-effort and never throws. A missing or unreadable file must not turn a
 * delete the user asked for into a 500, and the admin path in particular already swallowed storage
 * errors — changing that would start failing admin deletes that used to succeed.
 */

/** A `ContentVideo.segments` entry, as far as cleanup is concerned. */
function audioPathsFromSegments(segments: unknown): string[] {
  // Prisma types this as JsonValue and it is null on legacy rows, so the parse has to be total:
  // an unguarded map() here would break deletion for every video generated before segments existed.
  if (!Array.isArray(segments)) return [];
  const paths: string[] = [];
  for (const segment of segments) {
    if (!segment || typeof segment !== 'object') continue;
    const value = (segment as { audioPath?: unknown }).audioPath;
    if (typeof value === 'string' && value.length > 0) paths.push(value);
  }
  return paths;
}

/** Delete blobs, tolerating every failure. @returns how many were actually removed. */
async function deleteAll(paths: readonly string[]): Promise<number> {
  const outcomes = await Promise.all(
    paths.map((path) =>
      storageService
        .delete(path)
        .then(() => true)
        .catch(() => false),
    ),
  );
  return outcomes.filter(Boolean).length;
}

/** Every episode mp3 under one podcast. */
export async function deletePodcastBlobs(podcastId: string): Promise<number> {
  const episodes = await prisma.podcastEpisode.findMany({
    where: { podcastId },
    select: { audioPath: true },
  });
  return deleteAll(episodes.map((e) => e.audioPath).filter((p): p is string => Boolean(p)));
}

/** Every narration mp3 under one generated video, plus the vestigial storagePath if set. */
export async function deleteContentVideoBlobs(videoId: string): Promise<number> {
  const video = await prisma.contentVideo.findUnique({
    where: { id: videoId },
    select: { storagePath: true, segments: true },
  });
  if (!video) return 0;
  const paths = audioPathsFromSegments(video.segments);
  if (video.storagePath) paths.push(video.storagePath);
  return deleteAll(paths);
}

/**
 * Every media blob owned by one content: podcast episode audio and video narration audio.
 *
 * Deliberately does NOT delete `Content.storagePath` — the three callers differ in how they
 * handle the source file's errors, and that stays theirs.
 *
 * @returns how many blobs were removed, so a caller can assert the cleanup did something rather
 *   than silently swallowing everything.
 */
export async function deleteContentMediaBlobs(contentId: string): Promise<number> {
  const [podcasts, videos] = await Promise.all([
    prisma.podcast.findMany({
      where: { contentId },
      select: { episodes: { select: { audioPath: true } } },
    }),
    prisma.contentVideo.findMany({
      where: { contentId },
      select: { storagePath: true, segments: true },
    }),
  ]);

  const paths: string[] = [];
  for (const podcast of podcasts) {
    for (const episode of podcast.episodes) {
      if (episode.audioPath) paths.push(episode.audioPath);
    }
  }
  for (const video of videos) {
    paths.push(...audioPathsFromSegments(video.segments));
    if (video.storagePath) paths.push(video.storagePath);
  }
  return deleteAll(paths);
}
