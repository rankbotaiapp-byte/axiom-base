import { useState } from "react";
import { HeroHud } from "@/components/hero-hud";
import { nicheHeroButtons } from "@/config/niche-button-presets";
import { getNicheActions } from "@/config/niche-actions";
import {
  HERO_ANIMATION_LABEL,
  HERO_BUTTON_VARIANTS,
  HERO_CLICK_ANIMATIONS,
  HERO_HUD_ICONS,
  HERO_RESPONSE_ACTIONS,
  HERO_RESPONSE_LABEL,
  HERO_VARIANT_LABEL,
  actionFor,
  parseHeroHud,
  seedFilmPlates,
  type HeroClickAnimation,
  type HeroHudButton,
  type HeroHudConfig,
  type HeroResponseAction,
  type HeroButtonVariant,
} from "@/lib/axiom/hero-hud";
import { revalidateStorefront, updateShopBrand } from "@/lib/axiom/server";
import type { Shop } from "@/lib/axiom/types";

function freshId(): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  let body = "";
  for (let i = 0; i < 8; i += 1) body += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `hud_${body}`;
}

function blankButton(id: string): HeroHudButton {
  return {
    id,
    label: "New button",
    icon: "zap",
    action: "booking",
    x: 12,
    y: 48,
    phone: "",
    href: "",
    variant: "neon-glass",
    clickAnimation: "pulse-glow",
    successMessage: "",
    response: "modal",
  };
}

export function HeroButtonStudio({
  shop,
  readonly,
  film,
}: {
  shop: Shop;
  readonly: boolean;
  film: string;
}) {
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
  const [selected, setSelected] = useState(hud.buttons[0]?.id ?? "");
  const [preview, setPreview] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const current = hud.buttons.find((button) => button.id === selected) ?? hud.buttons[0];

  function publish(next: HeroHudConfig, immediate = false) {
    setHud(next);
    if (readonly || !immediate) return;
    const clean = parseHeroHud(next);
    if (!clean) return;
    setError("");
    void updateShopBrand({ data: { slug: shop.slug, heroHud: clean, markHero: true } })
      .then(() => revalidateStorefront({ data: shop.slug }))
      .then(() => setNote("Button layout saved."))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not save the buttons"));
  }

  function tune(id: string, patch: Partial<HeroHudButton>, commit = true) {
    const next = {
      ...hud,
      buttons: hud.buttons.map((button) => {
        if (button.id !== id) return button;
        const merged = { ...button, ...patch };
        if (patch.response) merged.action = actionFor(patch.response, merged.href);
        return merged;
      }),
    };
    publish(next, commit);
  }

  function play(id: string) {
    setPreview(id);
    window.setTimeout(() => setPreview(""), 700);
  }

  return (
    <section className="hud-studio" aria-label="Button studio">
      <div className="hero-studio-head">
        <div>
          <p className="motion-kicker">Button studio</p>
          <p className="motion-help">
            Drag a button to place it. Pick what a tap does, then play the response before you leave the desk.
          </p>
        </div>
        <button
          type="button"
          className="studio-switch"
          disabled={readonly}
          onClick={() => {
            const buttons = nicheHeroButtons(shop.niche);
            setSelected(buttons[0]?.id ?? "");
            publish({ ...hud, buttons }, true);
          }}
        >
          Load niche defaults
        </button>
      </div>
      <div className="hud-stage">
        {film ? <video src={film} autoPlay muted loop playsInline /> : <div className="hud-stage-empty" />}
        <HeroHud
          hud={hud}
          bookHref={`/${shop.slug}/book`}
          editable={!readonly}
          previewId={preview}
          onSelect={setSelected}
          onChange={(next, commit) => {
            setHud(next);
            if (commit) publish(next, true);
          }}
        />
      </div>

      <div className="hero-choice-row" role="group" aria-label="Buttons">
        {hud.buttons.map((button) => (
          <button
            key={button.id}
            type="button"
            className={current?.id === button.id ? "studio-switch is-on" : "studio-switch"}
            aria-pressed={current?.id === button.id}
            onClick={() => setSelected(button.id)}
          >
            {button.label}
          </button>
        ))}
        <button
          type="button"
          className="studio-switch"
          disabled={readonly || hud.buttons.length >= 6}
          onClick={() => {
            const created = blankButton(freshId());
            setSelected(created.id);
            publish({ ...hud, buttons: [...hud.buttons, created] }, true);
          }}
        >
          Add button
        </button>
      </div>

      {current ? (
        <div className="hero-response-card">
          <label className="motion-label" htmlFor={`hero-label-${current.id}`}>
            Label
          </label>
          <input
            id={`hero-label-${current.id}`}
            className="motion-tag"
            value={current.label}
            maxLength={28}
            disabled={readonly}
            onChange={(event) => tune(current.id, { label: event.target.value }, false)}
            onBlur={(event) => tune(current.id, { label: event.target.value }, true)}
          />

          <label className="motion-label" htmlFor={`hero-icon-${current.id}`}>
            Icon
          </label>
          <select
            id={`hero-icon-${current.id}`}
            className="film-select"
            value={current.icon}
            disabled={readonly}
            onChange={(event) => tune(current.id, { icon: event.target.value as HeroHudButton["icon"] })}
          >
            {HERO_HUD_ICONS.map((icon) => (
              <option key={icon} value={icon}>
                {icon}
              </option>
            ))}
          </select>

          <label className="motion-label" htmlFor={`hero-response-${current.id}`}>
            When tapped
          </label>
          <select
            id={`hero-response-${current.id}`}
            className="film-select"
            value={current.response}
            disabled={readonly}
            onChange={(event) => tune(current.id, { response: event.target.value as HeroResponseAction })}
          >
            {HERO_RESPONSE_ACTIONS.map((response) => (
              <option key={response} value={response}>
                {HERO_RESPONSE_LABEL[response]}
              </option>
            ))}
          </select>

          {current.response !== "modal" ? (
            <>
              <label className="motion-label" htmlFor={`hero-target-${current.id}`}>
                {current.response === "scrollTo" ? "Section" : current.response === "apiTrigger" ? "Checkout page" : "Link"}
              </label>
              <input
                id={`hero-target-${current.id}`}
                className="motion-tag"
                value={current.href}
                maxLength={180}
                disabled={readonly}
                placeholder={current.response === "scrollTo" ? "#services" : current.response === "apiTrigger" ? `/${shop.slug}/book` : "https://"}
                onChange={(event) => tune(current.id, { href: event.target.value }, false)}
                onBlur={(event) => tune(current.id, { href: event.target.value }, true)}
              />
            </>
          ) : null}

          <p className="motion-label">Look</p>
          <div className="hero-choice-row" role="group" aria-label="Button look">
            {HERO_BUTTON_VARIANTS.map((variant) => (
              <button
                key={variant}
                type="button"
                className={current.variant === variant ? "studio-switch is-on" : "studio-switch"}
                aria-pressed={current.variant === variant}
                disabled={readonly}
                onClick={() => tune(current.id, { variant: variant as HeroButtonVariant })}
              >
                {HERO_VARIANT_LABEL[variant]}
              </button>
            ))}
          </div>

          <p className="motion-label">Click animation</p>
          <div className="hero-choice-row" role="group" aria-label="Click animation">
            {HERO_CLICK_ANIMATIONS.map((animation) => (
              <button
                key={animation}
                type="button"
                className={current.clickAnimation === animation ? "studio-switch is-on" : "studio-switch"}
                aria-pressed={current.clickAnimation === animation}
                disabled={readonly}
                onClick={() => {
                  tune(current.id, { clickAnimation: animation as HeroClickAnimation });
                  play(current.id);
                }}
              >
                {HERO_ANIMATION_LABEL[animation]}
              </button>
            ))}
          </div>

          <label className="motion-label" htmlFor={`hero-message-${current.id}`}>
            Message
          </label>
          <input
            id={`hero-message-${current.id}`}
            className="motion-tag"
            value={current.successMessage}
            maxLength={80}
            disabled={readonly}
            placeholder="Shown after the tap"
            onChange={(event) => tune(current.id, { successMessage: event.target.value }, false)}
            onBlur={(event) => tune(current.id, { successMessage: event.target.value }, true)}
          />

          <p className="motion-help">{`Placed at ${current.x}% across and ${current.y}% down. Drag the button on the film to move it.`}</p>
          <div className="hero-choice-row">
            <button type="button" className="studio-switch" onClick={() => play(current.id)}>
              Play response
            </button>
            <button
              type="button"
              className="studio-switch"
              disabled={readonly || hud.buttons.length === 0}
              onClick={() => {
                const next = hud.buttons.filter((button) => button.id !== current.id);
                setSelected(next[0]?.id ?? "");
                publish({ ...hud, buttons: next }, true);
              }}
            >
              Remove
            </button>
          </div>
        </div>
      ) : null}
      {error ? <p className="motion-error">{error}</p> : null}
      {note ? <p className="motion-status">{note}</p> : null}
    </section>
  );
}
