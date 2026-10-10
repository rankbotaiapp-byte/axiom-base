type MintBucket = { count: number; reset: number };

const mintBuckets = new Map<string, MintBucket>();

/** Eight session mints per caller each ten minutes. A public page cannot drain the account. */
export function avatarMintAllowed(caller: string, now = Date.now()): boolean {
  const windowMs = 10 * 60 * 1000;
  const row = mintBuckets.get(caller);
  if (!row || row.reset <= now) {
    mintBuckets.set(caller, { count: 1, reset: now + windowMs });
    return true;
  }
  if (row.count >= 8) return false;
  row.count += 1;
  return true;
}

/** Fields the public page and the shop desk can hand to Ask Eric. */
export type AvatarContext = {
  businessName: string;
  trade: string;
  city: string;
};

const FIELD_MAX = 80;

export function clipAvatarField(value: string): string {
  return value.trim().replace(/\s+/g, " ").slice(0, FIELD_MAX);
}

/** Spoken once on the owner's first visit to the shop desk. */
export function ownerWelcome(context: AvatarContext): string {
  const business = clipAvatarField(context.businessName) || "your shop";
  return `Hi. I'm Eric, the creator of New Era, powered by Axiom. ${business} can stop losing the calls that come in after hours. The page stays open all night, so a booking business captures the lead while you're on the job.`;
}

export function ericGreeting(context: AvatarContext): string {
  const business = clipAvatarField(context.businessName) || "your shop";
  const trade = clipAvatarField(context.trade);
  const city = clipAvatarField(context.city);
  if (trade && city) return `Hi. I'm Eric. ${business} already has a ${trade} page in ${city}.`;
  if (city) return `Hi. I'm Eric. ${business} already has a page in ${city}.`;
  if (trade) return `Hi. I'm Eric. ${business} already has a ${trade} page waiting.`;
  return `Hi. I'm Eric. ${business} already has a page waiting.`;
}

/** Street, city, region addresses keep the city segment. A bare city stays as-is. */
export function cityFromAddress(address: string): string {
  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const city = parts.length >= 2 ? parts[1] : (parts[0] ?? "");
  return clipAvatarField(city);
}

/**
 * HeyGen prints this avatar id without hyphens. LiveAvatar's session token
 * takes the same id as a UUID.
 */
export const ASK_ERIC_AVATAR_ID = "3cbdf8bcb3b94c2a8aae11f03e0b5b96";

export function askEricAvatarId(): string {
  const compact = ASK_ERIC_AVATAR_ID.toLowerCase();
  return `${compact.slice(0, 8)}-${compact.slice(8, 12)}-${compact.slice(12, 16)}-${compact.slice(16, 20)}-${compact.slice(20)}`;
}

/**
 * LiveAvatar FULL-mode token body. Business, trade, and city fill ${placeholders}
 * in the stored context. The API key never belongs in this object.
 */
export function avatarSessionPayload(
  context: AvatarContext,
  config: {
    avatarId: string;
    voiceAgentId?: string;
    voiceId?: string;
    contextId?: string;
    sandbox?: boolean;
  },
): Record<string, unknown> {
  const variables = {
    business: clipAvatarField(context.businessName) || "your shop",
    trade: clipAvatarField(context.trade) || "local",
    city: clipAvatarField(context.city) || "your city",
  };
  const body: Record<string, unknown> = {
    mode: "FULL",
    avatar_id: config.avatarId,
    is_sandbox: config.sandbox === true,
    max_session_duration: 180,
    interactivity_type: "CONVERSATIONAL",
    video_settings: { quality: "medium", encoding: "H264" },
    dynamic_variables: variables,
  };
  if (config.voiceAgentId) {
    body.voice_agent = { id: config.voiceAgentId, dynamic_variables: variables };
    delete body.dynamic_variables;
  } else if (config.voiceId || config.contextId) {
    body.avatar_persona = {
      ...(config.voiceId ? { voice_id: config.voiceId } : {}),
      ...(config.contextId ? { context_id: config.contextId } : {}),
      language: "en",
    };
  }
  return body;
}
