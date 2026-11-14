import { heroClipTooLong } from "./hero-video.ts";

function waitFor(target: EventTarget, event: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("Could not read that file"));
    }, 8000);
    const ok = () => {
      cleanup();
      resolve();
    };
    const bad = () => {
      cleanup();
      reject(new Error("Could not read that file"));
    };
    const cleanup = () => {
      clearTimeout(timer);
      target.removeEventListener(event, ok);
      target.removeEventListener("error", bad);
    };
    target.addEventListener(event, ok, { once: true });
    target.addEventListener("error", bad, { once: true });
  });
}

function jpeg(canvas: HTMLCanvasElement): string {
  const url = canvas.toDataURL("image/jpeg", 0.82);
  if (!url.startsWith("data:image/jpeg")) throw new Error("Could not make a poster frame");
  return url;
}

async function stillPoster(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 900 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not read that photo");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return jpeg(canvas);
}

/** First readable frame, scaled down, plus the clip length. */
export async function inspectHeroUpload(file: File): Promise<{ poster: string; seconds: number }> {
  const video = file.type === "video/mp4" || file.name.toLowerCase().endsWith(".mp4");
  if (!video) return { poster: await stillPoster(file), seconds: 0 };
  const url = URL.createObjectURL(file);
  const el = document.createElement("video");
  el.muted = true;
  el.playsInline = true;
  el.preload = "auto";
  el.src = url;
  try {
    await waitFor(el, "loadeddata");
    const seconds = el.duration;
    if (heroClipTooLong(seconds)) throw new Error("Keep the clip under 20 seconds");
    const mark = Number.isFinite(seconds) ? Math.min(0.25, Math.max(0, seconds * 0.12)) : 0;
    if (mark > 0.01) {
      el.currentTime = mark;
      await waitFor(el, "seeked");
    }
    const width = el.videoWidth || 640;
    const height = el.videoHeight || 360;
    const scale = Math.min(1, 900 / Math.max(width, height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not read that video");
    ctx.drawImage(el, 0, 0, canvas.width, canvas.height);
    return { poster: jpeg(canvas), seconds };
  } finally {
    el.removeAttribute("src");
    el.load();
    URL.revokeObjectURL(url);
  }
}
