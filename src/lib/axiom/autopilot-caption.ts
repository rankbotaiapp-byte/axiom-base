/** Proof-atom captions, GBP-safe copy, and asset uniqueness (no calendar day). */

const PHONE_RE = /(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/g;
const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const GBP_CAPTION_MAX = 1500;

const GENERIC_FILLER = [
  "book today",
  "book now",
  "quality work",
  "your local shop",
  "call us",
  "we are open",
  "serving the community",
];

export type ProofCaptionInput = {
  shopName: string;
  city: string;
  tradeLabel: string;
  proofAtom: string;
  bookUrl?: string;
};

export function normalizeAssetUrl(url: string | null | undefined): string {
  return String(url ?? "")
    .trim()
    .split("?")[0]
    .replace(/\/$/, "")
    .toLowerCase();
}

/** Shop + still (or motion) identity. Day is intentionally omitted so the same photo never recycles. */
export function assetPublishKey(shopId: string, stillUrl: string): string {
  return `${shopId.trim()}|${normalizeAssetUrl(stillUrl)}`;
}

export function pickUnusedAssetUrl(candidates: string[], usedKeys: Set<string>, shopId: string): string {
  for (const url of candidates) {
    const clean = String(url ?? "").trim();
    if (!clean) continue;
    if (!usedKeys.has(assetPublishKey(shopId, clean))) return clean;
  }
  return "";
}

export function extractProofAtoms(
  profile: Record<string, unknown>,
  extras: Array<string | null | undefined> = [],
): string[] {
  const bag: string[] = [];
  const push = (value: unknown) => {
    if (typeof value === "string" && value.trim().length >= 8) bag.push(value.replace(/\s+/g, " ").trim().slice(0, 180));
    if (Array.isArray(value)) value.forEach(push);
  };
  push(profile.proofAtom);
  push(profile.specialty);
  push(profile.specialties);
  push(profile.serviceSpecialty);
  push(profile.customerProof);
  push(profile.proofPlates);
  push(profile.jobDetail);
  const services = profile.services;
  if (Array.isArray(services)) {
    for (const item of services) {
      if (typeof item === "string") push(item);
      else if (item && typeof item === "object") {
        const rec = item as Record<string, unknown>;
        push(rec.name);
        push(rec.detail);
        push(rec.caption);
      }
    }
  }
  for (const extra of extras) push(extra);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const atom of bag) {
    const key = atom.toLowerCase();
    if (seen.has(key) || isGenericFiller(atom)) continue;
    seen.add(key);
    out.push(atom);
  }
  return out;
}

export function isGenericFiller(text: string): boolean {
  const lower = text.toLowerCase().replace(/\s+/g, " ").trim();
  if (lower.length < 12) return true;
  return GENERIC_FILLER.some((phrase) => lower === phrase || lower.startsWith(`${phrase} `));
}

export function captionFingerprint(caption: string): string {
  return caption
    .toLowerCase()
    .replace(PHONE_RE, " ")
    .replace(EMAIL_RE, " ")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .slice(0, 120);
}

export function captionsTooSimilar(a: string, b: string): boolean {
  const left = captionFingerprint(a);
  const right = captionFingerprint(b);
  if (!left || !right) return false;
  if (left === right) return true;
  return left.includes(right.slice(0, 48)) || right.includes(left.slice(0, 48));
}

export function captionHitsRecent(caption: string, recent: string[]): boolean {
  return recent.some((item) => captionsTooSimilar(caption, item));
}

export function stripContactDetails(text: string): string {
  return text.replace(PHONE_RE, " ").replace(EMAIL_RE, " ").replace(/\s+/g, " ").trim();
}

export function gbpSafeSummary(caption: string): string {
  return stripContactDetails(caption).slice(0, GBP_CAPTION_MAX);
}

export function captionHasProofAtoms(caption: string, input: ProofCaptionInput): boolean {
  const hay = caption.toLowerCase();
  return (
    hay.includes(input.shopName.toLowerCase().slice(0, 24)) &&
    hay.includes(input.city.toLowerCase().slice(0, 16)) &&
    hay.includes(input.tradeLabel.toLowerCase().slice(0, 12)) &&
    hay.includes(input.proofAtom.toLowerCase().slice(0, 18))
  );
}

export function composeProofCaption(input: ProofCaptionInput): { ok: true; caption: string } | { ok: false; reason: string } {
  const shopName = input.shopName.replace(/\s+/g, " ").trim().slice(0, 48);
  const city = input.city.replace(/\s+/g, " ").trim().slice(0, 40);
  const tradeLabel = input.tradeLabel.replace(/\s+/g, " ").trim().slice(0, 40);
  const proofAtom = input.proofAtom.replace(/\s+/g, " ").trim().slice(0, 180);
  if (!shopName || !city || !tradeLabel || proofAtom.length < 8 || isGenericFiller(proofAtom)) {
    return { ok: false, reason: "queued_needs_copy" };
  }
  const book = (input.bookUrl ?? "").trim();
  const caption = stripContactDetails(
    `${shopName} · ${tradeLabel} in ${city}. ${proofAtom}${book ? ` Book: ${book}` : ""}`,
  );
  if (!captionHasProofAtoms(caption, { shopName, city, tradeLabel, proofAtom })) {
    return { ok: false, reason: "queued_needs_copy" };
  }
  return { ok: true, caption };
}

export function emptyCreditHeroDecision(
  balance: number,
  requiredUnits: number,
  lastApprovedStill: string | null | undefined,
): { generate: true } | { generate: false; reuseUrl: string; reason: string } {
  if (balance >= requiredUnits) return { generate: true };
  const reuseUrl = String(lastApprovedStill ?? "").trim();
  return {
    generate: false,
    reuseUrl,
    reason: reuseUrl
      ? "Render credits empty; last approved still stays on the storefront."
      : "Render credits empty and no approved still is on file.",
  };
}

export function shouldSendOpsAlert(existingKinds: string[], kind: "social_reauth" | "credits_empty"): boolean {
  return !existingKinds.includes(kind);
}

export const SOCIAL_REAUTH_COPY = {
  kind: "social_reauth" as const,
  subject: "Reconnect your social account",
  body: "Reconnect your social account in Axiom so Autopilot can keep posting.",
};

export const CREDITS_EMPTY_COPY = {
  kind: "credits_empty" as const,
  subject: "Render credits ran out",
  body: "Your render credits ran out. Autopilot is holding the last approved still on your storefront until you add a pack.",
};
