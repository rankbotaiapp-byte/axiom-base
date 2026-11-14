"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { ensureFunnelSession } from "@/lib/axiom/master";
import { leadSlugFrom, rememberLandingPlan } from "@/lib/axiom/funnel";
import { plumbingCheckoutRedirect } from "@/lib/axiom/plumbing-checkout";
import { startTenantStorefrontCheckout } from "@/lib/axiom/tenant-billing.functions";
import { sanitizeAccent, sanitizeLogoUrl } from "@/lib/axiom/prospect-brand";
import { cn } from "@/lib/utils";
import "./obsidian-studio-widget.css";

export const STUDIO_BRAND_KEY = "axiom.studio.brand";

const TRADES = [
  { id: "plumbing", label: "Plumbing", video: "/media/axio-plumber-hero.mp4", poster: "/media/axio-plumber-hero.jpg", still: "/media/van.png" },
  { id: "hvac", label: "HVAC", video: "/media/infrastructure-hero-animation.mp4", poster: "/media/hvac.png", still: "/media/hvac.png" },
  { id: "electrical", label: "Electrical", video: "/media/electrician-hero-animation.mp4", poster: "/media/axio-plumber-hero.jpg", still: "/media/van.png" },
] as const;

const SWATCHES = ["#00F2FE", "#38C8FF", "#00FFCC", "#FF7A1A"] as const;

type TradeId = (typeof TRADES)[number]["id"];

export type StudioBrandPack = {
  businessName: string;
  trade: TradeId;
  logoUrl: string;
  accent: string;
};

function persistBrand(pack: StudioBrandPack) {
  try {
    sessionStorage.setItem(STUDIO_BRAND_KEY, JSON.stringify(pack));
    sessionStorage.setItem(
      "axiom.lead",
      JSON.stringify({
        leadSlug: leadSlugFrom(pack.businessName, pack.trade),
        utmSource: "studio-hud",
        county: "",
        tradeType: pack.trade,
      }),
    );
  } catch {
    /* private mode */
  }
}

function HudFrame() {
  return (
    <>
      <span className="obsidian-studio-notch" aria-hidden />
      <div className="obsidian-studio-bezel" aria-hidden>
        <span className="obsidian-studio-bezel-sw" />
        <span className="obsidian-studio-bezel-se" />
      </div>
    </>
  );
}

export function ObsidianStudioWidget({ className }: { className?: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [businessName, setBusinessName] = useState("Apex Plumbing");
  const [trade, setTrade] = useState<TradeId>("plumbing");
  const [accent, setAccent] = useState<string>(SWATCHES[0]);
  const [logoUrl, setLogoUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const niche = TRADES.find((row) => row.id === trade) ?? TRADES[0];
  const name = businessName.trim() || "Your shop";
  const filled = [businessName.trim(), trade, logoUrl, accent].filter(Boolean).length;
  const progress = Math.min(99, 36 + filled * 16);

  useEffect(() => {
    persistBrand({ businessName: name, trade, logoUrl, accent });
  }, [name, trade, logoUrl, accent]);

  const overlayStyle = useMemo(
    () => ({ color: sanitizeAccent(accent) || "var(--color-hud)", textShadow: `0 0 24px ${accent}` }),
    [accent],
  );

  function onLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 1_500_000) {
      setError("Logo must be under 1.5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const url = typeof reader.result === "string" ? reader.result : "";
      setLogoUrl(url);
      setError(null);
    };
    reader.readAsDataURL(file);
  }

  async function claim() {
    const brand: StudioBrandPack = { businessName: name, trade, logoUrl: sanitizeLogoUrl(logoUrl) || logoUrl, accent };
    const slug = leadSlugFrom(brand.businessName, brand.trade);
    if (slug.length < 3) {
      setError("Enter a business name to claim the page.");
      return;
    }
    setBusy(true);
    setError(null);
    persistBrand(brand);
    rememberLandingPlan("trial");
    try {
      await ensureFunnelSession().catch(() => undefined);
      const started = await startTenantStorefrontCheckout({
        data: {
          leadSlug: slug,
          planId: "trial",
          namedPriceDollars: "1",
          businessName: brand.businessName,
          tradeType: brand.trade,
          niche: brand.trade,
          logoUrl: brand.logoUrl.startsWith("data:") ? "" : brand.logoUrl,
          accent: brand.accent,
        },
      });
      window.location.assign(plumbingCheckoutRedirect(started));
    } catch (err) {
      setBusy(false);
      setError(err instanceof Error ? err.message : "Checkout did not start");
    }
  }

  return (
    <section id="build-brand-buy" className={cn("obsidian-studio px-3 py-10 sm:px-6 sm:py-16", className)} aria-label="Build, Brand and Buy">
      <div className="obsidian-studio-stage mx-auto w-full max-w-6xl">
        <div className="obsidian-studio-plate px-4 py-8 sm:px-8 sm:py-10">
          <HudFrame />
          <header className="relative z-10 mb-6 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-hud/80">Build · Brand · Buy</p>
            <h2 className="mt-2 font-display text-2xl uppercase tracking-[0.18em] text-hud sm:text-4xl">Build your brand</h2>
          </header>

          <div className="relative z-10 grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)_minmax(0,0.95fr)]">
            <div className="obsidian-studio-panel flex flex-col gap-3 rounded-lg p-4">
              <label className="block font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                Business name
                <input
                  className="obsidian-studio-field mt-1.5"
                  value={businessName}
                  onChange={(event) => setBusinessName(event.target.value.slice(0, 80))}
                  autoComplete="organization"
                />
              </label>
              <label className="block font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                Trade
                <select className="obsidian-studio-field mt-1.5" value={trade} onChange={(event) => setTrade(event.target.value as TradeId)}>
                  {TRADES.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.label}
                    </option>
                  ))}
                </select>
              </label>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Upload logo</p>
                <button type="button" className="obsidian-studio-field mt-1.5 text-left text-mist" onClick={() => fileRef.current?.click()}>
                  {logoUrl ? "Logo locked in — tap to replace" : "Choose mark"}
                </button>
                <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={onLogo} />
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Color scheme</p>
                <div className="mt-2 flex gap-2">
                  {SWATCHES.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      aria-label={`Accent ${hex}`}
                      onClick={() => setAccent(hex)}
                      className={cn(
                        "h-11 w-11 rounded-sm border",
                        accent === hex ? "border-hud shadow-[0_0_12px_var(--color-hud)]" : "border-line",
                      )}
                      style={{ background: hex }}
                    />
                  ))}
                </div>
              </div>
              <div className="mt-auto pt-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-hud">Generation status: {progress}% complete</p>
                <div className="obsidian-studio-bar mt-2" aria-hidden>
                  <span style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="obsidian-studio-panel overflow-hidden rounded-lg">
                <p className="px-3 py-2 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
                  Preview: {name}
                </p>
                <div className="relative aspect-video overflow-hidden bg-abyss">
                  <video
                    key={niche.video}
                    className="h-full w-full object-cover"
                    src={niche.video}
                    poster={niche.poster}
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                  <div className="obsidian-studio-scan absolute inset-0" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-obsidian/20">
                    {logoUrl ? (
                      <img src={logoUrl} alt="" className="h-14 w-auto max-w-[40%] object-contain" />
                    ) : null}
                    <p className="px-4 text-center font-display text-2xl uppercase tracking-[0.2em] sm:text-4xl" style={overlayStyle}>
                      {name}
                    </p>
                  </div>
                </div>
                <div className="space-y-1 px-3 py-2">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">Your branded animated hero (MP4)</p>
                  <div className="obsidian-studio-bar">
                    <span style={{ width: `${progress}%` }} />
                  </div>
                </div>
              </div>

              <div className="obsidian-studio-panel flex items-center justify-between gap-3 rounded-lg px-3 py-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">Your branded still image (JPG)</p>
                <div className="relative w-36 shrink-0 sm:w-44">
                  <img src={niche.still} alt="" className="h-16 w-full object-contain sm:h-20" />
                  <span
                    className="absolute inset-x-1 bottom-1 truncate text-center font-display text-[10px] uppercase tracking-[0.14em]"
                    style={overlayStyle}
                  >
                    {name}
                  </span>
                </div>
              </div>
            </div>

            <div className="obsidian-studio-panel flex flex-col justify-between gap-4 rounded-lg p-4">
              <div>
                <h3 className="text-center font-display text-lg uppercase tracking-[0.16em] text-hud">Deploy your branded page</h3>
                <p className="mt-3 text-center text-sm leading-relaxed text-muted">
                  Live storefront with your name, mark, and {niche.label} reel. Stripe provisions the tenant the moment the card clears.
                </p>
              </div>
              <button type="button" className="obsidian-studio-claim rounded-md px-4 py-3 text-sm uppercase leading-tight" disabled={busy} onClick={() => void claim()}>
                {busy ? "Opening Stripe…" : "Claim your live page for $1 trial ($150/mo after)"}
              </button>
              {error ? <p className="text-center text-xs text-danger">{error}</p> : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
