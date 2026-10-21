import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  BLUR_STEPS,
  CARD_STEPS,
  DAMP_STEPS,
  DEPTH_STEPS,
  FADE_STEPS,
  FORCE_STEPS,
  GLOW_STEPS,
  HERO_EFFECTS,
  HERO_EFFECT_LABELS,
  HERO_FONTS,
  HERO_LAYER_IDS,
  HERO_LAYER_LABELS,
  HERO_WASHES,
  LOOK_PRESETS,
  RADIUS_STEPS,
  activeLookPreset,
  sanitizeGradient,
  setHeroLayer,
  type HeroLayerId,
  type HeroPick,
  type StorefrontHud,
} from "@/lib/axiom/hud";
import { sanitizeAccent } from "@/lib/axiom/prospect-brand";

export function PreviewStudio({
  hud,
  onChange,
  onCommit,
  heroChoices,
  activeLayer = "headline",
  onActiveLayer,
  variant = "public",
}: {
  hud: StorefrontHud;
  onChange: (next: StorefrontHud) => void;
  /** Writes the hero layout after a finished edit. Sliders stay local until the form saves. */
  onCommit?: (next: StorefrontHud) => void;
  heroChoices: { id: HeroPick; label: string }[];
  activeLayer?: HeroLayerId;
  onActiveLayer?: (id: HeroLayerId) => void;
  /** Public onboarding offers three looks. Admin keeps the raw physics sliders. */
  variant?: "public" | "admin";
}) {
  function patch(partial: Partial<StorefrontHud>) {
    onChange({ ...hud, ...partial });
  }

  function editLayer(partial: Partial<StorefrontHud["layers"][HeroLayerId]>, persist = false) {
    const next = setHeroLayer(hud, activeLayer, { ...hud.layers[activeLayer], ...partial });
    onChange(next);
    if (persist) onCommit?.(next);
  }

  return (
    <section className="mx-auto max-w-5xl px-5 py-8 sm:px-10">
      <div className="hud-card grid min-h-[22rem] gap-5 rounded-[24px] p-5 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Live preview studio</p>
          <p className="mt-2 font-display text-3xl">Feather, glow, and the line.</p>
          <p className="mt-2 text-sm text-muted">
            Drag a line on the hero, then set its type, color, and effect here. The preview updates before you save.
          </p>
        </div>
        <div className="grid gap-4 lg:col-span-7">
          <HeroTypeControls
            hud={hud}
            activeLayer={activeLayer}
            onActiveLayer={onActiveLayer}
            editLayer={editLayer}
          />
          {variant === "public" ? <LookPresets hud={hud} onPick={patch} /> : null}
          <label className="text-sm text-muted">
            Card opacity {Math.round((CARD_STEPS[hud.card] ?? 0.5) * 100)}%
            <input
              type="range"
              min={0}
              max={CARD_STEPS.length - 1}
              step={1}
              value={hud.card}
              onChange={(event) => patch({ card: Number(event.target.value) })}
              className="mt-2 w-full accent-accent"
            />
          </label>
          {variant === "admin" ? (
            <details className="rounded-2xl bg-surface-2 px-4 py-3">
              <summary className="cursor-pointer text-sm text-fg">Advanced 3D & Shader Physics (Developer Mode)</summary>
              <div className="mt-4 grid gap-4">
                <PhysicsSlider
                  label={`Edge fade ${hud.fade}%`}
                  max={FADE_STEPS.length - 1}
                  value={Math.max(0, FADE_STEPS.indexOf(hud.fade))}
                  onChange={(index) => patch({ fade: FADE_STEPS[index] ?? hud.fade })}
                />
                <PhysicsSlider
                  label={`Glow ${hud.glow}`}
                  max={GLOW_STEPS.length - 1}
                  value={Math.max(0, GLOW_STEPS.indexOf(hud.glow))}
                  onChange={(index) => patch({ glow: GLOW_STEPS[index] ?? hud.glow })}
                />
                <PhysicsSlider
                  label={`Glass blur ${BLUR_STEPS[hud.blur] ?? 22}px`}
                  max={BLUR_STEPS.length - 1}
                  value={hud.blur}
                  onChange={(index) => patch({ blur: index })}
                />
                <PhysicsSlider
                  label={`Spring damping ${DAMP_STEPS[hud.damp] ?? 10}`}
                  max={DAMP_STEPS.length - 1}
                  value={hud.damp}
                  onChange={(index) => patch({ damp: index })}
                />
                <PhysicsSlider
                  label={`Displacement ${FORCE_STEPS[hud.force] ?? 16}px`}
                  max={FORCE_STEPS.length - 1}
                  value={hud.force}
                  onChange={(index) => patch({ force: index })}
                />
                <PhysicsSlider
                  label={`Proximity ${RADIUS_STEPS[hud.radius] ?? 140}px`}
                  max={RADIUS_STEPS.length - 1}
                  value={hud.radius}
                  onChange={(index) => patch({ radius: index })}
                />
                <PhysicsSlider
                  label={`Depth feather ${DEPTH_STEPS[hud.depth] ?? 0.7}`}
                  max={DEPTH_STEPS.length - 1}
                  value={hud.depth}
                  onChange={(index) => patch({ depth: index })}
                />
              </div>
            </details>
          ) : null}
          <label className="text-sm text-muted">
            Wash
            <select
              value={hud.wash}
              onChange={(event) => patch({ wash: event.target.value as StorefrontHud["wash"] })}
              className="mt-2 h-11 w-full rounded-xl bg-surface-2 px-3 text-sm text-fg"
            >
              {HERO_WASHES.map((wash) => (
                <option key={wash} value={wash}>
                  {wash}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-muted">
            Hero asset
            <select
              value={hud.heroPick}
              onChange={(event) => patch({ heroPick: event.target.value as HeroPick })}
              className="mt-2 h-11 w-full rounded-xl bg-surface-2 px-3 text-sm text-fg"
            >
              {heroChoices.map((choice) => (
                <option key={choice.id} value={choice.id}>
                  {choice.label}
                </option>
              ))}
            </select>
          </label>
          {hud.heroPick === "url" ? (
            <label className="text-sm text-muted">
              Custom media URL
              <input
                value={hud.heroUrl}
                onChange={(event) => patch({ heroUrl: event.target.value })}
                placeholder="/media/... or https://"
                className="mt-2 h-11 w-full rounded-xl bg-surface-2 px-3 text-sm text-fg"
              />
            </label>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              aria-pressed={hud.rim}
              onClick={() => patch({ rim: !hud.rim })}
              className="h-11 rounded-full bg-surface-2 px-4 text-sm"
            >
              Border glow {hud.rim ? "on" : "off"}
            </button>
            <button
              type="button"
              aria-pressed={hud.scan}
              onClick={() => patch({ scan: !hud.scan })}
              className="h-11 rounded-full bg-surface-2 px-4 text-sm"
            >
              Scan {hud.scan ? "on" : "off"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function LookPresets({ hud, onPick }: { hud: StorefrontHud; onPick: (partial: Partial<StorefrontHud>) => void }) {
  const active = activeLookPreset(hud);
  return (
    <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Studio look">
      {LOOK_PRESETS.map((preset) => (
        <button
          key={preset.id}
          type="button"
          role="radio"
          aria-checked={active === preset.id}
          onClick={() => onPick(preset.hud)}
          className={`rounded-2xl px-3 py-3 text-left ${active === preset.id ? "bg-fg text-bg" : "bg-surface-2 text-fg"}`}
        >
          <span
            aria-hidden
            className={`block h-8 rounded-lg ${preset.id === "studio" ? "bg-accent" : preset.id === "frost" ? "bg-surface" : "bg-bg"}`}
            style={
              preset.id === "frost"
                ? { boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--color-fg) 28%, transparent)", backdropFilter: "blur(8px)" }
                : preset.id === "minimal"
                  ? { boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--color-fg) 18%, transparent)" }
                  : { boxShadow: "0 0 18px color-mix(in srgb, var(--color-accent) 55%, transparent)" }
            }
          />
          <span className="mt-2 block text-sm">{preset.label}</span>
          <span className={`mt-1 block text-xs ${active === preset.id ? "text-bg/70" : "text-muted"}`}>{preset.line}</span>
        </button>
      ))}
    </div>
  );
}

function PhysicsSlider({
  label,
  max,
  value,
  onChange,
}: {
  label: string;
  max: number;
  value: number;
  onChange: (index: number) => void;
}) {
  return (
    <label className="text-sm text-muted">
      {label}
      <input
        type="range"
        min={0}
        max={max}
        step={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 w-full accent-accent"
      />
    </label>
  );
}

function HeroTypeControls({
  hud,
  activeLayer,
  onActiveLayer,
  editLayer,
}: {
  hud: StorefrontHud;
  activeLayer: HeroLayerId;
  onActiveLayer?: (id: HeroLayerId) => void;
  editLayer: (partial: Partial<StorefrontHud["layers"][HeroLayerId]>, persist?: boolean) => void;
}) {
  const layer = hud.layers[activeLayer];
  const [gradientDraft, setGradientDraft] = useState(layer.gradientCss);
  const [colorDraft, setColorDraft] = useState(layer.solidColor);

  useEffect(() => {
    setGradientDraft(layer.gradientCss);
    setColorDraft(layer.solidColor);
  }, [activeLayer, layer.gradientCss, layer.solidColor]);

  return (
    <fieldset className="grid gap-3 rounded-2xl bg-surface-2/70 p-3">
      <legend className="px-1 text-[11px] uppercase tracking-[0.18em] text-muted">Hero type</legend>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Text layer">
        {HERO_LAYER_IDS.map((id) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={activeLayer === id}
            onClick={() => onActiveLayer?.(id)}
            className={`h-10 rounded-full px-3 text-sm ${activeLayer === id ? "bg-fg text-bg" : "bg-surface text-fg"}`}
          >
            {HERO_LAYER_LABELS[id]}
          </button>
        ))}
      </div>
      <label className="text-sm text-muted">
        Text
        <input
          value={layer.text}
          maxLength={activeLayer === "cta_button" ? 48 : activeLayer === "subheadline" ? 180 : 140}
          onChange={(event) => editLayer({ text: event.target.value })}
          onBlur={() => editLayer({ text: layer.text }, true)}
          placeholder={
            activeLayer === "headline" ? "Blank keeps the shop name" : activeLayer === "cta_button" ? "Blank keeps the book label" : "Blank keeps the tagline"
          }
          className="mt-2 h-11 w-full rounded-xl bg-surface px-3 text-sm text-fg"
        />
      </label>
      <label className="text-sm text-muted">
        Font
        <select
          value={layer.fontFamily}
          onChange={(event) => editLayer({ fontFamily: event.target.value as (typeof HERO_FONTS)[number] }, true)}
          className="mt-2 h-11 w-full rounded-xl bg-surface px-3 text-sm text-fg"
        >
          {HERO_FONTS.map((font) => (
            <option key={font} value={font}>
              {font}
            </option>
          ))}
        </select>
      </label>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Color mode">
        {(["solid", "gradient"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={layer.colorMode === mode}
            onClick={() => editLayer({ colorMode: mode }, true)}
            className={`h-10 rounded-full px-3 text-sm capitalize ${layer.colorMode === mode ? "bg-fg text-bg" : "bg-surface text-fg"}`}
          >
            {mode}
          </button>
        ))}
      </div>
      <label className="text-sm text-muted">
        Solid color
        <span className="mt-2 flex gap-2">
          <input
            type="color"
            value={layer.solidColor}
            aria-label="Solid color picker"
            onChange={(event) => editLayer({ solidColor: event.target.value.toUpperCase() })}
            onBlur={() => editLayer({ solidColor: layer.solidColor }, true)}
            className="h-11 w-14 cursor-pointer rounded-xl bg-surface p-1"
          />
          <input
            value={colorDraft}
            onChange={(event) => {
              setColorDraft(event.target.value);
              const next = sanitizeAccent(event.target.value);
              if (next) editLayer({ solidColor: next });
            }}
            onBlur={() => {
              const next = sanitizeAccent(colorDraft) || layer.solidColor;
              setColorDraft(next);
              editLayer({ solidColor: next }, true);
            }}
            spellCheck={false}
            className="h-11 min-w-0 flex-1 rounded-xl bg-surface px-3 font-mono text-sm text-fg"
          />
        </span>
      </label>
      <label className="text-sm text-muted">
        CSS gradient
        <input
          value={gradientDraft}
          onChange={(event) => {
            setGradientDraft(event.target.value);
            const next = sanitizeGradient(event.target.value, "");
            if (next) editLayer({ gradientCss: next });
          }}
          onBlur={() => {
            const next = sanitizeGradient(gradientDraft, layer.gradientCss);
            setGradientDraft(next);
            editLayer({ gradientCss: next }, true);
          }}
          spellCheck={false}
          placeholder="linear-gradient(...)"
          className="mt-2 h-11 w-full rounded-xl bg-surface px-3 font-mono text-sm text-fg"
        />
      </label>
      <label className="text-sm text-muted">
        Visual effect
        <select
          value={layer.effect}
          onChange={(event) => editLayer({ effect: event.target.value as (typeof HERO_EFFECTS)[number] }, true)}
          className="mt-2 h-11 w-full rounded-xl bg-surface px-3 text-sm text-fg"
        >
          {HERO_EFFECTS.map((effect) => (
            <option key={effect} value={effect}>
              {HERO_EFFECT_LABELS[effect]}
            </option>
          ))}
        </select>
      </label>
    </fieldset>
  );
}

const FAQ = [
  {
    q: "What does the trial cost today?",
    a: "The 30-day trial is $0 today. The published renewal is $497 a month starting day 31.",
  },
  {
    q: "What is the monthly plan?",
    a: "Managed Territory Growth Engine is $497 every month. The calculator multiplies that published price. It is not a discount.",
  },
  {
    q: "What is the one-time plan?",
    a: "Lifetime Territory Monopoly is $2,497 once. The territory stays with that purchase.",
  },
  {
    q: "Does the page send outreach?",
    a: "No. Campaign mode stays in simulation. Nothing on this page sends a live message.",
  },
] as const;

export function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(0);
  const reduced = useReducedMotion();
  return (
    <section id="faq" className="px-5 py-16 sm:px-10">
      <div className="mx-auto max-w-3xl">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted">Questions</p>
        <h2 className="mt-2 font-display text-3xl">The book, in plain terms.</h2>
        <div className="mt-8 grid gap-2">
          {FAQ.map((item, index) => {
            const on = open === index;
            return (
              <div key={item.q} className="hud-card overflow-hidden rounded-2xl">
                <button
                  type="button"
                  aria-expanded={on}
                  onClick={() => setOpen(on ? null : index)}
                  className="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm"
                >
                  {item.q}
                  <span className="text-muted">{on ? "−" : "+"}</span>
                </button>
                <AnimatePresence initial={false}>
                  {on ? (
                    <motion.div
                      key="body"
                      initial={reduced ? false : { height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={reduced ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
                      transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }}
                    >
                      <p className="px-4 pb-4 text-sm text-muted">{item.a}</p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
