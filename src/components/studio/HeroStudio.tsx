import { useMemo, useState } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { AiContentAutopilotToggle } from "@/components/admin/ai-content-autopilot";
import { SyncedHeroPlayer } from "@/components/studio/SyncedHeroPlayer";
import { saveHeroStudioJob } from "@/lib/actions/studio-client";
import { defaultNicheFilm } from "@/config/catalog";
import { MEDIA_FILE_MAX_BYTES } from "@/lib/axiom/media-slots";
import {
  DEFAULT_HERO_LOOK,
  boundHeroAnimation,
  cleanHeroUrl,
  cleanStillUrl,
  isPlayableHeroFilm,
  parseHeroLook,
  persistHeroToSupabase,
  readHeroDraft,
  uploadHeroToStorage,
  writeHeroDraft,
  type HeroLook,
} from "@/lib/axiom/hero-studio-state";
import { getBearerToken } from "@/lib/auth/client";
import { revalidateStorefront, updateShopBrand } from "@/lib/axiom/server";
import {
  EFFECT_TREE,
  autopilotEffectForNiche,
  cinematicEffect,
  fireCtaHaptic,
  fireProfileHaptic,
  type BrandMarkStyle,
  type CinematicEffectId,
} from "@/lib/haptic-profiles";
import type { Shop } from "@/lib/axiom/types";

const STILL_MB = Math.round(MEDIA_FILE_MAX_BYTES / (1024 * 1024));

function startingFilm(shop: Shop, storedUrl: string | undefined, effectId: CinematicEffectId): string {
  const stored = cleanHeroUrl(storedUrl);
  if (stored && isPlayableHeroFilm(stored)) return stored;
  const live = cleanHeroUrl(shop.heroVideoUrl);
  if (live && isPlayableHeroFilm(live)) return live;
  return cinematicEffect(effectId).loopUrl || boundHeroAnimation(shop.niche, shop.customNiche) || defaultNicheFilm(shop.niche);
}

export function HeroStudio({ shop, readonly }: { shop: Shop; readonly: boolean }) {
  const router = useRouter();
  const stored = readHeroDraft(shop.slug);
  const initialLook: HeroLook = parseHeroLook({
    ...(shop.heroLook ?? DEFAULT_HERO_LOOK),
    ...(stored?.look ?? {}),
    glow: stored?.look?.glow ?? shop.heroLook?.glow ?? shop.glowEnabled,
  });
  const [autopilot, setAutopilot] = useState(initialLook.autopilot);
  const [effectId, setEffectId] = useState<CinematicEffectId>(
    autopilot ? autopilotEffectForNiche(shop.customNiche || shop.niche) : initialLook.effect,
  );
  const [brandMark, setBrandMark] = useState<BrandMarkStyle>(initialLook.brandMark);
  const [openFamily, setOpenFamily] = useState<string>("water");
  const [tagline, setTagline] = useState(stored?.tagline ?? shop.tagline);
  const [video, setVideo] = useState(startingFilm(shop, stored?.hero_video_url, effectId));
  const [still, setStill] = useState(stored?.hero_image_url || cleanStillUrl(shop.heroImageUrl) || shop.frontendTemplate?.logoUrl || "");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const spec = useMemo(() => cinematicEffect(effectId), [effectId]);

  function lookFrom(next?: Partial<HeroLook>): HeroLook {
    return {
      brackets: true,
      glow: true,
      overlay: true,
      effect: next?.effect ?? effectId,
      brandMark: next?.brandMark ?? brandMark,
      autopilot: next?.autopilot ?? autopilot,
    };
  }

  async function publish(next?: { video?: string; still?: string; effect?: CinematicEffectId }) {
    const loop = cleanHeroUrl(next?.video ?? video) || spec.loopUrl;
    const plate = cleanStillUrl(next?.still ?? still);
    const effect = next?.effect ?? effectId;
    if (!loop || !isPlayableHeroFilm(loop)) {
      setError("Choose a cinematic loop before publishing.");
      return;
    }
    setBusy(true);
    setError(null);
    setStatus("");
    try {
      const frame = lookFrom({ effect });
      const draft = writeHeroDraft(shop.slug, {
        hero_video_url: loop,
        hero_image_url: plate,
        tagline,
        look: frame,
      });
      setVideo(draft.hero_video_url);
      if (!readonly) {
        await updateShopBrand({
          data: {
            slug: shop.slug,
            tagline: draft.tagline,
            ...(plate ? { heroImageUrl: plate } : {}),
            heroFilm: draft.hero_video_url,
            glowEnabled: true,
            heroLook: frame,
            markHero: true,
          },
        });
        await saveHeroStudioJob({
          data: {
            slug: shop.slug,
            mode: frame.autopilot ? "autopilot" : "manual",
            effectId: frame.effect,
            brandMark: frame.brandMark,
            loopUrl: draft.hero_video_url,
            logoUrl: plate,
          },
        });
      }
      await persistHeroToSupabase(shop.slug, draft);
      await revalidateStorefront({ data: shop.slug });
      await router.invalidate();
      setStatus("Cinematic loop is live. Mobile visitors get the matching LRA pulse.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not publish");
    } finally {
      setBusy(false);
    }
  }

  function pickEffect(id: CinematicEffectId) {
    if (readonly) return;
    setAutopilot(false);
    setEffectId(id);
    const next = cinematicEffect(id);
    setVideo(next.loopUrl);
    fireProfileHaptic(next.haptic);
  }

  async function takeFile(next: File | undefined) {
    if (!next || readonly || busy) return;
    const name = next.name.toLowerCase();
    const image = next.type.startsWith("image/") || /\.(jpe?g|png|webp)$/.test(name);
    if (!image) {
      setError("Drop a logo or still (JPEG, PNG, WebP). Background loops are cinematic presets — not toy CSS physics.");
      return;
    }
    if (next.size > MEDIA_FILE_MAX_BYTES) {
      setError(`Images must be ${STILL_MB} MB or smaller.`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const token = getBearerToken();
      const body = new FormData();
      body.set("shopId", shop.id);
      body.set("image", next);
      body.set("slot", "hero");
      body.set("isHero", "1");
      body.set("purpose", "Hero brand plate");
      const res = await fetch("/api/admin/media/upload", {
        method: "POST",
        credentials: "include",
        headers: token ? { authorization: `Bearer ${token}` } : {},
        body,
      });
      const json = (await res.json()) as { asset?: { url?: string }; error?: string };
      const hosted = await uploadHeroToStorage(shop.slug, next);
      const url = cleanStillUrl(hosted) || cleanStillUrl(json.asset?.url);
      if (!url) throw new Error(json.error || "That image could not be saved");
      setStill(url);
      setStatus("Brand plate is on the glass. Publish to lock it to the loop.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-dvh bg-studio text-fg">
      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-6 md:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
        <div className="overflow-hidden rounded-2xl border border-hud/20">
          <SyncedHeroPlayer
            src={video}
            poster={still || "/media/hero-poster.jpg"}
            effect={effectId}
            brandMark={brandMark}
            shopName={shop.name}
            logoUrl={still}
            tagline={tagline}
          />
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-line bg-obsidian/80 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] uppercase tracking-[0.22em] text-hud">Hero studio</p>
            <Link to="/$shopSlug/admin" params={{ shopSlug: shop.slug }} className="text-sm text-muted hover:text-hud">
              Desk
            </Link>
          </div>
          <h1 className="font-display text-2xl tracking-tight">Cinematic loop, not a toy animation.</h1>
          <p className="text-sm leading-relaxed text-muted">
            Logo and name sit on frosted HUD glass over a pre-rendered loop. Water and sparks are film plus haptics — never
            browser physics.
          </p>

          <div className="grid grid-cols-2 gap-2" role="group" aria-label="Studio mode">
            <button
              type="button"
              className={`rounded-lg px-3 py-3 text-sm ${autopilot ? "bg-hud/15 text-hud" : "bg-surface-2 text-muted"}`}
              aria-pressed={autopilot}
              disabled={readonly}
              onClick={() => {
                fireCtaHaptic();
                const next = autopilotEffectForNiche(shop.customNiche || shop.niche);
                setAutopilot(true);
                setEffectId(next);
                setVideo(cinematicEffect(next).loopUrl);
              }}
            >
              Autopilot
            </button>
            <button
              type="button"
              className={`rounded-lg px-3 py-3 text-sm ${!autopilot ? "bg-hud/15 text-hud" : "bg-surface-2 text-muted"}`}
              aria-pressed={!autopilot}
              disabled={readonly}
              onClick={() => {
                fireCtaHaptic();
                setAutopilot(false);
              }}
            >
              Manual
            </button>
          </div>
          <AiContentAutopilotToggle shop={shop} readonly={readonly} />

          {EFFECT_TREE.map((branch) => (
            <div key={branch.family} className="rounded-xl border border-line">
              <button
                type="button"
                className="flex w-full items-center justify-between px-3 py-3 text-left text-sm uppercase tracking-[0.16em]"
                onClick={() => setOpenFamily((current) => (current === branch.family ? "" : branch.family))}
              >
                {branch.label}
                <span className="text-hud">{openFamily === branch.family ? "−" : "+"}</span>
              </button>
              <AnimatePresence initial={false}>
                {openFamily === branch.family ? (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="grid gap-2 p-3 pt-0">
                      {branch.ids.map((id) => {
                        const item = cinematicEffect(id);
                        const on = effectId === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            disabled={readonly}
                            aria-pressed={on}
                            className={`rounded-lg px-3 py-3 text-left ${on ? "bg-hud/12 text-fg" : "bg-surface-2 text-muted"}`}
                            onClick={() => pickEffect(id)}
                          >
                            <span className="block text-sm">{item.label}</span>
                            <span className="mt-1 block text-xs leading-relaxed">{item.detail}</span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          ))}

          <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Brand plate</p>
          <div className="grid grid-cols-3 gap-2">
            {(["frost", "etch", "decal"] as const).map((mark) => (
              <button
                key={mark}
                type="button"
                disabled={readonly}
                aria-pressed={brandMark === mark}
                className={`rounded-lg py-2 text-xs capitalize ${brandMark === mark ? "text-hud" : "text-muted"} bg-surface-2`}
                onClick={() => {
                  fireCtaHaptic();
                  setBrandMark(mark);
                }}
              >
                {mark === "frost" ? "Frosted glass" : mark === "etch" ? "Etched" : "Decal"}
              </button>
            ))}
          </div>

          <label className="grid gap-1">
            <span className="text-[11px] uppercase tracking-[0.18em] text-muted">Overlay line</span>
            <input
              className="rounded-lg border border-line bg-surface px-3 py-2"
              value={tagline}
              maxLength={160}
              disabled={readonly}
              onChange={(event) => setTagline(event.target.value)}
            />
          </label>

          <label className="grid cursor-pointer gap-1 rounded-xl border border-dashed border-hud/30 px-3 py-4 text-sm text-muted">
            Drop logo / still
            <input
              type="file"
              className="sr-only"
              accept="image/jpeg,image/png,image/webp"
              disabled={readonly || busy}
              onChange={(event) => {
                void takeFile(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
          </label>

          <button
            type="button"
            data-hero-cta
            className="rounded-xl bg-hud px-4 py-3 text-sm font-medium text-obsidian disabled:opacity-50"
            disabled={readonly || busy}
            onClick={() => {
              fireCtaHaptic();
              void publish();
            }}
          >
            {busy ? "Publishing" : "Publish cinematic hero"}
          </button>
          {error ? <p className="text-sm text-hud-crimson">{error}</p> : null}
          {status ? <p className="text-sm text-ok">{status}</p> : null}
        </div>
      </section>
    </main>
  );
}
