import { readFile } from "node:fs/promises";
import path from "node:path";
import { validateForPublish } from "@/lib/schemas/publishGate";
import type { TenantStorefrontConfig } from "@/lib/schemas/tenant";

export type LoadedStorefront =
  | { status: "missing" }
  | { status: "invalid" }
  | { status: "ok"; config: TenantStorefrontConfig };

const SLUG = /^[a-z0-9-]{1,80}$/i;

/**
 * Local storefront document only. A missing file is not an error.
 * Invalid JSON or a failed publish gate is reported as invalid — the page 404s.
 */
export async function loadTenantStorefrontConfig(slug: string): Promise<LoadedStorefront> {
  const safe = slug.trim();
  if (!SLUG.test(safe) || safe.includes("..")) return { status: "missing" };
  const file = path.join(process.cwd(), "data", "storefronts", `${safe}.json`);
  let raw = "";
  try {
    raw = await readFile(file, "utf8");
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT" || code === "ENOTDIR") return { status: "missing" };
    return { status: "invalid" };
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    const gate = validateForPublish(parsed);
    if (!gate.ok) return { status: "invalid" };
    if (gate.data.slug !== safe) return { status: "invalid" };
    return { status: "ok", config: gate.data };
  } catch {
    return { status: "invalid" };
  }
}
