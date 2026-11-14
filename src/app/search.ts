export function flatSearch(raw: Record<string, string | string[] | undefined>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    out[key] = Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
  }
  return out;
}
