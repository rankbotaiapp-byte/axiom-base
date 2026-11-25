"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ACCENTS, NICHES, SLOT_META, findNiche, mockStudioApi } from "./studioPresets";
import { MAX_PHOTOS, ONBOARD_STORAGE_KEY, onboardHref, useAxiomStudio } from "./useAxiomStudio";
import { CinematicAmbientOverlay } from "@/components/atmosphere/CinematicAmbientOverlay";
import { cinemagraphPresetForNiche } from "@/lib/axiom/storefront-atmosphere";
import { INLAY_PRESETS, MOTION_PRESETS, microMotionForNiche, type InlayPresetId, type MotionPresetId } from "@/lib/axiom/storefront-themes";
import type { AccentKey, AxiomStudioApi, OnboardPayload, SlotId, StudioPhoto } from "./types";
import { ShowcaseThemePicker } from "@/components/storefront/showcase-theme-picker";
import { parseShowcaseThemeId } from "@/lib/axiom/outreach-desk";

interface AxiomStudioFunnelProps {
  api?: AxiomStudioApi;
  onboardPath?: string;
  /**
   * Optional hook before navigating (e.g. upload `files` to Supabase Storage,
   * create a Stripe Checkout session). Return a URL to redirect there instead.
   */
  onCheckout?: (payload: OnboardPayload, files: File[]) => Promise<string | void> | string | void;
}

const SLOTS: SlotId[] = ["hero", "proof", "services"];

export default function AxiomStudioFunnel({ api = mockStudioApi, onboardPath = "/onboard", onCheckout }: AxiomStudioFunnelProps) {
  const studio = useAxiomStudio(api);
  const { state, slots, photoById } = studio;
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [drift, setDrift] = useState(false);
  const [inlay, setInlay] = useState<InlayPresetId>("surface");
  const [motionPreset, setMotionPreset] = useState<MotionPresetId>("smoke");

  const niche = findNiche(state.niche);
  const accent = ACCENTS[state.accent];
  const name = state.businessName.trim();
  const full = state.photos.length >= MAX_PHOTOS;

  const checkout = async () => {
    if (!studio.canCheckout || submitting) return;
    setSubmitting(true);
    const payload = studio.buildPayload();
    try {
      sessionStorage.setItem(ONBOARD_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      /* private mode — query string still carries the essentials */
    }
    try {
      const files = state.photos.flatMap((p) => (p.file ? [p.file] : []));
      const redirect = await onCheckout?.(payload, files);
      if (redirect && /^https?:\/\//.test(redirect)) {
        window.location.assign(redirect);
        return;
      }
      router.push(redirect || onboardHref(payload, onboardPath));
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-5">
      <header className="mb-8 max-w-2xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#00ffcc]">02 · Axiom Studio</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Build your page in 60 seconds.</h2>
        <p className="mt-3 text-white/65">
          Drop in 1–3 photos of real work. Axiom maps them into your branded page and booking flow — live preview on
          the right.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        {/* ───────────── Controls ───────────── */}
        <div className="min-w-0 space-y-5">
          {/* Step 1: business */}
          <fieldset className="ax-panel">
            <legend className="ax-step">1 · Your business</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="ax-label">Business name</span>
                <input
                  className="ax-input"
                  value={state.businessName}
                  onChange={(e) => studio.setField("businessName", e.target.value)}
                  placeholder="The name on your truck"
                  autoComplete="organization"
                  maxLength={60}
                />
              </label>
              <label className="block">
                <span className="ax-label">Trade / niche</span>
                <input
                  className="ax-input"
                  list="ax-niches"
                  value={state.niche}
                  onChange={(e) => studio.setField("niche", e.target.value)}
                  placeholder="Plumbing, HVAC, Barber…"
                  maxLength={40}
                />
                <datalist id="ax-niches">
                  {NICHES.map((n) => (
                    <option key={n.key} value={n.label} />
                  ))}
                </datalist>
              </label>
            </div>
          </fieldset>

          {/* Step 2: photos */}
          <fieldset className="ax-panel">
            <legend className="ax-step">2 · Your photos</legend>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-white/60">
                {state.photos.length}/{MAX_PHOTOS} · job sites, finished work, your truck or shop
              </p>
              <button type="button" onClick={studio.loadSample} className="ax-chip-btn">
                ⚡ Try a sample in one tap
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {state.photos.map((p) => (
                <Thumb key={p.id} photo={p} onRemove={() => studio.removePhoto(p.id)} />
              ))}
              {!full && (
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    studio.addFiles(e.dataTransfer.files);
                  }}
                  className={`ax-drop ${dragging ? "ax-drop--active" : ""}`}
                >
                  <span className="text-2xl" aria-hidden>＋</span>
                  <span className="text-xs">{state.photos.length ? "Add photo" : "Upload photos"}</span>
                </button>
              )}
            </div>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => {
                studio.addFiles(e.target.files);
                e.target.value = "";
              }}
            />

            {state.photos.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-white/70">
                  Inlay
                  <select
                    value={inlay}
                    onChange={(event) => setInlay(event.target.value as InlayPresetId)}
                    className="rounded-md border border-white/15 bg-black/50 px-2 py-1 text-xs text-white"
                  >
                    {INLAY_PRESETS.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.label}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={() => void studio.enhance(inlay)}
                  disabled={state.status === "enhancing"}
                  className="ax-chip-btn disabled:opacity-60"
                >
                  {state.status === "enhancing" ? "Remaking the upload…" : state.status === "ready" ? "✓ Remade" : "Remake uploaded photos"}
                </button>
                {state.status === "error" && <span className="text-sm text-[#ff4fb3]">{state.error}</span>}
              </div>
            )}
          </fieldset>

          {/* Step 3: mode + slots */}
          <fieldset className="ax-panel">
            <legend className="ax-step">3 · Who runs the layout?</legend>
            <div role="radiogroup" aria-label="Layout mode" className="grid grid-cols-2 gap-2 rounded-xl bg-black/40 p-1">
              {(
                [
                  ["autopilot", "Full Autopilot", "Axiom places photos & writes copy"],
                  ["manual", "Manual Slots", "You pick each photo's spot"],
                ] as const
              ).map(([value, label, hint]) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={state.mode === value}
                  onClick={() => studio.setMode(value)}
                  className={`ax-seg ${state.mode === value ? "ax-seg--on" : ""}`}
                >
                  <span className="block text-sm font-semibold">{label}</span>
                  <span className="block text-[11px] opacity-70">{hint}</span>
                </button>
              ))}
            </div>

            <ul className="mt-4 space-y-3">
              {SLOTS.map((slot) => {
                const current = photoById(slots[slot]);
                return (
                  <li key={slot} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-2.5">
                    <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-white/5">
                      {current && <img src={current.url} alt="" className={`h-full w-full object-cover ${current.enhanced ? "ax-enhanced" : ""}`} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white">{SLOT_META[slot].label}</p>
                      <p className="truncate text-xs text-white/50">
                        {state.mode === "autopilot" ? (current ? "Auto-assigned by Axiom" : "Waiting for photos") : SLOT_META[slot].hint}
                      </p>
                    </div>
                    {state.mode === "manual" && state.photos.length > 0 && (
                      <div className="flex gap-1.5" role="radiogroup" aria-label={`${SLOT_META[slot].label} photo`}>
                        {state.photos.map((p, i) => (
                          <button
                            key={p.id}
                            type="button"
                            role="radio"
                            aria-checked={slots[slot] === p.id}
                            aria-label={`Use photo ${i + 1}`}
                            onClick={() => studio.assignSlot(slot, p.id)}
                            className={`ax-pick ${slots[slot] === p.id ? "ax-pick--on" : ""}`}
                          >
                            <img src={p.url} alt="" className="h-full w-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

            <div className="mt-4 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2" role="radiogroup" aria-label="Brand accent">
                <span className="text-xs text-white/55">Accent</span>
                {(Object.keys(ACCENTS) as AccentKey[]).map((k) => (
                  <button
                    key={k}
                    type="button"
                    role="radio"
                    aria-checked={state.accent === k}
                    aria-label={ACCENTS[k].label}
                    onClick={() => studio.setAccent(k)}
                    className={`h-6 w-6 rounded-full ring-offset-2 ring-offset-[#050507] transition-[box-shadow] ${state.accent === k ? "ring-2 ring-white" : ""}`}
                    style={{ background: ACCENTS[k].hex }}
                  />
                ))}
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-xs text-white/70">
                <input type="checkbox" checked={state.heroMotion} onChange={(e) => studio.setHeroMotion(e.target.checked)} className="accent-[#00ffcc]" />
                Animated hero
              </label>
            </div>
          </fieldset>
        </div>

        {/* ───────────── Live preview ───────────── */}
        <aside className="lg:sticky lg:top-6" aria-label="Live page preview">
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-white/45">Live preview</p>
          <div className="ax-phone" style={{ ["--ax-accent" as string]: accent.hex, ["--ax-ink" as string]: accent.ink }}>
            <div className="ax-phone-screen">
              <PreviewSlot slot="hero" photo={photoById(slots.hero)} className="relative h-56">
                <div className={`absolute inset-0 ${state.heroMotion && !photoById(slots.hero)?.backgroundVideo ? "ax-kenburns" : ""}`}>
                  {photoById(slots.hero)?.backgroundVideo ? (
                    <video
                      src={photoById(slots.hero)?.backgroundVideo}
                      poster={photoById(slots.hero)?.url}
                      muted
                      loop
                      autoPlay
                      playsInline
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <SlotImage photo={photoById(slots.hero)} />
                  )}
                  {drift && !photoById(slots.hero)?.backgroundVideo ? (
                    <CinematicAmbientOverlay preset={cinemagraphPresetForNiche(state.niche)} />
                  ) : null}
                </div>
                {state.heroMotion && <div aria-hidden className="ax-scan" />}
                <div className="absolute inset-0 bg-gradient-to-t from-[#050507] via-[#050507]/40 to-transparent" />
                {photoById(slots.hero)?.enhanced ? (
                  <div className="absolute right-3 top-3 z-10 flex items-center gap-1">
                    <select
                      aria-label="Background motion"
                      value={motionPreset}
                      onChange={(event) => setMotionPreset(event.target.value as MotionPresetId)}
                      className="rounded-md border border-white/20 bg-black/70 px-1.5 py-1 text-[10px] text-white"
                    >
                      {MOTION_PRESETS.map((preset) => (
                        <option key={preset.id} value={preset.id}>
                          {preset.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="rounded-md border border-white/20 bg-black/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white"
                      disabled={state.status === "enhancing"}
                      onClick={() => {
                        const hero = photoById(slots.hero);
                        if (!hero) return;
                        setDrift(true);
                        void studio.animateBackground(hero.id, motionPreset);
                      }}
                    >
                      {state.status === "enhancing" && drift ? "Animating…" : "Animate Background"}
                    </button>
                  </div>
                ) : null}
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <p className="text-[10px] font-mono uppercase tracking-[0.18em]" style={{ color: accent.hex }}>
                    {niche.label} · Booking open 24/7
                  </p>
                  <p className="mt-1 text-lg font-semibold leading-tight text-white">
                    {name ? niche.tagline(name) : "Your photos become a page that books jobs overnight."}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <span className="rounded-lg px-3 py-1.5 text-xs font-semibold" style={{ background: accent.hex, color: accent.ink }}>
                      Book now
                    </span>
                    <span className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white">Instant quote</span>
                  </div>
                </div>
              </PreviewSlot>

              <div className="space-y-3 p-4">
                <PreviewSlot slot="proof" photo={photoById(slots.proof)} className="relative h-28 overflow-hidden rounded-xl">
                  <SlotImage photo={photoById(slots.proof)} />
                  <span className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] text-white">Recent job ✓</span>
                </PreviewSlot>

                <PreviewSlot slot="services" photo={photoById(slots.services)} className="overflow-hidden rounded-xl border border-white/10">
                  <div className="relative h-16">
                    <SlotImage photo={photoById(slots.services)} />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#050507]/90 to-transparent" />
                    <p className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-white">Services</p>
                  </div>
                  <ul className="divide-y divide-white/5">
                    {niche.services.slice(0, 3).map((s) => (
                      <li key={s} className="flex items-center justify-between px-3 py-2 text-xs text-white/85">
                        {s}
                        <span style={{ color: accent.hex }}>Book →</span>
                      </li>
                    ))}
                  </ul>
                </PreviewSlot>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <div className="mt-8">
        <fieldset className="ax-panel">
          <legend className="ax-step">Last step · Neon ring before you go live</legend>
          <ShowcaseThemePicker
            value={parseShowcaseThemeId(state.showcaseThemeId)}
            onChange={(id) => studio.setShowcaseTheme(id)}
          />
        </fieldset>
      </div>

      {/* ───────────── Conversion ───────────── */}
      <div className="sticky bottom-3 z-20 mt-8">
        <div className="ax-cta-bar">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {name || "Live preview"} <span className="font-normal text-white/50">· {niche.label}</span>
            </p>
            <p className="truncate font-mono text-[10px] uppercase tracking-[0.16em] text-white/50">
              {state.mode === "autopilot" ? "Full Autopilot" : "Manual slots"} · {state.photos.length} photo{state.photos.length === 1 ? "" : "s"} · $1 first month
            </p>
          </div>
          <button type="button" onClick={checkout} disabled={!studio.canCheckout || submitting} className="ax-btn-amber">
            {submitting ? "Locking in…" : studio.canCheckout ? "Launch my $1 Test Drive →" : "Add name + 1 photo"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Thumb({ photo, onRemove }: { photo: StudioPhoto; onRemove: () => void }) {
  return (
    <div className="group relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-white/5">
      <img src={photo.url} alt={photo.name} className={`h-full w-full object-cover ${photo.enhanced ? "ax-enhanced" : ""}`} />
      {photo.source === "sample" && !photo.url.includes("/api/axiom/demo-plate") && (
        <span className="absolute left-1.5 top-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-white/80">Sample</span>
      )}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${photo.name}`}
        className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-black/70 text-sm text-white"
      >
        ×
      </button>
    </div>
  );
}

function SlotImage({ photo }: { photo: StudioPhoto | null }) {
  if (!photo) return <div className="ax-slot-empty h-full w-full" />;
  return <img src={photo.url} alt="" className={`h-full w-full object-cover ${photo.enhanced ? "ax-enhanced" : ""}`} />;
}

function PreviewSlot({
  slot,
  photo,
  className,
  children,
}: {
  slot: SlotId;
  photo: StudioPhoto | null;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`ax-slot ${className ?? ""}`} data-slot={slot} data-filled={!!photo}>
      {children}
    </div>
  );
}
