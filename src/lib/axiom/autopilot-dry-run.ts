import { balanceChannels, type AutopilotLead } from "./autopilot.ts";
import { outreachStrategy, renderOutreachMessage } from "./funnel.ts";
import { HOME_REGION_COUNTIES, type HomeCounty } from "./regional-roster.ts";

export const DRY_RUN_COUNTIES = HOME_REGION_COUNTIES;

export type DryShop = {
  id: string;
  slug: string;
  name: string;
  niche: string;
  billing: string;
};

export type DryCue = {
  kind: "outreach" | "social";
  id: string;
  shopSlug: string;
  county: string;
  status: string;
  detail: string;
};

export type DryPayload = {
  county: HomeCounty;
  channel: "email" | "sms";
  cue: "outreach" | "social" | "lead";
  leadSlug: string;
  shopSlug: string;
  to: string;
  subject: string;
  body: string;
};

export type DryLog = {
  county: string;
  channel: string;
  summary: string;
  status: "simulated";
};

export type AutopilotDryRun = {
  mode: "simulation";
  providers: "none";
  shops: DryShop[];
  cues: DryCue[];
  payloads: DryPayload[];
  logs: DryLog[];
};

const COUNTY_KEY = new Map<string, HomeCounty>(
  HOME_REGION_COUNTIES.flatMap((county) => {
    const full = county.toLowerCase();
    const short = full.replace(/ county$/, "");
    return [
      [full, county],
      [short, county],
    ] as [string, HomeCounty][];
  }),
);

export function homeCountyName(value: string): HomeCounty | null {
  return COUNTY_KEY.get(value.trim().toLowerCase()) ?? null;
}

function bookingUrl(origin: string, lead: AutopilotLead): string {
  const base = origin.trim().replace(/\/$/, "") || "http://127.0.0.1:8080";
  const url = new URL("/", `${base}/`);
  url.searchParams.set("preview", "true");
  url.searchParams.set("business", lead.businessName.slice(0, 80));
  url.searchParams.set("b", lead.leadSlug);
  url.searchParams.set("county", lead.county);
  if (lead.city) url.searchParams.set("city", lead.city);
  return url.toString();
}

function shopFor(shops: readonly DryShop[], trade: string): DryShop | undefined {
  const key = trade.trim().toLowerCase();
  return (
    shops.find((shop) => shop.niche.toLowerCase() === key || key.includes(shop.niche.toLowerCase())) ?? shops[0]
  );
}

function cueFor(cues: readonly DryCue[], county: HomeCounty, shopSlug: string): DryPayload["cue"] {
  if (cues.some((cue) => cue.kind === "social" && cue.shopSlug === shopSlug)) return "social";
  if (cues.some((cue) => cue.kind === "outreach" && (cue.county === county || cue.county === ""))) return "outreach";
  if (cues.some((cue) => cue.kind === "social")) return "social";
  if (cues.some((cue) => cue.kind === "outreach")) return "outreach";
  return "lead";
}

/** Formats a simulation batch. This function does not open a network connection. */
export function buildAutopilotDryRun(input: {
  shops: readonly DryShop[];
  cues: readonly DryCue[];
  leads: readonly AutopilotLead[];
  origin?: string;
}): AutopilotDryRun {
  const origin = input.origin ?? "http://127.0.0.1:8080";
  const draft = outreachStrategy("done-for-you");
  const active = input.shops.filter((shop) => shop.billing === "active" || shop.billing === "trialing");
  const payloads: DryPayload[] = [];

  for (const county of DRY_RUN_COUNTIES) {
    const rows = input.leads.filter((lead) => homeCountyName(lead.county) === county);
    const split = balanceChannels(rows);
    for (const channel of ["email", "sms"] as const) {
      for (const lead of split[channel].slice(0, 3)) {
        const shop = shopFor(active, lead.tradeType);
        const url = bookingUrl(origin, { ...lead, county });
        const tokens = {
          business: lead.businessName,
          url,
          trade: lead.tradeType,
          county,
          city: lead.city,
          owner: lead.businessName,
          reviews: "no public reviews",
          website: "no website listed",
          line: "listed number",
        };
        payloads.push({
          county,
          channel,
          cue: cueFor(input.cues, county, shop?.slug ?? ""),
          leadSlug: lead.leadSlug,
          shopSlug: shop?.slug ?? "",
          to: channel === "sms" ? lead.phone : lead.email,
          subject: channel === "email" ? renderOutreachMessage(draft.emailSubject, tokens).slice(0, 200) : "",
          body: renderOutreachMessage(channel === "sms" ? draft.text : draft.emailBody, tokens).slice(0, channel === "sms" ? 640 : 4000),
        });
      }
    }
  }

  const logs: DryLog[] = DRY_RUN_COUNTIES.map((county) => {
    const batch = payloads.filter((row) => row.county === county);
    const email = batch.filter((row) => row.channel === "email").length;
    const sms = batch.filter((row) => row.channel === "sms").length;
    return {
      county,
      channel: "dry-run",
      status: "simulated",
      summary: `${county}: ${active.length} active shops, ${email} email, ${sms} SMS, providers none`,
    };
  });

  return { mode: "simulation", providers: "none", shops: active, cues: [...input.cues], payloads, logs };
}
