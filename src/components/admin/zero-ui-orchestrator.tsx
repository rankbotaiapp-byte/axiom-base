import { useState } from "react";
import { HUD_CARD, HUD_SELECT, HudHeading, NeonBadge } from "@/components/admin/admin-hud";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { generateBrandedAsset, lockTenantBrand, orchestrateFinalWebBuild } from "@/lib/axiom/server";
import { BRAND_FONTS, BRAND_FONT_LABEL, type BrandFont } from "@/lib/axiom/shop-branding";
import type { Shop } from "@/lib/axiom/types";

export function ZeroUiOrchestrator({
  shop,
  readonly,
  onReload,
}: {
  shop: Shop;
  readonly: boolean;
  onReload: () => void;
}) {
  const locked = shop.frontendTemplate;
  const [logoDataUrl, setLogoDataUrl] = useState("");
  const [primary, setPrimary] = useState(locked?.primary || shop.ringColor || "#2EE6D6");
  const [font, setFont] = useState<BrandFont>(locked?.font || "display");
  const [prompt, setPrompt] = useState("");
  const [assetUrl, setAssetUrl] = useState(locked?.heroAssetUrl || "");
  const [animate, setAnimate] = useState(Boolean(locked?.animate));
  const [busy, setBusy] = useState<"lock" | "generate" | "build" | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const shopKey = { slug: shop.slug, shopId: shop.id };

  function fail(err: unknown) {
    setError(err instanceof Error ? err.message : "Could not complete that step");
  }

  return (
    <section className={`${HUD_CARD} p-5`}>
      <HudHeading
        kicker="Zero-UI orchestrator"
        title="Lock, generate, publish"
        aside={
          locked?.builtAt ? (
            <NeonBadge tone="emerald">Live template</NeonBadge>
          ) : (
            <NeonBadge tone="amber">Identity unlocked</NeonBadge>
          )
        }
      />
      <p className="mt-2 max-w-2xl text-sm text-slate-400">
        Every tenant site uses the same layout. Color, type, logo, and the hero still make it theirs. Autopilot loops
        stay untouched.
      </p>
      {error ? (
        <p className="mt-3 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 font-mono text-xs text-rose-300">
          {error}
        </p>
      ) : null}
      {note ? <p className="mt-3 font-mono text-xs text-cyan-300">{note}</p> : null}

      <ol className="mt-6 grid gap-5 lg:grid-cols-3">
        <li className="rounded-xl border border-cyan-500/20 bg-slate-950/60 p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-400/80">Action A</p>
          <p className="mt-1 text-lg text-slate-100">Lock brand</p>
          <div className="mt-4">
            <Label htmlFor="zu-logo">Logo</Label>
            <input
              id="zu-logo"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={readonly || Boolean(busy)}
              className="admin-file mt-2 block w-full text-sm text-slate-400"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => setLogoDataUrl(String(reader.result ?? ""));
                reader.readAsDataURL(file);
              }}
            />
          </div>
          <div className="mt-3">
            <Label htmlFor="zu-hex">Primary color</Label>
            <Input id="zu-hex" value={primary} disabled={readonly} onChange={(e) => setPrimary(e.target.value)} />
          </div>
          <div className="mt-3">
            <Label htmlFor="zu-font">Font</Label>
            <select
              id="zu-font"
              className={`${HUD_SELECT} mt-2`}
              value={font}
              disabled={readonly}
              onChange={(e) => setFont(e.target.value as BrandFont)}
            >
              {BRAND_FONTS.map((id) => (
                <option key={id} value={id}>
                  {BRAND_FONT_LABEL[id]}
                </option>
              ))}
            </select>
          </div>
          <Button
            className="mt-4 w-full"
            disabled={readonly || busy !== null}
            onClick={() => {
              setBusy("lock");
              setError(null);
              void lockTenantBrand({
                data: { ...shopKey, logoDataUrl: logoDataUrl || undefined, primary, font, tagline: shop.tagline },
              })
                .then(() => {
                  setNote("Brand locked.");
                  onReload();
                })
                .catch(fail)
                .finally(() => setBusy(null));
            }}
          >
            {busy === "lock" ? "Locking…" : "Lock identity"}
          </Button>
        </li>

        <li className="rounded-xl border border-cyan-500/20 bg-slate-950/60 p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-400/80">Action B</p>
          <p className="mt-1 text-lg text-slate-100">Generate still</p>
          <div className="mt-4">
            <Label htmlFor="zu-prompt">Scene note</Label>
            <Input
              id="zu-prompt"
              value={prompt}
              disabled={readonly}
              placeholder="Service van at dusk, job-site still"
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>
          {assetUrl ? (
            <img src={assetUrl} alt="" className="mt-3 h-28 w-full rounded-lg object-cover" />
          ) : (
            <p className="mt-3 font-mono text-xs text-slate-500">No branded still yet.</p>
          )}
          <Button
            className="mt-4 w-full"
            disabled={readonly || busy !== null}
            onClick={() => {
              setBusy("generate");
              setError(null);
              void generateBrandedAsset({ data: { ...shopKey, prompt } })
                .then((result) => {
                  setAssetUrl(result.assetUrl);
                  setNote("Still ready. Publish when it looks right.");
                  onReload();
                })
                .catch(fail)
                .finally(() => setBusy(null));
            }}
          >
            {busy === "generate" ? "Generating…" : "Generate branded still"}
          </Button>
        </li>

        <li className="rounded-xl border border-cyan-500/20 bg-slate-950/60 p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-400/80">Action C</p>
          <p className="mt-1 text-lg text-slate-100">Publish site</p>
          <label className="mt-4 flex min-h-11 items-center gap-2 font-mono text-xs text-slate-300">
            <input
              type="checkbox"
              checked={animate}
              disabled={readonly}
              onChange={(e) => setAnimate(e.target.checked)}
            />
            Map still onto the catalog loop (Ashland overlay)
          </label>
          <Button
            className="mt-4 w-full"
            disabled={readonly || busy !== null || !assetUrl}
            onClick={() => {
              setBusy("build");
              setError(null);
              void orchestrateFinalWebBuild({
                data: { ...shopKey, brandedAssetUrl: assetUrl, animate },
              })
                .then((result) => {
                  setNote("Storefront published.");
                  onReload();
                  window.location.assign(result.storefrontPath);
                })
                .catch(fail)
                .finally(() => setBusy(null));
            }}
          >
            {busy === "build" ? "Publishing…" : "Build live site"}
          </Button>
        </li>
      </ol>
    </section>
  );
}
