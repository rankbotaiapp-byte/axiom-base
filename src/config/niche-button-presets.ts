import {
  actionFor,
  type HeroButtonVariant,
  type HeroClickAnimation,
  type HeroHudButton,
  type HeroHudIcon,
  type HeroResponseAction,
} from "../lib/axiom/hero-hud.ts";

const FIELD_NICHES = new Set([
  "contractor",
  "electrical",
  "hvac",
  "plumbing",
  "roofing",
  "fabrication",
  "machining",
  "glasswork",
  "stone-masonry",
  "security",
  "tool-repair",
]);

function control(
  id: string,
  label: string,
  icon: HeroHudIcon,
  response: HeroResponseAction,
  animation: HeroClickAnimation,
  x: number,
  y: number,
  extra?: { variant?: HeroButtonVariant; successMessage?: string; href?: string; phone?: string },
): HeroHudButton {
  const href = extra?.href ?? "";
  return {
    id,
    label: label.slice(0, 28),
    icon,
    action: actionFor(response, href),
    x,
    y,
    phone: extra?.phone ?? "",
    href,
    variant: extra?.variant ?? "neon-glass",
    clickAnimation: animation,
    successMessage: (extra?.successMessage ?? "").slice(0, 80),
    response,
  };
}

function barber(): HeroHudButton[] {
  return [
    control("hud_fade0001", "Book Fade & Trim", "calendar-check", "modal", "morph-success", 12, 18, {
      successMessage: "The chair is open.",
    }),
    control("hud_gallery01", "View Cut Gallery", "layers", "scrollTo", "ripple-shockwave", 88, 18, {
      variant: "solid-obsidian",
      href: "#services",
    }),
  ];
}

function field(phone: string): HeroHudButton[] {
  const dial = phone.replace(/[^\d+]/g, "").slice(0, 16);
  const href = /^\+?\d{7,16}$/.test(dial) ? `tel:${dial}` : "";
  return [
    control("hud_estim001", "Request Free Estimate", "calendar-check", "modal", "morph-success", 12, 18, {
      successMessage: "We'll open the estimate.",
    }),
    control("hud_call0001", "Call Direct", "phone", "externalUrl", "pulse-glow", 88, 18, {
      variant: "liquid-metal",
      href,
      phone: dial,
    }),
  ];
}

function general(): HeroHudButton[] {
  return [
    control("hud_quote001", "Get Instant Quote", "zap", "modal", "morph-success", 12, 18, {
      successMessage: "The quote is ready.",
    }),
    control("hud_explor01", "Explore Services", "layers", "scrollTo", "ripple-shockwave", 88, 18, {
      variant: "solid-obsidian",
      href: "#services",
    }),
  ];
}

/** Two perimeter buttons for a niche. Used when a shop has not saved its own set. */
export function nicheHeroButtons(niche: string, options?: { phone?: string }): HeroHudButton[] {
  if (niche === "barber") return barber();
  if (FIELD_NICHES.has(niche)) return field(options?.phone ?? "");
  return general();
}
