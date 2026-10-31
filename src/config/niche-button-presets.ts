import { resolveCatalogNiche } from "./catalog.ts";
import {
  actionFor,
  type HeroButtonVariant,
  type HeroClickAnimation,
  type HeroHudButton,
  type HeroHudConfig,
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

/** Common names that are not catalog ids, mapped onto preset keys. */
const PRESET_ALIAS: Record<string, string> = {
  auto_repair: "auto",
  "auto-repair": "auto",
  rafting: "power-sports",
  raft: "power-sports",
  cleaning: "cleaning",
  clean: "cleaning",
};

export type NicheButtonOptions = { bookHref?: string; phone?: string };

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

function barber(_opts: NicheButtonOptions): HeroHudButton[] {
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

function field(opts: NicheButtonOptions): HeroHudButton[] {
  const dial = (opts.phone ?? "").replace(/[^\d+]/g, "").slice(0, 16);
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

function auto(opts: NicheButtonOptions): HeroHudButton[] {
  return [
    control("hud_bay00001", "Book the Bay", "calendar-check", "apiTrigger", "morph-success", 12, 18, {
      href: opts.bookHref ?? "",
      successMessage: "The bay is reserved.",
    }),
    control("hud_menu0001", "Service Menu", "layers", "scrollTo", "ripple-shockwave", 88, 18, {
      variant: "solid-obsidian",
      href: "#services",
    }),
  ];
}

function landscaping(_opts: NicheButtonOptions): HeroHudButton[] {
  return [
    control("hud_site0001", "Book a Site Visit", "calendar-check", "modal", "morph-success", 12, 18, {
      successMessage: "The visit is on the book.",
    }),
    control("hud_grounds1", "View Grounds Work", "layers", "scrollTo", "particle-burst", 88, 18, {
      variant: "solid-obsidian",
      href: "#proof",
    }),
  ];
}

function rafting(opts: NicheButtonOptions): HeroHudButton[] {
  return [
    control("hud_trip0001", "Book a Trip", "calendar-check", "apiTrigger", "morph-success", 12, 18, {
      href: opts.bookHref ?? "",
      successMessage: "The boat is held.",
    }),
    control("hud_river001", "River Days", "layers", "scrollTo", "ripple-shockwave", 88, 18, {
      variant: "solid-obsidian",
      href: "#services",
    }),
  ];
}

function cleaning(_opts: NicheButtonOptions): HeroHudButton[] {
  return [
    control("hud_clean001", "Book a Clean", "calendar-check", "modal", "morph-success", 12, 18, {
      successMessage: "The crew is on the calendar.",
    }),
    control("hud_before01", "See Before / After", "layers", "scrollTo", "particle-burst", 88, 18, {
      variant: "solid-obsidian",
      href: "#proof",
    }),
  ];
}

function general(_opts: NicheButtonOptions): HeroHudButton[] {
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

/** Four gateway buttons for the deep-sea shark storefront. */
export function deepSeaHeroButtons(bookHref = ""): HeroHudButton[] {
  return [
    control("hud_explor01", "Explore Services", "layers", "scrollTo", "ripple-shockwave", 12, 18, {
      variant: "solid-obsidian",
      href: "#services",
    }),
    control("hud_proof001", "Proof of Work Albums", "layers", "scrollTo", "particle-burst", 88, 18, {
      href: "#proof",
    }),
    control("hud_review01", "Client Reviews", "message-circle", "scrollTo", "pulse-glow", 12, 82, {
      href: "#reviews",
    }),
    control("hud_book0001", "Book Now", "calendar-check", "apiTrigger", "morph-success", 88, 82, {
      href: bookHref,
      successMessage: "The book is open.",
    }),
  ];
}

/**
 * Catalog niches plus the common aliases the studio copy uses
 * (auto_repair, rafting, cleaning).
 */
export const NICHE_BUTTON_PRESETS: Record<string, (opts: NicheButtonOptions) => HeroHudButton[]> = {
  barber,
  contractor: field,
  auto,
  landscaping,
  "power-sports": rafting,
  cleaning,
};

function presetKey(niche: string): string {
  const raw = niche.trim().toLowerCase();
  if (PRESET_ALIAS[raw]) return PRESET_ALIAS[raw];
  return resolveCatalogNiche(raw);
}

/** Two perimeter buttons for a niche. Used when a shop has not saved its own set. */
export function nicheHeroButtons(niche: string, options?: { phone?: string; bookHref?: string }): HeroHudButton[] {
  const opts: NicheButtonOptions = { phone: options?.phone ?? "", bookHref: options?.bookHref ?? "" };
  const key = presetKey(niche);
  const preset = NICHE_BUTTON_PRESETS[key];
  if (preset) return preset(opts);
  if (FIELD_NICHES.has(key)) return field(opts);
  return general(opts);
}

/** Empty HUD: deep-sea four-pack on the shark loop, otherwise the niche pair. */
export function studioDefaultButtons(niche: string, film: string, bookHref = "", phone = ""): HeroHudButton[] {
  const path = film.split("?")[0] ?? "";
  if (path.endsWith("/shark-hero-animation.mp4")) return deepSeaHeroButtons(bookHref);
  return nicheHeroButtons(niche, { phone, bookHref });
}

/** Seed payload written to `shop_hero_config` when a shop or niche is created. */
export function defaultShopHeroHud(niche: string, slug: string, film = "", phone = ""): HeroHudConfig {
  const bookHref = slug ? `/${slug}/book` : "";
  return { title: "", buttons: studioDefaultButtons(niche, film, bookHref, phone), plates: [] };
}
