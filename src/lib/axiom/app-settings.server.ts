import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * One row in public.app_settings.
 * setting_key / setting_value keep the existing readers working.
 * slug, shop_slug, settings, and assets are the studio columns.
 */
export type AppSettingRow = {
  setting_key: string;
  setting_value: string;
  slug: string | null;
  shop_slug: string | null;
  settings: Record<string, unknown>;
  assets: Record<string, unknown>;
  updated_at: string;
};

function admin(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function asObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return {};
    }
  }
  return {};
}

function identityFor(key: string): { slug: string | null; shopSlug: string | null } {
  const studio = /^axiom_studio_fx:(.+)$/.exec(key);
  if (studio) return { slug: studio[1], shopSlug: studio[1] };
  const landing = /^axiom_landing:(.+)$/.exec(key);
  if (landing) return { slug: landing[1], shopSlug: landing[1] };
  if (key === "axiom_studio_global") return { slug: "global", shopSlug: null };
  return { slug: null, shopSlug: null };
}

function assetsFor(settings: Record<string, unknown>): Record<string, unknown> {
  const assets: Record<string, unknown> = {};
  for (const key of ["rawUrl", "brandedUrl", "autopilotVideoUrl", "scrubMatrix", "assets"] as const) {
    if (key in settings) assets[key] = settings[key];
  }
  return assets;
}

export function appSettingRow(key: string, value: unknown): AppSettingRow {
  const settings = asObject(value);
  const { slug, shopSlug } = identityFor(key);
  return {
    setting_key: key,
    setting_value: JSON.stringify(value ?? settings),
    slug,
    shop_slug: shopSlug,
    settings,
    assets: assetsFor(settings),
    updated_at: new Date().toISOString(),
  };
}

function parseStored(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

export async function readAppSetting(key: string): Promise<unknown | null> {
  const db = admin();
  if (!db) return null;
  const wide = await db
    .from("app_settings")
    .select("settings, setting_value")
    .eq("setting_key", key)
    .maybeSingle();
  const row = wide.error
    ? (
        await db.from("app_settings").select("setting_value").eq("setting_key", key).maybeSingle()
      ).data
    : wide.data;
  if (!row) return null;
  const settings = (row as { settings?: unknown }).settings;
  if (settings && typeof settings === "object" && !Array.isArray(settings) && Object.keys(settings).length > 0) {
    return settings;
  }
  return parseStored((row as { setting_value?: unknown }).setting_value);
}

export async function upsertAppSetting(key: string, value: unknown): Promise<void> {
  const db = admin();
  if (!db) throw new Error("Supabase is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).");
  const row = appSettingRow(key, value);
  const full = await db.from("app_settings").upsert(row, { onConflict: "setting_key" });
  if (!full.error) return;

  const message = full.error.message;
  if (/could not find the table/i.test(message)) {
    throw new Error(message);
  }

  const legacy = await db.from("app_settings").upsert(
    { setting_key: key, setting_value: row.setting_value },
    { onConflict: "setting_key" },
  );
  if (!legacy.error) return;

  const { data: existing, error: lookupError } = await db
    .from("app_settings")
    .select("setting_key")
    .eq("setting_key", key)
    .maybeSingle();
  if (lookupError) throw new Error(message);

  const write = existing
    ? await db.from("app_settings").update({ setting_value: row.setting_value }).eq("setting_key", key)
    : await db.from("app_settings").insert({ setting_key: key, setting_value: row.setting_value });
  if (write.error) throw new Error(write.error.message);
}
