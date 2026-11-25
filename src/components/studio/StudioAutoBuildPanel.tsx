"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Loader2, Monitor, Smartphone, Sparkles, Upload } from "lucide-react";
import { handleGenerationGuardHttpStatus } from "@/lib/axiom/generation-checkout-client";
import { animateRecreatedBackground } from "@/components/axiom/studioRemake";
import { INLAY_PRESETS, MOTION_PRESETS, microMotionForNiche, type InlayPresetId, type MotionPresetId } from "@/lib/axiom/storefront-themes";
import {
  buildLayoutConfig,
  INITIAL_SLOTS,
  readLayoutFromStorage,
  STOREFRONT_LAYOUT_STORAGE_KEY,
  type LayoutSlot,
  type UploadedAsset,
  writeLayoutToStorage,
} from "@/lib/axiom/storefront-layout";
import {
  cinemagraphPresetForNiche,
  readAtmosphereEnabled,
  writeAtmosphereEnabled,
} from "@/lib/axiom/storefront-atmosphere";
import {
  NICHE_HERO_LOOP_OPTIONS,
  STOREFRONT_THEME_IDS,
  STOREFRONT_THEME_STORAGE_KEY,
  STOREFRONT_THEMES,
  STUDIO_ARCHETYPE_PRESETS,
  themeCssVars,
  type StorefrontThemeId,
} from "@/lib/axiom/storefront-themes";
import { resolveDemoLoop } from "@/lib/axiom/branded-demo-loop";
import { CinematicLoop, CinematicMediaFrame } from "@/components/studio/CinematicMediaFrame";
import { HudGlassPanel, HudMeter, HudSectionTitle } from "@/components/studio/ObsidianHudChrome";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import "./obsidian-hud-studio.css";

const SLOT_KEYS = ["heroFocal", "service1", "service2", "service3"] as const;
type SlotKey = (typeof SLOT_KEYS)[number];

const SLOT_LABELS: Record<SlotKey, string> = {
  heroFocal: "Hero Focal",
  service1: "Service 1",
  service2: "Service 2",
  service3: "Service 3",
};

type SlotDraft = {
  file?: File;
  previewUrl: string;
  remoteUrl: string;
};

export function StudioAutoBuildPanel({
  shopSlug,
  shopName,
  niche = "contractor",
  readonly = false,
  previewHref,
  embedInShell = false,
}: {
  shopSlug: string;
  shopName: string;
  niche?: string;
  readonly?: boolean;
  previewHref?: string;
  /** When false, panel assumes parent already applied AxiomStudioHudShell chrome. */
  embedInShell?: boolean;
}) {
  const [themeId, setThemeId] = useState<StorefrontThemeId>("cyber_cyan");
  const [heroLoop, setHeroLoop] = useState<string>(() => resolveDemoLoop(niche));
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [slots, setSlots] = useState<Record<SlotKey, SlotDraft>>({
    heroFocal: { previewUrl: "", remoteUrl: "" },
    service1: { previewUrl: "", remoteUrl: "" },
    service2: { previewUrl: "", remoteUrl: "" },
    service3: { previewUrl: "", remoteUrl: "" },
  });
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [atmosphereEnabled, setAtmosphereEnabled] = useState(false);
  const [heroMotionUrl, setHeroMotionUrl] = useState("");
  const [motionBusy, setMotionBusy] = useState(false);
  const [inlay, setInlay] = useState<InlayPresetId>("surface");
  const [motionPreset, setMotionPreset] = useState<MotionPresetId>(() => microMotionForNiche(niche));

  useEffect(() => {
    setAtmosphereEnabled(readAtmosphereEnabled(shopSlug));
  }, [shopSlug]);

  useEffect(() => {
    setMotionPreset(microMotionForNiche(niche));
  }, [niche]);

  const cinemagraphPreset = useMemo(() => cinemagraphPresetForNiche(niche), [niche]);

  const themeVars = useMemo(() => themeCssVars(themeId), [themeId]);
  const livePreview = previewHref || `/${shopSlug}`;
  const theme = STOREFRONT_THEMES[themeId];

  const filledSlots = SLOT_KEYS.filter((k) => Boolean(slots[k].previewUrl || slots[k].remoteUrl)).length;
  const completion = Math.round(((filledSlots + 2) / (SLOT_KEYS.length + 2)) * 100);

  const onAtmosphereToggle = useCallback(
    (next: boolean) => {
      if (readonly) return;
      setAtmosphereEnabled(next);
      writeAtmosphereEnabled(shopSlug, next);
      const layout = readLayoutFromStorage();
      if (layout?.shopSlug === shopSlug.trim().toLowerCase()) {
        writeLayoutToStorage({
          ...layout,
          atmosphereEnabled: next,
          cinemagraphPreset,
          updatedAt: new Date().toISOString(),
        });
      }
    },
    [cinemagraphPreset, readonly, shopSlug],
  );

  const onFile = useCallback((key: SlotKey, file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    const previewUrl = URL.createObjectURL(file);
    setSlots((prev) => ({
      ...prev,
      [key]: { file, previewUrl, remoteUrl: "" },
    }));
  }, []);

  async function uploadSlot(key: SlotKey, draft: SlotDraft): Promise<string> {
    if (draft.remoteUrl) return draft.remoteUrl;
    if (!draft.file) return "";
    const body = new FormData();
    body.append("file", draft.file);
    body.append("slug", shopSlug);
    const res = await fetch("/api/storefront/assets", { method: "POST", body });
    if (await handleGenerationGuardHttpStatus(res.status, shopSlug)) {
      throw new Error("Sign in or start trial to continue.");
    }
    const json = (await res.json().catch(() => ({}))) as { ok?: boolean; url?: string | null };
    if (res.ok && json.ok && json.url) return json.url;
    return "";
  }

  async function animateHeroBackground() {
    const src = slots.heroFocal.remoteUrl;
    if (!/^https:\/\//i.test(src)) {
      setError("Remake an uploaded photo first, then animate its background.");
      return;
    }
    setMotionBusy(true);
    setError("");
    try {
      const videoUrl = await animateRecreatedBackground({
        imageUrl: src,
        shopSlug,
        niche,
        shopName,
        brandColor: theme.brandPrimary,
        motion: motionPreset,
      });
      setHeroMotionUrl(videoUrl);
      setAtmosphereEnabled(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Background motion failed");
    } finally {
      setMotionBusy(false);
    }
  }

  async function createFullSite() {
    if (readonly) {
      setError("Preview desk — switch to owner mode to deploy.");
      return;
    }
    setBusy(true);
    setError("");
    setStatus("Uploading job plates…");
    try {
      const uploaded: Partial<Record<SlotKey, string>> = {};
      for (const key of SLOT_KEYS) {
        const url = await uploadSlot(key, slots[key]);
        if (url) uploaded[key] = url;
      }

      const jobs: {
        mode: "proof_touchup";
        shopSlug: string;
        slotLabel: string;
        sourceImageUrl: string;
        niche: string;
        shopName: string;
        brandColor: string;
        inlay: InlayPresetId;
      }[] = [];

      for (const key of SLOT_KEYS) {
        const label = SLOT_LABELS[key];
        const url = uploaded[key];
        if (url && /^https:\/\//i.test(url) && !url.includes("/studio/cache/proof-")) {
          jobs.push({
            mode: "proof_touchup",
            shopSlug,
            slotLabel: label,
            sourceImageUrl: url,
            niche,
            shopName,
            brandColor: theme.brandPrimary,
            inlay,
          });
        }
      }

      setStatus(jobs.length ? "Running Axiom slot generation…" : "Building layout…");

      const generated: string[] = [];
      if (jobs.length) {
        const res = await fetch("/api/studio/slot-generate", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ batch: true, shopSlug, niche, shopName, themeId, jobs }),
        });
        if (await handleGenerationGuardHttpStatus(res.status, shopSlug)) return;
        const json = (await res.json().catch(() => ({}))) as {
          results?: { imageUrl?: string }[];
          error?: string;
          partial?: { imageUrl?: string }[];
        };
        if (!res.ok) throw new Error(json.error || "Slot generation did not finish.");
        const rows = json.results ?? json.partial ?? [];
        for (const row of rows) {
          if (row?.imageUrl) generated.push(row.imageUrl);
        }
        setSlots((prev) => {
          const next = { ...prev };
          let index = 0;
          for (const key of SLOT_KEYS) {
            const url = uploaded[key];
            const remade = url && /^https:\/\//i.test(url) ? generated[index++] : "";
            if (remade) next[key] = { ...prev[key], remoteUrl: remade, previewUrl: remade };
          }
          return next;
        });
      }

      const heroUrl = generated[0] || uploaded.heroFocal || heroLoop;
      const loop = heroLoop;
      const assets: UploadedAsset[] = Object.entries(uploaded)
        .filter(([, url]) => Boolean(url))
        .map(([key, url]) => ({
          id: `asset_${key}`,
          name: SLOT_LABELS[key as SlotKey],
          url: url!,
          mime: "image/webp",
          remote: url!.startsWith("http"),
          createdAt: new Date().toISOString(),
        }));

      const layoutSlots: LayoutSlot[] = INITIAL_SLOTS.map((slot) => {
        if (slot.id === "slot-hero") return { ...slot, assignedAsset: loop, status: "Optimized" as const };
        if (slot.id === "slot-pow") return { ...slot, assignedAsset: generated[1] || heroUrl, status: "Assigned" as const };
        return slot;
      });

      const config = buildLayoutConfig({
        shopSlug,
        background: {
          id: `theme-${themeId}`,
          name: theme.label,
          videoUrl: loop,
          previewColor: "from-[#050507] to-[#050507]",
        },
        activeTradeId: "cutting",
        slots: layoutSlots,
        assets,
        atmosphereEnabled,
        cinemagraphPreset,
      });

      writeLayoutToStorage(config);
      writeAtmosphereEnabled(shopSlug, atmosphereEnabled);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STOREFRONT_THEME_STORAGE_KEY, themeId);
      }

      const layoutRes = await fetch("/api/storefront/layout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(config),
      });
      const layoutJson = (await layoutRes.json().catch(() => ({}))) as { ok?: boolean };
      if (layoutRes.status === 409) setStatus("Layout saved locally — complete remaining slots to deploy remote.");
      else if (!layoutRes.ok || !layoutJson.ok) setStatus("Preview updated locally. Remote sync pending.");
      else setStatus("Storefront deployed — live preview is updating.");

      window.open(livePreview, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Auto-build did not finish.");
    } finally {
      setBusy(false);
    }
  }

  const rootClass = embedInShell ? "w-full" : "axiom-studio-hud rounded-2xl p-1";

  return (
    <section className={rootClass} style={themeVars as CSSProperties}>
      <div className="grid gap-4 xl:grid-cols-[minmax(280px,360px)_1fr] xl:items-start">
        {/* —— Control rail —— */}
        <HudGlassPanel className="space-y-5">
          <HudSectionTitle
            kicker="1-Click Branding &amp; Assets"
            title="Studio Control Panel"
            subtitle="Palette, hero loop, job photos, and Axiom slot generation."
          />

          <HudMeter label="Site build completion" percent={completion} />

          <ul className="flex flex-wrap gap-2">
            <CheckChip ok label="Niche preset analyzed" />
            <CheckChip ok={Boolean(heroLoop)} label="3D Hero Slot 1 (Video)" />
            <CheckChip ok={filledSlots >= 1} label="Service cards Slot 2" />
            <CheckChip ok={false} label="AI booking integration" />
            <CheckChip ok={atmosphereEnabled} label="Living atmosphere FX" />
          </ul>

          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-white/12 bg-white/[0.02] px-3 py-2.5 backdrop-blur-md">
            <span className="text-left">
              <span className="block text-[11px] font-semibold text-white">Enable Living Atmosphere &amp; Cinemagraph FX</span>
              <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-[0.12em] text-white/45">
                Scroll embers + still micro-motion · {cinemagraphPreset.replace("_", " ")}
              </span>
            </span>
            <input
              type="checkbox"
              className="h-5 w-5 accent-[var(--brand-primary)]"
              checked={atmosphereEnabled}
              disabled={readonly || busy}
              onChange={(e) => onAtmosphereToggle(e.target.checked)}
            />
          </label>

          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/45">Archetype templates</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {STUDIO_ARCHETYPE_PRESETS.map((preset) => {
                const active = themeId === preset.themeId;
                const swatch = STOREFRONT_THEMES[preset.themeId];
                return (
                  <button
                    key={preset.themeId}
                    type="button"
                    disabled={readonly || busy}
                    onClick={() => setThemeId(preset.themeId)}
                    className={cn(
                      "rounded-lg border p-2 text-left backdrop-blur-md transition",
                      active
                        ? "border-[color-mix(in_srgb,var(--brand-primary)_65%,transparent)] bg-white/[0.05] shadow-[0_0_22px_color-mix(in_srgb,var(--brand-primary)_22%,transparent)]"
                        : "border-white/10 bg-white/[0.02] hover:border-white/20",
                    )}
                  >
                    <div
                      className="h-10 rounded-md"
                      style={{
                        background: `linear-gradient(135deg, ${swatch.brandPrimary}, ${swatch.brandSecondary})`,
                      }}
                    />
                    <p className="mt-1 text-[11px] font-semibold text-white">{preset.label}</p>
                    <p className="text-[9px] text-white/45">{preset.accent}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/45">Brand theme — 8 swatches</p>
            <div className="mt-2 grid grid-cols-4 gap-1.5">
              {STOREFRONT_THEME_IDS.map((id) => {
                const t = STOREFRONT_THEMES[id];
                const active = themeId === id;
                return (
                  <button
                    key={id}
                    type="button"
                    disabled={readonly || busy}
                    title={t.label}
                    onClick={() => setThemeId(id)}
                    className={cn(
                      "h-8 rounded-md border transition",
                      active ? "border-[var(--brand-primary)] ring-1 ring-[var(--brand-glow)]/40" : "border-white/10",
                    )}
                    style={{ background: `linear-gradient(135deg, ${t.brandPrimary}, ${t.brandSecondary})` }}
                  />
                );
              })}
            </div>
            <p className="mt-2 text-xs text-white/55">
              Emergency <span className="text-[var(--brand-primary)]">{theme.label}</span> &amp;{" "}
              <span className="text-[var(--brand-secondary)]">{theme.brandSecondary}</span>
            </p>
          </div>

          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/45">Hero MP4 loop</p>
            <div className="mt-2 max-h-32 space-y-1 overflow-y-auto pr-1">
              {NICHE_HERO_LOOP_OPTIONS.map((loop) => (
                <button
                  key={loop.id}
                  type="button"
                  disabled={readonly || busy}
                  onClick={() => setHeroLoop(loop.url)}
                  className={cn(
                    "w-full rounded-md border px-2 py-1.5 text-left text-[11px] transition",
                    heroLoop === loop.url
                      ? "border-[var(--brand-primary)]/50 bg-white/[0.04] text-white"
                      : "border-white/10 text-white/55 hover:border-white/25",
                  )}
                >
                  {loop.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/45">Slots composer</p>
            <label
              className={cn(
                "mt-2 flex min-h-[72px] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-white/20 bg-white/[0.02] px-3 py-3 text-center backdrop-blur-md transition hover:border-[var(--brand-primary)]/45",
                readonly && "pointer-events-none opacity-60",
              )}
            >
              <Upload className="mb-1 h-4 w-4 text-[var(--brand-primary)]" />
              <span className="text-[11px] text-white/70">Drop job photos for Hero + Service 1–3</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                disabled={readonly || busy}
                onChange={(e) => {
                  Array.from(e.target.files ?? [])
                    .slice(0, 4)
                    .forEach((file, index) => {
                      const key = SLOT_KEYS[index];
                      if (key) onFile(key, file);
                    });
                }}
              />
            </label>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {SLOT_KEYS.map((key) => (
                <p key={key} className="truncate font-mono text-[8px] uppercase tracking-[0.14em] text-white/40">
                  {SLOT_LABELS[key]}
                  {slots[key].previewUrl || slots[key].remoteUrl ? " · assigned" : ""}
                </p>
              ))}
            </div>
          </div>

          <button
            type="button"
            disabled={readonly || busy}
            onClick={() => void createFullSite()}
            className="axiom-hud-cta-primary inline-flex w-full min-h-11 items-center justify-center gap-2 px-4 py-3"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Generate / Refresh with Axiom AI
          </button>
          {status ? <p className="text-xs text-emerald-300/90">{status}</p> : null}
          {error ? <p className="text-xs text-red-300">{error}</p> : null}
        </HudGlassPanel>

        {/* —— Interactive preview —— */}
        <HudGlassPanel className="min-h-[520px]">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <HudSectionTitle
              className="mb-0 flex-1"
              kicker="Interactive split-screen web preview"
              title={shopName}
              subtitle="Desktop and mobile framing with live slot badges."
            />
            <button
              type="button"
              className="axiom-hud-cta-primary shrink-0 min-h-10 px-5 py-2"
              onClick={() => window.open(livePreview, "_blank", "noopener,noreferrer")}
            >
              Publish live to the web
            </button>
          </div>

          <div className="mb-3 flex flex-wrap items-center gap-2">
            <PreviewToggle active={previewMode === "desktop"} onClick={() => setPreviewMode("desktop")} icon={Monitor} label="Desktop" />
            <PreviewToggle active={previewMode === "mobile"} onClick={() => setPreviewMode("mobile")} icon={Smartphone} label="Mobile" />
          </div>

          <div
            className={cn(
              "axiom-hud-preview-chrome mx-auto overflow-hidden p-3 transition-all",
              previewMode === "mobile" ? "max-w-[390px]" : "w-full",
            )}
          >
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="axiom-hud-slot-badge">Slot 1 · Looping hero video / MP4</span>
              <span className="text-[10px] text-white/40">Double-click copy on live site</span>
            </div>
            <CinematicLoop src={heroLoop} themeId={themeId} className="aspect-video w-full" />
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(["service1", "service2", "service3"] as const).map((key, i) => {
                const src = slots[key].previewUrl || slots[key].remoteUrl;
                return (
                  <div key={key} className="space-y-1">
                    <span className={cn("axiom-hud-slot-badge", i === 0 && "axiom-hud-slot-badge--gold")}>
                      Slot 2 · {SLOT_LABELS[key]}
                    </span>
                    <CinematicMediaFrame
                      themeId={themeId}
                      className="aspect-square w-full"
                      ambientOverlay={atmosphereEnabled}
                      ambientPreset={cinemagraphPreset}
                      niche={niche}
                    >
                      {src ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={src} alt={SLOT_LABELS[key]} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex aspect-square items-center justify-center text-[9px] uppercase tracking-[0.12em] text-white/35">
                          Empty
                        </div>
                      )}
                    </CinematicMediaFrame>
                  </div>
                );
              })}
              <div className="space-y-1">
                <span className="axiom-hud-slot-badge">Hero still</span>
                <CinematicMediaFrame
                  themeId={themeId}
                  className="aspect-square w-full"
                  ambientOverlay={atmosphereEnabled}
                  ambientPreset={cinemagraphPreset}
                  niche={niche}
                >
                  {heroMotionUrl ? (
                    <video
                      src={heroMotionUrl}
                      poster={slots.heroFocal.previewUrl || slots.heroFocal.remoteUrl}
                      muted
                      loop
                      autoPlay
                      playsInline
                      className="h-full w-full object-cover"
                    />
                  ) : slots.heroFocal.previewUrl || slots.heroFocal.remoteUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={slots.heroFocal.previewUrl || slots.heroFocal.remoteUrl}
                      alt="Hero focal"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-square items-center justify-center text-[9px] text-white/35">Focal</div>
                  )}
                </CinematicMediaFrame>
                <label className="mt-1 flex items-center gap-1 text-[10px] text-white/55">
                  Inlay
                  <select
                    value={inlay}
                    onChange={(event) => setInlay(event.target.value as InlayPresetId)}
                    className="min-w-0 flex-1 rounded border border-white/15 bg-black/40 px-1 py-1 text-[10px] text-white"
                  >
                    {INLAY_PRESETS.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.label}
                      </option>
                    ))}
                  </select>
                </label>
                {/^https:\/\//i.test(slots.heroFocal.remoteUrl) ? (
                  <div className="mt-1 flex gap-1">
                    <select
                      aria-label="Background motion"
                      value={motionPreset}
                      onChange={(event) => setMotionPreset(event.target.value as MotionPresetId)}
                      className="min-w-0 flex-1 rounded border border-white/15 bg-black/40 px-1 py-1 text-[10px] text-white"
                    >
                      {MOTION_PRESETS.map((preset) => (
                        <option key={preset.id} value={preset.id}>
                          {preset.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="rounded border border-white/15 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-white/80"
                      disabled={motionBusy}
                      onClick={() => void animateHeroBackground()}
                    >
                      {motionBusy ? "…" : "Animate Background"}
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </HudGlassPanel>
      </div>
    </section>
  );
}

function CheckChip({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em]",
        ok ? "axiom-hud-check-ok" : "axiom-hud-check-pending",
      )}
    >
      {ok ? <Check className="h-3 w-3" /> : <span className="opacity-60">+</span>}
      {label}
    </li>
  );
}

function PreviewToggle({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Monitor;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] transition",
        active
          ? "border-[var(--brand-primary)]/55 bg-white/[0.05] text-[var(--brand-glow)]"
          : "border-white/15 text-white/45 hover:border-white/30",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}