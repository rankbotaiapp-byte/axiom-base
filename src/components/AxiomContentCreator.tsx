"use client";

import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  ACCENT_GLOWS,
  NICHE_TRADES,
  accentHex,
  defaultNicheConfig,
  readNicheConfigFromStorage,
  servicesForNiche,
  writeNicheConfigToStorage,
  type AccentGlowId,
  type NicheCustomizationConfig,
  type NicheTradeId,
} from "@/lib/axiom/niche-customization";
import { handleGenerationGuardHttpStatus } from "@/lib/axiom/generation-checkout-client";
import { DEFAULT_SHOP_SLUG } from "@/lib/axiom/storefront-layout";
import { writeStorefrontAccent, writeStorefrontDraft } from "@/lib/axiom/accent-color";
import { AXIOM_HUD_CYAN, AXIOM_VISUAL_LOCK } from "@/lib/axiom/visual-design";

void AXIOM_VISUAL_LOCK;

type SaveState = "idle" | "saving" | "saved" | "error";

function phoneDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return raw.trim() || "Add dispatch #";
}

function LiveStorefrontPreview({ config }: { config: NicheCustomizationConfig }) {
  const accent = ACCENT_GLOWS[config.accent];
  const activeServices = config.services.filter((s) => s.enabled).slice(0, 4);
  const tradeLabel = NICHE_TRADES.find((t) => t.id === config.niche)?.label ?? config.niche;

  return (
    <div
      className="axiom-glass relative overflow-hidden rounded-2xl border border-white/10 backdrop-blur-md"
      style={{
        boxShadow: `0 0 0 1px ${accent.glow}, 0 0 40px ${accent.glow}`,
      }}
    >
      {/* 3D hero portal mock */}
      <div className="relative aspect-[16/10] overflow-hidden bg-[#030712]">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background: `
              radial-gradient(ellipse 55% 50% at 50% 45%, ${accent.glow} 0%, transparent 62%),
              radial-gradient(ellipse 80% 60% at 50% 100%, rgba(3,7,18,0.9) 0%, #030712 70%)
            `,
          }}
        />
        <div
          className="pointer-events-none absolute left-1/2 top-[42%] h-[42%] w-[42%] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            border: `1px solid ${accent.hex}55`,
            boxShadow: `inset 0 0 40px ${accent.glow}, 0 0 28px ${accent.glow}`,
            background: `radial-gradient(circle at 40% 35%, ${accent.hex}22, transparent 60%)`,
          }}
        />
        <div className="absolute left-3 top-3 flex items-center gap-2">
          {config.logoUrl || config.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={config.logoUrl || config.avatarUrl}
              alt=""
              className="h-9 w-9 rounded-full border border-white/20 object-cover"
            />
          ) : (
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 font-mono text-[10px] text-white/70"
              style={{ background: `${accent.hex}18` }}
            >
              AX
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-white">{config.businessName || "Your shop"}</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em]" style={{ color: accent.hex }}>
              {tradeLabel} · live
            </p>
          </div>
        </div>
        <div className="absolute bottom-3 left-3 right-3">
          <p className="text-xs text-white/70">3D hero portal preview</p>
          <a
            href={config.dispatchPhone ? `tel:${config.dispatchPhone.replace(/\D/g, "")}` : undefined}
            className="mt-1 inline-flex min-h-9 items-center rounded-full border border-white/15 px-3 font-mono text-[11px] uppercase tracking-wider text-white"
            style={{ background: `${accent.hex}22`, borderColor: `${accent.hex}55` }}
          >
            Dispatch {phoneDisplay(config.dispatchPhone)}
          </a>
        </div>
        {/* Corner crosshairs */}
        <span className="pointer-events-none absolute left-2 top-2 h-3 w-3 border-l border-t border-white/25" />
        <span className="pointer-events-none absolute right-2 top-2 h-3 w-3 border-r border-t border-white/25" />
        <span className="pointer-events-none absolute bottom-2 left-2 h-3 w-3 border-b border-l border-white/25" />
        <span className="pointer-events-none absolute bottom-2 right-2 h-3 w-3 border-b border-r border-white/25" />
      </div>

      {/* Service action grid */}
      <div className="border-t border-white/10 p-3">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">
          Instant booking grid
        </p>
        <div className="grid grid-cols-2 gap-2">
          {activeServices.length === 0 ? (
            <p className="col-span-2 text-sm text-white/40">Enable at least one service package.</p>
          ) : (
            activeServices.map((svc) => (
              <button
                key={svc.id}
                type="button"
                className="axiom-glass rounded-xl border border-white/10 px-3 py-3 text-left backdrop-blur-md transition hover:border-white/25"
                style={{ boxShadow: `inset 0 0 20px ${accent.glow}` }}
              >
                <span className="block text-sm font-medium text-white">{svc.name}</span>
                <span className="mt-1 block font-mono text-[11px]" style={{ color: accent.hex }}>
                  {svc.priceLabel}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export type AxiomContentCreatorProps = {
  shopSlug?: string;
  businessName?: string;
  className?: string;
  compact?: boolean;
};

export default function AxiomContentCreator({
  shopSlug = DEFAULT_SHOP_SLUG,
  businessName,
  className = "",
  compact = false,
}: AxiomContentCreatorProps) {
  const formId = useId();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [config, setConfig] = useState<NicheCustomizationConfig>(() => ({
    ...defaultNicheConfig(shopSlug),
    businessName: businessName || defaultNicheConfig(shopSlug).businessName,
  }));
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveMessage, setSaveMessage] = useState("");
  const [uploading, setUploading] = useState<"logo" | "avatar" | null>(null);

  // Hydrate from localStorage once
  useEffect(() => {
    const saved = readNicheConfigFromStorage(shopSlug) ?? readNicheConfigFromStorage();
    if (saved) {
      setConfig({
        ...saved,
        shopSlug,
        businessName: businessName || saved.businessName,
      });
    } else if (businessName) {
      setConfig((c) => ({ ...c, shopSlug, businessName }));
    } else {
      setConfig((c) => ({ ...c, shopSlug }));
    }
  }, [shopSlug, businessName]);

  // Live sync → local storage + storefront accent draft (instant preview consumers)
  useEffect(() => {
    const next = { ...config, updatedAt: new Date().toISOString(), shopSlug };
    writeNicheConfigToStorage(next);
    const hex = accentHex(config.accent);
    writeStorefrontAccent(hex);
    writeStorefrontDraft({
      accent: hex,
      niche: config.niche,
      businessName: config.businessName,
      imageDataUrl: config.logoUrl.startsWith("data:image/") ? config.logoUrl : "",
    });
    try {
      window.dispatchEvent(
        new CustomEvent("axiom:niche-customization", { detail: next }),
      );
    } catch {
      /* ignore */
    }
  }, [config, shopSlug]);

  const patch = useCallback((partial: Partial<NicheCustomizationConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial, updatedAt: new Date().toISOString() }));
    setSaveState("idle");
  }, []);

  const setNiche = useCallback((niche: NicheTradeId) => {
    setConfig((prev) => ({
      ...prev,
      niche,
      services: servicesForNiche(niche),
      updatedAt: new Date().toISOString(),
    }));
    setSaveState("idle");
  }, []);

  const toggleService = useCallback((id: string) => {
    setConfig((prev) => ({
      ...prev,
      services: prev.services.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)),
      updatedAt: new Date().toISOString(),
    }));
    setSaveState("idle");
  }, []);

  const uploadAsset = useCallback(
    async (file: File, kind: "logo" | "avatar") => {
      setUploading(kind);
      try {
        // Prefer remote storage; fall back to object URL / data URL for instant preview
        const body = new FormData();
        body.append("file", file);
        body.append("slug", shopSlug);
        const res = await fetch("/api/storefront/assets", { method: "POST", body });
        if (await handleGenerationGuardHttpStatus(res.status, shopSlug)) return;
        const json = (await res.json().catch(() => null)) as
          | { ok?: boolean; url?: string | null; remote?: boolean }
          | null;

        if (json?.ok && json.url) {
          patch(kind === "logo" ? { logoUrl: json.url } : { avatarUrl: json.url });
          return;
        }

        const localUrl = URL.createObjectURL(file);
        patch(kind === "logo" ? { logoUrl: localUrl } : { avatarUrl: localUrl });
      } finally {
        setUploading(null);
      }
    },
    [patch, shopSlug],
  );

  const saveToSupabase = useCallback(async () => {
    setSaveState("saving");
    setSaveMessage("");
    const payload: NicheCustomizationConfig = {
      ...config,
      shopSlug,
      version: 1,
      updatedAt: new Date().toISOString(),
    };
    try {
      const res = await fetch("/api/storefront/niche", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (await handleGenerationGuardHttpStatus(res.status, shopSlug)) return;
      const json = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: string; target?: string; enforcedOwner?: boolean }
        | null;
      if (!res.ok || !json?.ok) {
        setSaveState("error");
        setSaveMessage(json?.error || "Save failed.");
        return;
      }
      writeNicheConfigToStorage(payload);
      setConfig(payload);
      setSaveState("saved");
      setSaveMessage(
        json.target === "local"
          ? "Saved locally — Supabase unavailable; will sync when connected."
          : json.enforcedOwner
            ? `Saved to ${json.target} (owner-scoped RLS).`
            : `Saved to ${json.target}.`,
      );
    } catch (err) {
      setSaveState("error");
      setSaveMessage(err instanceof Error ? err.message : "Network error.");
    }
  }, [config, shopSlug]);

  const accent = ACCENT_GLOWS[config.accent];

  const fieldClass =
    "mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-white/25";

  return (
    <section
      className={`axiom-glass rounded-2xl border border-white/10 backdrop-blur-md ${className}`}
      style={{ boxShadow: `0 0 0 1px ${accent.glow}` }}
      aria-labelledby={`${formId}-title`}
    >
      <div className={`grid gap-6 ${compact ? "p-4" : "p-5 sm:p-7"} lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]`}>
        {/* Controls */}
        <div className="space-y-6">
          <header>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: AXIOM_HUD_CYAN }}>
              Tenant layout board
            </p>
            <h2 id={`${formId}-title`} className="mt-1 font-display text-2xl text-white sm:text-3xl">
              Niche customization
            </h2>
            <p className="mt-2 max-w-xl text-sm text-white/55">
              Brand, trade packages, and accent glow for{" "}
              <span className="font-mono text-white/80">/{shopSlug}</span>. Changes preview live; deploy
              writes to Supabase tenant metadata under owner RLS.
            </p>
          </header>

          {/* Brand identity */}
          <div className="space-y-3">
            <h3 className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/50">
              Brand identity
            </h3>
            <label className="block">
              <span className="text-xs text-white/60">Business name</span>
              <input
                className={fieldClass}
                value={config.businessName}
                onChange={(e) => patch({ businessName: e.target.value.slice(0, 80) })}
                placeholder="Apex Plumbing"
                maxLength={80}
              />
            </label>
            <label className="block">
              <span className="text-xs text-white/60">Emergency dispatch phone</span>
              <input
                className={fieldClass}
                value={config.dispatchPhone}
                onChange={(e) => patch({ dispatchPhone: e.target.value.slice(0, 40) })}
                placeholder="(555) 010-2400"
                inputMode="tel"
                autoComplete="tel"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <span className="text-xs text-white/60">Logo URL or upload</span>
                <input
                  className={fieldClass}
                  value={config.logoUrl}
                  onChange={(e) => patch({ logoUrl: e.target.value })}
                  placeholder="https://…/logo.png"
                />
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void uploadAsset(f, "logo");
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploading === "logo"}
                  className="mt-2 inline-flex min-h-10 items-center rounded-full border border-white/15 px-3 text-xs text-white/80 transition hover:border-white/30 disabled:opacity-50"
                >
                  {uploading === "logo" ? "Uploading…" : "Upload logo"}
                </button>
              </div>
              <div>
                <span className="text-xs text-white/60">Avatar URL or upload</span>
                <input
                  className={fieldClass}
                  value={config.avatarUrl}
                  onChange={(e) => patch({ avatarUrl: e.target.value })}
                  placeholder="https://…/avatar.jpg"
                />
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void uploadAsset(f, "avatar");
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploading === "avatar"}
                  className="mt-2 inline-flex min-h-10 items-center rounded-full border border-white/15 px-3 text-xs text-white/80 transition hover:border-white/30 disabled:opacity-50"
                >
                  {uploading === "avatar" ? "Uploading…" : "Upload avatar"}
                </button>
              </div>
            </div>
          </div>

          {/* Niche selector */}
          <div className="space-y-3">
            <h3 className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/50">
              Niche service selector
            </h3>
            <div className="flex flex-wrap gap-2">
              {NICHE_TRADES.map((trade) => {
                const on = config.niche === trade.id;
                return (
                  <button
                    key={trade.id}
                    type="button"
                    onClick={() => setNiche(trade.id)}
                    className="min-h-10 rounded-full border px-3.5 text-sm transition"
                    style={
                      on
                        ? {
                            borderColor: accent.hex,
                            color: accent.hex,
                            background: `${accent.hex}18`,
                            boxShadow: `0 0 16px ${accent.glow}`,
                          }
                        : { borderColor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)" }
                    }
                  >
                    {trade.label}
                  </button>
                );
              })}
            </div>
            <ul className="space-y-2">
              {config.services.map((svc) => (
                <li
                  key={svc.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/25 px-3 py-2.5"
                >
                  <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={svc.enabled}
                      onChange={() => toggleService(svc.id)}
                      className="h-4 w-4 rounded border-white/20"
                      style={{ accentColor: accent.hex }}
                    />
                    <span className="truncate text-sm text-white">{svc.name}</span>
                  </label>
                  <span className="shrink-0 font-mono text-[11px]" style={{ color: accent.hex }}>
                    {svc.priceLabel}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Theme / accent */}
          <div className="space-y-3">
            <h3 className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/50">
              Theme & accent glow
            </h3>
            <div className="grid gap-2 sm:grid-cols-3">
              {(Object.keys(ACCENT_GLOWS) as AccentGlowId[]).map((id) => {
                const swatch = ACCENT_GLOWS[id];
                const on = config.accent === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => patch({ accent: id })}
                    className="rounded-xl border px-3 py-3 text-left transition"
                    style={{
                      borderColor: on ? swatch.hex : "rgba(255,255,255,0.12)",
                      boxShadow: on ? `0 0 20px ${swatch.glow}` : undefined,
                      background: on ? `${swatch.hex}14` : "rgba(0,0,0,0.25)",
                    }}
                  >
                    <span
                      className="mb-2 block h-3 w-3 rounded-full"
                      style={{ background: swatch.hex, boxShadow: `0 0 10px ${swatch.hex}` }}
                    />
                    <span className="block text-sm text-white">{swatch.label}</span>
                    <span className="mt-0.5 block font-mono text-[10px] text-white/45">{swatch.hex}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={() => void saveToSupabase()}
              disabled={saveState === "saving"}
              className="inline-flex min-h-11 items-center rounded-full px-5 text-sm font-semibold text-[#030712] transition disabled:opacity-60"
              style={{ background: accent.hex, boxShadow: `0 0 24px ${accent.glow}` }}
            >
              {saveState === "saving" ? "Saving…" : "Save to tenant DB"}
            </button>
            {saveMessage ? (
              <p
                className={`text-sm ${saveState === "error" ? "text-rose-300" : "text-white/60"}`}
                role="status"
              >
                {saveMessage}
              </p>
            ) : saveState === "saved" ? (
              <p className="text-sm text-emerald-300/90" role="status">
                Stored.
              </p>
            ) : (
              <p className="text-sm text-white/40">Preview updates instantly · save persists metadata</p>
            )}
          </div>
        </div>

        {/* Live preview */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">
            Live storefront preview
          </p>
          <LiveStorefrontPreview config={config} />
        </div>
      </div>
    </section>
  );
}

/** Optional listener hook for pages that mirror niche state into hero/grid. */
export function useNicheCustomizationSync(
  onChange?: (config: NicheCustomizationConfig) => void,
): NicheCustomizationConfig | null {
  const [cfg, setCfg] = useState<NicheCustomizationConfig | null>(null);

  useEffect(() => {
    const initial = readNicheConfigFromStorage();
    if (initial) {
      setCfg(initial);
      onChange?.(initial);
    }
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<NicheCustomizationConfig>).detail;
      if (!detail) return;
      setCfg(detail);
      onChange?.(detail);
    };
    window.addEventListener("axiom:niche-customization", handler);
    return () => window.removeEventListener("axiom:niche-customization", handler);
  }, [onChange]);

  return cfg;
}

export { LiveStorefrontPreview };
