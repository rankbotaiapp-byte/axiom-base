import { useEffect, useState } from "react";
import {
  enhanceHeroStill,
  finishCinematicHero,
  readMotionStudio,
  saveBrandDna,
  startAiCreditPack,
  startCinematicHero,
} from "@/lib/axiom/server";
import {
  AI_CREDIT_PACK,
  AI_IMAGE_UNITS,
  BRAND_FONT_LABEL,
  BRAND_FONTS,
  brandDnaComplete,
  emptyBrandDna,
  parseBrandDna,
  type BrandDna,
  type BrandFont,
} from "@/lib/axiom/shop-branding";
import type { Shop } from "@/lib/axiom/types";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Could not read that file"));
    reader.readAsDataURL(file);
  });
}

export function HeroMotionStudio({
  shop,
  readonly,
  onStill,
  onFilm,
}: {
  shop: Shop;
  readonly: boolean;
  onStill: (url: string) => void;
  onFilm: (url: string) => void;
}) {
  const [dna, setDna] = useState<BrandDna>(emptyBrandDna);
  const [credits, setCredits] = useState(0);
  const [available, setAvailable] = useState(false);
  const [billing, setBilling] = useState(false);
  const [scene, setScene] = useState("");
  const [branded, setBranded] = useState(shop.heroImageUrl);
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const locked = brandDnaComplete(dna);
  const shopKey = { slug: shop.slug, shopId: shop.id };

  useEffect(() => {
    let cancelled = false;
    void readMotionStudio({ data: shopKey })
      .then((desk) => {
        if (cancelled) return;
        setDna(parseBrandDna(desk.dna));
        setCredits(desk.credits);
        setAvailable(desk.available);
        setBilling(desk.billing);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load Brand DNA");
      });
    return () => {
      cancelled = true;
    };
  }, [shop.id, shop.slug]);

  async function lockDna() {
    setBusy("dna");
    setError("");
    try {
      const next = await saveBrandDna({ data: { ...shopKey, dna } });
      setDna(parseBrandDna(next.dna));
      setNote("Brand DNA locked for generation.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not lock Brand DNA");
    } finally {
      setBusy("");
    }
  }

  async function brandPhoto(file?: File) {
    if (!file || readonly) return;
    const dataUrl = await fileToDataUrl(file);
    setScene(dataUrl);
    setBusy("image");
    setError("");
    try {
      const next = await enhanceHeroStill({ data: { ...shopKey, imageDataUrl: dataUrl } });
      setBranded(next.stillUrl);
      setCredits(next.credits);
      onStill(next.stillUrl);
      setNote("Branded still ready.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not brand that still");
    } finally {
      setBusy("");
    }
  }

  async function cinematic() {
    const source = branded || scene;
    if (!source) {
      setError("Drop a job-site photo first so the loop has a still to move.");
      return;
    }
    setBusy("video");
    setError("");
    try {
      const started = await startCinematicHero({ data: { ...shopKey, imageDataUrl: source } });
      setCredits(started.credits);
      setNote("Cinematic loop is rendering.");
      for (let attempt = 0; attempt < 8; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 2500));
        const next = await finishCinematicHero({ data: { ...shopKey, requestId: started.requestId } });
        if (next.pending) continue;
        onFilm(next.heroVideoUrl);
        setCredits(next.credits);
        setNote("Hero loop is on the storefront.");
        return;
      }
      setNote("Still rendering. Stay on this desk and it will land on the shop film.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start the cinematic loop");
    } finally {
      setBusy("");
    }
  }

  async function buyPack() {
    setBusy("pack");
    setError("");
    try {
      const pack = await startAiCreditPack({ data: shopKey });
      window.location.href = pack.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start the credit pack");
      setBusy("");
    }
  }

  return (
    <section className="hud-studio" aria-label="Hero motion studio">
      <div className="hero-studio-head">
        <div>
          <p className="motion-kicker">Brand DNA</p>
          <p className="motion-help">
            Lock logo, palette, type, and tagline. Every generated still and loop uses this as the only brand context.
          </p>
        </div>
        <p className="motion-status">{credits} credits</p>
      </div>

      <div className="dna-grid">
        <label className="motion-label">
          Logo
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            disabled={readonly || Boolean(busy)}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              void fileToDataUrl(file).then((logoDataUrl) => setDna((current) => ({ ...current, logoDataUrl })));
            }}
          />
        </label>
        {dna.logoDataUrl ? <img className="dna-logo" src={dna.logoDataUrl} alt="" /> : null}
        <label className="motion-label" htmlFor="dna-primary">
          Primary
        </label>
        <input
          id="dna-primary"
          className="motion-tag"
          value={dna.primary}
          maxLength={7}
          disabled={readonly}
          onChange={(event) => setDna((current) => ({ ...current, primary: event.target.value }))}
        />
        <span className="dna-swatch" style={{ background: dna.primary }} aria-hidden />
        <label className="motion-label" htmlFor="dna-secondary">
          Secondary
        </label>
        <input
          id="dna-secondary"
          className="motion-tag"
          value={dna.secondary}
          maxLength={7}
          disabled={readonly}
          onChange={(event) => setDna((current) => ({ ...current, secondary: event.target.value }))}
        />
        <span className="dna-swatch" style={{ background: dna.secondary }} aria-hidden />
        <label className="motion-label" htmlFor="dna-font">
          Font
        </label>
        <select
          id="dna-font"
          className="film-select"
          value={dna.font}
          disabled={readonly}
          onChange={(event) => setDna((current) => ({ ...current, font: event.target.value as BrandFont }))}
        >
          {BRAND_FONTS.map((font) => (
            <option key={font} value={font}>
              {BRAND_FONT_LABEL[font]}
            </option>
          ))}
        </select>
        <label className="motion-label" htmlFor="dna-tag">
          Tagline
        </label>
        <input
          id="dna-tag"
          className="motion-tag"
          value={dna.tagline}
          maxLength={80}
          disabled={readonly}
          onChange={(event) => setDna((current) => ({ ...current, tagline: event.target.value }))}
        />
      </div>
      <button type="button" className="studio-save" disabled={readonly || busy === "dna"} onClick={() => void lockDna()}>
        {busy === "dna" ? "Locking" : locked ? "Update Brand DNA" : "Lock Brand DNA"}
      </button>

      <p className="motion-kicker">Brand a raw still</p>
      <p className="motion-help">
        Drop a job-site, truck, cut, or yard photo. Generation weaves the locked logo and palette into the scene, then
        spends {AI_IMAGE_UNITS} image credit.
      </p>
      <label className={readonly || !locked ? "studio-drop is-off" : "studio-drop"}>
        <p>Drop a photo to brand</p>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={readonly || !locked || Boolean(busy)}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            void brandPhoto(file);
          }}
        />
      </label>
      {branded ? <img className="dna-preview" src={branded} alt="" /> : null}

      <div className="hud-editor-row">
        <button
          type="button"
          className="studio-save"
          disabled={readonly || !locked || busy === "video" || !available}
          onClick={() => void cinematic()}
        >
          {busy === "video" ? "Rendering loop" : "Turn into cinematic hero"}
        </button>
        <button type="button" className="studio-switch" disabled={readonly || !billing || busy === "pack"} onClick={() => void buyPack()}>
          {busy === "pack" ? "Opening checkout" : `Buy ${AI_CREDIT_PACK} credits`}
        </button>
      </div>
      {!available ? <p className="motion-help">AI generation is not available in this environment.</p> : null}
      {!billing ? <p className="motion-help">Credit packs need Stripe on this workspace. Generation still deducts shop credits first.</p> : null}
      {error ? <p className="motion-error">{error}</p> : null}
      {note ? <p className="motion-status">{note}</p> : null}
    </section>
  );
}
