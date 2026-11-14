
export const MAX_LOGO_BYTES = 2 * 1024 * 1024;

const RASTER: { type: string; ext: string; test: (b: Buffer) => boolean }[] = [
  { type: "image/png", ext: "png", test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { type: "image/jpeg", ext: "jpg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { type: "image/webp", ext: "webp", test: (b) => b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP" },
];

/** Checks real file bytes (not the browser's claimed type). Returns null if rejected. */
export function sniffLogo(bytes: Buffer): { type: string; ext: string } | null {
  for (const r of RASTER) if (r.test(bytes)) return { type: r.type, ext: r.ext };
  const head = bytes.subarray(0, 4096).toString("utf8").trim().toLowerCase();
  if ((head.startsWith("<svg") || head.startsWith("<?xml")) && head.includes("<svg")) {
    const all = bytes.toString("utf8").toLowerCase();
    // Reject anything scriptable — logos never need it.
    if (/<script|on[a-z]+\s*=|javascript:|<foreignobject|<iframe|<embed|<object/.test(all)) return null;
    return { type: "image/svg+xml", ext: "svg" };
  }
  return null;
}

export const cleanText = (v: FormDataEntryValue | null, max: number) =>
  typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, max) : "";

/** Normalizes US numbers to "+1XXXXXXXXXX"; returns null when invalid. */
export function normalizePhone(raw: string): string | null {
  const d = raw.replace(/\D/g, "");
  if (d.length === 10) return `+1${d}`;
  if (d.length === 11 && d.startsWith("1")) return `+${d}`;
  return null;
}

export function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "business"
  );
}
