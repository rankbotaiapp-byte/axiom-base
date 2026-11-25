"use client";

/**
 * AxiomInlineStudio — the live storefront builder that slides in under the pitch beats.
 *
 * Entrance: one viewport-triggered slide-in (once), then it is LOCKED at
 * opacity 1 / y 0 / scale 1 — no scroll scrubbing, so typing, uploading and
 * clicking never happen on a moving surface.
 */
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Calculator,
  CalendarCheck,
  Car,
  Check,
  Fish,
  House,
  ImageUp,
  Megaphone,
  MessageCircle,
  Monitor,
  Phone,
  RotateCcw,
  Scissors,
  Smartphone,
  Trees,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  STUDIO_MODULES,
  STUDIO_NICHES,
  buildLaunchHref,
  fillTokens,
  formatPrice,
  nicheById,
  type ModuleId,
  type StudioConfig,
  type StudioNicheId,
  type StudioNichePreset,
  type StudioService,
} from "./nichePresets";

const C = {
  bg: "#050507",
  panel: "#07080C",
  text: "#f4f6fa",
  muted: "#9aa3b2",
  cyan: "#00f0ff",
  mint: "#00ffcc",
  gold: "#FFE500",
} as const;

const NICHE_ICON: Record<StudioNicheId, LucideIcon> = {
  "plumbing-hvac": Wrench,
  "auto-detailing": Car,
  "landscaping-tree": Trees,
  "roofing-gc": House,
  barbershop: Scissors,
  "guided-fishing": Fish,
};

export interface AxiomInlineStudioProps {
  /** Route the $1 CTA links to; config is appended as query params. */
  launchPath?: string;
  /**
   * Optional: take over the launch (e.g. call your Stripe $1 trial handler).
   * When provided, the CTA is a button and launchPath is not used.
   */
  onLaunch?: (config: StudioConfig, href: string) => void | Promise<void>;
  initialNiche?: StudioNicheId;
  id?: string;
}

export default function AxiomInlineStudio({
  launchPath = "/onboard",
  onLaunch,
  initialNiche = "plumbing-hvac",
  id = "axiom-studio-inline",
}: AxiomInlineStudioProps) {
  const reduce = useReducedMotion() ?? false;
  const first = nicheById(initialNiche);
  const [cfg, setCfg] = useState<StudioConfig>({
    business: first.defaultBusiness,
    city: first.defaultCity,
    niche: first.id,
    modules: { booking: true, chatbot: true, social: true },
    heroPresetId: first.heroPresets[0]?.id ?? "",
    hasCustomPhoto: false,
  });
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");
  const [view, setView] = useState<"after" | "before">("after");
  const [launching, setLaunching] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const preset = nicheById(cfg.niche);

  // remember whether the visitor typed their own name/city, so niche swaps don't overwrite it
  const touched = useRef({ business: false, city: false });

  useEffect(() => () => {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
  }, [photoUrl]);

  // desktop preview by default on wide screens
  useEffect(() => {
    if (window.matchMedia("(min-width: 1024px)").matches) setDevice("desktop");
  }, []);

  const pickNiche = (idValue: StudioNicheId) => {
    const p = nicheById(idValue);
    setCfg((c) => ({
      ...c,
      niche: p.id,
      business: touched.current.business ? c.business : p.defaultBusiness,
      city: touched.current.city ? c.city : p.defaultCity,
      heroPresetId: p.heroPresets[0]?.id ?? "",
    }));
    setView("after");
  };

  const onPhoto = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;
    setPhotoUrl(URL.createObjectURL(file));
    setCfg((c) => ({ ...c, hasCustomPhoto: true }));
    setView("after");
  };

  const clearPhoto = () => {
    setPhotoUrl(null);
    setCfg((c) => ({ ...c, hasCustomPhoto: false }));
  };

  const href = useMemo(() => buildLaunchHref(launchPath, cfg), [launchPath, cfg]);
  const ready = cfg.business.trim().length > 1;
  const activeModules = STUDIO_MODULES.filter((m) => cfg.modules[m.id]);

  const launch = async () => {
    if (!onLaunch || !ready) return;
    setLaunching(true);
    try {
      await onLaunch(cfg, href);
    } finally {
      setLaunching(false);
    }
  };

  const ctaLabel = launching ? "Opening checkout…" : "Lock In & Launch Your Storefront — $1 Test Drive";
  const ctaClass =
    "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-center text-sm font-bold uppercase tracking-wide text-black transition-transform hover:-translate-y-0.5 disabled:opacity-60 sm:w-auto sm:text-[15px]";

  return (
    <section id={id} aria-label="Axiom Studio — build your storefront live" className="relative scroll-mt-6 px-4 pb-16 pt-10 sm:px-8" style={{ color: C.text }}>
      <motion.div
        className="mx-auto max-w-7xl"
        initial={reduce ? false : { opacity: 0, y: 64, scale: 0.97 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, amount: 0.12 }}
        transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 70, damping: 18, mass: 1 }}
      >
        {/* header */}
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.26em]" style={{ color: C.cyan }}>
              AXIOM / STUDIO — BUILD YOUR STOREFRONT LIVE
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Configure it. Click it. Launch it for $1.</h2>
          </div>
          <StatusBadge ready={ready} />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          {/* ---------- configurator ---------- */}
          <div className="space-y-5 rounded-xl border border-white/10 p-4 sm:p-5 lg:col-span-4" style={{ background: C.panel }}>
            <Step n="01" title="Your business">
              <Field label="Business name">
                <input
                  value={cfg.business}
                  maxLength={48}
                  onChange={(e) => {
                    touched.current.business = true;
                    setCfg((c) => ({ ...c, business: e.target.value }));
                  }}
                  className="h-11 w-full rounded-md border border-white/10 bg-black/40 px-3 text-sm outline-none focus:border-[#00f0ff]/60"
                  placeholder="e.g. Accurate Plumbing"
                />
              </Field>
              <Field label="City / service area">
                <input
                  value={cfg.city}
                  maxLength={48}
                  onChange={(e) => {
                    touched.current.city = true;
                    setCfg((c) => ({ ...c, city: e.target.value }));
                  }}
                  className="h-11 w-full rounded-md border border-white/10 bg-black/40 px-3 text-sm outline-none focus:border-[#00f0ff]/60"
                  placeholder="e.g. Medford, OR"
                />
              </Field>
            </Step>

            <Step n="02" title="Your trade">
              <div className="grid grid-cols-2 gap-2">
                {STUDIO_NICHES.map((n) => {
                  const Icon = NICHE_ICON[n.id];
                  const on = n.id === cfg.niche;
                  return (
                    <button
                      key={n.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => pickNiche(n.id)}
                      className="flex min-h-11 items-center gap-2 rounded-md border px-2.5 py-2 text-left text-xs transition-colors"
                      style={{
                        borderColor: on ? n.accent : "rgba(255,255,255,0.1)",
                        background: on ? `${n.accent}14` : "transparent",
                        color: on ? C.text : C.muted,
                      }}
                    >
                      <Icon className="size-4 shrink-0" style={{ color: on ? n.accent : C.muted }} />
                      {n.label}
                    </button>
                  );
                })}
              </div>
            </Step>

            <Step n="03" title="Hero photo">
              <div className="flex flex-wrap gap-2">
                {preset.heroPresets.map((h) => {
                  const on = !cfg.hasCustomPhoto && h.id === cfg.heroPresetId;
                  return (
                    <button
                      key={h.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => {
                        setCfg((c) => ({ ...c, heroPresetId: h.id, hasCustomPhoto: false }));
                        setView("after");
                      }}
                      className="flex h-11 items-center gap-2 rounded-md border px-2 text-xs"
                      style={{ borderColor: on ? preset.accent : "rgba(255,255,255,0.1)", color: on ? C.text : C.muted }}
                    >
                      <span className="h-6 w-6 rounded" style={{ background: h.background }} />
                      {h.label}
                    </button>
                  );
                })}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex h-11 items-center gap-2 rounded-md px-3 text-xs font-semibold text-black"
                  style={{ background: preset.accent }}
                >
                  <ImageUp className="size-4" /> Upload a job-site photo
                </button>
                {photoUrl && (
                  <button type="button" onClick={clearPhoto} className="inline-flex h-11 items-center gap-1 rounded-md border border-white/10 px-3 text-xs" style={{ color: C.muted }}>
                    <X className="size-3.5" /> Remove
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={onPhoto} aria-label="Upload a job-site or shop photo" />
              </div>
              <p className="mt-1.5 text-[11px]" style={{ color: C.muted }}>Your photo stays in your browser — nothing is uploaded.</p>
            </Step>

            <Step n="04" title="Autopilot modules">
              <div className="space-y-2">
                {STUDIO_MODULES.map((m) => (
                  <ModuleToggle
                    key={m.id}
                    label={m.label}
                    blurb={m.blurb}
                    on={cfg.modules[m.id]}
                    accent={preset.accent}
                    onToggle={() => setCfg((c) => ({ ...c, modules: { ...c.modules, [m.id]: !c.modules[m.id] } }))}
                  />
                ))}
              </div>
            </Step>
          </div>

          {/* ---------- live viewport ---------- */}
          <div className="min-w-0 lg:col-span-8">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Segmented
                value={device}
                onChange={setDevice}
                options={[
                  { value: "mobile", label: "Mobile", icon: Smartphone },
                  { value: "desktop", label: "Desktop", icon: Monitor },
                ]}
              />
              <Segmented
                value={view}
                onChange={setView}
                options={[
                  { value: "before", label: "Before Axiom" },
                  { value: "after", label: "With Axiom" },
                ]}
              />
              <span className="ml-auto hidden font-mono text-[10px] uppercase tracking-[0.2em] sm:inline" style={{ color: C.muted }}>
                Live preview · click anything
              </span>
            </div>

            <div className="rounded-xl border border-white/10 p-3 sm:p-5" style={{ background: `radial-gradient(70% 60% at 50% 0%, ${preset.accent}1a, transparent 70%), ${C.panel}` }}>
              <div
                className={`relative mx-auto overflow-hidden border border-white/15 shadow-2xl transition-[max-width] duration-500 ${device === "mobile" ? "max-w-[360px] rounded-[30px]" : "max-w-full rounded-lg"}`}
                style={{ boxShadow: `0 40px 120px -40px ${preset.accent}66` }}
              >
                <div className={`relative overflow-y-auto overscroll-contain ${device === "mobile" ? "h-[640px]" : "h-[560px]"}`}>
                  {view === "before" ? (
                    <BeforeSite cfg={cfg} preset={preset} />
                  ) : (
                    <StorefrontPreview cfg={cfg} preset={preset} photoUrl={photoUrl} device={device} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ---------- locked-in conversion bar ---------- */}
        <div className="sticky bottom-3 z-30 mt-6">
          <div className="flex flex-col gap-3 rounded-xl border border-white/10 p-3 backdrop-blur-xl sm:flex-row sm:items-center sm:p-4" style={{ background: "rgba(7,8,12,0.88)", boxShadow: `0 -10px 60px -20px ${C.gold}55` }}>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {cfg.business.trim() || "Your business"} <span style={{ color: C.muted }}>· {preset.label} · {cfg.city.trim() || "your area"}</span>
              </p>
              <p className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-[0.16em]" style={{ color: C.muted }}>
                {activeModules.length ? activeModules.map((m) => m.label).join(" · ") : "No autopilot modules selected"}
              </p>
            </div>
            {onLaunch ? (
              <button type="button" onClick={() => void launch()} disabled={!ready || launching} className={ctaClass} style={{ background: C.gold, boxShadow: `0 12px 40px -12px ${C.gold}` }}>
                {ctaLabel} <ArrowRight className="size-4 shrink-0" />
              </button>
            ) : (
              <a
                href={ready ? href : undefined}
                aria-disabled={!ready}
                className={`${ctaClass} ${ready ? "" : "pointer-events-none opacity-60"}`}
                style={{ background: C.gold, boxShadow: `0 12px 40px -12px ${C.gold}` }}
              >
                {ctaLabel} <ArrowRight className="size-4 shrink-0" />
              </a>
            )}
          </div>
        </div>
      </motion.div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Configurator bits                                                   */
/* ------------------------------------------------------------------ */

function StatusBadge({ ready }: { ready: boolean }) {
  const color = ready ? C.mint : C.gold;
  return (
    <span
      className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em]"
      style={{ borderColor: `${color}66`, color, boxShadow: `0 0 24px -6px ${color}` }}
      role="status"
    >
      <span className="relative flex size-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: color }} />
        <span className="relative inline-flex size-2 rounded-full" style={{ background: color }} />
      </span>
      {ready ? "STATUS: READY TO DEPLOY" : "STATUS: ADD YOUR BUSINESS NAME"}
    </span>
  );
}

function Step({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2.5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em]" style={{ color: C.muted }}>
        <span style={{ color: C.cyan }}>{n}</span> {title}
      </p>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs" style={{ color: C.muted }}>{label}</span>
      {children}
    </label>
  );
}

function ModuleToggle({ label, blurb, on, accent, onToggle }: { label: string; blurb: string; on: boolean; accent: string; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className="flex min-h-12 w-full items-center gap-3 rounded-md border px-3 py-2 text-left"
      style={{ borderColor: on ? `${accent}66` : "rgba(255,255,255,0.1)" }}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-[11px]" style={{ color: C.muted }}>{blurb}</span>
      </span>
      <span className="relative h-5 w-9 shrink-0 rounded-full transition-colors" style={{ background: on ? accent : "rgba(255,255,255,0.15)" }}>
        <span className={`absolute top-0.5 size-4 rounded-full bg-white transition-transform ${on ? "translate-x-[18px]" : "translate-x-0.5"}`} />
      </span>
    </button>
  );
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; icon?: LucideIcon }[];
}) {
  return (
    <div className="inline-flex rounded-md border border-white/10 p-0.5">
      {options.map((o) => {
        const Icon = o.icon;
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            className="inline-flex h-9 items-center gap-1.5 rounded px-3 text-xs"
            style={{ background: on ? "rgba(255,255,255,0.1)" : "transparent", color: on ? C.text : C.muted }}
          >
            {Icon && <Icon className="size-3.5" />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The live storefront                                                 */
/* ------------------------------------------------------------------ */

type Sheet = { kind: "book"; service: StudioService } | { kind: "quote" } | null;

function StorefrontPreview({
  cfg,
  preset,
  photoUrl,
  device,
}: {
  cfg: StudioConfig;
  preset: StudioNichePreset;
  photoUrl: string | null;
  device: "mobile" | "desktop";
}) {
  const [sheet, setSheet] = useState<Sheet>(null);
  const [booked, setBooked] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const Icon = NICHE_ICON[preset.id];
  const hero = preset.heroPresets.find((h) => h.id === cfg.heroPresetId) ?? preset.heroPresets[0];
  const wide = device === "desktop";
  const accent = preset.accent;

  // reset transient UI when the trade changes
  useEffect(() => {
    setSheet(null);
    setBooked(null);
    setChatOpen(false);
  }, [preset.id]);

  useEffect(() => {
    if (!cfg.modules.chatbot) setChatOpen(false);
  }, [cfg.modules.chatbot]);

  return (
    <div className="relative min-h-full" style={{ background: C.bg, color: C.text }}>
      {/* nav */}
      <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-white/10 px-4 py-3 backdrop-blur" style={{ background: "rgba(5,5,7,0.8)" }}>
        <span className="grid size-7 place-items-center rounded-md" style={{ background: `${accent}22`, color: accent }}>
          <Icon className="size-4" />
        </span>
        <span className="truncate text-sm font-semibold">{cfg.business.trim() || "Your Business"}</span>
        <span className="ml-auto truncate rounded-full border border-white/10 px-2 py-0.5 text-[10px]" style={{ color: C.muted }}>{cfg.city.trim() || "Your area"}</span>
      </div>

      {/* hero */}
      <div className={`relative overflow-hidden ${wide ? "min-h-[300px]" : "min-h-[280px]"}`} style={{ background: photoUrl ? undefined : hero?.background }}>
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="Your uploaded job-site photo" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <Icon aria-hidden className="absolute -right-6 -top-6 size-48 opacity-[0.12]" style={{ color: accent }} />
        )}
        <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${C.bg} 5%, rgba(5,5,7,0.55) 55%, rgba(5,5,7,0.15))` }} />
        <div className={`relative flex flex-col justify-end p-5 ${wide ? "min-h-[300px] max-w-xl sm:p-8" : "min-h-[280px]"}`}>
          <AnimatePresence mode="wait">
            <motion.h3
              key={preset.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className={`font-bold leading-[1.05] tracking-tight ${wide ? "text-3xl sm:text-4xl" : "text-2xl"}`}
            >
              {fillTokens(preset.headline, cfg)}
            </motion.h3>
          </AnimatePresence>
          <p className="mt-2 text-sm" style={{ color: "#c9cfd8" }}>{fillTokens(preset.subhead, cfg)}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {cfg.modules.booking ? (
              <button
                type="button"
                onClick={() => preset.services[0] && setSheet({ kind: "book", service: preset.services[0] })}
                className="inline-flex h-10 items-center gap-1.5 rounded-md px-4 text-sm font-semibold text-black"
                style={{ background: accent, boxShadow: `0 10px 30px -10px ${accent}` }}
              >
                <CalendarCheck className="size-4" /> {preset.bookLabel}
              </button>
            ) : (
              <span className="inline-flex h-10 items-center gap-1.5 rounded-md border border-white/20 px-4 text-sm">
                <Phone className="size-4" /> Call to book
              </span>
            )}
            <button type="button" onClick={() => setSheet({ kind: "quote" })} className="inline-flex h-10 items-center gap-1.5 rounded-md border border-white/20 px-4 text-sm backdrop-blur">
              <Calculator className="size-4" /> Instant quote
            </button>
          </div>
        </div>
      </div>

      {/* booked toast */}
      <AnimatePresence>
        {booked && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mx-4 mt-3 flex items-start gap-2 rounded-md border px-3 py-2 text-xs"
            style={{ borderColor: `${C.mint}55`, background: `${C.mint}12` }}
          >
            <Check className="mt-0.5 size-4 shrink-0" style={{ color: C.mint }} />
            <span className="flex-1">{booked}</span>
            <button type="button" aria-label="Dismiss" onClick={() => setBooked(null)}><X className="size-3.5" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* services */}
      <div className="p-4 sm:p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: C.muted }}>Services</p>
        <div className={`mt-3 grid gap-2 ${wide ? "sm:grid-cols-2" : ""}`}>
          {preset.services.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSheet({ kind: "book", service: s })}
              className="flex items-center justify-between gap-3 rounded-md border border-white/10 px-3 py-3 text-left transition-colors hover:border-white/25"
              style={{ background: "rgba(255,255,255,0.02)" }}
            >
              <span>
                <span className="block text-sm font-medium">{s.name}</span>
                <span className="block text-[11px]" style={{ color: C.muted }}>{s.duration}</span>
              </span>
              <span className="text-right">
                <span className="block font-mono text-sm">{formatPrice(s)}</span>
                <span className="block text-[11px]" style={{ color: accent }}>{cfg.modules.booking ? "Book →" : "Details →"}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* social queue */}
      {cfg.modules.social && (
        <div className="px-4 pb-5 sm:px-5">
          <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: C.muted }}>
            <Megaphone className="size-3.5" style={{ color: accent }} /> Autonomous social queue · scheduled
          </p>
          <div className={`mt-3 grid gap-2 ${wide ? "sm:grid-cols-3" : ""}`}>
            {preset.socialPosts.map((p) => (
              <div key={p.when} className="rounded-md border border-white/10 p-3 text-xs" style={{ background: "rgba(255,255,255,0.02)" }}>
                <p className="font-mono text-[10px]" style={{ color: accent }}>{p.when}</p>
                <p className="mt-1">{fillTokens(p.text, cfg)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="px-4 pb-24 text-center font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: C.muted }}>
        Powered by Axiom · demo preview
      </p>

      {/* chat bubble */}
      {cfg.modules.chatbot && (
        <ChatWidget open={chatOpen} setOpen={setChatOpen} preset={preset} cfg={cfg} />
      )}

      {/* sheets */}
      <AnimatePresence>
        {sheet && (
          <motion.div className="absolute inset-0 z-20" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button type="button" aria-label="Close" className="absolute inset-0 bg-black/60" onClick={() => setSheet(null)} />
            <motion.div
              className="absolute inset-x-0 bottom-0 max-h-[85%] overflow-y-auto rounded-t-2xl border-t border-white/10 p-5"
              style={{ background: C.panel }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
            >
              {sheet.kind === "book" ? (
                <BookingSheet
                  service={sheet.service}
                  preset={preset}
                  bookingOn={cfg.modules.booking}
                  onClose={() => setSheet(null)}
                  onBooked={(msg) => {
                    setBooked(msg);
                    setSheet(null);
                  }}
                />
              ) : (
                <QuoteSheet
                  preset={preset}
                  bookingOn={cfg.modules.booking}
                  onClose={() => setSheet(null)}
                  onBook={(s) => setSheet({ kind: "book", service: s })}
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SheetHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <p className="text-base font-semibold">{title}</p>
      <button type="button" aria-label="Close" onClick={onClose} className="grid size-8 place-items-center rounded-md border border-white/10">
        <X className="size-4" />
      </button>
    </div>
  );
}

function BookingSheet({
  service,
  preset,
  bookingOn,
  onClose,
  onBooked,
}: {
  service: StudioService;
  preset: StudioNichePreset;
  bookingOn: boolean;
  onClose: () => void;
  onBooked: (msg: string) => void;
}) {
  const [slot, setSlot] = useState<string | null>(null);
  if (!bookingOn) {
    return (
      <>
        <SheetHeader title={service.name} onClose={onClose} />
        <p className="text-sm" style={{ color: C.muted }}>
          Without the booking module, customers have to call — and after hours, most won't. Turn on <b style={{ color: C.text }}>24/7 Instant Booking</b> in the studio to let them book this right here.
        </p>
      </>
    );
  }
  return (
    <>
      <SheetHeader title={`${service.name} · ${formatPrice(service)}`} onClose={onClose} />
      <p className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: C.muted }}>Open slots</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {preset.slots.map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={slot === s}
            onClick={() => setSlot(s)}
            className="h-11 rounded-md border text-xs"
            style={{ borderColor: slot === s ? preset.accent : "rgba(255,255,255,0.1)", background: slot === s ? `${preset.accent}1f` : "transparent" }}
          >
            {s}
          </button>
        ))}
      </div>
      <button
        type="button"
        disabled={!slot}
        onClick={() => slot && onBooked(`${service.name} booked for ${slot}. Confirmation texted to the customer, job sent to your phone. (Demo — nothing sent.)`)}
        className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md text-sm font-semibold text-black disabled:opacity-40"
        style={{ background: preset.accent }}
      >
        <CalendarCheck className="size-4" /> {slot ? `Confirm ${slot}` : "Pick a slot"}
      </button>
    </>
  );
}

function QuoteSheet({
  preset,
  bookingOn,
  onClose,
  onBook,
}: {
  preset: StudioNichePreset;
  bookingOn: boolean;
  onClose: () => void;
  onBook: (s: StudioService) => void;
}) {
  const priced = preset.services.filter((s) => s.price > 0 && s.unit !== "person");
  const [serviceId, setServiceId] = useState(priced[0]?.id ?? "");
  const [opt, setOpt] = useState(0);
  const service = priced.find((s) => s.id === serviceId) ?? priced[0];
  const factor = preset.quoteOptions[opt]?.factor ?? 1;
  const low = service ? Math.round((service.price * factor * 0.9) / 5) * 5 : 0;
  const high = service ? Math.round((service.price * factor * 1.15) / 5) * 5 : 0;

  return (
    <>
      <SheetHeader title="Instant quote" onClose={onClose} />
      <p className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: C.muted }}>Service</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {priced.map((s) => (
          <button
            key={s.id}
            type="button"
            aria-pressed={s.id === serviceId}
            onClick={() => setServiceId(s.id)}
            className="h-9 rounded-md border px-3 text-xs"
            style={{ borderColor: s.id === serviceId ? preset.accent : "rgba(255,255,255,0.1)" }}
          >
            {s.name}
          </button>
        ))}
      </div>
      <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: C.muted }}>{preset.quoteSizeLabel}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {preset.quoteOptions.map((o, i) => (
          <button
            key={o.label}
            type="button"
            aria-pressed={i === opt}
            onClick={() => setOpt(i)}
            className="h-9 rounded-md border px-3 text-xs"
            style={{ borderColor: i === opt ? preset.accent : "rgba(255,255,255,0.1)" }}
          >
            {o.label}
          </button>
        ))}
      </div>
      <div className="mt-5 rounded-md border border-white/10 p-4 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: C.muted }}>Estimated range</p>
        <p className="mt-1 text-3xl font-bold" style={{ color: preset.accent }}>
          ${low.toLocaleString("en-US")} – ${high.toLocaleString("en-US")}
        </p>
        <p className="mt-1 text-[11px]" style={{ color: C.muted }}>Final price confirmed on site. Sample pricing.</p>
      </div>
      {service && (
        <button
          type="button"
          onClick={() => onBook(service)}
          className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md text-sm font-semibold text-black"
          style={{ background: preset.accent }}
        >
          {bookingOn ? "Book this job" : "See booking options"} <ArrowRight className="size-4" />
        </button>
      )}
    </>
  );
}

function ChatWidget({
  open,
  setOpen,
  preset,
  cfg,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  preset: StudioNichePreset;
  cfg: StudioConfig;
}) {
  const [log, setLog] = useState<{ from: "bot" | "me"; text: string }[]>([]);
  useEffect(() => setLog([{ from: "bot", text: fillTokens(preset.chatGreeting, cfg) }]), [preset.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="absolute bottom-4 right-4 z-10 flex flex-col items-end gap-2">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            className="w-[260px] rounded-xl border border-white/10 p-3 shadow-2xl"
            style={{ background: C.panel }}
          >
            <div className="mb-2 flex items-center justify-between text-xs font-semibold">
              <span>{cfg.business.trim() || "Your Business"} · AI desk</span>
              <button type="button" aria-label="Close chat" onClick={() => setOpen(false)}><X className="size-3.5" /></button>
            </div>
            <div className="max-h-48 space-y-2 overflow-y-auto text-xs">
              {log.map((m, i) => (
                <p
                  key={i}
                  className={`max-w-[85%] rounded-lg px-2.5 py-1.5 ${m.from === "me" ? "ml-auto text-black" : ""}`}
                  style={{ background: m.from === "me" ? preset.accent : "rgba(255,255,255,0.06)" }}
                >
                  {m.text}
                </p>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {preset.chatReplies.map((r) => (
                <button
                  key={r.ask}
                  type="button"
                  onClick={() => setLog((l) => [...l, { from: "me", text: r.ask }, { from: "bot", text: fillTokens(r.answer, cfg) }])}
                  className="rounded-full border border-white/15 px-2.5 py-1 text-[11px]"
                >
                  {r.ask}
                </button>
              ))}
              {log.length > 1 && (
                <button type="button" aria-label="Restart chat" onClick={() => setLog([{ from: "bot", text: fillTokens(preset.chatGreeting, cfg) }])} className="rounded-full border border-white/15 px-2 py-1 text-[11px]">
                  <RotateCcw className="size-3" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={open ? "Close chat" : "Open chat"}
        className="grid size-12 place-items-center rounded-full text-black shadow-lg"
        style={{ background: preset.accent, boxShadow: `0 10px 30px -8px ${preset.accent}` }}
      >
        {open ? <X className="size-5" /> : <MessageCircle className="size-5" />}
      </button>
    </div>
  );
}

/** What their site probably looks like today — the "before" in before/after. */
function BeforeSite({ cfg, preset }: { cfg: StudioConfig; preset: StudioNichePreset }) {
  return (
    <div className="min-h-full bg-[#f3f1ec] p-5 text-[#222]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
      <div className="border-b-2 border-[#999] pb-3 text-center">
        <p className="text-2xl font-bold text-[#1a3a7a] underline">{cfg.business.trim() || "Your Business"}</p>
        <p className="mt-1 text-sm italic">{preset.beforeTagline}</p>
      </div>
      <p className="mt-4 text-center text-sm">
        Serving {cfg.city.trim() || "the area"} · <span className="text-[#1a3a7a] underline">Phone: (541) 555-0100</span>
      </p>
      <div className="mx-auto mt-5 grid h-36 max-w-xs place-items-center border border-[#aaa] bg-[#ddd] text-xs text-[#777]">[ photo coming soon ]</div>
      <p className="mt-5 text-sm font-bold">Services:</p>
      <ul className="ml-5 mt-1 list-disc text-sm">
        {preset.services.map((s) => (
          <li key={s.id}>{s.name}</li>
        ))}
      </ul>
      <p className="mt-5 text-sm">Please call during business hours (Mon–Fri 8–5). Leave a message and we will get back to you.</p>
      <p className="mt-6 text-center text-[11px] text-[#888]">© 2014 · Last updated: ages ago · Best viewed in Internet Explorer</p>
      <div className="mt-6 rounded border border-dashed border-[#b33] p-3 text-center text-xs text-[#b33]" style={{ fontFamily: "ui-sans-serif, system-ui" }}>
        No booking · No after-hours answers · No social posts. Flip to <b>With Axiom</b>.
      </div>
    </div>
  );
}
