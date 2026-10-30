import { useRef, useState } from "react";
import { FilmStudioDock } from "@/components/admin/film-studio-dock";
import { HeroHud } from "@/components/hero-hud";
import { getNicheActions } from "@/config/niche-actions";
import { nicheHeroButtons } from "@/config/niche-button-presets";
import {
  parseHeroHud,
  seedFilmPlates,
  type HeroHudConfig,
} from "@/lib/axiom/hero-hud";
import { revalidateStorefront, updateShopBrand } from "@/lib/axiom/server";
import type { Shop } from "@/lib/axiom/types";

function freshId(): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  let body = "";
  for (let i = 0; i < 8; i += 1) body += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `hud_${body}`;
}

export function HeroStudioMobile({
  shop,
  readonly,
  onReload,
}: {
  shop: Shop;
  readonly: boolean;
  onReload: () => void;
}) {
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const actions = getNicheActions(shop.niche);
  const [hud, setHud] = useState<HeroHudConfig>(() =>
    seedFilmPlates(shop.heroHud && shop.heroHud.buttons.length > 0 ? shop.heroHud : { title: "", buttons: nicheHeroButtons(shop.niche), plates: [] }, {
      name: shop.name,
      tagline: shop.tagline,
      city: shop.address,
      badge: actions?.badge ?? "",
      bookHref: `/${shop.slug}/book`,
      services: actions?.services ?? [],
    }),
  );
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [film, setFilm] = useState(shop.heroVideoUrl || "");

  function publish(next: HeroHudConfig, immediate = false, reload = false) {
    setHud(next);
    if (readonly) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const write = async () => {
      const clean = parseHeroHud(next);
      if (!clean) return;
      setBusy(true);
      setError("");
      try {
        const name = clean.plates.find((plate) => plate.id === "plate_identity")?.lines.find((line) => line.id === "line_name")?.text.trim();
        const tagline = clean.plates.find((plate) => plate.id === "plate_identity")?.lines.find((line) => line.id === "line_tag")?.text.trim();
        await updateShopBrand({
          data: {
            slug: shop.slug,
            heroHud: clean,
            markHero: true,
            ...(name ? { name } : {}),
            ...(tagline ? { tagline } : {}),
          },
        });
        await revalidateStorefront({ data: shop.slug });
        if (reload) onReload();
        setStatus("Saved on this shop.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save the HUD");
      } finally {
        setBusy(false);
      }
    };
    if (immediate) void write();
    else saveTimer.current = setTimeout(() => void write(), 320);
  }

  return (
    <section className="hud-studio">
      <p className="motion-kicker">Perimeter studio</p>
      <p className="motion-help">Click a heading or a button label and type. Leave the field, or press Enter, and it saves. Pick an action on the button, or upload a loop and it replaces the background.</p>
      <div className="hud-stage">
        {film ? <video src={film} autoPlay muted loop playsInline /> : <div className="hud-stage-empty" />}
        <HeroHud
          hud={hud}
          bookHref={`/${shop.slug}/book`}
          editable={!readonly}
          interactive={!readonly}
          onChange={(next, commit) => {
            setHud(next);
            if (commit) publish(next, true);
          }}
        />
        {readonly ? null : (
          <FilmStudioDock
            shopId={shop.id}
            slug={shop.slug}
            niche={shop.niche}
            current={film}
            tagline={shop.tagline}
            onFilm={setFilm}
          />
        )}
      </div>

      <div className="hud-editor-row">
        <button
          type="button"
          className="studio-switch"
          disabled={readonly || hud.buttons.length >= 6}
          onClick={() => {
            const id = freshId();
            publish({
              ...hud,
              buttons: [...hud.buttons, { id, label: "New control", icon: "zap", action: "booking", x: 12, y: 48, phone: "", href: "", variant: "neon-glass", clickAnimation: "pulse-glow", successMessage: "", response: "modal" }],
            });
          }}
        >
          Add control
        </button>
        <button
          type="button"
          className="studio-switch"
          disabled={readonly || hud.buttons.length === 0}
          onClick={() => publish({ ...hud, buttons: hud.buttons.slice(0, -1) })}
        >
          Remove
        </button>
        <button type="button" className="studio-save" disabled={readonly || busy} onClick={() => publish(hud, true, true)}>
          {busy ? "Saving" : "Save HUD"}
        </button>
      </div>
      {error ? <p className="motion-error">{error}</p> : null}
      {status ? <p className="motion-status">{status}</p> : null}
    </section>
  );
}
