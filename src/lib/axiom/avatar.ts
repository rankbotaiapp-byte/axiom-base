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
  if (parts.length >= 3) return clipAvatarField(parts[1] ?? "");
  if (parts.length === 2) {
    if (/^[A-Za-z]{2}$/.test(parts[1] ?? "")) return clipAvatarField(parts[0] ?? "");
    return clipAvatarField(parts[1] ?? "");
  }
  const first = parts[0] ?? "";
  return clipAvatarField(placeFromCityLine(first) || first);
}

/** City for Autopilot overlays. Drops tagline leftovers like "on the book". */
export function shopCity(address: string, fallback = "Ashland"): string {
  const place = placeFromCityLine(cityFromAddress(address));
  if (!place || /on the book/i.test(place) || /^southern oregon$/i.test(place)) return fallback;
  return place;
}

/** City used to match a prospect batch. Drops the service note after a middot. */
export function placeFromCityLine(city: string): string {
  return (city.split("·")[0] ?? "").trim();
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

/** LiveAvatar video quality: high = 720p (best fidelity / latency balance for lip-sync). */
export type AvatarVideoQuality = "low" | "medium" | "high" | "very_high";

/**
 * ElevenLabs neural TTS tuned for natural speech + clean lip-sync.
 * Prefer multilingual_v2 / conversational v3 over flash to cut synthetic artifacting.
 * @see https://docs.liveavatar.com/docs/full-mode/voice-settings
 */
export const PREMIUM_NEURAL_VOICE_SETTINGS = {
  provider: "elevenLabs" as const,
  /** Slightly under 1.0 keeps mouth shapes readable without dragging. */
  speed: 0.98,
  /** Mid stability = natural variation; high values sound flat / robotic. */
  stability: 0.52,
  similarity_boost: 0.88,
  style: 0.12,
  use_speaker_boost: true,
  /**
   * `eleven_multilingual_v2` = higher fidelity neural TTS.
   * Override with LIVEAVATAR_VOICE_MODEL when a conversational v3/v4 voice is preferred.
   */
  model: "eleven_multilingual_v2",
};

export function resolveAvatarVideoQuality(raw?: string): AvatarVideoQuality {
  const value = (raw ?? "").trim().toLowerCase();
  if (value === "low" || value === "medium" || value === "high" || value === "very_high") return value;
  return "high";
}

export function resolveAvatarVoiceModel(raw?: string): string {
  const value = (raw ?? "").trim();
  if (
    value === "eleven_flash_v2_5" ||
    value === "eleven_multilingual_v2" ||
    value === "eleven_v3" ||
    value === "eleven_v3_conversational" ||
    value === "eleven_v4_turbo"
  ) {
    return value;
  }
  return PREMIUM_NEURAL_VOICE_SETTINGS.model;
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
    videoQuality?: AvatarVideoQuality;
    voiceModel?: string;
  },
): Record<string, unknown> {
  const variables = {
    business: clipAvatarField(context.businessName) || "your shop",
    trade: clipAvatarField(context.trade) || "local",
    city: clipAvatarField(context.city) || "your city",
  };
  const quality = resolveAvatarVideoQuality(config.videoQuality);
  const voiceModel = resolveAvatarVoiceModel(config.voiceModel);
  const body: Record<string, unknown> = {
    mode: "FULL",
    avatar_id: config.avatarId,
    is_sandbox: config.sandbox === true,
    max_session_duration: 180,
    interactivity_type: "CONVERSATIONAL",
    // H264 + high (720p): sharp mouth detail without the latency spike of very_high.
    video_settings: { quality, encoding: "H264" },
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
      voice_settings: {
        ...PREMIUM_NEURAL_VOICE_SETTINGS,
        model: voiceModel,
      },
    };
  }
  return body;
}
