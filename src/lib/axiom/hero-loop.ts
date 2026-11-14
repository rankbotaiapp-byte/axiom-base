import { HERO_VIDEO_MAX_BYTES, isMp4 } from "./hero-video.ts";
import {
  HERO_LOOP_FPS,
  HERO_LOOP_FRAMES,
  HERO_LOOP_HEIGHT,
  HERO_LOOP_WIDTH,
  frameTiming,
  heroEncoderConfig,
} from "./branded-hero.ts";
import { paintHeroFrame, type BrandInk } from "./brand-paint.ts";

export function canEncodeHero(): boolean {
  return typeof VideoEncoder !== "undefined";
}

export async function encodeHeroLoop(options: {
  source: CanvasImageSource;
  srcW: number;
  srcH: number;
  ink: BrandInk;
  preview?: HTMLCanvasElement | null;
  onFrame?: (done: number, total: number) => void;
  signal?: AbortSignal;
}): Promise<{ bytes: Uint8Array; hardware: boolean }> {
  if (!canEncodeHero()) throw new Error("This browser cannot encode the MP4.");
  let config = heroEncoderConfig();
  let support = await VideoEncoder.isConfigSupported(config);
  let hardware = true;
  if (!support.supported) {
    hardware = false;
    config = heroEncoderConfig("prefer-software");
    support = await VideoEncoder.isConfigSupported(config);
  }
  if (!support.supported) throw new Error("This browser cannot encode the MP4.");

  const canvas = document.createElement("canvas");
  canvas.width = HERO_LOOP_WIDTH;
  canvas.height = HERO_LOOP_HEIGHT;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("Could not draw the hero loop");

  const { Muxer, ArrayBufferTarget } = await import("mp4-muxer");
  const target = new ArrayBufferTarget();
  const muxer = new Muxer({
    target,
    video: {
      codec: "avc",
      width: HERO_LOOP_WIDTH,
      height: HERO_LOOP_HEIGHT,
      frameRate: HERO_LOOP_FPS,
    },
    fastStart: "in-memory",
    firstTimestampBehavior: "strict",
  });

  let failed: Error | null = null;
  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (err) => {
      failed = err instanceof Error ? err : new Error("The encoder stopped");
    },
  });

  try {
    encoder.configure(config);
    for (let i = 0; i < HERO_LOOP_FRAMES; i += 1) {
      if (options.signal?.aborted) throw new Error("Encoding stopped");
      if (failed) throw failed;
      const timing = frameTiming(i);
      paintHeroFrame(ctx, options.source, options.srcW, options.srcH, timing.timestamp / 1_000_000, options.ink);
      const preview = options.preview;
      if (preview) {
        if (preview.width !== canvas.width || preview.height !== canvas.height) {
          preview.width = canvas.width;
          preview.height = canvas.height;
        }
        preview.getContext("2d")?.drawImage(canvas, 0, 0);
      }
      const frame = new VideoFrame(canvas, { timestamp: timing.timestamp, duration: timing.duration });
      encoder.encode(frame, { keyFrame: i % HERO_LOOP_FPS === 0 });
      frame.close();
      if (encoder.encodeQueueSize > 6) {
        await new Promise((resolve) => window.setTimeout(resolve, 12));
      }
      if (i % 6 === 0) {
        options.onFrame?.(i + 1, HERO_LOOP_FRAMES);
        await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
      }
    }
    options.onFrame?.(HERO_LOOP_FRAMES, HERO_LOOP_FRAMES);
    await encoder.flush();
    if (failed) throw failed;
    muxer.finalize();
  } finally {
    if (encoder.state !== "closed") encoder.close();
  }

  const bytes = new Uint8Array(target.buffer);
  if (bytes.byteLength > HERO_VIDEO_MAX_BYTES) throw new Error("The loop is over 12 MB.");
  if (!isMp4(bytes)) throw new Error("The loop was not a valid MP4.");
  return { bytes, hardware };
}
