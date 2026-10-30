export const HERO_HUD_ACTIONS = ["booking", "phone", "checkout", "url", "services", "help", "chat"] as const;
export type HeroHudAction = (typeof HERO_HUD_ACTIONS)[number];

export const HERO_HUD_ICONS = ["zap", "calendar-check", "layers", "life-buoy", "phone", "message-circle"] as const;
export type HeroHudIcon = (typeof HERO_HUD_ICONS)[number];

export const HERO_BUTTON_VARIANTS = ["neon-glass", "solid-obsidian", "liquid-metal"] as const;
export type HeroButtonVariant = (typeof HERO_BUTTON_VARIANTS)[number];

export const HERO_CLICK_ANIMATIONS = ["pulse-glow", "ripple-shockwave", "morph-success", "particle-burst"] as const;
export type HeroClickAnimation = (typeof HERO_CLICK_ANIMATIONS)[number];

/** What a customer tap does after the click animation. */
export const HERO_RESPONSE_ACTIONS = ["modal", "scrollTo", "externalUrl", "apiTrigger"] as const;
export type HeroResponseAction = (typeof HERO_RESPONSE_ACTIONS)[number];

export const HERO_VARIANT_LABEL: Record<HeroButtonVariant, string> = {
  "neon-glass": "Neon glass",
  "solid-obsidian": "Solid obsidian",
  "liquid-metal": "Liquid metal",
};

export const HERO_ANIMATION_LABEL: Record<HeroClickAnimation, string> = {
  "pulse-glow": "Pulse glow",
  "ripple-shockwave": "Ripple",
  "morph-success": "Morph",
  "particle-burst": "Particle burst",
};

export const HERO_RESPONSE_LABEL: Record<HeroResponseAction, string> = {
  modal: "Open a message",
  scrollTo: "Scroll to a section",
  externalUrl: "Open a link",
  apiTrigger: "Open checkout",
};

export type HeroHudButton = {
  id: string;
  label: string;
  icon: HeroHudIcon;
  action: HeroHudAction;
  x: number;
  y: number;
  phone: string;
  href: string;
  variant: HeroButtonVariant;
  clickAnimation: HeroClickAnimation;
  /** Shown in the message panel after a tap. */
  successMessage: string;
  response: HeroResponseAction;
};

export type HeroHudLine = {
  id: string;
  text: string;
  href: string;
};

/** A corner module: the shop name block or the service list. */
export type HeroHudPlate = {
  id: string;
  x: number;
  y: number;
  lines: HeroHudLine[];
};

export type HeroHudConfig = {
  title: string;
  buttons: HeroHudButton[];
  plates: HeroHudPlate[];
};

export type FilmPlateSeed = {
  name: string;
  tagline: string;
  city: string;
  badge: string;
  bookHref: string;
  services: readonly { title: string; detail: string; priceLabel: string }[];
};

export const HERO_HUD_ACTION_LABEL: Record<HeroHudAction, string> = {
  booking: "Open booking",
  phone: "Phone call",
  checkout: "Launch checkout",
  url: "Open URL",
  services: "Services",
  help: "Ask for help",
  chat: "Ask Eric",
};

const ID = /^hud_[a-z0-9]{4,24}$/;

export function defaultHeroHud(): HeroHudConfig {
  return {
    title: "",
    buttons: [
      button("hud_help0001", "Ask for help", "life-buoy", "help", 10, 20),
      button("hud_svc00001", "Services", "layers", "services", 90, 20),
      button("hud_book0001", "Confirm booking", "calendar-check", "booking", 10, 34),
      button("hud_pay00001", "Instant checkout", "zap", "checkout", 90, 34),
    ],
    plates: [],
  };
}

/** Puts the name and the service list on the bottom corners when a shop has not placed them yet. */
export function seedFilmPlates(hud: HeroHudConfig, seed: FilmPlateSeed): HeroHudConfig {
  const plates = hud.plates.slice();
  if (!plates.some((plate) => plate.id === "plate_identity")) {
    plates.push({
      id: "plate_identity",
      x: 8,
      y: 94,
      lines: [
        { id: "line_badge", text: seed.badge.slice(0, 28), href: "" },
        { id: "line_name", text: seed.name.slice(0, 42), href: "" },
        { id: "line_tag", text: seed.tagline.slice(0, 80), href: "" },
        { id: "line_city", text: seed.city.slice(0, 42), href: "" },
      ],
    });
  }
  if (!plates.some((plate) => plate.id === "plate_services") && seed.services.length > 0) {
    plates.push({
      id: "plate_services",
      x: 92,
      y: 94,
      lines: seed.services.slice(0, 3).flatMap((service, index) => [
        { id: `line_svc${index}_title`, text: service.title.slice(0, 42), href: seed.bookHref },
        { id: `line_svc${index}_detail`, text: service.detail.slice(0, 80), href: "" },
        { id: `line_svc${index}_price`, text: service.priceLabel.slice(0, 16), href: "" },
      ]),
    });
  }
  return { ...hud, plates };
}

export function responseFor(action: HeroHudAction): HeroResponseAction {
  if (action === "services") return "scrollTo";
  if (action === "url" || action === "phone") return "externalUrl";
  if (action === "checkout") return "apiTrigger";
  return "modal";
}

export function actionFor(response: HeroResponseAction, href = ""): HeroHudAction {
  if (response === "scrollTo") return "services";
  if (response === "apiTrigger") return "checkout";
  if (response === "externalUrl") return href.startsWith("tel:") ? "phone" : "url";
  return "booking";
}

function asVariant(value: unknown): HeroButtonVariant {
  return HERO_BUTTON_VARIANTS.includes(value as HeroButtonVariant) ? (value as HeroButtonVariant) : "neon-glass";
}

function asAnimation(value: unknown): HeroClickAnimation {
  return HERO_CLICK_ANIMATIONS.includes(value as HeroClickAnimation) ? (value as HeroClickAnimation) : "pulse-glow";
}

function asResponse(value: unknown, action: HeroHudAction): HeroResponseAction {
  return HERO_RESPONSE_ACTIONS.includes(value as HeroResponseAction) ? (value as HeroResponseAction) : responseFor(action);
}

function cleanMessage(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001f]/g, "").replace(/\s+/g, " ").trim().slice(0, 80);
}

function button(id: string, label: string, icon: HeroHudIcon, action: HeroHudAction, x: number, y: number): HeroHudButton {
  return {
    id,
    label,
    icon,
    action,
    x,
    y,
    phone: "",
    href: "",
    variant: "neon-glass",
    clickAnimation: "pulse-glow",
    successMessage: "",
    response: responseFor(action),
  };
}

function clampPercent(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 50;
  return Math.min(92, Math.max(8, Math.round(n)));
}

function asIcon(value: unknown): HeroHudIcon {
  return HERO_HUD_ICONS.includes(value as HeroHudIcon) ? (value as HeroHudIcon) : "zap";
}

function asAction(value: unknown): HeroHudAction {
  return HERO_HUD_ACTIONS.includes(value as HeroHudAction) ? (value as HeroHudAction) : "booking";
}

function cleanHref(value: unknown): string {
  if (typeof value !== "string") return "";
  const href = value.trim().slice(0, 180);
  if (!href) return "";
  if (/^#[a-z0-9_-]{1,40}$/i.test(href)) return href;
  if (href.startsWith("/") && !href.startsWith("//")) return href;
  if (/^https:\/\//i.test(href)) return href;
  if (/^tel:\+?[\d]{7,16}$/i.test(href)) return href;
  if (/^mailto:[^\s@]+@[^\s@]+$/i.test(href)) return href;
  return "";
}

function parsePlates(raw: unknown): HeroHudPlate[] {
  if (!Array.isArray(raw)) return [];
  const plates: HeroHudPlate[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const row = item as Record<string, unknown>;
    const id = typeof row.id === "string" && /^plate_[a-z0-9_]{2,24}$/.test(row.id) ? row.id : "";
    if (!id || plates.some((plate) => plate.id === id)) continue;
    const source = Array.isArray(row.lines) ? row.lines : [];
    const lines: HeroHudLine[] = [];
    for (const line of source) {
      if (!line || typeof line !== "object" || Array.isArray(line)) continue;
      const entry = line as Record<string, unknown>;
      const lineId = typeof entry.id === "string" && /^line_[a-z0-9_]{2,32}$/.test(entry.id) ? entry.id : "";
      if (!lineId || lines.some((kept) => kept.id === lineId)) continue;
      const text = typeof entry.text === "string" ? entry.text.replace(/\s+/g, " ").trim().slice(0, 80) : "";
      lines.push({ id: lineId, text, href: cleanHref(entry.href) });
      if (lines.length >= 12) break;
    }
    plates.push({ id, x: clampPercent(row.x), y: clampPercent(row.y), lines });
    if (plates.length >= 4) break;
  }
  return plates;
}

export function parseHeroHud(raw: unknown): HeroHudConfig | null {
  const record = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : null;
  if (!record) return null;
  const title = typeof record.title === "string" ? record.title.replace(/\s+/g, " ").trim().slice(0, 42) : "";
  const source = Array.isArray(record.buttons) ? record.buttons : [];
  const buttons: HeroHudButton[] = [];
  for (const item of source) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const row = item as Record<string, unknown>;
    const id = typeof row.id === "string" && ID.test(row.id) ? row.id : "";
    if (!id || buttons.some((button) => button.id === id)) continue;
    const label = typeof row.label === "string" ? row.label.replace(/\s+/g, " ").trim().slice(0, 28) : "";
    if (!label) continue;
    const action = asAction(row.action);
    buttons.push({
      id,
      label,
      icon: asIcon(row.icon),
      action,
      x: clampPercent(row.x),
      y: clampPercent(row.y),
      phone: typeof row.phone === "string" ? row.phone.replace(/[^\d+]/g, "").slice(0, 16) : "",
      href: cleanHref(row.href),
      variant: asVariant(row.variant),
      clickAnimation: asAnimation(row.clickAnimation),
      successMessage: cleanMessage(row.successMessage),
      response: asResponse(row.response, action),
    });
    if (buttons.length >= 6) break;
  }
  const plates = parsePlates(record.plates);
  if (!title && buttons.length === 0 && plates.length === 0) return null;
  return { title, buttons, plates };
}

export function heroHudFromProfile(raw: unknown): HeroHudConfig | null {
  let record: unknown = raw;
  if (typeof raw === "string") {
    if (!raw.trim()) return null;
    try {
      record = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!record || typeof record !== "object" || Array.isArray(record)) return null;
  return parseHeroHud((record as { heroHud?: unknown }).heroHud);
}
