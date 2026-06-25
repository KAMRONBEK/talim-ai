-- AI video generation: a new usage feature for metering video generations and a
-- per-slide narration timeline stored on ContentVideo (the "video" is a narrated
-- slideshow: deck slides + per-slide TTS audio, played in-browser).

ALTER TYPE "UsageFeature" ADD VALUE IF NOT EXISTS 'VIDEO_GEN';

ALTER TABLE "ContentVideo" ADD COLUMN IF NOT EXISTS "segments" JSONB;
