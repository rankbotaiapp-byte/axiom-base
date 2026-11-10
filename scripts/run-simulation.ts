/**
 * Simulated outreach pass over unclaimed preloaded_leads.
 * Reads Supabase, assigns a channel, and prints a preview link.
 * It never calls an email or SMS provider.
 */
const BATCH_SIZE = 50;
const TRICKLE_MS = 2000;

type Channel = "Email-Optimized" | "SMS-Optimized";

type LeadRow = {
  id: string;
  lead_slug: string;
  business_name: string;
  county: string;
  city: string;
  trade_type: string;
  contact_email: string | null;
  contact_phone: string | null;
  contact_name?: string | null;
  phone_line?: string | null;
};

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim() ?? "";
  if (!value) {
    console.error(`[simulation] ${name} is not set`);
    process.exit(1);
  }
  return value;
}

function assignChannel(lead: LeadRow): Channel | null {
  // Keep simulation routing aligned with production SMS-first prioritization.
  // Dynamic import avoided so ts-node can run this file without path aliases.
  const email = (lead.contact_email ?? "").trim();
  const phone = (lead.contact_phone ?? "").trim();
  const line = String(lead.phone_line ?? "").trim().toLowerCase();
  const digits = phone.replace(/\D/g, "");
  const hasPhone = digits.length >= 10;
  const emailOk = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(email);
  const local = email.toLowerCase().split("@")[0] ?? "";
  const officeHeavy =
    emailOk &&
    /^(info|office|admin|contact|hello|support|service|sales|frontdesk|front.?desk|reception)$/i.test(local);
  const mobile = line === "mobile" && hasPhone;
  if (mobile && !officeHeavy) return "SMS-Optimized";
  if (officeHeavy || (emailOk && !mobile)) return "Email-Optimized";
  if (hasPhone) return "SMS-Optimized";
  if (emailOk) return "Email-Optimized";
  return null;
}

function previewToken(): string {
  return crypto.randomUUID().replaceAll("-", "");
}

function previewUrl(origin: string, lead: LeadRow, token: string): string {
  const url = new URL("/", origin.endsWith("/") ? origin : `${origin}/`);
  url.searchParams.set("b", lead.lead_slug);
  if (lead.county) url.searchParams.set("county", lead.county);
  url.searchParams.set("utm_source", "simulation");
  url.searchParams.set("greet", "1");
  url.searchParams.set("t", token);
  return url.toString();
}

async function fetchBatch(supabaseUrl: string, serviceKey: string, afterId: string): Promise<LeadRow[]> {
  const params = new URLSearchParams({
    select: "id,lead_slug,business_name,county,city,trade_type,contact_email,contact_phone,contact_name,phone_line",
    claimed: "eq.false",
    order: "id.asc",
    limit: String(BATCH_SIZE),
  });
  if (afterId) params.set("id", `gt.${afterId}`);
  const endpoint = `${supabaseUrl.replace(/\/$/, "")}/rest/v1/preloaded_leads?${params}`;
  const response = await fetch(endpoint, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      Accept: "application/json",
    },
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 180);
    throw new Error(`Supabase responded ${response.status}${detail ? `: ${detail}` : ""}`);
  }
  return (await response.json()) as LeadRow[];
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const origin = (process.env.SIMULATION_APP_ORIGIN ?? "http://localhost:8080").replace(/\/$/, "");

  console.log("[simulation] classifying unclaimed leads · no messages sent");

  const counts: Record<Channel | "skipped", number> = {
    "Email-Optimized": 0,
    "SMS-Optimized": 0,
    skipped: 0,
  };
  let afterId = "";
  let batches = 0;

  for (;;) {
    const rows = await fetchBatch(supabaseUrl, serviceKey, afterId);
    if (rows.length === 0) break;

    for (const lead of rows) {
      const channel = assignChannel(lead);
      if (!channel) {
        counts.skipped += 1;
        continue;
      }
      counts[channel] += 1;
      const url = previewUrl(origin, lead, previewToken());
      console.log(`[simulation] ${channel} · ${lead.county} · ${lead.trade_type} · ${url}`);
    }

    batches += 1;
    afterId = rows[rows.length - 1]?.id ?? afterId;
    console.log(
      `[simulation] batch ${batches} · ${rows.length} leads · email ${counts["Email-Optimized"]} · sms ${counts["SMS-Optimized"]} · skipped ${counts.skipped}`,
    );
    if (rows.length < BATCH_SIZE) break;
    await wait(TRICKLE_MS);
  }

  console.log(
    `[simulation] done · batches ${batches} · email ${counts["Email-Optimized"]} · sms ${counts["SMS-Optimized"]} · skipped ${counts.skipped}`,
  );
}

main().catch((err: unknown) => {
  console.error("[simulation]", err instanceof Error ? err.message : err);
  process.exit(1);
});
