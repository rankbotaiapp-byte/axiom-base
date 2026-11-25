/**
 * Autopilot content → web storefront + social publish contract.
 * Pure module: simulation by default, no Graph/GBP network calls.
 */

import { composeAutopilotClip, tradeCopyForNiche } from "../../config/AutopilotContentEngine.ts";
import { AUTOPILOT_TIME_ZONE } from "./autopilot-limits.ts";
import { assertValidBranding } from "./studio-visual-blueprint.ts";

export const SOCIAL_PUBLISH_TARGETS = [
  "web_storefront",
  "facebook",
  "instagram",
  "google_business",
] as const;
export type SocialPublishTarget = (typeof SOCIAL_PUBLISH_TARGETS)[number];

export const SOCIAL_NETWORK_TARGETS = ["facebook", "instagram", "google_business"] as const;
export type SocialNetworkTarget = (typeof SOCIAL_NETWORK_TARGETS)[number];

/** One pass may fan out to web + three networks once each. */
export const AUTOPILOT_PUBLISH_PER_RUN_CAP = 4;
/** Distinct social/web posts per shop per Pacific day. Does not touch SMS/email caps. */
export const AUTOPILOT_SOCIAL_DAILY_CAP = 4;

export type TenantPublishAsset = {
  stillUrl: string;
  motionUrl: string;
  kind: "image" | "loop-video";
};

export type TenantPublishCopy = {
  shopName: string;
  tradeLabel: string;
  caption: string;
  cta: string;
  bookUrl: string;
  claimUrl: string;
};

export type TenantPublishBundle = {
  shopId: string;
  slug: string;
  niche: string;
  asset: TenantPublishAsset;
  copy: TenantPublishCopy;
  targets: SocialPublishTarget[];
  idempotencyKey: string;
  approved: boolean;
  rejectReason?: string;
};

export type WebPresencePreview = {
  stillUrl: string;
  motionUrl: string;
  caption: string;
  bookUrl: string;
  applied: boolean;
  skippedReason?: string;
};

export type ShopBrandingSnapshot = {
  shopName: string;
  phone?: string;
  tagline?: string;
};

export type PublishLedgerEntry = {
  key: string;
  shopId: string;
  target: SocialPublishTarget;
  day: string;
  status: string;
};

export type SocialPublishIntent = {
  target: SocialPublishTarget;
  bundle: TenantPublishBundle;
  payload: Record<string, unknown>;
};

export type SocialPublishReceipt = {
  target: SocialPublishTarget;
  status: "simulated" | "queued" | "skipped" | "published";
  idempotencyKey: string;
  detail: string;
  recordedAt: string;
  payload?: Record<string, unknown>;
};

export type SocialOAuthToken = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
};

export type SocialOAuthTokenHook = {
  storeToken(
    shopId: string,
    target: SocialNetworkTarget,
    token: SocialOAuthToken,
  ): Promise<void> | void;
  readToken(shopId: string, target: SocialNetworkTarget): Promise<SocialOAuthToken | null> | SocialOAuthToken | null;
};

export interface SocialChannelAdapter {
  mode: "simulation" | "live";
  publish(intent: SocialPublishIntent): SocialPublishReceipt;
}

const LOCAL_STILL = /^\/(api\/shop-media\/|api\/hero\/|media\/)[A-Za-z0-9._/?=-]+$/;
const LOCAL_MOTION = /^\/(api\/hero-video\/|media\/)[A-Za-z0-9._/?=-]+\.(mp4|webm)(\?.*)?$/i;

export function isPublishStillUrl(value: string | null | undefined): boolean {
  const url = (value ?? "").trim();
  if (!url || url.includes("..") || /\s/.test(url)) return false;
  if (/^https:\/\//i.test(url) && !/^https:\/\/localhost\b/i.test(url)) return url.length <= 2000;
  return LOCAL_STILL.test(url.split("?")[0] ?? url);
}

export function isPublishMotionUrl(value: string | null | undefined): boolean {
  const url = (value ?? "").trim();
  if (!url || url.includes("..") || /\s/.test(url)) return false;
  if (/^https:\/\//i.test(url) && /\.(mp4|webm)(\?|$)/i.test(url)) return url.length <= 2000;
  return LOCAL_MOTION.test(url);
}

export function pacificPublishDay(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: AUTOPILOT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function publishFingerprint(input: {
  shopId: string;
  target: SocialPublishTarget;
  stillUrl: string;
  motionUrl?: string;
  day: string;
}): string {
  return [input.shopId, input.target, input.stillUrl, input.motionUrl || "", input.day].join("|").slice(0, 400);
}

export function canPublishItem(
  ledger: readonly PublishLedgerEntry[],
  input: {
    shopId: string;
    target: SocialPublishTarget;
    fingerprint: string;
    day: string;
    perRunPosted: number;
    dailyCap?: number;
    perRunCap?: number;
  },
): { ok: true } | { ok: false; reason: "duplicate" | "daily_cap" | "run_cap" } {
  const dailyCap = input.dailyCap ?? AUTOPILOT_SOCIAL_DAILY_CAP;
  const perRunCap = input.perRunCap ?? AUTOPILOT_PUBLISH_PER_RUN_CAP;
  if (input.perRunPosted >= perRunCap) return { ok: false, reason: "run_cap" };
  if (ledger.some((row) => row.key === input.fingerprint)) return { ok: false, reason: "duplicate" };
  const today = ledger.filter((row) => row.shopId === input.shopId && row.day === input.day).length;
  if (today >= dailyCap) return { ok: false, reason: "daily_cap" };
  return { ok: true };
}

function cleanSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export type BuildPublishBundleInput = {
  shopId: string;
  slug: string;
  shopName: string;
  niche: string;
  city?: string;
  phone?: string;
  tagline?: string;
  stillUrl?: string | null;
  motionUrl?: string | null;
  origin?: string;
  now?: Date;
  targets?: SocialPublishTarget[];
};

export function buildTenantPublishBundle(input: BuildPublishBundleInput): TenantPublishBundle {
  const slug = cleanSlug(input.slug);
  const branding = assertValidBranding({
    shopName: input.shopName,
    phone: input.phone,
    tagline: input.tagline,
  });
  const stillUrl = isPublishStillUrl(input.stillUrl) ? String(input.stillUrl).trim() : "";
  const motionUrl = isPublishMotionUrl(input.motionUrl) ? String(input.motionUrl).trim() : "";
  const bookPath = `/${slug}/book`;
  const claimPath = `/t/${slug}`;
  const origin = (input.origin ?? "").replace(/\/$/, "");
  const bookUrl = origin && /^https:\/\//i.test(origin) ? `${origin}${bookPath}` : bookPath;
  const claimUrl = origin && /^https:\/\//i.test(origin) ? `${origin}${claimPath}` : claimPath;
  const clip = composeAutopilotClip({
    loopUrl: motionUrl,
    shopName: input.shopName,
    city: input.city || "Your city",
    bookUrl,
    niche: input.niche,
  });
  const { tradeLabel } = tradeCopyForNiche(input.niche);
  const copy: TenantPublishCopy = {
    shopName: clip.overlay.shopName,
    tradeLabel,
    caption: clip.caption,
    cta: clip.overlay.cta,
    bookUrl,
    claimUrl,
  };
  const asset: TenantPublishAsset = {
    stillUrl,
    motionUrl,
    kind: motionUrl ? "loop-video" : "image",
  };
  const day = pacificPublishDay(input.now);
  const targets = (input.targets?.length ? input.targets : [...SOCIAL_PUBLISH_TARGETS]).filter((target) =>
    (SOCIAL_PUBLISH_TARGETS as readonly string[]).includes(target),
  ) as SocialPublishTarget[];
  let rejectReason: string | undefined;
  if (!branding.ok) rejectReason = branding.reason;
  else if (!stillUrl && !motionUrl) rejectReason = "Need a validated still or motion asset before publish.";
  const approved = !rejectReason;
  const idempotencyKey = publishFingerprint({
    shopId: input.shopId,
    target: "web_storefront",
    stillUrl: stillUrl || motionUrl,
    motionUrl,
    day,
  });
  return {
    shopId: input.shopId,
    slug,
    niche: input.niche,
    asset,
    copy,
    targets,
    idempotencyKey,
    approved,
    rejectReason,
  };
}

/** Web presence first: preview media only. Never overwrites unvalidated shop name/phone. */
export function applyWebPresencePreview(input: {
  branding: ShopBrandingSnapshot;
  currentPreview?: Partial<WebPresencePreview> | null;
  bundle: TenantPublishBundle;
}): { branding: ShopBrandingSnapshot; preview: WebPresencePreview } {
  const branding = { ...input.branding };
  const check = assertValidBranding(branding);
  if (!check.ok) {
    return {
      branding,
      preview: {
        stillUrl: input.currentPreview?.stillUrl ?? "",
        motionUrl: input.currentPreview?.motionUrl ?? "",
        caption: input.currentPreview?.caption ?? "",
        bookUrl: input.currentPreview?.bookUrl ?? "",
        applied: false,
        skippedReason: check.reason,
      },
    };
  }
  if (!input.bundle.approved) {
    return {
      branding,
      preview: {
        stillUrl: input.currentPreview?.stillUrl ?? "",
        motionUrl: input.currentPreview?.motionUrl ?? "",
        caption: input.currentPreview?.caption ?? "",
        bookUrl: input.currentPreview?.bookUrl ?? "",
        applied: false,
        skippedReason: input.bundle.rejectReason || "Bundle is not approved.",
      },
    };
  }
  return {
    branding,
    preview: {
      stillUrl: input.bundle.asset.stillUrl,
      motionUrl: input.bundle.asset.motionUrl,
      caption: input.bundle.copy.caption,
      bookUrl: input.bundle.copy.bookUrl,
      applied: true,
    },
  };
}

/** Writes preview into trade_profile.shopConfig without touching shop name/phone. */
export function mergeAutopilotWebPreview(
  tradeProfile: Record<string, unknown>,
  preview: WebPresencePreview,
): Record<string, unknown> {
  const shopConfig =
    tradeProfile.shopConfig && typeof tradeProfile.shopConfig === "object" && !Array.isArray(tradeProfile.shopConfig)
      ? { ...(tradeProfile.shopConfig as Record<string, unknown>) }
      : {};
  shopConfig.autopilotWebPreview = preview;
  return { ...tradeProfile, shopConfig };
}

export function socialIntentPayload(bundle: TenantPublishBundle, target: SocialPublishTarget): Record<string, unknown> {
  if (target === "web_storefront") {
    return {
      stillUrl: bundle.asset.stillUrl,
      motionUrl: bundle.asset.motionUrl,
      caption: bundle.copy.caption,
      bookUrl: bundle.copy.bookUrl,
    };
  }
  if (target === "facebook") {
    return {
      channel: "facebook",
      message: bundle.copy.caption,
      link: /^https:\/\//i.test(bundle.copy.bookUrl) ? bundle.copy.bookUrl : bundle.copy.claimUrl,
      imageUrl: bundle.asset.stillUrl,
    };
  }
  if (target === "instagram") {
    return {
      channel: "instagram",
      caption: bundle.copy.caption,
      imageUrl: bundle.asset.stillUrl,
    };
  }
  return {
    channel: "google_business",
    summary: bundle.copy.caption.slice(0, 1500),
    callToAction: { actionType: "LEARN_MORE", url: bundle.copy.bookUrl },
  };
}

export function createMemoryOAuthStore(): SocialOAuthTokenHook & { records: Map<string, SocialOAuthToken> } {
  const records = new Map<string, SocialOAuthToken>();
  return {
    records,
    storeToken(shopId, target, token) {
      records.set(`${shopId}:${target}`, { ...token });
    },
    readToken(shopId, target) {
      return records.get(`${shopId}:${target}`) ?? null;
    },
  };
}

export function createSimulationSocialAdapter(log: SocialPublishReceipt[] = []): SocialChannelAdapter & {
  log: SocialPublishReceipt[];
} {
  return {
    mode: "simulation",
    log,
    publish(intent) {
      const receipt: SocialPublishReceipt = {
        target: intent.target,
        status: "simulated",
        idempotencyKey: intent.bundle.idempotencyKey,
        detail: `Simulation recorded ${intent.target} for ${intent.bundle.slug}. No external API called.`,
        recordedAt: new Date().toISOString(),
        payload: intent.payload,
      };
      log.push(receipt);
      return receipt;
    },
  };
}

/** Live Graph/GBP is a stub until OAuth tokens are stored per shop. Never called from simulation. */
export function createLiveSocialAdapterStub(oauth: SocialOAuthTokenHook): SocialChannelAdapter {
  return {
    mode: "live",
    publish(intent) {
      if (intent.target === "web_storefront") {
        return {
          target: intent.target,
          status: "queued",
          idempotencyKey: intent.bundle.idempotencyKey,
          detail: "Web presence is applied in-app; no OAuth required.",
          recordedAt: new Date().toISOString(),
          payload: intent.payload,
        };
      }
      const token = oauth.readToken(intent.bundle.shopId, intent.target as SocialNetworkTarget) as SocialOAuthToken | null;
      if (!token?.accessToken) {
        return {
          target: intent.target,
          status: "skipped",
          idempotencyKey: intent.bundle.idempotencyKey,
          detail: "OAuth token store is wired. Connect the channel before live publish.",
          recordedAt: new Date().toISOString(),
        };
      }
      return {
        target: intent.target,
        status: "skipped",
        idempotencyKey: intent.bundle.idempotencyKey,
        detail: "Live Graph/GBP publish hook is stubbed. Simulation adapter is the default.",
        recordedAt: new Date().toISOString(),
      };
    },
  };
}

export function runPublishPlan(input: {
  bundle: TenantPublishBundle;
  adapter: SocialChannelAdapter;
  ledger?: PublishLedgerEntry[];
  branding: ShopBrandingSnapshot;
  now?: Date;
}): {
  web: ReturnType<typeof applyWebPresencePreview>;
  receipts: SocialPublishReceipt[];
  ledger: PublishLedgerEntry[];
} {
  const day = pacificPublishDay(input.now);
  const ledger = [...(input.ledger ?? [])];
  const web = applyWebPresencePreview({ branding: input.branding, bundle: input.bundle });
  const receipts: SocialPublishReceipt[] = [];
  if (!input.bundle.approved) {
    return { web, receipts, ledger };
  }
  let perRunPosted = 0;
  for (const target of input.bundle.targets) {
    const fingerprint = publishFingerprint({
      shopId: input.bundle.shopId,
      target,
      stillUrl: input.bundle.asset.stillUrl || input.bundle.asset.motionUrl,
      motionUrl: input.bundle.asset.motionUrl,
      day,
    });
    const gate = canPublishItem(ledger, {
      shopId: input.bundle.shopId,
      target,
      fingerprint,
      day,
      perRunPosted,
    });
    if (!gate.ok) {
      receipts.push({
        target,
        status: "skipped",
        idempotencyKey: fingerprint,
        detail: gate.reason === "duplicate" ? "Already posted this item." : `Publish ${gate.reason} reached.`,
        recordedAt: new Date().toISOString(),
      });
      continue;
    }
    if (target === "web_storefront" && !web.preview.applied) {
      receipts.push({
        target,
        status: "skipped",
        idempotencyKey: fingerprint,
        detail: web.preview.skippedReason || "Web preview was not applied.",
        recordedAt: new Date().toISOString(),
      });
      continue;
    }
    const receipt = input.adapter.publish({
      target,
      bundle: { ...input.bundle, idempotencyKey: fingerprint },
      payload: socialIntentPayload(input.bundle, target),
    });
    receipts.push(receipt);
    ledger.push({
      key: fingerprint,
      shopId: input.bundle.shopId,
      target,
      day,
      status: receipt.status,
    });
    perRunPosted += 1;
  }
  return { web, receipts, ledger };
}
