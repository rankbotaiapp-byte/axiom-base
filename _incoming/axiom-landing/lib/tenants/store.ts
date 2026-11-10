import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export type TenantStatus = "pending_payment" | "pending_review" | "active" | "suspended";

export type Tenant = {
  id: string;
  slug: string;
  status: TenantStatus;
  build_id: string;
  plan: string;
  business_name: string;
  phone: string;
  logo_url: string | null;
  owner_name: string | null;
  email: string;
  stripe_session_id: string | null;
  amount_paid_cents: number | null;
  created_at: string;
  activated_at: string | null;
};

export type NewTenant = Pick<Tenant, "slug" | "status" | "build_id" | "plan" | "business_name" | "phone" | "logo_url" | "owner_name" | "email">;

export class SlugTakenError extends Error {}

/* ------------------------------------------------------------------ */
/* Driver selection                                                    */
/* ------------------------------------------------------------------ */

const SB_URL = process.env.SUPABASE_URL?.replace(/\/$/, "");
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_LOGO_BUCKET || "tenant-logos";

export const storeMode = SB_URL && SB_KEY ? "supabase" : "local";

/* ------------------------------------------------------------------ */
/* Supabase (PostgREST + Storage over fetch — no SDK needed)           */
/* ------------------------------------------------------------------ */

const sbHeaders = (extra: Record<string, string> = {}) => ({
  apikey: SB_KEY!,
  Authorization: `Bearer ${SB_KEY}`,
  ...extra,
});

async function sbInsert(t: NewTenant): Promise<Tenant> {
  const res = await fetch(`${SB_URL}/rest/v1/tenants`, {
    method: "POST",
    headers: sbHeaders({ "Content-Type": "application/json", Prefer: "return=representation" }),
    body: JSON.stringify(t),
    cache: "no-store",
  });
  if (res.status === 409) throw new SlugTakenError(t.slug);
  if (!res.ok) throw new Error(`Supabase insert ${res.status}: ${await res.text()}`);
  return (await res.json())[0];
}

async function sbGet(column: "slug" | "id", value: string): Promise<Tenant | null> {
  const res = await fetch(`${SB_URL}/rest/v1/tenants?${column}=eq.${encodeURIComponent(value)}&select=*&limit=1`, {
    headers: sbHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Supabase select ${res.status}: ${await res.text()}`);
  return (await res.json())[0] ?? null;
}

async function sbUpdate(id: string, patch: Partial<Tenant>): Promise<Tenant | null> {
  const res = await fetch(`${SB_URL}/rest/v1/tenants?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: sbHeaders({ "Content-Type": "application/json", Prefer: "return=representation" }),
    body: JSON.stringify(patch),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Supabase update ${res.status}: ${await res.text()}`);
  return (await res.json())[0] ?? null;
}

async function sbUpload(objectPath: string, bytes: Buffer, contentType: string): Promise<string> {
  const res = await fetch(`${SB_URL}/storage/v1/object/${BUCKET}/${objectPath}`, {
    method: "POST",
    headers: sbHeaders({ "Content-Type": contentType, "x-upsert": "true", "Cache-Control": "31536000" }),
    body: new Uint8Array(bytes),
  });
  if (!res.ok) throw new Error(`Supabase upload ${res.status}: ${await res.text()}`);
  return `${SB_URL}/storage/v1/object/public/${BUCKET}/${objectPath}`;
}

/* ------------------------------------------------------------------ */
/* Local file store — dev/demo only (Vercel's filesystem is read-only) */
/* ------------------------------------------------------------------ */

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "tenants.json");
export const LOCAL_LOGO_DIR = path.join(DATA_DIR, "logos");

async function localAll(): Promise<Tenant[]> {
  try {
    return JSON.parse(await fs.readFile(DB_FILE, "utf8"));
  } catch {
    return [];
  }
}
async function localSave(all: Tenant[]) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DB_FILE, JSON.stringify(all, null, 2));
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

export async function createTenant(t: NewTenant): Promise<Tenant> {
  if (storeMode === "supabase") return sbInsert(t);
  const all = await localAll();
  if (all.some((x) => x.slug === t.slug)) throw new SlugTakenError(t.slug);
  const row: Tenant = {
    ...t,
    id: crypto.randomUUID(),
    stripe_session_id: null,
    amount_paid_cents: null,
    created_at: new Date().toISOString(),
    activated_at: t.status === "active" ? new Date().toISOString() : null,
  };
  await localSave([...all, row]);
  return row;
}

export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  if (!/^[a-z0-9-]{3,60}$/.test(slug)) return null;
  if (storeMode === "supabase") return sbGet("slug", slug);
  return (await localAll()).find((x) => x.slug === slug) ?? null;
}

export async function getTenantById(id: string): Promise<Tenant | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  if (storeMode === "supabase") return sbGet("id", id);
  return (await localAll()).find((x) => x.id === id) ?? null;
}

export async function updateTenant(id: string, patch: Partial<Tenant>): Promise<Tenant | null> {
  if (storeMode === "supabase") return sbUpdate(id, patch);
  const all = await localAll();
  const i = all.findIndex((x) => x.id === id);
  if (i < 0) return null;
  all[i] = { ...all[i], ...patch };
  await localSave(all);
  return all[i];
}

/** Stores the logo and returns its public URL. */
export async function uploadLogo(bytes: Buffer, ext: string, contentType: string): Promise<string> {
  const name = `${crypto.randomUUID()}.${ext}`; // unguessable, independent of the slug
  if (storeMode === "supabase") return sbUpload(`logos/${name}`, bytes, contentType);
  await fs.mkdir(LOCAL_LOGO_DIR, { recursive: true });
  await fs.writeFile(path.join(LOCAL_LOGO_DIR, name), bytes);
  return `/api/tenant-logo/${name}`;
}
