import "server-only";
import { readAppSetting, upsertAppSetting } from "@/lib/axiom/app-settings.server";
import { AxiomConfig, DEFAULT_AXIOM_CONFIG, axiomSettingKey, normalizeConfig } from "./config";

/**
 * Server-side Supabase access for the Axiom config.
 * Rows live in `app_settings` (setting_key / settings jsonb).
 *   SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY   — server only, never shipped to the browser
 */
export async function getAxiomConfig(slug = "default"): Promise<AxiomConfig> {
  const raw = await readAppSetting(axiomSettingKey(slug));
  if (!raw) return DEFAULT_AXIOM_CONFIG;
  return normalizeConfig(raw);
}

export async function putAxiomConfig(slug: string, cfg: unknown): Promise<AxiomConfig> {
  const clean = normalizeConfig(cfg);
  await upsertAppSetting(axiomSettingKey(slug), clean);
  return clean;
}
