import { useRef, useState } from "react";
import { DefaultAssetStudioPanel } from "@/components/admin/default-asset-studio";
import { FilmStudioDock } from "@/components/admin/film-studio-dock";
import { HeroHud } from "@/components/hero-hud";
import { getNicheActions } from "@/config/niche-actions";
import { studioDefaultButtons } from "@/config/niche-button-presets";
import { HeroSharkInteractive } from "@/components/HeroSharkInteractive";
import { InteractiveOtterHero } from "@/components/interactive-otter-hero";
import { isOtterHeroFilm, isSharkHeroFilm } from "@/lib/axiom/hero-films";
import {
  HERO_ANIMATION_LABEL,
  HERO_CLICK_ANIMATIONS,
  HERO_RESPONSE_ACTIONS,
  HERO_RESPONSE_LABEL,
  actionFor,
  parseHeroHud,
  seedFilmPlates,
  type HeroClickAnimation,
  type HeroHudConfig,
  type HeroResponseAction,
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
    seedFilmPlates(shop.heroHud && shop.heroHud.buttons.length > 0 ? shop.heroHud : { title: "", buttons: studioDefaultButtons(shop.niche, shop.heroVideoUrl, `/${shop.slug}/book`), plates: [] }, {
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
  const [selected, setSelected] = useState(hud.buttons[0]?.id ?? "");
  const current = hud.buttons.find((button) => button.id === selected) ?? hud.buttons[0];

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
      <DefaultAssetStudioPanel shop={shop} readonly={readonly} />
      <div className="hud-stage">
        {isSharkHeroFilm(film) ? (
          <HeroSharkInteractive active>
            {film ? <video src={film} autoPlay muted loop playsInline /> : <div className="hud-stage-empty" />}
          </HeroSharkInteractive>
        ) : (
          <InteractiveOtterHero active={isOtterHeroFilm(film)}>
            {film ? <video src={film} autoPlay muted loop playsInline /> : <div className="hud-stage-empty" />}
          </InteractiveOtterHero>
        )}
        <HeroHud
          hud={hud}
          bookHref={`/${shop.slug}/book`}
          editable={!readonly}
          interactive={!readonly}
          buoyant={(isOtterHeroFilm(film) || isSharkHeroFilm(film)) && readonly}
          onSelect={setSelected}
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
          disabled={readonly}
          onClick={() => {
            const buttons = studioDefaultButtons(shop.niche, film, `/${shop.slug}/book`);
            setSelected(buttons[0]?.id ?? "");
            publish({ ...hud, buttons }, true);
          }}
        >
          Load niche defaults
        </button>
        <button
          type="button"
          className="studio-switch"
          disabled={readonly || !current || hud.buttons[0]?.id === current?.id}
          onClick={() => {
            if (!current) return;
            const index = hud.buttons.findIndex((button) => button.id === current.id);
            if (index < 1) return;
            const buttons = hud.buttons.slice();
            const swap = buttons[index - 1];
            const row = buttons[index];
            if (!swap || !row) return;
            buttons[index - 1] = row;
            buttons[index] = swap;
            publish({ ...hud, buttons }, true);
          }}
        >
          Up
        </button>
        <button
          type="button"
          className="studio-switch"
          disabled={readonly || !current || hud.buttons[hud.buttons.length - 1]?.id === current?.id}
          onClick={() => {
            if (!current) return;
            const index = hud.buttons.findIndex((button) => button.id === current.id);
            if (index < 0 || index >= hud.buttons.length - 1) return;
            const buttons = hud.buttons.slice();
            const swap = buttons[index + 1];
            const row = buttons[index];
            if (!swap || !row) return;
            buttons[index + 1] = row;
            buttons[index] = swap;
            publish({ ...hud, buttons }, true);
          }}
        >
          Down
        </button>
        <button
          type="button"
          className="studio-switch"
          disabled={readonly || hud.buttons.length >= 6}
          onClick={() => {
            const id = freshId();
            setSelected(id);
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
      {current && !readonly ? (
        <div className="hero-response-card">
          <label className="motion-label" htmlFor={`mobile-response-${current.id}`}>
            When tapped
          </label>
          <select
            id={`mobile-response-${current.id}`}
            className="film-select"
            value={current.response}
            onChange={(event) => {
              const response = event.target.value as HeroResponseAction;
              publish({
                ...hud,
                buttons: hud.buttons.map((button) =>
                  button.id === current.id
                    ? { ...button, response, action: actionFor(response, button.href) }
                    : button,
                ),
              }, true);
            }}
          >
            {HERO_RESPONSE_ACTIONS.map((response) => (
              <option key={response} value={response}>
                {HERO_RESPONSE_LABEL[response]}
              </option>
            ))}
          </select>
          {current.response !== "modal" ? (
            <>
              <label className="motion-label" htmlFor={`mobile-target-${current.id}`}>
                {current.response === "scrollTo" ? "Section" : current.response === "apiTrigger" ? "Checkout page" : "Link"}
              </label>
              <input
                id={`mobile-target-${current.id}`}
                className="motion-tag"
                value={current.href}
                maxLength={180}
                placeholder={current.response === "scrollTo" ? "#services" : current.response === "apiTrigger" ? `/${shop.slug}/book` : "https://"}
                onChange={(event) =>
                  setHud({
                    ...hud,
                    buttons: hud.buttons.map((button) =>
                      button.id === current.id ? { ...button, href: event.target.value } : button,
                    ),
                  })
                }
                onBlur={(event) =>
                  publish({
                    ...hud,
                    buttons: hud.buttons.map((button) =>
                      button.id === current.id ? { ...button, href: event.target.value } : button,
                    ),
                  }, true)
                }
              />
            </>
          ) : null}
          <p className="motion-label">Click animation</p>
          <div className="hero-choice-row" role="group" aria-label="Click animation">
            {HERO_CLICK_ANIMATIONS.map((animation) => (
              <button
                key={animation}
                type="button"
                className={current.clickAnimation === animation ? "studio-switch is-on" : "studio-switch"}
                aria-pressed={current.clickAnimation === animation}
                onClick={() =>
                  publish({
                    ...hud,
                    buttons: hud.buttons.map((button) =>
                      button.id === current.id ? { ...button, clickAnimation: animation as HeroClickAnimation } : button,
                    ),
                  }, true)
                }
              >
                {HERO_ANIMATION_LABEL[animation]}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {error ? <p className="motion-error">{error}</p> : null}
      {status ? <p className="motion-status">{status}</p> : null}
    </section>
  );
}
