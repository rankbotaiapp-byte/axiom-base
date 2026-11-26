import "server-only";
import { getSql } from "@/lib/db";
import { env } from "@/lib/env.server";
import { AutopilotError, assertAutopilotDesk } from "./autopilot.server";
import {
  HERO_MIN_WIDTH,
  commandLeadMatchesNiche,
  commandLeadMatchesSearch,
  computePrimeScore,
  normalizeUsE164,
  parseHeroImageStatus,
  parseLeadLineType,
  readImageWidthFromBytes,
  sortCommandLeads,
  type CommandLeadFilter,
  type CommandLeadNiche,
  type HeroImageStatus,
  type LeadLineType,
} from "./lead-verification";
import { isOutreachNicheId, outreachNicheHero, tradeTypeMatchersForNiche } from "./outreach-niche-batch";
import type { DatasetLeadRecord } from "./outreach-desk";
import { parseDatasetImages, parseVisualMode, parseVisualStatus, VISUAL_MODE_SAMPLE } from "./outreach-desk";
import {
  PRIME_CANDIDATE_THRESHOLD,
  PRIME_HERO_COMPILE_MAX,
  evaluatePrimeCandidate,
  parsePrimeBatchLimit,
  planPrimeBatch,
  selectTopPrimeCandidates,
} from "./prime-conversion";

type Sql = Awaited<ReturnType<typeof getSql>>;

export type VerifiedLeadRow = DatasetLeadRecord & {
  phoneE164: string;
  lineType: LeadLineType;
  carrierName: string;
  verifiedCallerName: string;
  phoneVerifiedAt: string;
  heroImageStatus: HeroImageStatus;
  heroImageWidth: number | null;
  primeScore: number;
  primeReasons: string[];
  qaApproved: boolean;
  qaNotes: string;
  reviewCount: number;
  reviewScore: number;
  hasWebsite: boolean;
  lookupMode: "live" | "simulation";
};

function withPrimeConversion(lead: VerifiedLeadRow): VerifiedLeadRow {
  const scored = evaluatePrimeCandidate(lead);
  return { ...lead, primeScore: scored.score, primeReasons: scored.reasons };
}

function missingColumn(err: unknown, column: string): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return new RegExp(column, "i").test(message) && /does not exist|undefined column/i.test(message);
}

function asVerified(row: Record<string, unknown>, lookupMode: "live" | "simulation" = "simulation"): VerifiedLeadRow {
  return {
    id: String(row.id ?? ""),
    leadSlug: String(row.lead_slug ?? ""),
    businessName: String(row.business_name ?? ""),
    tradeType: String(row.trade_type ?? ""),
    tradeLabel: String(row.trade_label ?? ""),
    contactName: String(row.contact_name ?? ""),
    contactPhone: String(row.contact_phone ?? ""),
    contactEmail: String(row.contact_email ?? ""),
    streetAddress: String(row.street_address ?? ""),
    city: String(row.city ?? ""),
    county: String(row.county ?? ""),
    state: String(row.state ?? ""),
    zipCode: String(row.zip_code ?? ""),
    website: String(row.website ?? ""),
    source: String(row.source ?? ""),
    claimed: Boolean(row.claimed),
    datasetImages: parseDatasetImages(row.dataset_images),
    heroImageUrl: String(row.hero_image_url ?? row.poster_url ?? ""),
    heroVideoUrl: String(row.hero_video_url ?? ""),
    visualMode: parseVisualMode(row.visual_mode),
    visualStatus: parseVisualStatus(row.visual_status),
    phoneE164: String(row.phone_e164 ?? ""),
    lineType: parseLeadLineType(row.line_type),
    carrierName: String(row.carrier_name ?? ""),
    verifiedCallerName: String(row.verified_caller_name ?? ""),
    phoneVerifiedAt: row.phone_verified_at ? String(row.phone_verified_at) : "",
    heroImageStatus: parseHeroImageStatus(row.hero_image_status),
    heroImageWidth: typeof row.hero_image_width === "number" ? row.hero_image_width : Number(row.hero_image_width) || null,
    primeScore: Number(row.prime_score ?? 0) || 0,
    primeReasons: evaluatePrimeCandidate({
      businessName: String(row.business_name ?? ""),
      tradeType: String(row.trade_type ?? ""),
      tradeLabel: String(row.trade_label ?? ""),
      contactName: String(row.contact_name ?? ""),
      contactPhone: String(row.contact_phone ?? ""),
      contactEmail: String(row.contact_email ?? ""),
      streetAddress: String(row.street_address ?? ""),
      city: String(row.city ?? ""),
      website: String(row.website ?? ""),
      hasWebsite: Boolean(row.has_website),
      datasetImages: parseDatasetImages(row.dataset_images),
      heroImageUrl: String(row.hero_image_url ?? row.poster_url ?? ""),
      lineType: parseLeadLineType(row.line_type),
      reviewCount: Number(row.review_count ?? 0) || 0,
      reviewScore: Number(row.review_score ?? 0) || 0,
      qaNotes: String(row.qa_notes ?? ""),
    }).reasons,
    qaApproved: Boolean(row.qa_approved),
    qaNotes: String(row.qa_notes ?? ""),
    reviewCount: Number(row.review_count ?? 0) || 0,
    reviewScore: Number(row.review_score ?? 0) || 0,
    hasWebsite: Boolean(row.has_website),
    lookupMode,
  };
}

async function loadLeadById(sql: Sql, leadId: string): Promise<VerifiedLeadRow | null> {
  try {
    const rows = await sql<Record<string, unknown>>`
      select id, lead_slug, business_name, trade_type, trade_label, contact_name, contact_phone, contact_email,
        street_address, city, county, state, zip_code, website, source, claimed, dataset_images,
        hero_image_url, hero_video_url, visual_mode, visual_status,
        coalesce(phone_e164, '') as phone_e164,
        coalesce(line_type, 'unknown') as line_type,
        coalesce(carrier_name, '') as carrier_name,
        coalesce(verified_caller_name, '') as verified_caller_name,
        phone_verified_at,
        coalesce(hero_image_status, 'unchecked') as hero_image_status,
        hero_image_width,
        coalesce(prime_score, 0) as prime_score,
        coalesce(qa_approved, false) as qa_approved,
        coalesce(qa_notes, '') as qa_notes,
        coalesce(review_count, 0) as review_count,
        coalesce(review_score, 0) as review_score,
        coalesce(has_website, false) as has_website
      from preloaded_leads
      where id = ${leadId} or lead_slug = ${leadId}
      limit 1
    `;
    return rows[0] ? asVerified(rows[0]) : null;
  } catch (err) {
    if (!missingColumn(err, "prime_score") && !missingColumn(err, "phone_e164") && !missingColumn(err, "hero_image_status")) {
      throw err;
    }
    const rows = await sql<Record<string, unknown>>`
      select id, lead_slug, business_name, trade_type, trade_label, contact_name, contact_phone, contact_email,
        city, county, state, zip_code, website, source, claimed,
        coalesce(hero_image_url, '') as hero_image_url
      from preloaded_leads
      where id = ${leadId} or lead_slug = ${leadId}
      limit 1
    `;
    return rows[0] ? asVerified(rows[0]) : null;
  }
}

export async function listCommandLeads(
  request: Request,
  input: { filter?: CommandLeadFilter; niche?: CommandLeadNiche; search?: string; limit?: number } = {},
): Promise<VerifiedLeadRow[]> {
  await assertAutopilotDesk(request);
  const sql = await getSql();
  const limit = Math.min(120, Math.max(1, Math.floor(input.limit ?? 40)));
  const niche: CommandLeadNiche = input.niche === "electrical" || input.niche === "hvac" || input.niche === "all" ? input.niche : "plumbing";
  const search = String(input.search ?? "").trim().slice(0, 80);
  const like = `%${search.replace(/[%_]/g, "")}%`;
  try {
    const featured = await sql<Record<string, unknown>>`
      select id, lead_slug, business_name, trade_type, trade_label, contact_name, contact_phone, contact_email,
        street_address, city, county, state, zip_code, website, source, claimed, dataset_images,
        hero_image_url, hero_video_url, visual_mode, visual_status,
        coalesce(phone_e164, '') as phone_e164,
        coalesce(line_type, 'unknown') as line_type,
        coalesce(carrier_name, '') as carrier_name,
        coalesce(verified_caller_name, '') as verified_caller_name,
        phone_verified_at,
        coalesce(hero_image_status, 'unchecked') as hero_image_status,
        hero_image_width,
        coalesce(prime_score, 0) as prime_score,
        coalesce(qa_approved, false) as qa_approved,
        coalesce(qa_notes, '') as qa_notes,
        coalesce(review_count, 0) as review_count,
        coalesce(review_score, 0) as review_score,
        coalesce(has_website, false) as has_website
      from preloaded_leads
      where claimed = false
        and (
          business_name ilike '%stedfast%'
          or (business_name ilike '%grants pass%' and (business_name ilike '%electric%' or trade_type ilike '%electric%'))
        )
      limit 12
    `;
    const matchers = isOutreachNicheId(niche) ? tradeTypeMatchersForNiche(niche).join("|") : "";
    const rows = await sql<Record<string, unknown>>`
      select id, lead_slug, business_name, trade_type, trade_label, contact_name, contact_phone, contact_email,
        street_address, city, county, state, zip_code, website, source, claimed, dataset_images,
        hero_image_url, hero_video_url, visual_mode, visual_status,
        coalesce(phone_e164, '') as phone_e164,
        coalesce(line_type, 'unknown') as line_type,
        coalesce(carrier_name, '') as carrier_name,
        coalesce(verified_caller_name, '') as verified_caller_name,
        phone_verified_at,
        coalesce(hero_image_status, 'unchecked') as hero_image_status,
        hero_image_width,
        coalesce(prime_score, 0) as prime_score,
        coalesce(qa_approved, false) as qa_approved,
        coalesce(qa_notes, '') as qa_notes,
        coalesce(review_count, 0) as review_count,
        coalesce(review_score, 0) as review_score,
        coalesce(has_website, false) as has_website
      from preloaded_leads
      where claimed = false
        and (
          ${search ? sql`(business_name ilike ${like} or city ilike ${like} or contact_phone ilike ${like} or contact_name ilike ${like})` : sql`true`}
        )
        and (
          ${niche === "all" || search ? sql`true` : sql`(trade_type ~* ${matchers} or trade_label ~* ${matchers} or business_name ~* ${matchers})`}
        )
      order by prime_score desc, county asc, lead_slug asc
      limit ${limit * 4}
    `;
    const merged = new Map<string, VerifiedLeadRow>();
    for (const row of [...featured, ...rows]) {
      const lead = asVerified(row);
      if (lead.id) merged.set(lead.id, lead);
    }
    return finalizeCommandLeads([...merged.values()], { filter: input.filter, niche, search, limit });
  } catch (err) {
    if (!missingColumn(err, "prime_score") && !missingColumn(err, "phone_e164")) throw err;
    const rows = await sql<Record<string, unknown>>`
      select id, lead_slug, business_name, trade_type, trade_label, contact_name, contact_phone, contact_email,
        city, county, state, zip_code, website, source, claimed, coalesce(hero_image_url, '') as hero_image_url
      from preloaded_leads
      where claimed = false
      order by county asc, lead_slug asc
      limit ${limit * 4}
    `;
    return finalizeCommandLeads(rows.map((row) => asVerified(row)), { filter: input.filter, niche, search, limit });
  }
}

export function filterCommandLeads(leads: VerifiedLeadRow[], filter?: CommandLeadFilter): VerifiedLeadRow[] {
  if (!filter || filter === "all") return leads;
  if (filter === "prime_candidates") {
    return leads.filter((lead) => evaluatePrimeCandidate(lead).score >= PRIME_CANDIDATE_THRESHOLD);
  }
  if (filter === "prime") return leads.filter((lead) => evaluatePrimeCandidate(lead).score >= 75);
  if (filter === "needs_hero") {
    return leads.filter((lead) => lead.heroImageStatus === "missing" || lead.heroImageStatus === "low_res" || lead.heroImageStatus === "unchecked");
  }
  return leads.filter((lead) => !lead.phoneVerifiedAt || lead.lineType === "unknown");
}

export function finalizeCommandLeads(
  leads: VerifiedLeadRow[],
  input: { filter?: CommandLeadFilter; niche?: CommandLeadNiche; search?: string; limit?: number },
): VerifiedLeadRow[] {
  const niche = input.niche ?? "plumbing";
  const search = input.search ?? "";
  const filtered = leads.filter((lead) => {
    if (search) return commandLeadMatchesSearch(lead, search);
    if (niche === "all") return true;
    return commandLeadMatchesNiche(lead, niche);
  });
  return sortCommandLeads(filterCommandLeads(filtered, input.filter), niche, search)
    .map(withPrimeConversion)
    .slice(0, input.limit ?? 40);
}

function twilioReady(): boolean {
  return Boolean(env("TWILIO_ACCOUNT_SID") && env("TWILIO_AUTH_TOKEN"));
}

export type TwilioLookupResult = {
  mode: "live" | "simulation";
  lineType: LeadLineType;
  carrierName: string;
  callerName: string;
};

export async function lookupTwilioLine(e164: string, dryRun: boolean): Promise<TwilioLookupResult> {
  if (dryRun || !twilioReady()) {
    return { mode: "simulation", lineType: "unknown", carrierName: "", callerName: "" };
  }
  const sid = env("TWILIO_ACCOUNT_SID")!;
  const token = env("TWILIO_AUTH_TOKEN")!;
  const url = `https://lookups.twilio.com/v2/PhoneNumbers/${encodeURIComponent(e164)}?Fields=line_type_intelligence,caller_name`;
  const res = await fetch(url, {
    headers: { Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}` },
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) {
    throw new AutopilotError(502, `Twilio Lookup returned ${res.status}`);
  }
  const body = (await res.json()) as {
    line_type_intelligence?: { type?: string; carrier_name?: string };
    caller_name?: { caller_name?: string };
  };
  return {
    mode: "live",
    lineType: parseLeadLineType(body.line_type_intelligence?.type),
    carrierName: String(body.line_type_intelligence?.carrier_name ?? "").slice(0, 120),
    callerName: String(body.caller_name?.caller_name ?? "").slice(0, 160),
  };
}

export async function inspectHeroMedia(
  urls: string[],
  origin = "",
): Promise<{ status: HeroImageStatus; width: number | null }> {
  const candidates = urls.map((url) => url.trim()).filter((url) => /^https?:\/\//i.test(url) || url.startsWith("/"));
  if (!candidates.length) return { status: "missing", width: null };
  const base = origin.replace(/\/$/, "");
  for (const raw of candidates) {
    const target = raw.startsWith("http") ? raw : base ? `${base}${raw}` : "";
    if (!target.startsWith("http")) continue;
    try {
      const res = await fetch(target, {
        headers: { Range: "bytes=0-65535" },
        redirect: "follow",
        signal: AbortSignal.timeout(10_000),
      });
      if (res.status !== 200 && res.status !== 206) continue;
      const buf = new Uint8Array(await res.arrayBuffer());
      const width = readImageWidthFromBytes(buf);
      if (width == null) {
        const type = (res.headers.get("content-type") ?? "").toLowerCase();
        if (type.includes("image") && buf.length > 40_000) return { status: "valid", width: null };
        continue;
      }
      if (width >= HERO_MIN_WIDTH) return { status: "valid", width };
      return { status: "low_res", width };
    } catch {
      continue;
    }
  }
  return { status: "missing", width: null };
}

async function persistVerification(sql: Sql, lead: VerifiedLeadRow): Promise<void> {
  try {
    await sql`
      update preloaded_leads
      set phone_e164 = ${lead.phoneE164},
          line_type = ${lead.lineType},
          carrier_name = ${lead.carrierName},
          verified_caller_name = ${lead.verifiedCallerName},
          phone_verified_at = ${lead.phoneVerifiedAt ? lead.phoneVerifiedAt : null},
          hero_image_status = ${lead.heroImageStatus},
          hero_image_width = ${lead.heroImageWidth},
          prime_score = ${lead.primeScore},
          qa_approved = ${lead.qaApproved},
          qa_notes = ${lead.qaNotes}
      where id = ${lead.id}
    `;
  } catch (err) {
    if (!missingColumn(err, "prime_score")) throw err;
    throw new AutopilotError(409, "Run migration 0106_master_lead_verification before verifying leads.");
  }
}

export async function verifyLeadRecord(
  request: Request,
  leadId: string,
  opts: { dryRun?: boolean; useCallerName?: boolean } = {},
): Promise<VerifiedLeadRow> {
  await assertAutopilotDesk(request);
  const sql = await getSql();
  const current = await loadLeadById(sql, leadId);
  if (!current) throw new AutopilotError(404, "Lead not found");
  const e164 = normalizeUsE164(current.contactPhone) ?? "";
  const lookup = e164
    ? await lookupTwilioLine(e164, Boolean(opts.dryRun))
    : { mode: "simulation" as const, lineType: "unknown" as const, carrierName: "", callerName: "" };
  const heroUrls = [current.heroImageUrl, ...current.datasetImages].filter(Boolean);
  let origin = "";
  try {
    origin = new URL(request.url).origin;
  } catch {
    origin = "";
  }
  const hero = await inspectHeroMedia(heroUrls, origin);
  const caller = lookup.callerName || current.verifiedCallerName;
  const scored = computePrimeScore({
    lineType: lookup.lineType,
    verifiedCallerName: caller,
    businessName: current.businessName,
    heroImageStatus: hero.status,
    email: current.contactEmail,
    website: current.website,
    hasWebsite: current.hasWebsite,
    reviewCount: current.reviewCount,
    reviewScore: current.reviewScore,
  });
  const next: VerifiedLeadRow = {
    ...current,
    phoneE164: e164,
    lineType: lookup.lineType,
    carrierName: lookup.carrierName || current.carrierName,
    verifiedCallerName: caller,
    phoneVerifiedAt: e164 ? new Date().toISOString() : current.phoneVerifiedAt,
    heroImageStatus: current.heroImageStatus === "regenerated" && hero.status === "valid" ? "regenerated" : hero.status,
    heroImageWidth: hero.width,
    primeScore: scored.total,
    lookupMode: lookup.mode,
    contactName: opts.useCallerName && caller ? caller : current.contactName,
  };
  await persistVerification(sql, next);
  if (opts.useCallerName && caller) {
    await sql`
      update preloaded_leads
      set contact_name = ${caller}
      where id = ${next.id}
    `;
  }
  const saved = await loadLeadById(sql, next.id);
  return saved ? { ...saved, lookupMode: lookup.mode } : next;
}

export async function verifyLeadBatch(
  request: Request,
  ids: string[],
  opts: { dryRun?: boolean } = {},
): Promise<{ leads: VerifiedLeadRow[]; failed: { id: string; error: string }[] }> {
  const unique = [...new Set(ids.map((id) => id.trim()).filter(Boolean))].slice(0, 25);
  const leads: VerifiedLeadRow[] = [];
  const failed: { id: string; error: string }[] = [];
  for (const id of unique) {
    try {
      leads.push(await verifyLeadRecord(request, id, opts));
    } catch (err) {
      failed.push({ id, error: err instanceof Error ? err.message : "verify failed" });
    }
  }
  return { leads, failed };
}

export async function saveLeadIdentity(
  request: Request,
  input: { leadId: string; businessName?: string; city?: string; phone?: string },
): Promise<VerifiedLeadRow> {
  await assertAutopilotDesk(request);
  const sql = await getSql();
  const current = await loadLeadById(sql, input.leadId);
  if (!current) throw new AutopilotError(404, "Lead not found");
  const businessName = (input.businessName ?? current.businessName).replace(/\s+/g, " ").trim().slice(0, 80);
  const city = (input.city ?? current.city).replace(/\s+/g, " ").trim().slice(0, 80);
  const phone = input.phone != null ? input.phone.replace(/\D/g, "").slice(-15) : current.contactPhone.replace(/\D/g, "");
  if (!businessName) throw new AutopilotError(400, "Business name is required.");
  if (input.phone != null && phone.length < 10) throw new AutopilotError(400, "Enter the full 10-digit phone.");
  const e164 = normalizeUsE164(phone) ?? "";
  await sql`
    update preloaded_leads
    set business_name = ${businessName},
        city = ${city},
        contact_phone = ${phone || current.contactPhone}
    where id = ${current.id}
  `;
  try {
    await sql`
      update preloaded_leads
      set phone_e164 = ${e164},
          line_type = ${phone !== current.contactPhone.replace(/\D/g, "") ? "unknown" : current.lineType}
      where id = ${current.id}
    `;
  } catch (err) {
    if (!missingColumn(err, "phone_e164")) throw err;
  }
  const next = await loadLeadById(sql, current.id);
  if (!next) throw new AutopilotError(404, "Lead not found");
  return next;
}

export async function setLeadQa(
  request: Request,
  input: { leadId: string; qaApproved: boolean; notes?: string },
): Promise<VerifiedLeadRow> {
  await assertAutopilotDesk(request);
  const sql = await getSql();
  const current = await loadLeadById(sql, input.leadId);
  if (!current) throw new AutopilotError(404, "Lead not found");
  try {
    await sql`
      update preloaded_leads
      set qa_approved = ${input.qaApproved},
          qa_notes = ${String(input.notes ?? current.qaNotes).slice(0, 500)}
      where id = ${current.id}
    `;
  } catch (err) {
    if (!missingColumn(err, "qa_approved")) throw err;
    throw new AutopilotError(409, "Run migration 0106_master_lead_verification before QA approval.");
  }
  const next = await loadLeadById(sql, current.id);
  if (!next) throw new AutopilotError(404, "Lead not found");
  return next;
}

export async function markHeroRegenerated(leadId: string, imageUrl: string, width: number | null): Promise<void> {
  const sql = await getSql();
  const status: HeroImageStatus = width != null && width < HERO_MIN_WIDTH ? "low_res" : "regenerated";
  try {
    await sql`
      update preloaded_leads
      set hero_image_status = ${status},
          hero_image_width = ${width},
          visual_mode = ${"custom_hero"},
          visual_status = ${"approved"}
      where id = ${leadId} or lead_slug = ${leadId}
    `;
  } catch (err) {
    if (!missingColumn(err, "hero_image_status")) throw err;
  }
  const current = await loadLeadById(sql, leadId);
  if (current) {
    const scored = computePrimeScore({
      lineType: current.lineType,
      verifiedCallerName: current.verifiedCallerName,
      businessName: current.businessName,
      heroImageStatus: status,
      email: current.contactEmail,
      website: current.website,
      hasWebsite: current.hasWebsite,
      reviewCount: current.reviewCount,
      reviewScore: current.reviewScore,
    });
    try {
      await sql`update preloaded_leads set prime_score = ${scored.total} where id = ${current.id}`;
    } catch (err) {
      if (!missingColumn(err, "prime_score")) throw err;
    }
  }
  void imageUrl;
}

export async function assignNicheFallbackHero(leadId: string, nicheHint?: string): Promise<VerifiedLeadRow> {
  const sql = await getSql();
  const current = await loadLeadById(sql, leadId);
  if (!current) throw new AutopilotError(404, "Lead not found");
  const loop = outreachNicheHero(nicheHint || current.tradeType, current.tradeLabel);
  try {
    await sql`
      update preloaded_leads
      set hero_video_url = ${loop},
          visual_mode = ${VISUAL_MODE_SAMPLE},
          visual_status = ${"unverified"}
      where id = ${current.id}
    `;
  } catch (err) {
    if (!missingColumn(err, "hero_video_url")) throw err;
  }
  const next = await loadLeadById(sql, current.id);
  if (!next) throw new AutopilotError(404, "Lead not found");
  return withPrimeConversion({ ...next, heroVideoUrl: loop });
}

export async function pullPrimeConversionBatch(
  request: Request,
  input: {
    niche?: CommandLeadNiche;
    limit?: number;
    leadIds?: string[];
    compileHero?: boolean;
    assignFallback?: boolean;
    queueOutreach?: boolean;
  },
): Promise<{
  selected: VerifiedLeadRow[];
  heroes: VerifiedLeadRow[];
  fallbacks: VerifiedLeadRow[];
  queued: number;
  skippedOutreach: Array<{ id: string; reason: string }>;
  mode: "simulation" | "live";
  errors: Array<{ id: string; error: string }>;
}> {
  await assertAutopilotDesk(request);
  const niche: CommandLeadNiche =
    input.niche === "electrical" || input.niche === "hvac" || input.niche === "all" ? input.niche : "plumbing";
  const listed = await listCommandLeads(request, {
    filter: input.leadIds?.length ? "all" : "prime_candidates",
    niche,
    limit: 80,
  });
  const selectedIds =
    input.leadIds?.length ?
      input.leadIds.map((id) => id.trim()).filter(Boolean).slice(0, PRIME_HERO_COMPILE_MAX + 20)
    : selectTopPrimeCandidates(listed, { niche, limit: parsePrimeBatchLimit(input.limit) }).map((lead) => lead.id);
  const selected = listed.filter((lead) => selectedIds.includes(lead.id));
  const { occupancyToday, enqueueOutreachBatch } = await import("./outreach-scheduler.server");
  const { parseOutreachMode } = await import("./outreach-queue");
  const { env } = await import("@/lib/env.server");
  const sql = await getSql();
  const [smsOcc, emailOcc] = await Promise.all([occupancyToday(sql, "sms"), occupancyToday(sql, "email")]);
  const plan = planPrimeBatch(selected.length ? selected : listed, {
    selectedIds,
    smsRemaining: smsOcc.remaining,
    emailRemaining: emailOcc.remaining,
  });

  const errors: Array<{ id: string; error: string }> = [];
  const heroes: VerifiedLeadRow[] = [];
  const fallbacks: VerifiedLeadRow[] = [];

  if (input.compileHero !== false) {
    const { recreateAnimatedHero } = await import("./outreach-desk.server");
    for (const id of plan.heroRecreateIds) {
      try {
        const lead = selected.find((row) => row.id === id);
        const compiled = await recreateAnimatedHero(request, {
          leadId: id,
          imageUrl: lead?.heroImageUrl || lead?.datasetImages[0],
          shopName: lead?.businessName,
          city: lead?.city,
          niche: lead?.tradeType || niche,
        });
        await markHeroRegenerated(id, compiled.heroImageUrl, compiled.heroImageWidth ?? null);
        const saved = await loadLeadById(sql, id);
        if (saved) heroes.push(withPrimeConversion(saved));
      } catch (err) {
        errors.push({ id, error: err instanceof Error ? err.message : "Hero compile failed" });
      }
    }
  }

  if (input.assignFallback !== false) {
    for (const id of plan.fallbackHeroIds) {
      try {
        fallbacks.push(await assignNicheFallbackHero(id, niche === "all" ? undefined : niche));
      } catch (err) {
        errors.push({ id, error: err instanceof Error ? err.message : "Fallback hero failed" });
      }
    }
  }

  let queued = 0;
  if (input.queueOutreach !== false) {
    const rows = plan.outreach
      .map((item) => {
        const lead = selected.find((row) => row.id === item.id);
        if (!lead) return null;
        return {
          businessName: lead.businessName,
          phone: lead.contactPhone,
          email: lead.contactEmail,
          niche: niche === "all" ? lead.tradeType || "plumbing" : niche,
          channel: item.channel,
          leadSlug: lead.leadSlug,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row != null);
    queued = await enqueueOutreachBatch(sql, rows);
  }

  return {
    selected: selected.map(withPrimeConversion),
    heroes,
    fallbacks,
    queued,
    skippedOutreach: plan.skippedOutreach,
    mode: parseOutreachMode(env("OUTREACH_MODE")),
    errors,
  };
}
