-- Podcast transcript sync: persist real per-turn timings captured at synthesis
-- time from each dialogue turn's audio byte length (constant-bitrate mp3 ⇒
-- bytes ≈ duration), stored as [{ speaker, text, startMs, endMs }] on the episode.
-- Additive only. Legacy episodes keep NULL and fall back to char-proportion timing.

ALTER TABLE "PodcastEpisode" ADD COLUMN IF NOT EXISTS "segments" JSONB;
