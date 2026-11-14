import "server-only";
import type { Booking, Channel, Post, Tenant } from "./types";
import { seedDemo } from "./seed";

/**
 * Data access. Uses Supabase PostgREST when SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 * are set; otherwise an in-memory store seeded with a demo tenant (dev / preview).
 * Server-only — the service role key never reaches the browser.
 */

const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const isDemoMode = !(SB_URL && SB_KEY);

// ---------------------------------------------------------------------------
// Supabase REST
// ---------------------------------------------------------------------------
async function sb<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SB_KEY!,
      Authorization: `Bearer ${SB_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

type Row = Record<string, unknown>;
const toTenant = (r: Row): Tenant => ({
  id: r.id as string,
  slug: r.slug as string,
  name: r.name as string,
  niche: r.niche as Tenant["niche"],
  city: r.city as string,
  region: r.region as string,
  street: (r.street as string) ?? null,
  postalCode: (r.postal_code as string) ?? null,
  phone: r.phone as string,
  email: r.email as string,
  website: (r.website as string) ?? null,
  plan: r.plan as Tenant["plan"],
  status: r.status as Tenant["status"],
  config: r.config as Tenant["config"],
  createdAt: r.created_at as string,
  updatedAt: r.updated_at as string,
});
const fromTenant = (t: Partial<Tenant>): Row => ({
  ...(t.id && { id: t.id }),
  ...(t.slug !== undefined && { slug: t.slug }),
  ...(t.name !== undefined && { name: t.name }),
  ...(t.niche !== undefined && { niche: t.niche }),
  ...(t.city !== undefined && { city: t.city }),
  ...(t.region !== undefined && { region: t.region }),
  ...(t.street !== undefined && { street: t.street }),
  ...(t.postalCode !== undefined && { postal_code: t.postalCode }),
  ...(t.phone !== undefined && { phone: t.phone }),
  ...(t.email !== undefined && { email: t.email }),
  ...(t.website !== undefined && { website: t.website }),
  ...(t.plan !== undefined && { plan: t.plan }),
  ...(t.status !== undefined && { status: t.status }),
  ...(t.config !== undefined && { config: t.config }),
});
const toPost = (r: Row): Post => ({
  id: r.id as string,
  tenantId: r.tenant_id as string,
  slug: r.slug as string,
  kind: r.kind as Post["kind"],
  title: r.title as string,
  body: r.body as string,
  excerpt: r.excerpt as string,
  keywords: (r.keywords as string[]) ?? [],
  cta: (r.cta as string) ?? null,
  imagePrompt: (r.image_prompt as string) ?? null,
  status: r.status as Post["status"],
  scheduledFor: r.scheduled_for as string,
  publishedAt: (r.published_at as string) ?? null,
  results: (r.results as Post["results"]) ?? {},
  createdAt: r.created_at as string,
});
const fromPost = (p: Partial<Post>): Row => ({
  ...(p.id && { id: p.id }),
  ...(p.tenantId !== undefined && { tenant_id: p.tenantId }),
  ...(p.slug !== undefined && { slug: p.slug }),
  ...(p.kind !== undefined && { kind: p.kind }),
  ...(p.title !== undefined && { title: p.title }),
  ...(p.body !== undefined && { body: p.body }),
  ...(p.excerpt !== undefined && { excerpt: p.excerpt }),
  ...(p.keywords !== undefined && { keywords: p.keywords }),
  ...(p.cta !== undefined && { cta: p.cta }),
  ...(p.imagePrompt !== undefined && { image_prompt: p.imagePrompt }),
  ...(p.status !== undefined && { status: p.status }),
  ...(p.scheduledFor !== undefined && { scheduled_for: p.scheduledFor }),
  ...(p.publishedAt !== undefined && { published_at: p.publishedAt }),
  ...(p.results !== undefined && { results: p.results }),
});
const q = encodeURIComponent;

// ---------------------------------------------------------------------------
// In-memory fallback
// ---------------------------------------------------------------------------
interface Mem {
  tenants: Tenant[];
  posts: Post[];
  channels: Channel[];
  bookings: (Booking & { created_at: string })[];
}
const g = globalThis as typeof globalThis & { __axiomMem?: Mem };
function mem(): Mem {
  if (!g.__axiomMem) g.__axiomMem = seedDemo();
  return g.__axiomMem;
}
const now = () => new Date().toISOString();
const uid = () => crypto.randomUUID();

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  if (isDemoMode) return mem().tenants.find((t) => t.slug === slug) ?? null;
  const rows = await sb<Row[]>(`axiom_tenants?slug=eq.${q(slug)}&limit=1`);
  return rows[0] ? toTenant(rows[0]) : null;
}

export async function listTenants(opts: { status?: Tenant["status"][] } = {}): Promise<Tenant[]> {
  if (isDemoMode) return mem().tenants.filter((t) => !opts.status || opts.status.includes(t.status));
  const filter = opts.status ? `&status=in.(${opts.status.join(",")})` : "";
  return (await sb<Row[]>(`axiom_tenants?select=*${filter}&order=created_at.desc`)).map(toTenant);
}

export async function slugTaken(slug: string): Promise<boolean> {
  return (await getTenantBySlug(slug)) !== null;
}

export async function createTenant(t: Omit<Tenant, "id" | "createdAt" | "updatedAt">): Promise<Tenant> {
  if (isDemoMode) {
    const full: Tenant = { ...t, id: uid(), createdAt: now(), updatedAt: now() };
    mem().tenants.push(full);
    return full;
  }
  const rows = await sb<Row[]>("axiom_tenants", { method: "POST", body: JSON.stringify(fromTenant(t)) });
  return toTenant(rows[0]);
}

export async function updateTenant(id: string, patch: Partial<Tenant>): Promise<void> {
  if (isDemoMode) {
    const t = mem().tenants.find((x) => x.id === id);
    if (t) Object.assign(t, patch, { updatedAt: now() });
    return;
  }
  await sb(`axiom_tenants?id=eq.${q(id)}`, { method: "PATCH", body: JSON.stringify(fromTenant(patch)) });
}

export async function listPosts(
  tenantId: string,
  opts: { status?: Post["status"]; kind?: Post["kind"]; limit?: number } = {},
): Promise<Post[]> {
  const limit = opts.limit ?? 50;
  if (isDemoMode) {
    return mem()
      .posts.filter(
        (p) => p.tenantId === tenantId && (!opts.status || p.status === opts.status) && (!opts.kind || p.kind === opts.kind),
      )
      .sort((a, b) => (b.publishedAt ?? b.scheduledFor).localeCompare(a.publishedAt ?? a.scheduledFor))
      .slice(0, limit);
  }
  let path = `axiom_posts?tenant_id=eq.${q(tenantId)}&order=scheduled_for.desc&limit=${limit}`;
  if (opts.status) path += `&status=eq.${opts.status}`;
  if (opts.kind) path += `&kind=eq.${opts.kind}`;
  return (await sb<Row[]>(path)).map(toPost);
}

export async function getPost(tenantId: string, slug: string): Promise<Post | null> {
  if (isDemoMode) return mem().posts.find((p) => p.tenantId === tenantId && p.slug === slug) ?? null;
  const rows = await sb<Row[]>(`axiom_posts?tenant_id=eq.${q(tenantId)}&slug=eq.${q(slug)}&limit=1`);
  return rows[0] ? toPost(rows[0]) : null;
}

export async function createPosts(posts: Omit<Post, "id" | "createdAt">[]): Promise<Post[]> {
  if (!posts.length) return [];
  if (isDemoMode) {
    const full = posts.map((p) => ({ ...p, id: uid(), createdAt: now() }));
    mem().posts.push(...full);
    return full;
  }
  const rows = await sb<Row[]>("axiom_posts", { method: "POST", body: JSON.stringify(posts.map(fromPost)) });
  return rows.map(toPost);
}

export async function updatePost(id: string, patch: Partial<Post>): Promise<void> {
  if (isDemoMode) {
    const p = mem().posts.find((x) => x.id === id);
    if (p) Object.assign(p, patch);
    return;
  }
  await sb(`axiom_posts?id=eq.${q(id)}`, { method: "PATCH", body: JSON.stringify(fromPost(patch)) });
}

export async function duePosts(tenantId: string, at = new Date()): Promise<Post[]> {
  if (isDemoMode) {
    return mem().posts.filter(
      (p) => p.tenantId === tenantId && p.status === "scheduled" && new Date(p.scheduledFor) <= at,
    );
  }
  return (
    await sb<Row[]>(
      `axiom_posts?tenant_id=eq.${q(tenantId)}&status=eq.scheduled&scheduled_for=lte.${q(at.toISOString())}&order=scheduled_for.asc`,
    )
  ).map(toPost);
}

export async function listChannels(tenantId: string): Promise<Channel[]> {
  const web: Channel = { tenantId, platform: "web", enabled: true, credentials: {} };
  if (isDemoMode) return [web, ...mem().channels.filter((c) => c.tenantId === tenantId && c.platform !== "web")];
  const rows = await sb<Row[]>(`axiom_channels?tenant_id=eq.${q(tenantId)}&enabled=eq.true`);
  return [
    web,
    ...rows
      .filter((r) => r.platform !== "web")
      .map((r) => ({
        tenantId,
        platform: r.platform as Channel["platform"],
        enabled: true,
        credentials: (r.credentials as Record<string, string>) ?? {},
      })),
  ];
}

/** Writes to the existing AXIOM `orders` table (business_id = tenant slug). */
export async function createBooking(b: Booking): Promise<void> {
  if (isDemoMode) {
    mem().bookings.push({ ...b, created_at: now() });
    return;
  }
  await sb("orders", { method: "POST", body: JSON.stringify(b), headers: { Prefer: "return=minimal" } });
}

export async function countBookings(slug: string): Promise<number> {
  if (isDemoMode) return mem().bookings.filter((b) => b.business_id === slug).length;
  const res = await fetch(`${SB_URL}/rest/v1/orders?business_id=eq.${q(slug)}&select=id`, {
    method: "HEAD",
    headers: { apikey: SB_KEY!, Authorization: `Bearer ${SB_KEY}`, Prefer: "count=exact" },
    cache: "no-store",
  });
  return Number(res.headers.get("content-range")?.split("/")[1] ?? 0);
}
