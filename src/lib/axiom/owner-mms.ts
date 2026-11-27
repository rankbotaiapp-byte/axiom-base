/** Owner MMS keyword routing and 1/2/3 placement menu (pure). */

export const OWNER_MMS_TTL_MS = 24 * 60 * 60 * 1000;

export const OWNER_MMS_MENU =
  "Got your photo! Added to your Recent Work gallery & queued for Autopilot. Reply 1 to make it your main Hero Banner, 2 to save as a Before photo, or 3 to Undo.";

export type OwnerMmsSlot = "hero" | "before" | "after" | "proof";
export type OwnerMmsMenuReply = "hero" | "before" | "undo";

export type LastMmsUpload = {
  url: string;
  prevHeroUrl: string;
  portfolioId: string;
  slot: OwnerMmsSlot;
  uploadedAt: string;
};

export function parseOwnerMmsKeyword(body: string): OwnerMmsSlot {
  const first = (body ?? "").trim().split(/\s+/)[0]?.toUpperCase() ?? "";
  if (first === "HERO" || first === "BANNER") return "hero";
  if (first === "BEFORE") return "before";
  if (first === "AFTER") return "after";
  if (first === "PROOF") return "proof";
  return "proof";
}

export function parseOwnerMmsMenuReply(body: string): OwnerMmsMenuReply | null {
  const token = (body ?? "").trim().toUpperCase();
  if (token === "1") return "hero";
  if (token === "2") return "before";
  if (token === "3" || token === "UNDO") return "undo";
  return null;
}

export function lastMmsIsFresh(pointer: LastMmsUpload | null | undefined, now = Date.now()): boolean {
  if (!pointer?.url || !pointer.uploadedAt) return false;
  const when = Date.parse(pointer.uploadedAt);
  if (!Number.isFinite(when)) return false;
  return now - when <= OWNER_MMS_TTL_MS;
}

export function parseLastMmsUpload(raw: unknown): LastMmsUpload | null {
  if (!raw || typeof raw !== "object") return null;
  const rec = raw as Record<string, unknown>;
  const url = String(rec.url ?? "").trim();
  if (!url) return null;
  const slot = rec.slot === "hero" || rec.slot === "before" || rec.slot === "after" || rec.slot === "proof" ? rec.slot : "proof";
  return {
    url,
    prevHeroUrl: String(rec.prevHeroUrl ?? "").trim(),
    portfolioId: String(rec.portfolioId ?? "").trim(),
    slot,
    uploadedAt: String(rec.uploadedAt ?? ""),
  };
}

export function applyOwnerMmsMenu(
  pointer: LastMmsUpload,
  reply: OwnerMmsMenuReply,
): { slot: OwnerMmsSlot | "removed"; heroUrl: string; prevHeroUrl: string; confirm: string } {
  if (reply === "hero") {
    return {
      slot: "hero",
      heroUrl: pointer.url,
      prevHeroUrl: pointer.prevHeroUrl || pointer.url,
      confirm: "Set as your main Hero Banner. Reply 3 to Undo.",
    };
  }
  if (reply === "before") {
    return {
      slot: "before",
      heroUrl: "",
      prevHeroUrl: pointer.prevHeroUrl,
      confirm: "Saved as a Before photo for your slider. Reply 3 to Undo.",
    };
  }
  return {
    slot: "removed",
    heroUrl: pointer.prevHeroUrl,
    prevHeroUrl: pointer.prevHeroUrl,
    confirm: "Undid that upload. Your previous hero is back.",
  };
}

export function ownerMmsCaptionSeed(body: string): string {
  return (body ?? "")
    .replace(/^\s*(HERO|BANNER|BEFORE|AFTER|PROOF)\b/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}
