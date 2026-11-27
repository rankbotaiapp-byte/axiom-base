import { FOUNDER_LIFETIME_CENTS, STANDARD_MONTHLY_CENTS } from "@/lib/stripe/commercial";
import { tradeCopyForNiche } from "../../config/AutopilotContentEngine.ts";
import { brandOverlayStamp, composeSocialPublishJob, tradeKeywordsForNiche } from "./autopilot-content.ts";
import { pairDatasetToNichePreview } from "./niche-dataset-pairing.ts";
import { parseOutreachMode } from "./outreach-queue.ts";

export const BULLETPROOF_NICHES = ["plumbing", "hvac", "electrical"] as const;
export type BulletproofNiche = (typeof BULLETPROOF_NICHES)[number];

export function isPermanentMediaUrl(url: string): boolean {
  const value = url.trim();
  if (!value) return false;
  if (/replicate\.delivery|replicate\.com\/v1\/files|pbxt\.replicate/i.test(value)) return false;
  if (value.startsWith("/media/") || value.startsWith("data:")) return true;
  return /supabase\.co\/storage\/v1\/object\/public\/(axiom-media|media|app-uploads)\//i.test(value);
}

export function storefrontUnlockCents(): 100 {
  return 100;
}

export function firstLeadMonthlyCents(): number {
  return STANDARD_MONTHLY_CENTS;
}

export function founderLifetimeCents(): number {
  return FOUNDER_LIFETIME_CENTS;
}

export type AutopilotSweepTenant = {
  slug: string;
  businessName: string;
  niche: BulletproofNiche;
  city: string;
};

export type SimulatedAutopilotPost = {
  slug: string;
  niche: BulletproofNiche;
  caption: string;
  status: "scheduled" | "published";
  fingerprint: string;
  leakage: string[];
};

const FOREIGN_TOKENS: Record<BulletproofNiche, string[]> = {
  plumbing: ["hvac", "furnace", "air conditioning", "electrician", "breaker panel"],
  hvac: ["plumber", "burst pipe", "drain", "electrician", "breaker panel"],
  electrical: ["plumber", "burst pipe", "hvac", "furnace", "air conditioning"],
};

export function simulateNicheAutopilotSweep(
  tenants: AutopilotSweepTenant[],
  mode = parseOutreachMode(process.env.OUTREACH_MODE),
): SimulatedAutopilotPost[] {
  const status: SimulatedAutopilotPost["status"] = mode === "live" ? "published" : "scheduled";
  const posts = tenants.map((tenant) => {
    const copy = tradeCopyForNiche(tenant.niche);
    const overlay = brandOverlayStamp({
      shopName: tenant.businessName,
      city: tenant.city,
      bookUrl: `/t/${tenant.slug}/book`,
      niche: tenant.niche,
    });
    const caption = `${overlay.shopName} · ${copy.tradeLabel} · ${overlay.cta}`;
    const job = composeSocialPublishJob({
      caption,
      storefrontUrl: `https://axiom.test/t/${tenant.slug}`,
      imageUrl: `https://cdn.axiom.test/axiom-media/${tenant.slug}/hero.webp`,
    });
    const blob = `${job.facebook.body.message}\n${job.instagram.caption}\n${job.gbp.body.summary}`;
    const leakage = FOREIGN_TOKENS[tenant.niche].filter((token) => blob.toLowerCase().includes(token));
    return {
      slug: tenant.slug,
      niche: tenant.niche,
      caption,
      status,
      fingerprint: `${tenant.slug}:${tenant.niche}:${caption}`,
      leakage,
    };
  });
  return posts;
}

export function duplicatePostCount(posts: SimulatedAutopilotPost[]): number {
  const seen = new Set<string>();
  let dupes = 0;
  for (const post of posts) {
    if (seen.has(post.fingerprint)) dupes += 1;
    else seen.add(post.fingerprint);
  }
  return dupes;
}

export function nicheHeroCopy(niche: BulletproofNiche, businessName: string, city: string) {
  const preview = pairDatasetToNichePreview({
    businessName,
    tradeType: niche,
    tradeLabel: niche,
    city,
    county: "Jackson County",
    leadSlug: businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  });
  const keywords = tradeKeywordsForNiche(niche).join(" ");
  return {
    niche: preview.niche,
    heroVideoUrl: preview.heroVideoUrl,
    tagline: preview.tagline,
    tradeLabel: tradeCopyForNiche(niche).tradeLabel,
    keywords,
    permanentHero: isPermanentMediaUrl(preview.heroVideoUrl),
  };
}

export type ExternalCallOutcome = {
  ok: boolean;
  kind: "ok" | "timeout" | "http_error";
  status?: number;
  shopIntact: true;
};

export async function isolateExternalFailure(
  run: () => Promise<{ ok: boolean; status?: number }>,
  timeoutMs = 40,
): Promise<ExternalCallOutcome> {
  try {
    const result = await Promise.race([
      run(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(Object.assign(new Error("timeout"), { name: "TimeoutError" })), timeoutMs);
      }),
    ]);
    if (!result.ok) {
      return { ok: false, kind: "http_error", status: result.status ?? 500, shopIntact: true };
    }
    return { ok: true, kind: "ok", status: result.status ?? 200, shopIntact: true };
  } catch (err) {
    const name = err instanceof Error ? err.name : "";
    if (name === "TimeoutError" || /timeout/i.test(err instanceof Error ? err.message : "")) {
      return { ok: false, kind: "timeout", shopIntact: true };
    }
    return { ok: false, kind: "http_error", status: 500, shopIntact: true };
  }
}
