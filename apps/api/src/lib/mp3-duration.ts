/**
 * Measure an MP3's real duration by walking its frame headers.
 *
 * The video job had just synthesised the audio and then stored a word-count ESTIMATE of
 * how long it would be (~150 wpm). The player, which loads the real audio, disagreed —
 * and because it learns each segment's true length lazily as you advance, the total grew
 * while you watched: 1:23 on slide 1, 1:41 on slide 5, against a stored 1:19. The scrub
 * bar and chapter ticks are driven by that same total, so they slid leftward mid-playback.
 *
 * Walking frames rather than dividing bytes by bitrate because TTS output is not reliably
 * constant-bitrate, and a CBR assumption is how you get a number that is confidently wrong.
 */

const BITRATES_V1_L3 = [
  0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0,
] as const;
const BITRATES_V2_L3 = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, 0] as const;
const SAMPLE_RATES_V1 = [44100, 48000, 32000, 0] as const;
const SAMPLE_RATES_V2 = [22050, 24000, 16000, 0] as const;
const SAMPLE_RATES_V25 = [11025, 12000, 8000, 0] as const;

/** Skip an ID3v2 tag if present; its size is a syncsafe integer in bytes 6..9. */
function audioStart(buf: Buffer): number {
  if (buf.length >= 10 && buf.toString('ascii', 0, 3) === 'ID3') {
    const size =
      ((buf[6]! & 0x7f) << 21) | ((buf[7]! & 0x7f) << 14) | ((buf[8]! & 0x7f) << 7) | (buf[9]! & 0x7f);
    return 10 + size;
  }
  return 0;
}

/**
 * @returns duration in seconds, or null when no valid frame is found — callers must treat
 *   null as "unknown" rather than zero, since a silently-zero segment is worse than an
 *   estimate.
 */
export function mp3DurationSec(buf: Buffer): number | null {
  let i = audioStart(buf);
  let seconds = 0;
  let frames = 0;

  while (i + 4 <= buf.length) {
    // Frame sync: 11 set bits.
    if (buf[i] !== 0xff || (buf[i + 1]! & 0xe0) !== 0xe0) {
      i += 1;
      continue;
    }
    const b1 = buf[i + 1]!;
    const b2 = buf[i + 2]!;

    const versionBits = (b1 >> 3) & 0x03; // 0=2.5, 2=2, 3=1
    const layerBits = (b1 >> 1) & 0x03; // 1=III
    if (versionBits === 1 || layerBits !== 1) {
      i += 1;
      continue;
    }

    const bitrateIndex = (b2 >> 4) & 0x0f;
    const sampleRateIndex = (b2 >> 2) & 0x03;
    if (bitrateIndex === 0 || bitrateIndex === 15 || sampleRateIndex === 3) {
      i += 1;
      continue;
    }

    const isV1 = versionBits === 3;
    const bitrate = (isV1 ? BITRATES_V1_L3[bitrateIndex] : BITRATES_V2_L3[bitrateIndex])! * 1000;
    const sampleRate = (
      versionBits === 3 ? SAMPLE_RATES_V1 : versionBits === 2 ? SAMPLE_RATES_V2 : SAMPLE_RATES_V25
    )[sampleRateIndex]!;
    if (!bitrate || !sampleRate) {
      i += 1;
      continue;
    }

    // Layer III: 1152 samples per frame on MPEG-1, 576 on MPEG-2/2.5.
    const samplesPerFrame = isV1 ? 1152 : 576;
    const padding = (b2 >> 1) & 0x01;
    const frameBytes = Math.floor((samplesPerFrame / 8) * (bitrate / sampleRate)) + padding;
    if (frameBytes <= 4) {
      i += 1;
      continue;
    }

    seconds += samplesPerFrame / sampleRate;
    frames += 1;
    i += frameBytes;
  }

  return frames > 0 ? seconds : null;
}
