import { isCatalogNiche, type CatalogNiche } from "@/config/catalog";

/** Session stash for inbound hero CTA → login → provision resume. */
export const INBOUND_PENDING_KEY = "axiom.inbound.pending";

export type InboundPending = {
  name: string;
  niche: CatalogNiche;
};

export function readInboundPending(): InboundPending | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(INBOUND_PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<InboundPending>;
    const name = typeof parsed.name === "string" ? parsed.name.trim() : "";
    const niche = typeof parsed.niche === "string" ? parsed.niche.trim() : "";
    if (!name || !isCatalogNiche(niche)) return null;
    return { name, niche };
  } catch {
    return null;
  }
}

export function writeInboundPending(pending: InboundPending): void {
  sessionStorage.setItem(INBOUND_PENDING_KEY, JSON.stringify(pending));
}

export function clearInboundPending(): void {
  sessionStorage.removeItem(INBOUND_PENDING_KEY);
}
