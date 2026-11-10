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

const TENANT_TTL_MS = 8_000;
const tenantMemo = new Map<string, { at: number; value: Tenant | null }>();

function memoGet(key: string): Tenant | null | undefined {
  const hit = tenantMemo.get(key);
  if (!hit) return undefined;
  if (Date.now() - hit.at > TENANT_TTL_MS) {
    tenantMemo.delete(key);
    return undefined;
  }
  return hit.value;
}

function memoSet(key: string, value: Tenant | null) {
  tenantMemo.set(key, { at: Date.now(), value });
}

function memoBust(tenant: Pick<Tenant, "id" | "slug"> | null | undefined) {
  if (!tenant) return;
  tenantMemo.delete(`slug:${tenant.slug}`);
  tenantMemo.delete(`id:${tenant.id}`);
}

async function sbFetch(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal, cache: "no-store" });
  } finally {
    clearTimeout(timer);
  }
}

/* ------------------------------------------------------------------ */
/* Supabase (PostgREST + Storage over fetch — no SDK needed)           */
/* ------------------------------------------------------------------ */

const sbHeaders = (extra: Record<string, string> = {}) => ({
  apikey: SB_KEY!,
  Authorization: `Bearer ${SB_KEY}`,
  ...extra,
});

async function sbInsert(t: NewTenant): Promise<Tenant> {
  const res = await sbFetch(
    `${SB_URL}/rest/v1/tenants`,
    {
      method: "POST",
      headers: sbHeaders({ "Content-Type": "application/json", Prefer: "return=representation" }),
      body: JSON.stringify(t),
    },
    8_000,
  );
  if (res.status === 409) throw new SlugTakenError(t.slug);
  if (!res.ok) throw new Error(`Supabase insert ${res.status}: ${await res.text()}`);
  return (await res.json())[0];
}

async function sbGet(column: "slug" | "id", value: string): Promise<Tenant | null> {
  const res = await sbFetch(
    `${SB_URL}/rest/v1/tenants?${column}=eq.${encodeURIComponent(value)}&select=*&limit=1`,
    { headers: sbHeaders() },
    3_000,
  );
  if (!res.ok) throw new Error(`Supabase select ${res.status}: ${await res.text()}`);
  return (await res.json())[0] ?? null;
}

async function sbUpdate(id: string, patch: Partial<Tenant>): Promise<Tenant | null> {
  const res = await sbFetch(
    `${SB_URL}/rest/v1/tenants?id=eq.${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: sbHeaders({ "Content-Type": "application/json", Prefer: "return=representation" }),
      body: JSON.stringify(patch),
    },
    8_000,
  );
  if (!res.ok) throw new Error(`Supabase update ${res.status}: ${await res.text()}`);
  return (await res.json())[0] ?? null;
}

async function sbUpload(objectPath: string, bytes: Buffer, contentType: string): Promise<string> {
  const res = await sbFetch(
    `${SB_URL}/storage/v1/object/${BUCKET}/${objectPath}`,
    {
      method: "POST",
      headers: sbHeaders({ "Content-Type": contentType, "x-upsert": "true", "Cache-Control": "31536000" }),
      body: new Uint8Array(bytes),
    },
    12_000,
  );
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
  let row: Tenant;
  if (storeMode === "supabase") {
    row = await sbInsert(t);
  } else {
    const all = await localAll();
    if (all.some((x) => x.slug === t.slug)) throw new SlugTakenError(t.slug);
    row = {
      ...t,
      id: crypto.randomUUID(),
      stripe_session_id: null,
      amount_paid_cents: null,
      created_at: new Date().toISOString(),
      activated_at: t.status === "active" ? new Date().toISOString() : null,
    };
    await localSave([...all, row]);
  }
  memoSet(`slug:${row.slug}`, row);
  memoSet(`id:${row.id}`, row);
  return row;
}

export async function getTenantBySlug(slug: string, opts?: { fresh?: boolean }): Promise<Tenant | null> {
  if (!/^[a-z0-9-]{3,60}$/.test(slug)) return null;
  const key = `slug:${slug}`;
  if (!opts?.fresh) {
    const cached = memoGet(key);
    if (cached !== undefined) return cached;
  }
  const value =
    storeMode === "supabase" ? await sbGet("slug", slug) : ((await localAll()).find((x) => x.slug === slug) ?? null);
  memoSet(key, value);
  if (value) memoSet(`id:${value.id}`, value);
  return value;
}

export async function getTenantById(id: string, opts?: { fresh?: boolean }): Promise<Tenant | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const key = `id:${id}`;
  if (!opts?.fresh) {
    const cached = memoGet(key);
    if (cached !== undefined) return cached;
  }
  const value =
    storeMode === "supabase" ? await sbGet("id", id) : ((await localAll()).find((x) => x.id === id) ?? null);
  memoSet(key, value);
  if (value) memoSet(`slug:${value.slug}`, value);
  return value;
}

export async function updateTenant(id: string, patch: Partial<Tenant>): Promise<Tenant | null> {
  const next =
    storeMode === "supabase"
      ? await sbUpdate(id, patch)
      : await (async () => {
          const all = await localAll();
          const i = all.findIndex((x) => x.id === id);
          if (i < 0) return null;
          all[i] = { ...all[i], ...patch };
          await localSave(all);
          return all[i];
        })();
  memoBust(next ?? undefined);
  if (next) {
    memoSet(`slug:${next.slug}`, next);
    memoSet(`id:${next.id}`, next);
  }
  return next;
}

/** Stores the logo and returns its public URL. */
export async function uploadLogo(bytes: Buffer, ext: string, contentType: string): Promise<string> {
  const name = `${crypto.randomUUID()}.${ext}`; // unguessable, independent of the slug
  if (storeMode === "supabase") return sbUpload(`logos/${name}`, bytes, contentType);
  await fs.mkdir(LOCAL_LOGO_DIR, { recursive: true });
  await fs.writeFile(path.join(LOCAL_LOGO_DIR, name), bytes);
  return `/api/tenant-logo/${name}`;
}
