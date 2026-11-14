"use client";

/**
 * src/app/[shop-slug]/page.tsx — Axiom shattered-crystal storefront
 *
 * Deps:  npm i three @react-three/fiber @react-three/drei framer-motion @supabase/supabase-js
 *        npm i -D @types/three
 * Needs: Next 15 + React 19.
 * Env:   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
 *        NEXT_PUBLIC_AXIOM_LOOP_URL (optional, default /api/axiom/content-loop)
 * Without the Supabase env the page runs on built-in demo data (bookings held in memory).
 *
 * ASSUMED SCHEMA (adapt names in the DATA LAYER section if yours differ):
 *   businesses(id, slug, name, headline, tagline, accent, accent2, slot_times text[])   -- e.g. {09:00,11:00,13:00,15:00,17:30}
 *   offerings(id, business_id, kind 'service'|'album', label, meta, blurb, price, clip_url, sort)
 *   media_assets(id, business_id, offering_id, kind 'image'|'video', url, status 'pending'|'approved', source, created_at)
 *   bookings(id, business_id, offering_id, starts_at timestamptz, customer_name, phone, status, source)
 *   create unique index on bookings(business_id, starts_at) where status <> 'cancelled';   -- stops double booking
 *   RLS: anon select on businesses/offerings; anon select on media_assets where status='approved';
 *        anon insert on bookings and media_assets (status forced to 'pending' by policy/default);
 *        anon select on bookings(starts_at) only. Storage bucket app-uploads: anon insert under <business_id>/uploads/.
 *   Realtime: add bookings and media_assets to the supabase_realtime publication.
 * Studio brand drawer reads media_assets where status='pending', approves, and this page picks it up live.
 *
 * Sections: data layer · physics helpers · 3D (video shards, obsidian, debris, scene) · UI · page
 */

import { Suspense, use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Html, Lightformer, PerformanceMonitor } from "@react-three/drei";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@supabase/supabase-js";
import { Manrope, Syne } from "next/font/google";
import * as THREE from "three";

const display = Syne({ subsets: ["latin"], weight: ["600", "800"] });
const bodyFont = Manrope({ subsets: ["latin"], weight: ["400", "500", "700"] });

/* ═════════════════════════════ DATA LAYER ═════════════════════════════ */
type Kind = "service" | "album";
interface Offering { id: string; kind: Kind; label: string; meta: string; blurb: string; price?: number; clips: string[] }
interface Asset { id: string; offeringId: string | null; kind: "image" | "video"; url: string; status: "pending" | "approved" }
interface Tenant {
  id: string; name: string; headline: string; tagline: string; accent: string; accent2: string;
  times: string[]; offerings: Offering[]; assets: Asset[]; taken: string[]; demo: boolean;
}
type Row = Record<string, unknown>;

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = SB_URL && SB_KEY ? createClient(SB_URL, SB_KEY) : null;
const LOOP_URL = process.env.NEXT_PUBLIC_AXIOM_LOOP_URL ?? "/api/axiom/content-loop";

const DEMO: Tenant = {
  id: "demo", demo: true, name: "Rogue River Outfitters", headline: "Wild water. Real trophies.",
  tagline: "Guided rafting, elk hunts and fly fishing in Southern Oregon. Pick a shard, pick a time, you are booked.",
  accent: "#35e0ff", accent2: "#ff4fd8", times: ["06:00", "09:00", "12:00", "15:00", "18:00"], taken: [], assets: [],
  offerings: [
    { id: "s1", kind: "service", label: "Guided rafting", meta: "Half day", price: 165, blurb: "Class III rapids with a licensed guide, gear and lunch included.", clips: [] },
    { id: "s2", kind: "service", label: "Elk hunting", meta: "3 days", price: 2400, blurb: "Fully guided backcountry hunt with camp, meals and field support.", clips: [] },
    { id: "s3", kind: "service", label: "Fly fishing", meta: "Full day", price: 395, blurb: "Steelhead and trout on the Rogue with a drift boat and guide.", clips: [] },
    { id: "s4", kind: "service", label: "Jet boat tour", meta: "2 hrs", price: 70, blurb: "Wildlife and canyon run, family friendly.", clips: [] },
    { id: "a1", kind: "album", label: "Steelhead season", meta: "Album", price: undefined, blurb: "Fresh catches from the fall run.", clips: [] },
    { id: "a2", kind: "album", label: "Elk camp", meta: "Album", price: undefined, blurb: "Camp life and trophy bulls.", clips: [] },
    { id: "a3", kind: "album", label: "River sunsets", meta: "Album", price: undefined, blurb: "Evenings on the water.", clips: [] },
  ],
};

async function loadTenant(slug: string): Promise<Tenant | null> {
  if (!supabase) return null;
  const { data: b } = await supabase.from("businesses").select("*").eq("slug", slug).maybeSingle();
  if (!b) return null;
  const [o, a, k] = await Promise.all([
    supabase.from("offerings").select("*").eq("business_id", b.id).order("sort"),
    supabase.from("media_assets").select("*").eq("business_id", b.id).eq("status", "approved").order("created_at", { ascending: false }).limit(200),
    supabase.from("bookings").select("starts_at").eq("business_id", b.id).gte("starts_at", new Date().toISOString()).neq("status", "cancelled"),
  ]);
  const assets: Asset[] = ((a.data ?? []) as Row[]).map((r) => ({
    id: String(r.id), offeringId: r.offering_id ? String(r.offering_id) : null,
    kind: r.kind === "video" ? "video" : "image", url: String(r.url), status: "approved",
  }));
  const offerings: Offering[] = ((o.data ?? []) as Row[]).map((r) => {
    const id = String(r.id);
    const seed = r.clip_url ? [String(r.clip_url)] : [];
    return {
      id, kind: r.kind === "album" ? "album" : "service", label: String(r.label), meta: String(r.meta ?? ""),
      blurb: String(r.blurb ?? ""), price: r.price == null ? undefined : Number(r.price),
      clips: [...seed, ...assets.filter((x) => x.kind === "video" && x.offeringId === id).map((x) => x.url)],
    };
  });
  return {
    id: String(b.id), demo: false, name: String(b.name), headline: String(b.headline ?? b.name), tagline: String(b.tagline ?? ""),
    accent: String(b.accent ?? "#35e0ff"), accent2: String(b.accent2 ?? "#ff4fd8"),
    times: (b.slot_times as string[] | null) ?? DEMO.times, offerings, assets,
    taken: ((k.data ?? []) as Row[]).map((r) => new Date(String(r.starts_at)).toISOString()),
  };
}

/** Loads the tenant and keeps it live: new bookings and newly approved media arrive without a refresh. */
function useTenant(slug: string) {
  const [tenant, setTenant] = useState<Tenant>(DEMO);
  const [status, setStatus] = useState<"loading" | "ready" | "missing">(supabase ? "loading" : "ready");
  const reload = useCallback(async () => {
    if (!supabase) return;
    try {
      const t = await loadTenant(slug);
      if (t) { setTenant(t); setStatus("ready"); } else setStatus("missing");
    } catch { setStatus((s) => (s === "loading" ? "missing" : s)); }
  }, [slug]);
  useEffect(() => { void reload(); }, [reload]);
  useEffect(() => {
    if (!supabase || tenant.demo) return;
    let timer = 0;
    const ping = () => { window.clearTimeout(timer); timer = window.setTimeout(() => void reload(), 400); };
    const f = `business_id=eq.${tenant.id}`;
    const ch = supabase.channel(`axiom-${tenant.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings", filter: f }, ping)
      .on("postgres_changes", { event: "*", schema: "public", table: "media_assets", filter: f }, ping)
      .subscribe();
    return () => { window.clearTimeout(timer); void supabase.removeChannel(ch); };
  }, [tenant.id, tenant.demo, reload]);
  return { tenant, setTenant, status, reload };
}

/** Hook into the autonomous content loop (server side: caption, approve, post). Fire and forget. */
function fireLoop(event: string, payload: Record<string, unknown>) {
  if (!supabase) return;
  try {
    void fetch(LOOP_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event, ...payload }), keepalive: true }).catch(() => {});
  } catch { /* never block the UI on the loop */ }
}

const slotISO = (date: string, time: string) => new Date(`${date}T${time}:00`).toISOString();
const fmtTime = (t: string) => new Date(`2000-01-01T${t}:00`).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

async function createBooking(t: Tenant, o: Offering, startsAt: string, name: string, phone: string): Promise<"ok" | "taken" | "error"> {
  if (!supabase || t.demo) return "ok";
  const { error } = await supabase.from("bookings").insert({
    business_id: t.id, offering_id: o.id, starts_at: startsAt, customer_name: name, phone, status: "pending", source: "storefront",
  });
  if (!error) { fireLoop("booking.created", { businessId: t.id, offeringId: o.id, startsAt }); return "ok"; }
  return error.code === "23505" ? "taken" : "error";
}

async function uploadAsset(t: Tenant, file: File, offeringId: string): Promise<Asset> {
  if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) throw new Error("Only photos and videos");
  if (file.size > 50 * 1024 * 1024) throw new Error("Files must be under 50 MB");
  const kind = file.type.startsWith("video/") ? "video" : "image";
  if (!supabase || t.demo) return { id: crypto.randomUUID(), offeringId, kind, url: URL.createObjectURL(file), status: "pending" };
  const ext = (file.name.split(".").pop() ?? "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${t.id}/uploads/${crypto.randomUUID()}.${ext}`;
  const up = await supabase.storage.from("app-uploads").upload(path, file, { contentType: file.type, upsert: false });
  if (up.error) throw up.error;
  const url = supabase.storage.from("app-uploads").getPublicUrl(path).data.publicUrl;
  const ins = await supabase.from("media_assets").insert({ business_id: t.id, offering_id: offeringId, kind, url, status: "pending", source: "storefront" });
  if (ins.error) throw ins.error;
  fireLoop("asset.uploaded", { businessId: t.id, offeringId, kind, url });
  return { id: path, offeringId, kind, url, status: "pending" };
}

/* ═════════════════════════════ PHYSICS HELPERS ═════════════════════════════ */
type Spring = { x: number; v: number };
const mk = (x = 0): Spring => ({ x, v: 0 });
function step(s: Spring, target: number, dt: number, k = 110, c = 13) {
  s.v += (k * (target - s.x) - c * s.v) * dt;
  s.x += s.v * dt;
}
function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** Shared pointer field: where the cursor/finger is in world space and how hard it is pushing. */
interface Field { x: number; y: number; speed: number; active: boolean; pulse: number; reduced: boolean }
const K = 9; // idle spring stiffness toward home
const C = 3.2; // idle damping: low = slippery, weightless
const K_LOCK = 24; // lock phase: stiffer and critically damped, so the shard settles with no overshoot
const REPEL = 22;
const REPEL_SPEED_GAIN = 1.2;
const SLIDE_HOVER = 4.6; // launch speed (units/s) when a shard is hovered
const SLIDE_TAP = 7.5; // launch speed when a shard is pressed
const PAIR_K = 14; // magnetic push between neighbouring shards

interface Layout { rx: number; ry: number; cy: number; base: number }
/**
 * Fits the shard ring into the space left over by the HUD (header on top, headline + dock below),
 * for any viewport size, aspect ratio or orientation. Everything is in world units at z = 0.
 */
function computeLayout(vw: number, vh: number, H: number, top: number, bottom: number, n: number): Layout {
  const usableH = Math.max(vh * 0.35, vh * (1 - (top + bottom) / Math.max(H, 1)));
  const cy = ((bottom - top) / (2 * Math.max(H, 1))) * vh;
  const ell = (a: number, b: number) => Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
  const b0 = 0.8;
  const spacing = ell(Math.max(0.6, vw / 2 - 1.3 * b0), Math.max(0.6, usableH / 2 - 1.4 * b0)) / Math.max(n, 1);
  const base = THREE.MathUtils.clamp(Math.min((spacing * 0.92) / 2.3, usableH / 5.2, vw / 4.2), 0.42, 1.15);
  return { rx: Math.max(0.5, vw / 2 - 1.3 * base), ry: Math.max(0.5, usableH / 2 - 1.4 * base), cy, base };
}
function homeFor(i: number, n: number, L: Layout, out: THREE.Vector3) {
  const a = (i / n) * Math.PI * 2 - Math.PI / 2 + 0.35;
  out.set(Math.cos(a) * L.rx, Math.sin(a) * L.ry + L.cy, Math.sin(a * 2 + i) * 0.6);
}

/* ═════════════════════════════ 3D: SHARD GEOMETRY + VIDEO ═════════════════════════════ */
function makeShard(seed: number) {
  const r = rng(seed * 7919 + 13);
  const n = 5 + Math.floor(r() * 3);
  const rx = 1 + r() * 0.25, ry = 1.15 + r() * 0.3;
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + (r() - 0.5) * 0.6;
    const k = 0.72 + r() * 0.4;
    pts.push(new THREE.Vector2(Math.cos(a) * rx * k, Math.sin(a) * ry * k));
  }
  const shape = new THREE.Shape(pts);
  const body = new THREE.ExtrudeGeometry(shape, { depth: 0.14, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 1, curveSegments: 1 });
  body.translate(0, 0, -0.07);
  const face = new THREE.ShapeGeometry(shape);
  face.computeBoundingBox();
  const bb = face.boundingBox!;
  const w = bb.max.x - bb.min.x, h = bb.max.y - bb.min.y;
  const uv = face.attributes.uv as THREE.BufferAttribute;
  const pos = face.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) - bb.min.x) / w, (pos.getY(i) - bb.min.y) / h);
  return { body, face, aspect: w / h };
}

function gradientTexture(c1: string, c2: string, i: number) {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grad = g.createLinearGradient(0, 0, 128, 128);
  grad.addColorStop(0, i % 2 ? c1 : c2);
  grad.addColorStop(0.55, "#0b1a2b");
  grad.addColorStop(1, i % 2 ? c2 : c1);
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** One muted looping <video> per shard, swapped in place when the content loop rotates the clip. */
function useVideoTexture(src: string | undefined, paused: boolean, enabled: boolean) {
  const [tex, setTex] = useState<THREE.VideoTexture | null>(null);
  const video = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    if (!src || !enabled) { setTex(null); return; }
    const v = document.createElement("video");
    v.crossOrigin = "anonymous"; v.muted = true; v.loop = true; v.playsInline = true; v.preload = "auto"; v.src = src;
    video.current = v;
    const t = new THREE.VideoTexture(v);
    t.colorSpace = THREE.SRGBColorSpace; t.generateMipmaps = false; t.minFilter = THREE.LinearFilter;
    v.play().catch(() => {});
    setTex(t);
    return () => { v.pause(); v.removeAttribute("src"); v.load(); t.dispose(); video.current = null; };
  }, [src, enabled]);
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (paused) v.pause(); else v.play().catch(() => {});
  }, [paused, tex]);
  return { tex, video };
}

/* ═════════════════════════════ 3D: SHARD ═════════════════════════════ */
interface Origin { x: number; y: number }
interface Pressed { o: Offering; x: number; y: number; t: number }
type Phase = "idle" | "slide" | "lock";
interface ShardState {
  pos: THREE.Vector3; vel: THREE.Vector3; q: THREE.Quaternion; axis: THREE.Vector3; spin: number;
  scale: Spring; glow: Spring; hover: boolean; fit: boolean; phase: Phase; phaseT: number; cool: number;
}
interface ShardProps {
  o: Offering; i: number; n: number; tenant: Tenant; field: React.MutableRefObject<Field>;
  bodies: React.MutableRefObject<THREE.Vector3[]>; pressed: React.MutableRefObject<Pressed | null>;
  layout: Layout; compact: boolean; clip?: string; videoOn: boolean; paused: boolean; lowQ: boolean;
  onHover: (o: Offering | null) => void;
}
const tmpE = new THREE.Euler();
const tmpQ = new THREE.Quaternion();
const tmpQ2 = new THREE.Quaternion();
const home = new THREE.Vector3();

function Shard({ o, i, n, tenant, field, bodies, pressed, layout, compact, clip, videoOn, paused, lowQ, onHover }: ShardProps) {
  const geo = useMemo(() => makeShard(i + 1), [i]);
  const group = useRef<THREE.Group>(null!);
  const edge = useRef<THREE.Mesh>(null!);
  const leave = useRef<number | undefined>(undefined);
  const [hover, setHover] = useState(false);
  const color = o.kind === "service" ? tenant.accent : tenant.accent2;
  const { tex, video } = useVideoTexture(clip, paused, videoOn);
  const fallback = useMemo(() => gradientTexture(tenant.accent, tenant.accent2, i), [tenant.accent, tenant.accent2, i]);
  useEffect(() => () => fallback.dispose(), [fallback]);

  // Born on the sphere surface, flung outward with a tumble.
  const st = useRef<ShardState | null>(null);
  if (!st.current) {
    const r = rng(i * 131 + 7);
    const y = 1 - ((i + 0.5) / n) * 2, rad = Math.sqrt(1 - y * y), phi = i * 2.399963;
    const dir = new THREE.Vector3(Math.cos(phi) * rad, y, Math.sin(phi) * rad * 0.4).normalize();
    st.current = {
      pos: dir.clone().multiplyScalar(1.1), vel: dir.clone().multiplyScalar(9 + r() * 5),
      q: new THREE.Quaternion().random(), axis: new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize(), spin: 9,
      scale: mk(0.15), glow: mk(), hover: false, fit: false, phase: "idle", phaseT: 0, cool: 0,
    };
  }
  bodies.current[i] = st.current.pos;
  useEffect(() => { if (st.current) st.current.fit = false; }, [tex]);
  useEffect(() => {
    if (st.current) st.current.hover = hover;
    document.body.style.cursor = hover ? "pointer" : "";
    return () => { document.body.style.cursor = ""; };
  }, [hover]);

  /** Slippery slide: launch the shard directly away from the contact point with a sideways swirl. */
  const slide = (strength: number, force: boolean, from: { x: number; y: number }) => {
    const S = st.current!, now = performance.now() / 1000;
    if (field.current.reduced) return;
    if (!force && (S.phase !== "idle" || now < S.cool)) return; // hover slides once, then waits for the lock
    if (force && S.phase === "slide" && S.phaseT < 0.15) return; // touch fires hover and press together
    let dx = S.pos.x - from.x, dy = S.pos.y - from.y, d = Math.hypot(dx, dy);
    if (d < 0.05) { const a = i * 2.4; dx = Math.cos(a); dy = Math.sin(a); d = 1; }
    dx /= d; dy /= d;
    const sw = i % 2 ? 0.35 : -0.35;
    S.vel.x += (dx - dy * sw) * strength;
    S.vel.y += (dy + dx * sw) * strength;
    S.phase = "slide"; S.phaseT = 0;
  };

  useFrame((s, raw) => {
    const dt = Math.min(raw, 1 / 30), S = st.current!, F = field.current, t = s.clock.elapsedTime, now = performance.now() / 1000;
    const base = layout.base;
    homeFor(i, n, layout, home);
    if (!F.reduced) { home.x += Math.sin(t * 0.5 + i * 1.7) * 0.22; home.y += Math.cos(t * 0.43 + i * 2.1) * 0.2; }

    // Phases: idle (floaty) → slide (low damping, glides away) → lock (stiff, critically damped, snaps home without overshoot)
    S.phaseT += dt;
    let k = K, c = C;
    if (S.phase === "slide") {
      c = 2;
      if (S.phaseT > 0.45) { S.phase = "lock"; S.phaseT = 0; }
    } else if (S.phase === "lock") {
      k = K_LOCK; c = 2 * Math.sqrt(K_LOCK) * 1.02;
      const dist = Math.hypot(home.x - S.pos.x, home.y - S.pos.y);
      if ((dist < 0.06 && S.vel.length() < 0.4) || S.phaseT > 2.5) { S.phase = "idle"; S.cool = now + 0.5; }
    }
    let ax = (home.x - S.pos.x) * k - S.vel.x * c;
    let ay = (home.y - S.pos.y) * k - S.vel.y * c;
    const az = (home.z - S.pos.z) * k - S.vel.z * c;

    // Cursor field: pushes idle shards away. The one under the cursor resists so it stays clickable.
    if (S.phase === "idle" && F.active && !F.reduced) {
      const R = 2.8 * base;
      const dx = S.pos.x - F.x, dy = S.pos.y - F.y;
      const d = Math.hypot(dx, dy) || 0.001;
      const f = Math.max(0, 1 - d / R);
      const mag = Math.min(60, (REPEL + F.speed * REPEL_SPEED_GAIN) * f * f + F.pulse * 40 * Math.max(0, 1 - d / (R * 2.2))) * (S.hover ? 0.12 : 1);
      const sw = i % 2 ? 0.3 : -0.3;
      ax += (dx / d) * mag + (-dy / d) * mag * sw;
      ay += (dy / d) * mag + (dx / d) * mag * sw;
    }
    // Magnetic poles between shards: a sliding shard shoves its neighbours, and none overlap on small screens.
    const list = bodies.current, minD = 2.3 * base;
    for (let j = 0; j < list.length; j++) {
      const b = list[j];
      if (j === i || !b) continue;
      const px = S.pos.x - b.x, py = S.pos.y - b.y, d = Math.hypot(px, py);
      if (d < minD && d > 0.001) { const f = 1 - d / minD, m = PAIR_K * f * f; ax += (px / d) * m; ay += (py / d) * m; }
    }
    S.vel.x += ax * dt; S.vel.y += ay * dt; S.vel.z += az * dt;
    if (S.vel.length() > 18) S.vel.setLength(18);
    S.pos.addScaledVector(S.vel, dt);

    tmpE.set(-S.vel.y * 0.05 + Math.sin(t * 0.7 + i) * 0.08, S.vel.x * 0.05 + Math.cos(t * 0.6 + i) * 0.1, Math.sin(t * 0.4 + i) * 0.05);
    tmpQ.setFromEuler(tmpE);
    S.q.slerp(tmpQ, 1 - Math.exp(-dt * (S.spin > 0.5 ? 1.2 : 4)));
    if (S.spin > 0.02) { tmpQ2.setFromAxisAngle(S.axis, S.spin * dt); S.q.premultiply(tmpQ2); S.spin *= Math.exp(-dt * 1.4); }

    step(S.scale, (hover ? 1.2 : 1) * base, dt, 160, 14);
    step(S.glow, hover || S.phase === "slide" ? 1 : 0, dt, 120, 16);
    group.current.position.copy(S.pos);
    group.current.quaternion.copy(S.q);
    group.current.scale.setScalar(Math.max(0.01, S.scale.x));
    (edge.current.material as THREE.MeshBasicMaterial).opacity = Math.min(1, 0.22 + Math.max(0, S.glow.x) * 0.7 + (hover ? Math.sin(t * 7) * 0.1 : 0));

    const v = video.current;
    if (!S.fit && tex && v && v.videoWidth > 0) { // cover-fit the clip to the shard's face
      const va = v.videoWidth / v.videoHeight, sa = geo.aspect;
      if (va > sa) { tex.repeat.x = sa / va; tex.offset.x = (1 - tex.repeat.x) / 2; }
      else { tex.repeat.y = va / sa; tex.offset.y = (1 - tex.repeat.y) / 2; }
      S.fit = true;
    }
  });

  return (
    <group
      ref={group}
      onPointerOver={(e) => { e.stopPropagation(); window.clearTimeout(leave.current); setHover(true); onHover(o); slide(SLIDE_HOVER, false, e.point); }}
      onPointerOut={() => { leave.current = window.setTimeout(() => { setHover(false); onHover(null); }, 90); }}
      onPointerDown={(e) => {
        // The scene opens the shard on pointer-up using these coordinates, so a shard that has already
        // slid out from under the finger can still be tapped.
        pressed.current = { o, x: e.nativeEvent.clientX, y: e.nativeEvent.clientY, t: performance.now() };
        slide(SLIDE_TAP, true, e.point);
      }}
    >
      <mesh ref={edge} geometry={geo.body} scale={1.06}>
        <meshBasicMaterial color={color} transparent opacity={0.2} side={THREE.BackSide} toneMapped={false} />
      </mesh>
      <mesh geometry={geo.body}>
        {lowQ ? (
          <meshPhysicalMaterial color="#bfefff" transparent opacity={0.4} roughness={0.1} clearcoat={1} envMapIntensity={1.6} />
        ) : (
          <meshPhysicalMaterial color="#d9f6ff" transmission={1} thickness={0.8} ior={1.31} roughness={0.08} attenuationColor={color} attenuationDistance={1.4} clearcoat={1} envMapIntensity={1.6} />
        )}
      </mesh>
      <mesh geometry={geo.face} position={[0, 0, 0.115]}>
        <meshBasicMaterial map={tex ?? fallback} toneMapped={false} transparent opacity={0.94} />
      </mesh>
      <mesh geometry={geo.face} position={[0, 0, 0.13]}>
        <meshPhysicalMaterial color="#ffffff" transparent opacity={0.1} roughness={0.05} clearcoat={1} envMapIntensity={2} depthWrite={false} />
      </mesh>
      {(!compact || hover) && (
        <Html center position={[0, -0.55, 0.25]} style={{ pointerEvents: "none" }} zIndexRange={[20, 0]}>
          <div className={bodyFont.className} style={{ ...glass, borderRadius: 14, padding: "7px 12px", textAlign: "center", whiteSpace: "nowrap", color: "#fff", border: `1px solid ${hover ? color : "rgba(255,255,255,0.18)"}`, background: "rgba(3,8,14,0.55)", boxShadow: hover ? `0 0 24px ${color}88` : "none" }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{o.label}</div>
            <div style={{ fontSize: 11, opacity: 0.8, color }}>{o.kind === "service" ? `${o.meta}${o.price != null ? ` · $${o.price}` : ""}` : "Open album"}</div>
          </div>
        </Html>
      )}
    </group>
  );
}

/* ═════════════════════════════ 3D: OBSIDIAN, DEBRIS, SCENE ═════════════════════════════ */
function Debris({ accent }: { accent: string }) {
  const ref = useRef<THREE.Points>(null!);
  const data = useMemo(() => {
    const count = 420, pos = new Float32Array(count * 3), vel = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const d = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, (Math.random() - 0.5) * 0.6).normalize().multiplyScalar(3 + Math.random() * 9);
      vel.set([d.x, d.y, d.z], i * 3);
      pos.set([d.x * 0.04, d.y * 0.04, d.z * 0.04], i * 3);
    }
    return { pos, vel, age: 0 };
  }, []);
  useFrame((_, dt) => {
    const D = data; D.age += dt;
    const drag = Math.exp(-dt * 1.8);
    for (let i = 0; i < D.pos.length; i++) { D.vel[i] *= drag; D.pos[i] += D.vel[i] * dt; }
    (ref.current.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (ref.current.material as THREE.PointsMaterial).opacity = Math.max(0, 0.9 - D.age * 0.35);
    ref.current.visible = D.age < 2.7;
  });
  return (
    <points ref={ref}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[data.pos, 3]} /></bufferGeometry>
      <pointsMaterial size={0.06} color={accent} transparent opacity={0.9} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

function Dust({ color, count }: { color: string; count: number }) {
  const ref = useRef<THREE.Points>(null!);
  const positions = useMemo(() => {
    const a = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) { a[i * 3] = (Math.random() - 0.5) * 44; a[i * 3 + 1] = (Math.random() - 0.5) * 26; a[i * 3 + 2] = (Math.random() - 0.5) * 34 - 6; }
    return a;
  }, [count]);
  useFrame((s, dt) => {
    ref.current.rotation.y += dt * 0.012;
    ref.current.position.x = THREE.MathUtils.damp(ref.current.position.x, -s.pointer.x * 0.8, 2, dt);
    ref.current.position.y = THREE.MathUtils.damp(ref.current.position.y, -s.pointer.y * 0.5, 2, dt);
  });
  return (
    <points ref={ref}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
      <pointsMaterial size={0.04} color={color} transparent opacity={0.55} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

interface SceneProps {
  tenant: Tenant; clips: Record<string, string | undefined>; videoOn: boolean; paused: boolean; lowQ: boolean; reduced: boolean; fastIntro: boolean;
  inset: { top: number; bottom: number };
  onPick: (o: Offering, at: Origin) => void; onHover: (o: Offering | null) => void; onShatter: () => void;
}
function Scene({ tenant, clips, videoOn, paused, lowQ, reduced, fastIntro, inset, onPick, onHover, onShatter }: SceneProps) {
  const [shattered, setShattered] = useState(reduced);
  const field = useRef<Field>({ x: 99, y: 99, speed: 0, active: false, pulse: 0, reduced });
  const bodies = useRef<THREE.Vector3[]>([]);
  const pressed = useRef<Pressed | null>(null);
  const pickRef = useRef(onPick);
  pickRef.current = onPick;
  const intro = useRef({ t: 0 });
  const kick = useRef(mk());
  const sphere = useRef<THREE.Mesh>(null!);
  const cracks = useRef<THREE.Mesh>(null!);
  const heart = useRef<THREE.Mesh>(null!);
  const flashLight = useRef<THREE.PointLight>(null!);
  const cursorLight = useRef<THREE.PointLight>(null!);
  const ray = useMemo(() => new THREE.Raycaster(), []);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
  const hit = useMemo(() => new THREE.Vector3(), []);
  const heartScale = useRef(mk());
  const vp = useThree((s) => s.viewport);
  const size = useThree((s) => s.size);
  const n = tenant.offerings.length;
  const layout = useMemo(() => computeLayout(vp.width, vp.height, size.height, inset.top, inset.bottom, n), [vp.width, vp.height, size.height, inset.top, inset.bottom, n]);
  const shatterNow = useCallback(() => { setShattered(true); kick.current.v = -7; onShatter(); }, [onShatter]);

  useEffect(() => {
    if (reduced) onShatter();
    const F = field.current;
    const on = () => { F.active = true; };
    const down = () => { F.active = true; F.pulse = 1; };
    const up = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") window.setTimeout(() => { F.active = false; }, 150);
      const p = pressed.current;
      pressed.current = null;
      if (p && performance.now() - p.t < 700 && Math.hypot(e.clientX - p.x, e.clientY - p.y) < 14) pickRef.current(p.o, { x: e.clientX, y: e.clientY });
    };
    const cancel = () => { pressed.current = null; };
    const out = (e: MouseEvent) => { if (!e.relatedTarget) F.active = false; };
    window.addEventListener("pointermove", on);
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
    document.addEventListener("mouseout", out);
    return () => { window.removeEventListener("pointermove", on); window.removeEventListener("pointerdown", down); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", cancel); document.removeEventListener("mouseout", out); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame((s, raw) => {
    const dt = Math.min(raw, 1 / 30), F = field.current;
    ray.setFromCamera(s.pointer, s.camera);
    if (ray.ray.intersectPlane(plane, hit)) {
      const sp = Math.hypot(hit.x - F.x, hit.y - F.y) / Math.max(dt, 1e-3);
      F.speed += (Math.min(sp > 200 ? 0 : sp, 40) - F.speed) * Math.min(1, dt * 8);
      F.x = hit.x; F.y = hit.y;
    }
    F.pulse = Math.max(0, F.pulse - dt * 3.5);
    cursorLight.current.position.set(s.pointer.x * 6, s.pointer.y * 4, 4);
    step(kick.current, 0, dt, 60, 9);
    s.camera.position.z = 9 + kick.current.x;

    if (!shattered) {
      intro.current.t += dt;
      const T = fastIntro ? 0.55 : 1.5, r = Math.min(1, intro.current.t / T);
      const shake = r * r * 0.03;
      sphere.current.position.set((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake, 0);
      sphere.current.scale.setScalar((1 + Math.sin(intro.current.t * 9) * 0.015 * r) * Math.min(1, layout.base * 1.3 + 0.2));
      cracks.current.scale.copy(sphere.current.scale);
      (sphere.current.material as THREE.MeshPhysicalMaterial).emissiveIntensity = 0.15 + r * r * 3.5;
      (cracks.current.material as THREE.MeshBasicMaterial).opacity = r * r * 0.9;
      flashLight.current.intensity = r * r * 60;
      if (r >= 1) shatterNow();
    } else {
      flashLight.current.intensity = Math.max(0, flashLight.current.intensity * Math.exp(-dt * 5));
      step(heartScale.current, 0.26 * Math.min(1, layout.base * 1.3 + 0.2), dt, 90, 9);
      heart.current.scale.setScalar(Math.max(0.01, heartScale.current.x));
      heart.current.position.y = layout.cy;
      heart.current.rotation.y += dt * 0.8;
      heart.current.rotation.x += dt * 0.5;
    }
  });

  return (
    <>
      <ambientLight intensity={0.25} />
      <pointLight ref={cursorLight} intensity={45} color={tenant.accent} />
      <pointLight position={[-6, 3, -2]} intensity={28} color={tenant.accent2} />
      <pointLight ref={flashLight} position={[0, 0, 1]} intensity={0} color="#ffffff" distance={14} />
      <Environment resolution={128}>
        <Lightformer form="rect" intensity={3} color={tenant.accent} position={[0, 4, 3]} scale={[8, 1.5, 1]} />
        <Lightformer form="rect" intensity={2} color={tenant.accent2} position={[-5, 0, 2]} scale={[1.5, 6, 1]} />
        <Lightformer form="ring" intensity={2} color="#ffffff" position={[4, 1, 4]} scale={3} />
      </Environment>
      <Dust color={tenant.accent} count={lowQ ? 700 : 1600} />

      {!shattered && (
        <>
          <mesh ref={sphere}>
            <sphereGeometry args={[1.25, 64, 64]} />
            <meshPhysicalMaterial color="#04060a" metalness={0.9} roughness={0.12} clearcoat={1} emissive={tenant.accent} emissiveIntensity={0.15} />
          </mesh>
          <mesh ref={cracks}>
            <icosahedronGeometry args={[1.27, 2]} />
            <meshBasicMaterial wireframe color={tenant.accent} transparent opacity={0} toneMapped={false} />
          </mesh>
        </>
      )}
      {shattered && (
        <>
          <Debris accent={tenant.accent} />
          <mesh ref={heart}>
            <icosahedronGeometry args={[1, 1]} />
            <meshStandardMaterial color="#ffffff" emissive={tenant.accent2} emissiveIntensity={2.4} wireframe toneMapped={false} />
          </mesh>
          {tenant.offerings.map((o, i) => (
            <Shard key={o.id} o={o} i={i} n={n} tenant={tenant} field={field} bodies={bodies} pressed={pressed} layout={layout}
              compact={size.width < 560} clip={clips[o.id]} videoOn={videoOn && i < 7} paused={paused} lowQ={lowQ} onHover={onHover} />
          ))}
        </>
      )}
    </>
  );
}

/* ═════════════════════════════ UI: SHARED ═════════════════════════════ */
const glass: React.CSSProperties = {
  background: "linear-gradient(145deg, rgba(255,255,255,0.10), rgba(255,255,255,0.03))",
  border: "1px solid rgba(255,255,255,0.14)", backdropFilter: "blur(22px) saturate(140%)", WebkitBackdropFilter: "blur(22px) saturate(140%)",
  boxShadow: "0 30px 90px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.12)",
};
const ghostBtn: React.CSSProperties = { background: "rgba(255,255,255,0.08)", color: "#fff", border: "1px solid rgba(255,255,255,0.16)", borderRadius: 999, padding: "9px 16px", cursor: "pointer", fontWeight: 600, fontSize: 14 };
const primaryBtn = (c: string): React.CSSProperties => ({ background: c, color: "#031018", border: 0, borderRadius: 999, padding: "14px 26px", fontWeight: 800, fontSize: 15, cursor: "pointer", boxShadow: `0 0 34px ${c}88` });
const chip = (on: boolean, c: string, off = false): React.CSSProperties => ({
  background: on ? c : "rgba(255,255,255,0.06)", color: on ? "#031018" : "#fff", border: `1px solid ${on ? c : "rgba(255,255,255,0.16)"}`,
  borderRadius: 999, padding: "8px 14px", cursor: off ? "not-allowed" : "pointer", fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", minHeight: 40, display: "inline-flex", alignItems: "center",
  opacity: off ? 0.3 : 1, textDecoration: off ? "line-through" : "none",
});
const field: React.CSSProperties = { width: "100%", background: "rgba(255,255,255,0.06)", color: "#fff", colorScheme: "dark", border: "1px solid rgba(255,255,255,0.16)", borderRadius: 14, padding: "13px 14px", fontSize: 15, outline: "none" };
const centerOf = (el: Element): Origin => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };

function Flash({ k, o, color }: { k: number; o: Origin; color: string }) {
  if (!k) return null;
  return (
    <motion.div key={k} initial={{ opacity: 1, scale: 0.2 }} animate={{ opacity: 0, scale: 3 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      style={{ position: "fixed", inset: 0, zIndex: 70, pointerEvents: "none", transformOrigin: `${o.x}px ${o.y}px`, background: `radial-gradient(circle at ${o.x}px ${o.y}px, #fff 0, ${color} 12%, transparent 38%)` }} />
  );
}

/** Teleport reveal: a circle expands from the tap point into the destination. */
function Overlay({ origin, label, onClose, children, align }: { origin: Origin; label: string; onClose: () => void; children: React.ReactNode; align: "center" | "end" }) {
  return (
    <motion.div role="dialog" aria-modal="true" aria-label={label}
      initial={{ clipPath: `circle(0px at ${origin.x}px ${origin.y}px)` }} animate={{ clipPath: `circle(160vmax at ${origin.x}px ${origin.y}px)` }} exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", justifyContent: align === "end" ? "flex-end" : "center", background: "rgba(2,4,9,0.82)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", overflow: "auto" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", width: align === "end" ? "auto" : "100%", minHeight: "100%" }}>{children}</div>
    </motion.div>
  );
}

/* ═════════════════════════════ UI: BOOKING (live 24/7) ═════════════════════════════ */
function BookingPanel({ tenant, offering, reload, onBooked }: { tenant: Tenant; offering: Offering; reload: () => Promise<void>; onBooked: (iso: string) => void }) {
  const days = useMemo(() => Array.from({ length: 8 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i);
    return { iso: d.toLocaleDateString("en-CA"), label: i === 0 ? "Today" : d.toLocaleDateString([], { weekday: "short", day: "numeric" }) };
  }), []);
  const taken = useMemo(() => new Set(tenant.taken), [tenant.taken]);
  const free = useCallback((date: string, time: string) => { const iso = slotISO(date, time); return !taken.has(iso) && new Date(iso).getTime() > Date.now() + 30 * 60000; }, [taken]);
  const next = useCallback(() => { for (const d of days) for (const t of tenant.times) if (free(d.iso, t)) return { date: d.iso, time: t }; return null; }, [days, tenant.times, free]);
  const [sel, setSel] = useState<{ date: string; time: string } | null>(() => next());
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [ref, setRef] = useState("");

  useEffect(() => {
    try { const s = JSON.parse(localStorage.getItem("axiom:contact") ?? "null"); if (s?.name) setName(s.name); if (s?.phone) setPhone(s.phone); } catch { /* ignore */ }
  }, []);
  useEffect(() => { // live state: if someone grabs the chosen slot, move to the next opening
    if (!sel) { const n = next(); if (n) setSel(n); return; }
    if (!free(sel.date, sel.time)) { setSel(next()); setNote("That time was just taken, so we moved you to the next opening."); }
  }, [sel, free, next]);

  const ready = !!sel && name.trim().length > 1 && phone.replace(/\D/g, "").length >= 7;
  async function submit() {
    if (!sel) return;
    setState("busy");
    const iso = slotISO(sel.date, sel.time);
    const r = await createBooking(tenant, offering, iso, name.trim(), phone.trim());
    if (r === "ok") {
      try { localStorage.setItem("axiom:contact", JSON.stringify({ name, phone })); } catch { /* ignore */ }
      onBooked(iso); setRef(`AX-${Math.random().toString(36).slice(2, 7).toUpperCase()}`); setState("done");
    } else if (r === "taken") { await reload(); setNote("Someone just booked that time. Pick the next opening."); setState("idle"); }
    else setState("error");
  }

  if (state === "done" && sel) {
    return (
      <div style={{ ...glass, borderRadius: 24, padding: 28, textAlign: "center" }}>
        <h3 className={display.className} style={{ fontSize: 30, margin: 0 }}>You are booked</h3>
        <p style={{ opacity: 0.8, lineHeight: 1.5 }}>{offering.label} on {days.find((d) => d.iso === sel.date)?.label} at {fmtTime(sel.time)}. Confirmation {ref}. We will text {phone}.</p>
      </div>
    );
  }
  return (
    <div style={{ ...glass, borderRadius: 24, padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
        <h3 className={display.className} style={{ fontSize: 24, margin: 0 }}>Book {offering.label}</h3>
        <span style={{ fontSize: 12, color: tenant.accent }}>Open 24/7</span>
      </div>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
        {days.map((d) => <button key={d.iso} style={chip(sel?.date === d.iso, tenant.accent)} onClick={() => { const t = tenant.times.find((x) => free(d.iso, x)); if (t) setSel({ date: d.iso, time: t }); }}>{d.label}</button>)}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {sel && tenant.times.map((t) => { const ok = free(sel.date, t); return <button key={t} disabled={!ok} style={chip(sel.time === t, tenant.accent, !ok)} onClick={() => setSel({ date: sel.date, time: t })}>{fmtTime(t)}</button>; })}
        {!sel && <p style={{ margin: 0, opacity: 0.7 }}>No openings in the next week. Call us and we will fit you in.</p>}
      </div>
      <input aria-label="Your name" placeholder="Your name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} style={field} />
      <input aria-label="Mobile number" placeholder="Mobile number" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} style={field} />
      {note && <p role="status" style={{ margin: 0, fontSize: 13, color: tenant.accent }}>{note}</p>}
      {state === "error" && <p role="alert" style={{ margin: 0, fontSize: 14, color: "#ff8a9b" }}>The booking did not go through. Check your connection and confirm again.</p>}
      <button disabled={!ready || state === "busy"} onClick={submit} style={{ ...primaryBtn(tenant.accent), opacity: ready ? 1 : 0.45 }}>
        {state === "busy" ? "Booking…" : `Confirm${offering.price != null ? ` · $${offering.price}` : ""}`}
      </button>
    </div>
  );
}

/* ═════════════════════════════ UI: SERVICE PAGE + GALLERY DRAWER ═════════════════════════════ */
function ServicePage({ tenant, offering, clip, onClose, onPick, reload, onBooked }: { tenant: Tenant; offering: Offering; clip?: string; onClose: () => void; onPick: (o: Offering, at: Origin) => void; reload: () => Promise<void>; onBooked: (iso: string) => void }) {
  const others = tenant.offerings.filter((x) => x.kind === "service" && x.id !== offering.id);
  return (
    <div className={bodyFont.className} style={{ width: "100%", padding: "clamp(16px,4vw,48px)", color: "#fff" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <span className={display.className} style={{ fontSize: 20 }}>{tenant.name}</span>
        <button autoFocus onClick={onClose} style={ghostBtn}>Back to the shards</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))", gap: "clamp(18px,3vw,36px)", alignItems: "start", maxWidth: 1200, margin: "0 auto" }}>
        <div>
          <div style={{ aspectRatio: "16/9", borderRadius: 24, overflow: "hidden", border: "1px solid rgba(255,255,255,0.14)", background: `linear-gradient(135deg, ${tenant.accent}44, #0b1a2b 55%, ${tenant.accent2}55)` }}>
            {clip && <video src={clip} autoPlay muted loop playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
          </div>
          <h1 className={display.className} style={{ fontSize: "clamp(34px,6vw,64px)", margin: "22px 0 8px", letterSpacing: "-0.03em", lineHeight: 1 }}>{offering.label}</h1>
          <p style={{ fontSize: 18, opacity: 0.8, lineHeight: 1.55, margin: 0 }}>{offering.blurb}</p>
          <p style={{ margin: "14px 0 0", color: tenant.accent, fontWeight: 700 }}>{offering.meta}{offering.price != null ? ` · from $${offering.price}` : ""}</p>
          {others.length > 0 && (
            <div style={{ marginTop: 28, display: "flex", flexWrap: "wrap", gap: 8 }}>
              {others.map((x) => <button key={x.id} onClick={(e) => onPick(x, centerOf(e.currentTarget))} style={chip(false, tenant.accent)}>{x.label}</button>)}
            </div>
          )}
        </div>
        <div style={{ position: "sticky", top: 16 }}>
          <BookingPanel key={offering.id} tenant={tenant} offering={offering} reload={reload} onBooked={onBooked} />
        </div>
      </div>
    </div>
  );
}

function GalleryDrawer({ tenant, album, onClose, onBook }: { tenant: Tenant; album: Offering; onClose: () => void; onBook: (at: Origin) => void }) {
  const approved = tenant.assets.filter((a) => a.offeringId === album.id);
  const [mine, setMine] = useState<Asset[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const firstService = tenant.offerings.some((o) => o.kind === "service");
  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true); setMsg("");
    let ok = 0;
    for (const f of Array.from(files).slice(0, 10)) {
      try { const a = await uploadAsset(tenant, f, album.id); setMine((m) => [a, ...m]); ok++; }
      catch (e) { setMsg(e instanceof Error ? e.message : "Upload failed. Try again."); }
    }
    setBusy(false);
    if (ok) setMsg(`${ok} uploaded. The studio reviews new media before it goes public.`);
  }
  const tiles = [...mine, ...approved];
  return (
    <aside className={`${bodyFont.className} ax-drawer`} style={{ ...glass, width: "min(620px, 100vw)", minHeight: "100%", padding: 24, borderRadius: "28px 0 0 28px", color: "#fff" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
        <div>
          <h2 className={display.className} style={{ fontSize: 34, margin: 0, letterSpacing: "-0.02em" }}>{album.label}</h2>
          <p style={{ margin: "6px 0 0", opacity: 0.75 }}>{album.blurb}</p>
        </div>
        <button autoFocus onClick={onClose} aria-label="Close gallery" style={ghostBtn}>Close</button>
      </div>
      <label style={{ ...chip(false, tenant.accent2), display: "inline-block", margin: "18px 0 6px" }}>
        {busy ? "Uploading…" : "Add your photos or video"}
        <input type="file" accept="image/*,video/*" multiple hidden disabled={busy} onChange={(e) => { void onFiles(e.target.files); e.target.value = ""; }} />
      </label>
      {msg && <p role="status" style={{ margin: "4px 0 0", fontSize: 13, color: tenant.accent2 }}>{msg}</p>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(170px,1fr))", gap: 10, marginTop: 16 }}>
        {tiles.length === 0 && Array.from({ length: 6 }, (_, i) => (
          <div key={i} style={{ aspectRatio: "1/1", borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)", background: `linear-gradient(${40 + i * 37}deg, ${tenant.accent}33, ${tenant.accent2}44 60%, #0b1220)` }} />
        ))}
        {tiles.map((a) => (
          <div key={a.id} style={{ position: "relative", aspectRatio: "1/1", borderRadius: 14, overflow: "hidden", border: "1px solid rgba(255,255,255,0.12)" }}>
            {a.kind === "video"
              ? <video src={a.url} autoPlay muted loop playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <img src={a.url} alt={`${album.label}`} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
            {a.status === "pending" && <span style={{ position: "absolute", left: 8, bottom: 8, ...glass, borderRadius: 999, padding: "3px 10px", fontSize: 11 }}>Pending review</span>}
          </div>
        ))}
      </div>
      {firstService && <button onClick={(e) => onBook(centerOf(e.currentTarget))} style={{ ...primaryBtn(tenant.accent), marginTop: 22 }}>Book a trip like this</button>}
    </aside>
  );
}

/* ═════════════════════════════ PAGE ═════════════════════════════ */
interface Env { reduced: boolean; saveData: boolean; coarse: boolean; seen: boolean }
type View = { id: string; origin: Origin };

export default function StorefrontPage({ params }: { params: Promise<{ "shop-slug": string }> }) {
  const slug = use(params)["shop-slug"];
  const { tenant, setTenant, status, reload } = useTenant(slug);
  const [env, setEnv] = useState<Env | null>(null);
  const [view, setView] = useState<View | null>(null);
  const [flash, setFlash] = useState({ k: 0, o: { x: 0, y: 0 } });
  const [introDone, setIntroDone] = useState(false);
  const [lowQ, setLowQ] = useState(false);
  const [dpr, setDpr] = useState(1.75);
  const [tick, setTick] = useState(0);
  const topRef = useRef<HTMLElement>(null);
  const botRef = useRef<HTMLDivElement>(null);
  const [inset, setInset] = useState({ top: 72, bottom: 220 });

  useEffect(() => {
    const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
    let seen = false;
    try { seen = sessionStorage.getItem("axiom:intro") === "1"; } catch { /* ignore */ }
    const coarse = matchMedia("(pointer: coarse)").matches;
    setEnv({ reduced: matchMedia("(prefers-reduced-motion: reduce)").matches, saveData: !!nav.connection?.saveData, coarse, seen });
    setLowQ(coarse);
    if (coarse) setDpr(1.25);
  }, []);

  // Measure the HUD so the 3D ring always fits the space between header and headline/dock, on any screen.
  useEffect(() => {
    const measure = () => setInset((p) => {
      const top = topRef.current?.offsetHeight ?? 72, bottom = botRef.current?.offsetHeight ?? 220;
      return p.top === top && p.bottom === bottom ? p : { top, bottom };
    });
    const ro = new ResizeObserver(measure);
    if (topRef.current) ro.observe(topRef.current);
    if (botRef.current) ro.observe(botRef.current);
    measure();
    return () => ro.disconnect();
  }, [env, status]);

  // Content loop: rotate which approved clip each shard shows, so the storefront keeps changing as media arrives.
  useEffect(() => { const id = window.setInterval(() => setTick((t) => t + 1), 12000); return () => window.clearInterval(id); }, []);
  const clips = useMemo(() => {
    const m: Record<string, string | undefined> = {};
    for (const o of tenant.offerings) m[o.id] = o.clips.length ? o.clips[tick % o.clips.length] : undefined;
    return m;
  }, [tenant.offerings, tick]);

  const find = useCallback((id: string) => tenant.offerings.find((o) => o.id === id), [tenant.offerings]);
  const open = useCallback((o: Offering, at: Origin) => {
    setFlash((f) => ({ k: f.k + 1, o: at }));
    setView({ id: o.id, origin: at });
    try { history.pushState({ ax: 1 }, "", `?o=${encodeURIComponent(o.id)}`); } catch { /* ignore */ }
  }, []);
  const close = useCallback(() => {
    setView(null);
    try { if (history.state?.ax) history.back(); } catch { /* ignore */ }
  }, []);
  const openFirstService = useCallback((at: Origin) => { const s = tenant.offerings.find((o) => o.kind === "service"); if (s) open(s, at); }, [tenant.offerings, open]);

  useEffect(() => { // deep links and the back button
    const sync = () => {
      const id = new URLSearchParams(location.search).get("o");
      if (!id) { setView(null); return; }
      const o = find(id);
      if (o) setView((v) => v ?? { id, origin: { x: innerWidth / 2, y: innerHeight / 2 } });
    };
    sync();
    window.addEventListener("popstate", sync);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", esc);
    return () => { window.removeEventListener("popstate", sync); window.removeEventListener("keydown", esc); };
  }, [find, close, status]);

  const onShatter = useCallback(() => {
    setIntroDone(true);
    setFlash((f) => ({ k: f.k + 1, o: { x: innerWidth / 2, y: innerHeight / 2 } }));
    try { sessionStorage.setItem("axiom:intro", "1"); } catch { /* ignore */ }
  }, []);

  const current = view ? find(view.id) : undefined;
  const now = Date.now();
  const today = new Date().toLocaleDateString("en-CA");
  const openToday = env ? tenant.times.filter((t) => { const iso = slotISO(today, t); return !tenant.taken.includes(iso) && new Date(iso).getTime() > now + 30 * 60000; }).length : 0;

  if (status === "missing") {
    return <main className={bodyFont.className} style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#04070d", color: "#fff" }}><p>This studio is not available.</p></main>;
  }

  return (
    <main className={bodyFont.className} style={{ position: "fixed", inset: 0, overflow: "hidden", color: "#fff", background: "radial-gradient(ellipse at 50% 38%, #0b1a2b 0%, #04070d 55%, #020307 100%)" }}>
      <style>{`
        @keyframes ax-edge{0%,100%{opacity:.55}50%{opacity:1}}
        .ax-drawer{border-radius:28px 0 0 28px!important}
        @media (max-width:640px){.ax-drawer{border-radius:0!important}.ax-live{display:none!important}}
        @media (max-height:520px){.ax-tag{display:none!important}}
        html,body{overscroll-behavior:none}
      `}</style>

      {env && status === "ready" && (
        <Canvas dpr={[1, dpr]} frameloop={current ? "never" : "always"} camera={{ position: [0, 0.6, 9], fov: 48 }} gl={{ antialias: true, alpha: true }} style={{ position: "absolute", inset: 0 }}>
          <PerformanceMonitor onDecline={() => { setDpr(1); setLowQ(true); }} />
          <Suspense fallback={null}>
            <Scene tenant={tenant} clips={clips} videoOn={!env.reduced && !env.saveData} paused={!!current} lowQ={lowQ} reduced={env.reduced}
              fastIntro={env.seen} inset={inset} onPick={open} onHover={() => {}} onShatter={onShatter} />
          </Suspense>
        </Canvas>
      )}

      <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "linear-gradient(180deg, rgba(2,4,9,.65) 0%, transparent 22%, transparent 55%, rgba(2,4,9,.85) 100%), radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,.55) 100%)" }} />
      <div aria-hidden="true" style={{ position: "absolute", inset: 10, borderRadius: 30, pointerEvents: "none", animation: env?.reduced ? undefined : "ax-edge 5s ease-in-out infinite", boxShadow: `inset 0 0 0 1px ${tenant.accent}44, inset 0 0 70px ${tenant.accent}22, 0 0 36px ${tenant.accent2}22` }} />

      <motion.div initial={false} animate={{ opacity: introDone ? 1 : 0 }} transition={{ duration: 0.8 }} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <header ref={topRef} style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "calc(16px + env(safe-area-inset-top)) clamp(14px,4vw,48px) 12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <span className={display.className} style={{ fontSize: "clamp(16px,2.4vw,20px)", letterSpacing: "-0.01em", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tenant.name}</span>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
            {env && <span className="ax-live" style={{ ...glass, borderRadius: 999, padding: "6px 12px", fontSize: 12, color: tenant.accent, boxShadow: "none" }}>{openToday > 0 ? `${openToday} openings today` : "Booking open 24/7"}</span>}
            <button onClick={(e) => openFirstService(centerOf(e.currentTarget))} style={{ ...ghostBtn, minHeight: 40, pointerEvents: "auto", borderColor: tenant.accent, boxShadow: `0 0 22px ${tenant.accent}55` }}>Book now</button>
          </div>
        </header>
        <div ref={botRef} style={{ position: "absolute", left: 0, right: 0, bottom: 0, display: "flex", flexDirection: "column", gap: 14, padding: "0 clamp(14px,4vw,48px) calc(14px + env(safe-area-inset-bottom))" }}>
          <section style={{ maxWidth: 540 }}>
            <h1 className={display.className} style={{ fontSize: "clamp(28px, min(7vw, 11vh), 80px)", lineHeight: 0.96, margin: 0, letterSpacing: "-0.03em", fontWeight: 800 }}>{tenant.headline}</h1>
            <p className="ax-tag" style={{ margin: "10px 0 0", fontSize: "clamp(14px,1.8vw,17px)", opacity: 0.78, lineHeight: 1.5 }}>{tenant.tagline}</p>
          </section>
          <nav aria-label="Services and albums" style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ ...glass, borderRadius: 999, padding: 6, display: "flex", gap: 6, overflowX: "auto", maxWidth: "100%", pointerEvents: "auto", scrollbarWidth: "none" }}>
              {tenant.offerings.map((o) => {
                const c = o.kind === "service" ? tenant.accent : tenant.accent2;
                return (
                  <button key={o.id} onClick={(e) => open(o, centerOf(e.currentTarget))} style={{ ...chip(false, c), gap: 8, flexShrink: 0 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 8, background: c, boxShadow: `0 0 10px ${c}` }} />{o.label}
                  </button>
                );
              })}
            </div>
          </nav>
        </div>
      </motion.div>

      <Flash k={flash.k} o={flash.o} color={tenant.accent} />

      <AnimatePresence>
        {view && current && (
          <Overlay key={current.kind} origin={view.origin} label={current.label} onClose={close} align={current.kind === "album" ? "end" : "center"}>
            {current.kind === "album" ? (
              <GalleryDrawer tenant={tenant} album={current} onClose={close} onBook={openFirstService} />
            ) : (
              <ServicePage tenant={tenant} offering={current} clip={clips[current.id]} onClose={close} onPick={open} reload={reload}
                onBooked={(iso) => setTenant((t) => (t.taken.includes(iso) ? t : { ...t, taken: [...t.taken, iso] }))} />
            )}
          </Overlay>
        )}
      </AnimatePresence>
    </main>
  );
}