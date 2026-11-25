import "server-only";
import { createClient } from "@supabase/supabase-js";
import { readAppSetting, upsertAppSetting } from "@/lib/axiom/app-settings.server";
import {
  STUDIO_GLOBAL_KEY,
  defaultStudioFxState,
  defaultStudioGlobalLibrary,
  normalizeStudioFxState,
  normalizeStudioGlobal,
  studioFxSettingKey,
} from "./defaults";
import type { StudioFxState, StudioGlobalLibrary } from "./types";

function admin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

async function readSetting(key: string): Promise<unknown | null> {
  return readAppSetting(key);
}

async function writeSetting(key: string, value: unknown): Promise<void> {
  await upsertAppSetting(key, value);
}

export async function getStudioFxState(slug = "default"): Promise<StudioFxState> {
  const key = studioFxSettingKey(slug);
  const raw = await readSetting(key);
  if (!raw) return defaultStudioFxState(slug);
  return normalizeStudioFxState(raw, slug);
}

export async function putStudioFxState(slug: string, cfg: unknown): Promise<StudioFxState> {
  const clean = normalizeStudioFxState(cfg, slug);
  clean.updatedAt = new Date().toISOString();
  await writeSetting(studioFxSettingKey(slug), clean);
  return clean;
}

export async function getStudioGlobalLibrary(): Promise<StudioGlobalLibrary> {
  const raw = await readSetting(STUDIO_GLOBAL_KEY);
  if (!raw) return defaultStudioGlobalLibrary();
  return normalizeStudioGlobal(raw);
}

export async function putStudioGlobalLibrary(cfg: unknown): Promise<StudioGlobalLibrary> {
  const clean = normalizeStudioGlobal(cfg);
  clean.updatedAt = new Date().toISOString();
  await writeSetting(STUDIO_GLOBAL_KEY, clean);
  return clean;
}

/** Append a render log and bump the matching tenant row inside the global library. */
export async function appendStudioLog(entry: {
  slug: string;
  label: string;
  progress?: number;
}): Promise<StudioGlobalLibrary> {
  const lib = await getStudioGlobalLibrary();
  const slug = entry.slug.replace(/[^a-z0-9-_]/gi, "").slice(0, 64) || "default";
  const progress = Math.max(0, Math.min(1, Number(entry.progress ?? 1) || 0));
  const now = new Date().toISOString();
  lib.queueJobs = [
    { id: `job-${Date.now()}`, slug, label: entry.label.slice(0, 48), progress },
    ...lib.queueJobs.filter((job) => !(job.slug === slug && job.label === entry.label)),
  ].slice(0, 6);
  const known = lib.tenants.some((tenant) => tenant.slug === slug);
  lib.tenants = known
    ? lib.tenants.map((tenant) =>
        tenant.slug === slug
          ? { ...tenant, studioUsage: tenant.studioUsage + 1, lastRenderAt: now }
          : tenant,
      )
    : [
        {
          slug,
          name: slug,
          niche: "contractor",
          studioUsage: 1,
          stripeConnected: false,
          lastRenderAt: now,
        },
        ...lib.tenants,
      ].slice(0, 12);
  return putStudioGlobalLibrary(lib);
}

/** Upload bytes to storage bucket `app-uploads` (falls back to `media`). */
export async function uploadStudioBytes(
  slug: string,
  bytes: ArrayBuffer,
  fileName: string,
  contentType: string,
): Promise<string> {
  const db = admin();
  if (!db) throw new Error("Supabase is not configured for uploads.");
  const safeSlug = slug.replace(/[^a-z0-9-_]/gi, "").slice(0, 64) || "default";
  const ext = fileName.split(".").pop()?.toLowerCase() || "bin";
  const path = `${safeSlug}/${Date.now()}.${ext}`;
  const buckets = ["app-uploads", "media"] as const;
  let lastError = "Upload failed";
  for (const bucket of buckets) {
    const { error } = await db.storage.from(bucket).upload(path, bytes, {
      contentType,
      upsert: true,
    });
    if (!error) {
      const { data } = db.storage.from(bucket).getPublicUrl(path);
      return data.publicUrl;
    }
    lastError = error.message;
  }
  throw new Error(lastError);
}
