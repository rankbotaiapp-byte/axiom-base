/** A screen the owner can be standing on. Help text is written ahead of time for each one. */
export type AvatarScreenId =
  | "niche_selection"
  | "lead_dashboard"
  | "storefront_editor"
  | "audit_widget"
  | "booking"
  | "welcome";

export interface AvatarHelpEntry {
  screen: AvatarScreenId;
  title: string;
  persona: string;
  body: string;
  steps: readonly string[];
}

export const AVATAR_PERSONA = "Eric";

/**
 * Spoken-style guidance for each screen.
 * Nothing here is generated. Tapping Help only looks up the screen the owner is already on.
 */
export const AVATAR_HELP: Record<AvatarScreenId, AvatarHelpEntry> = {
  niche_selection: {
    screen: "niche_selection",
    title: "Pick the trade",
    persona: AVATAR_PERSONA,
    body: "You don't write the page from a blank box. Tap Just me or A team, then tap the trade that matches the work. The name, the services, and the booking button are already filled in. You can change the name before you continue.",
    steps: [
      "Tap Just me if clients book you, or A team if each person has their own book.",
      "Tap a trade. The ready name drops into the name box.",
      "Continue. The public page is built from that trade.",
    ],
  },
  lead_dashboard: {
    screen: "lead_dashboard",
    title: "Today's book",
    persona: AVATAR_PERSONA,
    body: "This is the desk. New bookings land here. You don't hunt through settings to see who is coming. Open a booking when you are ready to confirm it.",
    steps: [
      "Read the list. Each row is a person and a time.",
      "Confirm the ones you can take.",
      "Use the tabs when you want the public page, the services, or the team.",
    ],
  },
  storefront_editor: {
    screen: "storefront_editor",
    title: "The public page",
    persona: AVATAR_PERSONA,
    body: "The page already has a title, a line under the name, a color, and services. Tap a ready page if you want a different starting set, like roofing instead of a general contractor. Then save. You never have to invent the first draft.",
    steps: [
      "Tap a ready page. The name and the line fill themselves.",
      "Tap a search word if you want it in that line.",
      "Save. The customer site uses what you saved.",
    ],
  },
  audit_widget: {
    screen: "audit_widget",
    title: "The questions on your page",
    persona: AVATAR_PERSONA,
    body: "Visitors answer a few taps, then see a score and a way to book. The questions come from the trade you picked. You don't write them, and nothing is sent to an outside assistant.",
    steps: [
      "A visitor taps the choices that match the job.",
      "They leave a name and a phone or email.",
      "The answer is saved on your shop so you can call them back.",
    ],
  },
  booking: {
    screen: "booking",
    title: "How a customer books",
    persona: AVATAR_PERSONA,
    body: "This is the page your customer uses. They pick a service, a person, and a time. The button label is already written for the trade, such as Book a chair or Book a plumber.",
    steps: [
      "They pick the service.",
      "They pick who they want, if you have a team.",
      "They pick a time and send the request.",
    ],
  },
  welcome: {
    screen: "welcome",
    title: "You're on the book",
    persona: AVATAR_PERSONA,
    body: "The introduction plays once. When it finishes, continue to the desk. From there you confirm bookings and change the public page by tapping, not by starting over.",
    steps: [
      "Let the introduction play.",
      "Continue to the desk.",
      "Open the public page if you want to see what customers see.",
    ],
  },
};

export function avatarHelpFor(screen: AvatarScreenId): AvatarHelpEntry {
  return AVATAR_HELP[screen];
}

/** Which prepared note matches this address, before a desk tab overrides it. */
export function screenFromPath(pathname: string): AvatarScreenId {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/" || path === "/onboard") return "niche_selection";
  if (path === "/welcome") return "welcome";
  if (path === "/master-admin" || path.endsWith("/admin")) return "lead_dashboard";
  if (path.endsWith("/book")) return "booking";
  return "audit_widget";
}
