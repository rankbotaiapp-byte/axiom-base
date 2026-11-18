"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Layers3, Sparkles, Upload } from "lucide-react";
import { writeStorefrontDraft } from "@/lib/axiom/accent-color";
import { AxiomParticleCanvasBackground } from "@/components/AxiomParticleCanvasBackground";
import {
  allStudioTemplatePresets,
  rememberStudioTemplate,
  type StudioTemplatePreset,
} from "@/lib/axiom/studio-templates";

const BRAND_COLORS = [
  { label: "Cyber Cyan", value: "#00ffcc" },
  { label: "Warm Amber", value: "#ffb020" },
  { label: "Ice", value: "#7EC8E3" },
  { label: "Signal", value: "#ff4b4b" },
  { label: "Violet", value: "#b967ff" },
] as const;

const SCAN_MS = 650;

export function StudioWorkspace({
  embedded = false,
  onLaunch,
  initialTemplate = null,
  templateSource,
}: {
  embedded?: boolean;
  onLaunch?: () => void;
  initialTemplate?: StudioTemplatePreset | null;
  templateSource?: string;
}) {
  const [isScanning, setIsScanning] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [accent, setAccent] = useState<string>(initialTemplate?.accent || BRAND_COLORS[0].value);
  const [previewUrl, setPreviewUrl] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState("");
  const [inView, setInView] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<StudioTemplatePreset | null>(initialTemplate);
  const rootRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const scanTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!initialTemplate) return;
    setActiveTemplate(initialTemplate);
    setAccent(initialTemplate.accent);
    rememberStudioTemplate(initialTemplate.slug);
  }, [initialTemplate]);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.2 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      if (scanTimer.current) window.clearTimeout(scanTimer.current);
    };
  }, []);

  function beginScan(file: File | undefined) {
    if (!file || isScanning) return;
    if (!file.type.startsWith("image/")) return;
    if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setIsGenerated(false);
    setIsScanning(true);
    const reader = new FileReader();
    reader.onload = () => {
      const value = typeof reader.result === "string" ? reader.result : "";
      setImageDataUrl(value.length <= 480000 ? value : "");
    };
    reader.readAsDataURL(file);
    if (scanTimer.current) window.clearTimeout(scanTimer.current);
    scanTimer.current = window.setTimeout(() => {
      setIsScanning(false);
      setIsGenerated(true);
    }, SCAN_MS);
  }

  function launch() {
    writeStorefrontDraft({
      accent,
      niche: activeTemplate?.slug || "plumbing",
      businessName: "",
      imageDataUrl,
    });
    onLaunch?.();
  }

  const showThumbCta = isGenerated && inView;
  const presets = allStudioTemplatePresets();

  return (
    <div
      ref={rootRef}
      id="studio"
      className={`relative isolate min-h-dvh overflow-hidden bg-transparent text-white ${embedded ? "scroll-mt-24" : ""} ${showThumbCta ? "pb-36" : "pb-28"}`}
    >
      {/* z-0 — film + DarkAxiom freeze constellation + neon fog (landing owns layer when embedded) */}
      {!embedded ? <AxiomParticleCanvasBackground fixed logoAnchor="header" atmosphere /> : null}

      {/* z-10 — glassmorphic foreground shell; clicks pass through atmosphere (pointer-events-none). */}
      <div className={`relative z-10 ${embedded ? "pt-24" : "pt-6 sm:pt-8"}`}>
        {activeTemplate ? (
          <div className="mx-auto mb-4 max-w-3xl px-4">
            <div className="flex items-start gap-3 rounded-2xl border border-[#34d399]/35 bg-[#050507]/90 px-4 py-3 shadow-[0_0_28px_rgba(52,211,153,0.18)] backdrop-blur-xl sm:px-5">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#34d399]" aria-hidden />
              <div className="min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#34d399]">
                  {templateSource === "proof_of_work" ? "Proof of work handoff" : "Template loaded"}
                </p>
                <p className="mt-1 text-sm leading-snug text-white/90">{activeTemplate.banner}</p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Title band overlays the object-top AXIOM watermark; upload sits below that band */}
        <div className="relative min-h-[min(28vh,240px)] px-6 pb-8 pt-4 text-center sm:min-h-[min(32vh,280px)] sm:pb-10 sm:pt-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#00f2fe]/90 drop-shadow-[0_0_18px_rgba(0,242,254,0.35)]">
            Axiom Studio
          </p>
          <h1 className="mt-3 bg-gradient-to-r from-white via-zinc-200 to-[#00f2fe] bg-clip-text text-3xl font-black tracking-tight text-transparent sm:text-4xl">
            {activeTemplate ? `Build from ${activeTemplate.name}` : "Launch Your 24/7 Niche Site"}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-zinc-400">
            {activeTemplate
              ? `${activeTemplate.heroTheme} hero, packages, booking calendar, and AI assistant are pre-structured. Drop your logo and brand it.`
              : "Drop your business logo to build your live automated booking site instantly."}
          </p>
        </div>

        {activeTemplate ? (
          <div className="relative mx-auto mb-8 max-w-3xl px-4">
            <div className="overflow-hidden rounded-3xl border border-cyan-500/25 bg-[#030712]/85 shadow-2xl shadow-cyan-500/10 backdrop-blur-2xl">
              <div className="relative aspect-[16/9] bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={activeTemplate.poster} alt="" className="absolute inset-0 h-full w-full object-cover" />
                {activeTemplate.preview ? (
                  <video
                    src={activeTemplate.preview}
                    muted
                    loop
                    playsInline
                    autoPlay
                    className="absolute inset-0 h-full w-full object-cover opacity-90"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-transparent to-transparent" />
                <span className="absolute left-3 top-3 rounded-full border border-white/15 bg-black/55 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-cyan-200 backdrop-blur">
                  {activeTemplate.heroTheme}
                </span>
              </div>
              <div className="grid gap-4 p-5 sm:grid-cols-2">
                <div>
                  <p className="mb-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-400">
                    <Layers3 className="h-3.5 w-3.5 text-[#00f2fe]" aria-hidden />
                    Page structure
                  </p>
                  <ul className="space-y-1.5">
                    {activeTemplate.sections.map((section) => (
                      <li key={section} className="text-sm text-zinc-200">
                        <span className="mr-2 text-[#00f2fe]">▸</span>
                        {section}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-400">
                    Included systems
                  </p>
                  <ul className="space-y-1.5">
                    {activeTemplate.features.map((feature) => (
                      <li key={feature} className="text-sm text-zinc-200">
                        <span className="mr-2 text-[#34d399]">●</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="relative mx-auto mb-8 max-w-3xl px-4">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-400">
            Swap proof-of-work preset
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {presets.map((preset) => {
              const selected = activeTemplate?.slug === preset.slug;
              return (
                <button
                  key={preset.slug}
                  type="button"
                  onClick={() => {
                    setActiveTemplate(preset);
                    setAccent(preset.accent);
                    rememberStudioTemplate(preset.slug);
                  }}
                  className={`rounded-xl border px-3 py-3 text-left transition ${
                    selected
                      ? "border-[#34d399]/60 bg-[#34d399]/10"
                      : "border-white/10 bg-white/5 hover:border-cyan-400/40"
                  }`}
                >
                  <span className="block text-sm font-semibold text-white">{preset.name}</span>
                  <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-400">
                    {preset.heroTheme}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Glass upload card — neon rim backlight floats behind (stage is z-0); card is z-10 */}
        <div className="relative mx-auto max-w-lg px-4">
          <div
            className="pointer-events-none absolute -inset-8 -z-10 rounded-[2rem] opacity-90 blur-2xl"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(52,211,153,0.35), rgba(6,182,212,0.2) 45%, transparent 70%)",
            }}
            aria-hidden
          />
          <div
            role="button"
            tabIndex={0}
            onClick={() => fileRef.current?.click()}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                fileRef.current?.click();
              }
            }}
            onDragEnter={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setDragging(false);
            }}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              beginScan(event.dataTransfer.files?.[0]);
            }}
            className={`cursor-pointer rounded-3xl border border-cyan-500/25 bg-[#030712]/85 p-8 text-center shadow-2xl shadow-cyan-500/15 backdrop-blur-2xl transition-all duration-300 md:p-12 hover:border-cyan-400 hover:shadow-cyan-500/30 ${
              dragging ? "border-cyan-400 shadow-cyan-500/40 scale-[1.01]" : ""
            }`}
          >
            {isScanning ? (
              <div className="space-y-3 py-8">
                <div
                  className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
                  style={{ borderColor: accent, borderTopColor: "transparent" }}
                />
                <p className="font-mono text-xs uppercase tracking-wider" style={{ color: accent }}>
                  Building Live Demo...
                </p>
              </div>
            ) : isGenerated && previewUrl ? (
              <img
                src={previewUrl}
                alt="Your business logo on the live demo"
                className="mx-auto block h-auto max-h-64 w-full object-contain"
              />
            ) : (
              <div className="space-y-4 py-4">
                <div
                  className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-500/35 bg-cyan-500/10 text-[#00f2fe] shadow-[0_0_24px_rgba(0,242,254,0.18)]"
                >
                  <Upload className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium text-zinc-100">Drop your business logo here</p>
                <span className="inline-block rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400">
                  Tap to select file
                </span>
              </div>
            )}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={(event) => {
              beginScan(event.target.files?.[0]);
              event.target.value = "";
            }}
          />

          <div className="mt-6 rounded-3xl border border-cyan-500/20 bg-[#030712]/80 p-5 shadow-xl shadow-cyan-500/10 backdrop-blur-2xl transition-all duration-300 hover:border-cyan-400/50 md:p-6">
            <p className="mb-3 block font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-400">
              Choose Your Brand Color
            </p>
            <div className="flex flex-wrap gap-3">
              {BRAND_COLORS.map((color) => {
                const selected = accent === color.value;
                return (
                  <button
                    key={color.value}
                    type="button"
                    aria-label={color.label}
                    aria-pressed={selected}
                    onClick={() => setAccent(color.value)}
                    className="h-11 w-11 rounded-full border-2 transition-all duration-300 hover:scale-110"
                    style={{
                      backgroundColor: color.value,
                      borderColor: selected ? "#ffffff" : "rgba(255,255,255,0.2)",
                      boxShadow: selected ? `0 0 16px ${color.value}` : undefined,
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {showThumbCta ? (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-cyan-500/20 bg-[#030712]/95 p-4 shadow-[0_-10px_30px_rgba(0,0,0,0.8)] backdrop-blur-xl"
        >
          <button
            type="button"
            onClick={launch}
            className="flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 text-sm font-black uppercase tracking-wider text-[#030712] transition-all duration-300 active:scale-[0.98]"
            style={{ backgroundColor: accent, boxShadow: `0 0 25px ${accent}66` }}
          >
            <span>Launch My Site — $1 Today</span>
            <ArrowRight className="h-4 w-4" />
          </button>
          <div className="mt-2 flex items-center justify-center gap-4 font-mono text-[10px] text-zinc-400">
            <span>Instant live preview</span>
            <span aria-hidden>·</span>
            <span>Cancel anytime</span>
          </div>
          <p className="mt-1 text-center text-[10px] leading-relaxed text-zinc-500">
            14-day trial, then $150/mo, cancel anytime in Admin Billing.
          </p>
        </motion.div>
      ) : null}
    </div>
  );
}
