import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { StudioCinematicHero } from "@/components/studio-cinematic-hero";
import { getBearerToken } from "@/lib/auth/client";
import { isImageFile, PROOF_FILE_MAX_BYTES } from "@/lib/axiom/branded-hero";
import { isPublicNiche, NICHES, PUBLIC_NICHE_ORDER } from "@/lib/axiom/niches";
import { HERO_VIDEO_MAX_BYTES } from "@/lib/axiom/hero-video";
import { addPortfolioItem, saveTradeProfile, setShopNiche, updateShopBrand } from "@/lib/axiom/server";
import type { LayoutBlock } from "@/lib/axiom/storefront";
import {
  defaultBadges,
  generateStudioIdentity,
  identitySurface,
  isStudioPlate,
  paletteToRipple,
  STUDIO_PALETTES,
  studioLogo,
  studioPalette,
  type StudioIdentity,
  type StudioPaletteId,
} from "@/lib/axiom/studio-identity";
import { paintStudioPlate, studioPlateJpeg } from "@/lib/axiom/studio-paint";
import type { Shop, ShopNiche } from "@/lib/axiom/types";
import { cn } from "@/lib/utils";

function nicheChoices(shopNiche: ShopNiche, selected: string): string[] {
  const list: string[] = isPublicNiche(shopNiche) ? [...PUBLIC_NICHE_ORDER] : [shopNiche, ...PUBLIC_NICHE_ORDER];
  if (selected && !list.includes(selected)) list.unshift(selected);
  return list;
}

function nicheLabel(id: string): string {
  return isPublicNiche(id) || (id in NICHES) ? NICHES[id as ShopNiche].label : id;
}

export function AxiomStudio({
  shop,
  readonly,
  onReload,
}: {
  shop: Shop;
  readonly: boolean;
  onReload: () => void;
}) {
  const saved = shop.tradeProfile.studioIdentity;
  const [name, setName] = useState(saved.businessName || shop.name);
  const [niche, setNiche] = useState(saved.niche || shop.niche);
  const [paletteId, setPaletteId] = useState<StudioPaletteId>(saved.paletteId || "signal");
  const [badges, setBadges] = useState<string[]>(
    (saved.badges.length ? saved.badges : defaultBadges(saved.niche || shop.niche)).map((badge) => badge.label),
  );
  const [locked, setLocked] = useState<StudioIdentity | null>(saved.locked ? saved : null);
  const [file, setFile] = useState<File | null>(null);
  const [rawUrl, setRawUrl] = useState("");
  const [plate, setPlate] = useState(saved.animated && isStudioPlate(shop.heroImageUrl) ? shop.heroImageUrl : "");
  const [live, setLive] = useState(saved.animated && isStudioPlate(shop.heroImageUrl));
  const [hot, setHot] = useState(false);
  const [busy, setBusy] = useState<"lock" | "recreate" | "animate" | "place" | "clip" | "page" | null>(null);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(saved.locked ? 2 : 1);
  const [layout, setLayout] = useState<LayoutBlock[]>(shop.layout.length ? shop.layout : ["staff", "estimate", "menu"]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const rawRef = useRef("");

  const palette = studioPalette(paletteId) ?? STUDIO_PALETTES[0];
  const previewIdentity =
    locked ??
    ({
      locked: true,
      businessName: name || shop.name,
      niche,
      nicheLabel: nicheLabel(niche),
      paletteId: palette.id,
      accent: palette.accent,
      neon: palette.neon,
      ink: palette.ink,
      field: palette.field,
      badges: defaultBadges(niche),
      animated: false,
    } satisfies StudioIdentity);
  const mark = locked ? studioLogo(locked) : studioLogo(previewIdentity);

  useEffect(() => {
    return () => {
      if (rawRef.current.startsWith("blob:")) URL.revokeObjectURL(rawRef.current);
    };
  }, []);

  function rememberRaw(next: string) {
    if (rawRef.current.startsWith("blob:")) URL.revokeObjectURL(rawRef.current);
    rawRef.current = next;
    setRawUrl(next);
  }

  function chooseNiche(next: string) {
    setNiche(next);
    setBadges(defaultBadges(next).map((badge) => badge.label));
  }

  function takeFile(next: File | null) {
    if (!next || readonly || busy || !locked) return;
    if (!isImageFile(next)) {
      setError("Use a JPEG, PNG, or WebP.");
      return;
    }
    if (next.size > PROOF_FILE_MAX_BYTES) {
      setError("That photo is over 15 MB.");
      return;
    }
    setFile(next);
    setPlate("");
    setLive(false);
    setError(null);
    setStatus("");
    rememberRaw(URL.createObjectURL(next));
  }

  async function lockIdentity() {
    if (readonly || busy) return;
    setBusy("lock");
    setError(null);
    try {
      const next = generateStudioIdentity({
        businessName: name,
        niche,
        nicheLabel: nicheLabel(niche),
        paletteId,
        badges,
      });
      await saveTradeProfile({
        data: {
          slug: shop.slug,
          profile: {
            ...shop.tradeProfile,
            studio: {
              ...shop.tradeProfile.studio,
              header: next.businessName,
              tagline: next.nicheLabel,
              theme: paletteToRipple(next.paletteId),
            },
            studioIdentity: next,
          },
        },
      });
      await updateShopBrand({
        data: {
          slug: shop.slug,
          name: next.businessName,
          neonAccent: next.accent,
          ringColor: next.accent,
          glowEnabled: true,
        },
      });
      if (isPublicNiche(next.niche) && next.niche !== shop.niche) {
        await setShopNiche({ data: { slug: shop.slug, niche: next.niche } });
      }
      setLocked(next);
      setLive(false);
      setStep(2);
      setStatus("Identity locked. The logo is on the shop.");
      onReload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "The identity could not be locked");
    } finally {
      setBusy(null);
    }
  }

  async function recreate() {
    if (!file || !locked || readonly || busy) return;
    setBusy("recreate");
    setError(null);
    setLive(false);
    try {
      const bitmap = await createImageBitmap(file);
      try {
        const canvas = paintStudioPlate(bitmap, bitmap.width, bitmap.height, locked);
        setPlate(studioPlateJpeg(canvas));
        setStep(3);
        setStatus("The photo is re-created with the locked brand.");
      } finally {
        bitmap.close();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "That photo could not be re-created");
    } finally {
      setBusy(null);
    }
  }

  async function publishPlate() {
    const blob = await (await fetch(plate)).blob();
    const body = new FormData();
    body.append("shopId", shop.id);
    body.append("file", new File([blob], "studio-hero.jpg", { type: "image/jpeg" }));
    const token = getBearerToken();
    const res = await fetch("/api/hero/brand", {
      method: "POST",
      credentials: "include",
      headers: token ? { authorization: `Bearer ${token}` } : undefined,
      body,
    });
    const data = (await res.json()) as { heroImageUrl?: string; error?: string };
    if (!res.ok || !data.heroImageUrl) throw new Error(data.error || "The photo could not be saved");
    return data.heroImageUrl;
  }

  async function placePlate(spot: "hero" | "proof") {
    if (!plate || !locked || readonly || busy) return;
    setBusy("place");
    setError(null);
    try {
      if (spot === "proof") {
        await addPortfolioItem({
          data: { slug: shop.slug, imageUrl: plate, caption: locked.businessName },
        });
        setStatus("That branded photo is on the proof wall, under the hero.");
      } else {
        const heroImageUrl = await publishPlate();
        await updateShopBrand({
          data: {
            slug: shop.slug,
            heroImageUrl,
            markHero: true,
            clearHeroVideo: true,
            introPreset: "kenburns",
          },
        });
        setStatus("That branded photo is the still hero. Animate it when you want the intro.");
      }
      setStep(4);
      onReload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "The photo could not be placed");
    } finally {
      setBusy(null);
    }
  }

  async function uploadClip(file: File | null) {
    if (!file || !locked || readonly || busy) return;
    const mp4 = file.type === "video/mp4" || file.name.toLowerCase().endsWith(".mp4");
    if (!mp4) {
      setError("Use an .mp4.");
      return;
    }
    if (file.size > HERO_VIDEO_MAX_BYTES) {
      setError("That clip is over 12 MB.");
      return;
    }
    setBusy("clip");
    setError(null);
    try {
      const token = getBearerToken();
      const res = await fetch(`/api/hero-video/${shop.id}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "content-type": "video/mp4",
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: file,
      });
      const json = (await res.json()) as { heroVideoUrl?: string; error?: string };
      if (!res.ok || !json.heroVideoUrl) throw new Error(json.error || "The clip could not be saved");
      setStatus("That clip is the hero on the customer page.");
      onReload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "The clip could not be saved");
    } finally {
      setBusy(null);
    }
  }

  function moveBlock(index: number, dir: -1 | 1) {
    const next = [...layout];
    const swap = index + dir;
    if (swap < 0 || swap >= next.length) return;
    const [item] = next.splice(index, 1);
    next.splice(swap, 0, item);
    setLayout(next);
  }

  async function savePage(kind: "cinematic" | "book") {
    if (!locked || readonly || busy) return;
    setBusy("page");
    setError(null);
    try {
      await updateShopBrand({
        data: {
          slug: shop.slug,
          introPreset: kind === "cinematic" ? "orbital-pulse" : "none",
          glowEnabled: kind === "cinematic",
          layout,
        },
      });
      setStatus(
        kind === "cinematic"
          ? "Cinematic intro. The hero plays, then the crew and the menu."
          : "Still book. The photo stays, and the sections follow the order you set.",
      );
      onReload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "The page setup could not be saved");
    } finally {
      setBusy(null);
    }
  }

  async function animateIntro() {
    if (!plate || !locked || readonly || busy) return;
    setBusy("animate");
    setError(null);
    try {
      const heroImageUrl = await publishPlate();
      const data = { heroImageUrl };
      const next = { ...locked, animated: true };
      await saveTradeProfile({
        data: {
          slug: shop.slug,
          profile: {
            ...shop.tradeProfile,
            studio: {
              ...shop.tradeProfile.studio,
              header: next.businessName,
              tagline: next.nicheLabel,
              theme: paletteToRipple(next.paletteId),
              presentation: "orbital-pulse",
            },
            studioIdentity: next,
          },
        },
      });
      await updateShopBrand({
        data: {
          slug: shop.slug,
          name: next.businessName,
          neonAccent: next.accent,
          ringColor: next.accent,
          glowEnabled: true,
          introPreset: "orbital-pulse",
          markHero: true,
          clearHeroVideo: true,
        },
      });
      setLocked(next);
      setPlate(data.heroImageUrl);
      setLive(true);
      setStep(4);
      setStatus("The cinematic intro is the hero on the shop.");
      onReload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "The intro could not be published");
    } finally {
      setBusy(null);
    }
  }

  const steps = [
    { id: 1 as const, label: "Brand" },
    { id: 2 as const, label: "One photo" },
    { id: 3 as const, label: "Place it" },
    { id: 4 as const, label: "The page" },
  ];
  const blockLabel: Record<LayoutBlock, string> = {
    staff: "Who does the work",
    estimate: "What it costs",
    menu: "What they sell",
  };

  return (
    <div className="grid gap-8" style={identitySurface(previewIdentity)}>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Axiom Studio</p>
          <h2 className="mt-2 font-display text-4xl text-fg">One brand. Then every photo.</h2>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Lock the logo first. One upload comes back with that mark built in. Put it on the hero or the proof wall, or turn it into the intro your customers scroll through.
          </p>
        </div>
        <Link to="/$shopSlug" params={{ shopSlug: shop.slug }} className="text-sm text-accent">
          View the shop
        </Link>
      </header>

      <ol className="flex gap-2 overflow-x-auto">
        {steps.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => setStep(item.id)}
              className="h-11 shrink-0 rounded-full px-4 text-sm"
              style={
                step === item.id
                  ? { background: "var(--color-fg)", color: "var(--color-bg)" }
                  : { background: "var(--color-surface)", color: "var(--color-muted)" }
              }
            >
              {item.id}. {item.label}
            </button>
          </li>
        ))}
      </ol>

      {step === 1 ? (
      <section className="grid gap-6 rounded-3xl bg-surface p-5 shadow-[var(--shadow-border)] lg:grid-cols-[16rem_1fr]">
        <div>
          <img src={mark} alt="" className="aspect-square w-full rounded-2xl bg-bg object-contain" />
          <p className="mt-3 text-xs text-muted">
            {locked ? "Locked on this shop." : "Preview. Lock it to keep the mark."}
          </p>
        </div>
        <div className="grid gap-4">
          <div>
            <Label htmlFor="studio-name">Business name</Label>
            <Input
              id="studio-name"
              value={name}
              disabled={readonly || busy !== null}
              onChange={(event) => setName(event.target.value)}
              placeholder="Harbor Wash"
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="studio-niche">Trade</Label>
            <select
              id="studio-niche"
              value={niche}
              disabled={readonly || busy !== null}
              onChange={(event) => chooseNiche(event.target.value)}
              className="mt-2 h-11 w-full rounded-xl bg-surface-2 px-3 text-sm text-fg"
            >
              {nicheChoices(shop.niche, niche).map((id) => (
                <option key={id} value={id}>
                  {nicheLabel(id)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className="text-sm text-fg">Color</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {STUDIO_PALETTES.map((item) => {
                const on = item.id === paletteId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={readonly || busy !== null}
                    aria-pressed={on}
                    onClick={() => setPaletteId(item.id)}
                    className="inline-flex h-11 items-center gap-2 rounded-full bg-surface-2 px-3 text-sm text-fg"
                    style={{
                      boxShadow: on
                        ? `0 0 0 1px ${item.accent}, 0 0 16px color-mix(in srgb, ${item.accent} 45%, transparent)`
                        : "var(--shadow-border)",
                    }}
                  >
                    <span className="size-3 rounded-full" style={{ background: item.accent }} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {badges.map((badge, index) => (
              <div key={`badge-field-${index}`}>
                <Label htmlFor={`studio-badge-${index}`}>Sponsor {index + 1}</Label>
                <Input
                  id={`studio-badge-${index}`}
                  value={badge}
                  disabled={readonly || busy !== null}
                  onChange={(event) => {
                    const next = [...badges];
                    next[index] = event.target.value;
                    setBadges(next);
                  }}
                  className="mt-2"
                />
              </div>
            ))}
          </div>
          <Button type="button" variant="accent" disabled={readonly || busy !== null} onClick={() => void lockIdentity()}>
            {busy === "lock" ? "Locking" : "Lock identity"}
          </Button>
        </div>
      </section>
      ) : null}

      {step === 2 ? (
      <section className="grid gap-4">
        <label
          className={cn("studio-drop", hot && "is-hot", !locked && "is-locked")}
          onDragOver={(event) => {
            event.preventDefault();
            if (locked && !readonly) setHot(true);
          }}
          onDragLeave={() => setHot(false)}
          onDrop={(event) => {
            event.preventDefault();
            setHot(false);
            takeFile(event.dataTransfer.files?.[0] ?? null);
          }}
        >
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={!locked || readonly || busy !== null}
            onChange={(event) => takeFile(event.target.files?.[0] ?? null)}
          />
          <span className="font-display text-3xl text-fg">Upload Your Image Here</span>
          <span className="mt-2 block max-w-md text-sm text-muted">
            {locked
              ? "A job site, the truck, or the tools. Submit it and the locked brand is etched into the landscape."
              : "Lock the identity first. Then this drop takes the photo."}
          </span>
          {file ? <span className="mt-3 block text-sm text-fg">{file.name}</span> : null}
        </label>
        <div className="grid gap-4 lg:grid-cols-2">
          <figure className="overflow-hidden rounded-3xl bg-surface shadow-[var(--shadow-border)]">
            {rawUrl ? <img src={rawUrl} alt="" className="aspect-video w-full object-cover" /> : <div className="aspect-video" />}
            <figcaption className="px-4 py-3 text-xs uppercase tracking-[0.16em] text-muted">Original</figcaption>
          </figure>
          <figure className="overflow-hidden rounded-3xl bg-surface shadow-[var(--shadow-border)]">
            {plate ? <img src={plate} alt="" className="aspect-video w-full object-cover" /> : <div className="aspect-video" />}
            <figcaption className="px-4 py-3 text-xs uppercase tracking-[0.16em] text-muted">Re-created</figcaption>
          </figure>
        </div>
        <Button type="button" disabled={!file || !locked || readonly || busy !== null} onClick={() => void recreate()}>
          {busy === "recreate" ? "Re-creating" : "Re-create this photo"}
        </Button>
      </section>
      ) : null}

      {step === 3 ? (
      <section className="grid gap-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <figure className="overflow-hidden rounded-3xl bg-surface shadow-[var(--shadow-border)]">
            {plate ? <img src={plate} alt="" className="aspect-video w-full object-cover" /> : <div className="grid aspect-video place-items-center text-sm text-muted">Re-create a photo first.</div>}
            <figcaption className="px-4 py-3 text-xs uppercase tracking-[0.16em] text-muted">Branded photo</figcaption>
          </figure>
          {live && plate && locked ? (
            <StudioCinematicHero plateUrl={plate} identity={locked} className="studio-cine-preview">
              <p className="text-xs uppercase tracking-[0.18em] text-muted">{locked.nicheLabel}</p>
              <h3 className="mt-2 font-display text-4xl text-fg">{locked.businessName}</h3>
            </StudioCinematicHero>
          ) : (
            <div className="grid aspect-video place-items-center rounded-3xl bg-surface text-sm text-muted shadow-[var(--shadow-border)]">
              The 3D intro shows here after you animate.
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" disabled={!plate || !locked || readonly || busy !== null} onClick={() => void placePlate("hero")}>
            {busy === "place" ? "Placing" : "Use as the hero still"}
          </Button>
          <Button type="button" disabled={!plate || !locked || readonly || busy !== null} onClick={() => void placePlate("proof")}>
            Put it on the proof wall
          </Button>
          <Button type="button" variant="accent" disabled={!plate || !locked || readonly || busy !== null} onClick={() => void animateIntro()}>
            {busy === "animate" ? "Compiling the intro" : "Animate Hero Intro"}
          </Button>
        </div>
      </section>
      ) : null}

      {step === 4 ? (
      <section className="grid gap-6">
        <div className="grid gap-3 lg:grid-cols-2">
          <button
            type="button"
            disabled={!locked || readonly || busy !== null}
            onClick={() => void savePage("cinematic")}
            className="rounded-3xl bg-surface p-5 text-left shadow-[var(--shadow-border)]"
          >
            <p className="text-xs uppercase tracking-[0.16em] text-muted">Setup one</p>
            <p className="mt-2 font-display text-2xl text-fg">Hero introduction</p>
            <p className="mt-2 text-sm text-muted">The clip plays first. Scroll, and the crew, the price, and the menu are underneath.</p>
          </button>
          <button
            type="button"
            disabled={!locked || readonly || busy !== null}
            onClick={() => void savePage("book")}
            className="rounded-3xl bg-surface p-5 text-left shadow-[var(--shadow-border)]"
          >
            <p className="text-xs uppercase tracking-[0.16em] text-muted">Setup two</p>
            <p className="mt-2 font-display text-2xl text-fg">Still book</p>
            <p className="mt-2 text-sm text-muted">The branded photo stays put. The sections below follow the order you set.</p>
          </button>
        </div>
        <div>
          <p className="text-sm text-fg">Section order</p>
          <ul className="mt-2 grid gap-2">
            {layout.map((block, index) => (
              <li key={block} className="flex items-center justify-between gap-3 rounded-2xl bg-surface px-4 py-2">
                <span className="text-sm text-fg">{blockLabel[block]}</span>
                <span className="flex gap-1">
                  <Button type="button" size="sm" disabled={index === 0 || readonly} onClick={() => moveBlock(index, -1)}>Up</Button>
                  <Button type="button" size="sm" disabled={index === layout.length - 1 || readonly} onClick={() => moveBlock(index, 1)}>Down</Button>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <label className="studio-drop">
          <input
            type="file"
            accept="video/mp4,.mp4"
            className="sr-only"
            disabled={!locked || readonly || busy !== null}
            onChange={(event) => void uploadClip(event.target.files?.[0] ?? null)}
          />
          <span className="font-display text-2xl text-fg">Or upload a clip you already shot</span>
          <span className="mt-2 block text-sm text-muted">An mp4 under 12 MB becomes the hero on the customer page.</span>
        </label>
      </section>
      ) : null}

      {status ? <p className="text-sm text-accent">{status}</p> : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
