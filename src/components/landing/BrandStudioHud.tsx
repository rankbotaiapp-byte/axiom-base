"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/* Config — edit these, not the markup                                 */
/* ------------------------------------------------------------------ */

const TRADES = {
  plumbing: {
    label: "Plumbing",
    tagline: "24/7 Emergency Plumbing",
    video: "/hud/hero-plumbing.mp4",
  },
  hvac: {
    label: "HVAC",
    tagline: "Heating & Cooling, Same Day",
    video: "/hud/hero-hvac.mp4",
  },
  electrical: {
    label: "Electrical",
    tagline: "Licensed Emergency Electricians",
    video: "/hud/hero-electrical.mp4",
  },
} as const;

type TradeId = keyof typeof TRADES;

const PALETTES = [
  { id: "cyan", name: "Arc Cyan", primary: "#00FFFF", secondary: "#0B2A3A" },
  { id: "blue", name: "Pro Blue", primary: "#3B82F6", secondary: "#0B1B3A" },
  { id: "amber", name: "Safety Amber", primary: "#F59E0B", secondary: "#2A1B05" },
  { id: "red", name: "Emergency Red", primary: "#EF4444", secondary: "#2A0B0B" },
  { id: "green", name: "Go Green", primary: "#22C55E", secondary: "#072A14" },
] as const;

type PaletteId = (typeof PALETTES)[number]["id"];

const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

export interface BrandStudioHUDProps {
  /** Shown under the CTA. Must match TRIAL_DAYS on the server. */
  trialDays?: number;
  /** Blurred lab backdrop. Falls back to pure gradients if missing. */
  backgroundImage?: string;
  checkoutEndpoint?: string;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const CYAN = "#00FFFF";

const chamfer = (c: number) =>
  `polygon(${c}px 0, calc(100% - ${c}px) 0, 100% ${c}px, 100% calc(100% - ${c}px), calc(100% - ${c}px) 100%, ${c}px 100%, 0 calc(100% - ${c}px), 0 ${c}px)`;

export function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

/** Chamfered charcoal panel with a thin cyan edge. */
function Panel({
  children,
  className = "",
  cut = 14,
  active = false,
}: {
  children: React.ReactNode;
  className?: string;
  cut?: number;
  active?: boolean;
}) {
  return (
    <div
      className={`p-px ${className}`}
      style={{
        clipPath: chamfer(cut),
        background: active
          ? `linear-gradient(135deg, ${CYAN}, rgba(0,255,255,.25) 40%, rgba(0,255,255,.6))`
          : "linear-gradient(135deg, rgba(0,255,255,.45), rgba(148,163,184,.12) 35%, rgba(0,255,255,.2))",
      }}
    >
      <div
        className="h-full w-full bg-[#0c1117]/95"
        style={{ clipPath: chamfer(cut) }}
      >
        {children}
      </div>
    </div>
  );
}

function CornerBracket({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      aria-hidden
      className={`hud-pulse pointer-events-none absolute h-9 w-9 sm:h-12 sm:w-12 ${className}`}
    >
      <path d="M4 20V4h16" fill="none" stroke={CYAN} strokeWidth="3" />
      <path d="M10 26V10h16" fill="none" stroke="#E040FB" strokeWidth="1.5" opacity=".8" />
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={24 + i * 4} y={3} width="2" height="6" fill={i % 2 ? "#E040FB" : CYAN} />
      ))}
    </svg>
  );
}

function Label({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200"
    >
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-sm border border-slate-700/80 bg-black/60 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-cyan-300 focus:shadow-[0_0_0_1px_#00FFFF,0_0_18px_rgba(0,255,255,.25)]";

/* ------------------------------------------------------------------ */
/* Preview pieces                                                      */
/* ------------------------------------------------------------------ */

function HeroPreview({
  name,
  tagline,
  logoUrl,
  color,
  videoSrc,
}: {
  name: string;
  tagline: string;
  logoUrl: string | null;
  color: string;
  videoSrc: string;
}) {
  const [videoOk, setVideoOk] = useState(true);
  useEffect(() => setVideoOk(true), [videoSrc]);

  return (
    <div
      className="relative aspect-video w-full overflow-hidden bg-black"
      style={{ boxShadow: `inset 0 0 0 1.5px ${color}, 0 0 24px ${color}33` }}
    >
      {/* Cinematic loop. Drop real MP4s in /public/hud/. */}
      {videoOk && (
        <video
          key={videoSrc}
          className="absolute inset-0 h-full w-full object-cover"
          src={videoSrc}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onError={() => setVideoOk(false)}
        />
      )}

      {/* Animated fallback when no video asset is present */}
      {!videoOk && (
        <div className="absolute inset-0" aria-hidden>
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at 55% 50%, ${color}26, transparent 55%), linear-gradient(180deg,#020617,#000)`,
            }}
          />
          <div
            className="hud-beam absolute left-0 top-1/2 h-[10%] w-[55%] -translate-y-1/2"
            style={{
              background: `linear-gradient(90deg, transparent, ${color}99 60%, #fff)`,
              filter: "blur(3px)",
            }}
          />
          {[58, 42, 26].map((size, i) => (
            <div
              key={size}
              className={i % 2 ? "hud-spin-rev absolute" : "hud-spin absolute"}
              style={{
                left: "55%",
                top: "50%",
                width: `${size}%`,
                aspectRatio: "1",
                marginLeft: `-${size / 2}%`,
                transform: "translateY(-50%)",
                borderRadius: "9999px",
                border: `${3 - i}px solid ${color}`,
                borderLeftColor: "transparent",
                boxShadow: `0 0 22px ${color}66, inset 0 0 22px ${color}33`,
                animationDuration: `${6 + i * 3}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Scrim + scanlines */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
      <div
        className="absolute inset-0 opacity-20 mix-blend-overlay"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,.25) 0 1px, transparent 1px 3px)",
        }}
      />

      {/* Branding overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center">
        {logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt=""
            className="h-10 max-w-[40%] object-contain drop-shadow-[0_2px_12px_rgba(0,0,0,.8)] sm:h-14"
          />
        )}
        <div
          className="break-words text-2xl font-extrabold uppercase leading-none tracking-[0.08em] sm:text-4xl lg:text-5xl"
          style={{
            color: "rgba(255,255,255,.55)",
            textShadow: `0 0 18px ${color}88, 0 1px 0 rgba(0,0,0,.6)`,
            WebkitTextStroke: "1px rgba(255,255,255,.35)",
          }}
        >
          {name}
        </div>
        <div
          className="text-[10px] font-semibold uppercase tracking-[0.3em] sm:text-xs"
          style={{ color }}
        >
          {tagline}
        </div>
      </div>

      <span className="absolute left-2 top-2 rounded-sm bg-black/60 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-slate-300">
        Live preview
      </span>
    </div>
  );
}

function VanStill({
  name,
  logoUrl,
  color,
  secondary,
}: {
  name: string;
  logoUrl: string | null;
  color: string;
  secondary: string;
}) {
  return (
    <svg viewBox="0 0 220 110" className="h-20 w-auto shrink-0 sm:h-24" role="img" aria-label={`${name} service van`}>
      <defs>
        <linearGradient id="vanSwoosh" x1="0" x2="1">
          <stop offset="0" stopColor={color} />
          <stop offset="1" stopColor={secondary} />
        </linearGradient>
        <clipPath id="vanBox">
          <rect x="70" y="12" width="140" height="68" rx="4" />
        </clipPath>
      </defs>
      <ellipse cx="112" cy="98" rx="100" ry="6" fill="#000" opacity=".5" />
      {/* cab */}
      <path d="M14 80V58l14-22h42v44z" fill="#f1f5f9" />
      <path d="M31 40h30v18H22z" fill="#0f172a" />
      <rect x="8" y="72" width="14" height="8" rx="2" fill="#94a3b8" />
      {/* box */}
      <rect x="70" y="12" width="140" height="68" rx="4" fill="#f8fafc" />
      <g clipPath="url(#vanBox)">
        <path d="M70 80C110 78 150 60 210 20v60z" fill="url(#vanSwoosh)" />
      </g>
      {logoUrl ? (
        <image href={logoUrl} x="80" y="18" width="46" height="30" preserveAspectRatio="xMidYMid meet" />
      ) : null}
      <text
        x={logoUrl ? 132 : 82}
        y="38"
        fontSize={name.length > 14 ? 9 : 12}
        fontWeight="800"
        fill="#0f172a"
        style={{ textTransform: "uppercase" }}
      >
        {name.length > 22 ? `${name.slice(0, 21)}…` : name}
      </text>
      {/* wheels */}
      {[44, 172].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="84" r="13" fill="#0b0f14" />
          <circle cx={cx} cy="84" r="6" fill="#94a3b8" />
        </g>
      ))}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

export default function BrandStudioHUD({
  trialDays = 7,
  backgroundImage = "/hud/lab-bg.jpg",
  checkoutEndpoint = "/api/checkout",
}: BrandStudioHUDProps) {
  const [businessName, setBusinessName] = useState("");
  const [trade, setTrade] = useState<TradeId | "">("");
  const [paletteId, setPaletteId] = useState<PaletteId>("cyan");
  const [paletteTouched, setPaletteTouched] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const palette = PALETTES.find((p) => p.id === paletteId) ?? PALETTES[0];
  const tradeCfg = TRADES[(trade || "plumbing") as TradeId];
  const displayName = businessName.trim() || "Apex Plumbing";
  const slug = slugify(businessName);

  // Object URL lifecycle for the logo preview
  useEffect(() => {
    if (!logoFile) {
      setLogoUrl(null);
      return;
    }
    const url = URL.createObjectURL(logoFile);
    setLogoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  // Status bar is driven by real form completeness, not a fake timer.
  const target = useMemo(() => {
    let t = 0;
    if (businessName.trim().length >= 2) t += 30;
    if (trade) t += 25;
    if (logoFile) t += 25;
    if (paletteTouched) t += 19;
    return t; // max 99 — the last 1% is the live deploy after checkout
  }, [businessName, trade, logoFile, paletteTouched]);

  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (progress === target) return;
    const id = setTimeout(
      () => setProgress((p) => (p < target ? p + 1 : p - 1)),
      12,
    );
    return () => clearTimeout(id);
  }, [progress, target]);

  const canSubmit = businessName.trim().length >= 2 && !!trade && !submitting;

  function onLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setError(null);
    if (!file) return setLogoFile(null);
    if (!LOGO_TYPES.includes(file.type)) {
      e.target.value = "";
      return setError("Logo must be a PNG, JPG, WebP or SVG.");
    }
    if (file.size > MAX_LOGO_BYTES) {
      e.target.value = "";
      return setError("Logo must be under 2 MB.");
    }
    setLogoFile(file);
  }

  async function onClaim() {
    if (!canSubmit) {
      setError("Add your business name and trade to continue.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const body = new FormData();
      body.set("businessName", businessName.trim());
      body.set("trade", trade);
      body.set("colorScheme", palette.id);
      if (logoFile) body.set("logo", logoFile);

      const res = await fetch(checkoutEndpoint, { method: "POST", body });
      const data = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Could not start checkout. Try again.");
      }
      window.location.assign(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <section className="relative min-h-screen overflow-hidden bg-slate-950 font-sans text-slate-200 antialiased">
      <style>{`
        @keyframes hud-pulse { 0%,100% { opacity:.55 } 50% { opacity:1 } }
        @keyframes hud-spin { to { rotate: 360deg } }
        @keyframes hud-beam { 0%,100% { opacity:.55; scale: .96 1 } 50% { opacity:1; scale: 1 1 } }
        @keyframes hud-march { to { background-position: 28px 0 } }
        .hud-pulse { animation: hud-pulse 2.4s ease-in-out infinite }
        .hud-spin { animation: hud-spin 8s linear infinite }
        .hud-spin-rev { animation: hud-spin 8s linear infinite reverse }
        .hud-beam { animation: hud-beam 2.2s ease-in-out infinite; transform-origin: left }
        .hud-march { animation: hud-march 1s linear infinite }
        @media (prefers-reduced-motion: reduce) {
          .hud-pulse,.hud-spin,.hud-spin-rev,.hud-beam,.hud-march { animation: none }
        }
      `}</style>

      {/* Backdrop: blurred lab + obsidian vignette */}
      <div aria-hidden className="absolute inset-0">
        <div
          className="absolute inset-0 scale-110 bg-cover bg-center opacity-40 blur-md"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,255,255,.10),transparent_55%),radial-gradient(ellipse_at_top,rgba(15,23,42,.2),#020617_75%)]" />
        <div className="absolute -left-10 top-1/4 h-1 w-64 -rotate-12 bg-white/40 blur-sm" />
        <div className="absolute -right-10 top-1/4 h-1 w-64 rotate-12 bg-white/40 blur-sm" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-[1400px] items-center px-3 py-6 sm:px-6 lg:px-10">
        {/* ---------- Bezel ---------- */}
        <div
          className="relative w-full"
          style={{ filter: "drop-shadow(0 0 28px rgba(0,255,255,.35)) drop-shadow(0 30px 60px rgba(0,0,0,.8))" }}
        >
          {/* brushed metal outer */}
          <div
            className="p-[6px] sm:p-[10px]"
            style={{
              clipPath: chamfer(34),
              background:
                "repeating-linear-gradient(90deg, rgba(255,255,255,.05) 0 1px, transparent 1px 3px), linear-gradient(160deg,#5b6b78,#1b242c 30%,#3a4853 55%,#141a20)",
            }}
          >
            {/* neon rail */}
            <div
              className="p-[3px]"
              style={{
                clipPath: chamfer(30),
                background: `linear-gradient(135deg, ${CYAN}, #7ff 30%, rgba(0,255,255,.5) 60%, ${CYAN})`,
              }}
            >
              {/* etched inner metal */}
              <div
                className="p-[8px] sm:p-[14px]"
                style={{
                  clipPath: chamfer(28),
                  background:
                    "repeating-linear-gradient(135deg, rgba(0,255,255,.07) 0 1px, transparent 1px 14px), linear-gradient(180deg,#141b22,#0a0f14)",
                }}
              >
                <div
                  className="p-px"
                  style={{ clipPath: chamfer(22), background: "rgba(0,255,255,.7)" }}
                >
                  {/* ---------- Screen ---------- */}
                  <div
                    className="relative bg-[#070b10] px-3 pb-6 pt-5 sm:px-6 sm:pb-8 sm:pt-7"
                    style={{
                      clipPath: chamfer(22),
                      backgroundImage:
                        "radial-gradient(ellipse at 50% 0%, rgba(0,255,255,.08), transparent 60%)",
                    }}
                  >
                    <h1
                      className="mb-5 text-center text-2xl font-extrabold uppercase tracking-[0.06em] sm:mb-7 sm:text-4xl"
                      style={{ color: "#5ef2ff", textShadow: "0 0 18px rgba(0,255,255,.55)" }}
                    >
                      Build Your Brand
                    </h1>

                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)_minmax(0,1fr)] lg:gap-5">
                      {/* ===== LEFT: studio form ===== */}
                      <div className="flex flex-col gap-4">
                        <Panel>
                          <form
                            className="space-y-4 p-4 sm:p-5"
                            onSubmit={(e) => {
                              e.preventDefault();
                              void onClaim();
                            }}
                          >
                            <div>
                              <Label htmlFor="hud-name">Business name</Label>
                              <input
                                id="hud-name"
                                className={inputClass}
                                value={businessName}
                                onChange={(e) => setBusinessName(e.target.value)}
                                placeholder="Apex Plumbing"
                                maxLength={60}
                                autoComplete="organization"
                              />
                            </div>

                            <div>
                              <Label htmlFor="hud-trade">Trade</Label>
                              <select
                                id="hud-trade"
                                className={`${inputClass} appearance-none`}
                                value={trade}
                                onChange={(e) => setTrade(e.target.value as TradeId | "")}
                              >
                                <option value="" disabled>
                                  Select your trade
                                </option>
                                {(Object.keys(TRADES) as TradeId[]).map((id) => (
                                  <option key={id} value={id} className="bg-slate-900">
                                    {TRADES[id].label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <Label htmlFor="hud-logo">Upload logo</Label>
                              <input
                                ref={fileRef}
                                id="hud-logo"
                                type="file"
                                accept={LOGO_TYPES.join(",")}
                                onChange={onLogoChange}
                                className="sr-only"
                              />
                              <button
                                type="button"
                                onClick={() => fileRef.current?.click()}
                                className={`${inputClass} flex items-center justify-between text-left`}
                              >
                                <span className={`truncate ${logoFile ? "text-white" : "text-slate-600"}`}>
                                  {logoFile ? logoFile.name : "PNG, JPG, SVG — optional"}
                                </span>
                                <span className="ml-3 shrink-0 text-[10px] font-bold uppercase tracking-widest text-cyan-300">
                                  {logoFile ? "Change" : "Browse"}
                                </span>
                              </button>
                            </div>

                            <fieldset>
                              <legend className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200">
                                Color scheme
                              </legend>
                              <div className="flex items-center gap-2 rounded-sm border border-slate-700/80 bg-black/60 p-2">
                                {PALETTES.map((p) => {
                                  const on = p.id === paletteId;
                                  return (
                                    <button
                                      key={p.id}
                                      type="button"
                                      title={p.name}
                                      aria-label={p.name}
                                      aria-pressed={on}
                                      onClick={() => {
                                        setPaletteId(p.id);
                                        setPaletteTouched(true);
                                      }}
                                      className="h-7 w-7 rounded-sm transition"
                                      style={{
                                        background: `linear-gradient(135deg, ${p.primary} 55%, ${p.secondary})`,
                                        boxShadow: on
                                          ? `0 0 0 2px #070b10, 0 0 0 3.5px ${p.primary}, 0 0 14px ${p.primary}`
                                          : "inset 0 0 0 1px rgba(255,255,255,.15)",
                                      }}
                                    />
                                  );
                                })}
                                <span className="ml-auto truncate text-[11px] text-slate-400">{palette.name}</span>
                              </div>
                            </fieldset>
                          </form>
                        </Panel>

                        <Panel>
                          <div className="p-4 sm:p-5" role="status" aria-live="polite">
                            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-200">
                              Generation status:{" "}
                              <span className="text-cyan-300">{progress}% complete</span>
                            </div>
                            <div className="h-2.5 w-full overflow-hidden rounded-sm border border-slate-700 bg-black/70">
                              <div
                                className="hud-march h-full transition-[width] duration-150"
                                style={{
                                  width: `${progress}%`,
                                  backgroundImage: `repeating-linear-gradient(90deg, ${CYAN} 0 10px, rgba(0,255,255,.55) 10px 14px)`,
                                  boxShadow: "0 0 12px rgba(0,255,255,.7)",
                                }}
                              />
                            </div>
                            <div className="mt-2 flex items-center justify-between">
                              <span className="text-[10px] uppercase tracking-widest text-slate-500">
                                {progress >= 99 ? "Ready to deploy" : "Awaiting your details"}
                              </span>
                              <span className="flex gap-1" aria-hidden>
                                {[0, 1, 2, 3].map((i) => (
                                  <span
                                    key={i}
                                    className="hud-pulse h-1.5 w-1.5 bg-cyan-300"
                                    style={{ animationDelay: `${i * 0.25}s` }}
                                  />
                                ))}
                              </span>
                            </div>
                          </div>
                        </Panel>
                      </div>

                      {/* ===== CENTER: live preview ===== */}
                      <div className="flex flex-col gap-4 max-lg:order-first">
                        <Panel>
                          <div className="p-3 sm:p-4">
                            <div className="mb-2.5 truncate text-center text-xs font-semibold uppercase tracking-[0.2em] text-white sm:text-sm">
                              Preview: {displayName}
                            </div>
                            <HeroPreview
                              name={displayName}
                              tagline={tradeCfg.tagline}
                              logoUrl={logoUrl}
                              color={palette.primary}
                              videoSrc={tradeCfg.video}
                            />
                          </div>
                        </Panel>

                        <Panel cut={10}>
                          <div className="px-4 py-3">
                            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-200">
                              Your branded animated hero
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-sm border border-slate-700 bg-black/70">
                              <div
                                className="h-full transition-[width] duration-150"
                                style={{
                                  width: `${progress}%`,
                                  background: palette.primary,
                                  boxShadow: `0 0 10px ${palette.primary}`,
                                }}
                              />
                            </div>
                          </div>
                        </Panel>

                        <Panel cut={10}>
                          <div className="flex items-center justify-between gap-3 px-4 py-2">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-200">
                              Your branded still image
                              <div className="mt-1 text-[10px] font-normal normal-case tracking-normal text-slate-500">
                                Illustrative mock-up
                              </div>
                            </div>
                            <VanStill
                              name={displayName}
                              logoUrl={logoUrl}
                              color={palette.primary}
                              secondary={palette.secondary}
                            />
                          </div>
                        </Panel>
                      </div>

                      {/* ===== RIGHT: conversion bridge ===== */}
                      <Panel active={canSubmit}>
                        <div className="flex h-full flex-col items-center px-4 py-8 text-center sm:px-6 lg:py-12">
                          <h2 className="text-lg font-extrabold uppercase leading-tight tracking-[0.08em] text-white sm:text-xl">
                            Deploy your
                            <br />
                            branded page
                          </h2>

                          {slug && (
                            <p className="mt-3 break-all text-[11px] text-slate-400">
                              Your address:{" "}
                              <span className="text-cyan-300">{slug}.axiom.io</span>
                            </p>
                          )}

                          <button
                            type="button"
                            onClick={onClaim}
                            disabled={submitting}
                            aria-disabled={!canSubmit}
                            className={`mt-8 w-full rounded-sm px-4 py-4 font-extrabold uppercase leading-tight tracking-wide text-slate-950 transition active:scale-[.98] ${
                              canSubmit ? "hover:brightness-110" : "opacity-60"
                            } ${submitting ? "cursor-wait" : ""}`}
                            style={{
                              background: "linear-gradient(180deg,#7ff9ff,#00FFFF)",
                              boxShadow: canSubmit
                                ? "0 0 26px rgba(0,255,255,.65), inset 0 1px 0 rgba(255,255,255,.6)"
                                : "none",
                            }}
                          >
                            {submitting ? (
                              "Opening secure checkout…"
                            ) : (
                              <>
                                <span className="block text-base sm:text-lg">
                                  Claim your live page
                                  <br />
                                  for $1 trial
                                </span>
                                <span className="mt-1 block text-xs font-semibold normal-case tracking-normal">
                                  ($150/mo after)
                                </span>
                              </>
                            )}
                          </button>

                          <p className="mt-3 text-[11px] text-slate-400">
                            Instant Deployment via Stripe Secure Checkout.
                          </p>
                          <p className="mt-1 text-[11px] text-slate-500">
                            $1 today, then $150/mo after your {trialDays}-day trial. Cancel anytime.
                          </p>

                          {error && (
                            <p role="alert" className="mt-4 text-xs font-medium text-rose-400">
                              {error}
                            </p>
                          )}

                          <ul className="mt-auto hidden space-y-2 pt-10 text-left text-[11px] text-slate-400 lg:block">
                            {[
                              "Live storefront on your own address",
                              "Admin dashboard to edit everything",
                              `${tradeCfg.label} copy pre-written`,
                            ].map((t) => (
                              <li key={t} className="flex gap-2">
                                <span className="text-cyan-300">▸</span>
                                {t}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </Panel>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <CornerBracket className="left-3 top-3 sm:left-5 sm:top-5" />
          <CornerBracket className="right-3 top-3 -scale-x-100 sm:right-5 sm:top-5" />
          <CornerBracket className="bottom-3 left-3 -scale-y-100 sm:bottom-5 sm:left-5" />
          <CornerBracket className="bottom-3 right-3 -scale-100 sm:bottom-5 sm:right-5" />
        </div>
      </div>
    </section>
  );
}
