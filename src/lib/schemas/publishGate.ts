import { TenantStorefrontSchema, type TenantStorefrontConfig } from "./tenant";

export type PublishVerdict =
  | { ok: true; data: TenantStorefrontConfig }
  | { ok: false; issues: string[] };

/** Schema plus the few live-site rules a draft can omit. */
export function validateForPublish(input: unknown): PublishVerdict {
  const parsed = TenantStorefrontSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.issues.map((issue) => {
        const path = issue.path.length ? issue.path.join(".") : "config";
        return `${path}: ${issue.message}`;
      }),
    };
  }

  const config = parsed.data;
  const issues: string[] = [];
  const digits = config.conversion.displayPhone.replace(/\D/g, "");
  if (digits.length < 10) issues.push("conversion.displayPhone needs a 10-digit phone number.");
  if (!config.hero.media.posterUrl.trim()) issues.push("hero.media.posterUrl is required before publish.");
  if (config.hero.media.kind !== "image" && !config.hero.media.videoUrl?.trim()) {
    issues.push("hero.media.videoUrl is required when the hero is a cinemagraph or loop.");
  }
  if (config.services.length < 1) issues.push("At least one service is required before publish.");
  if (config.conversion.serviceCities.length < 1) issues.push("Name at least one service city before publish.");

  if (issues.length) return { ok: false, issues };
  return { ok: true, data: config };
}
