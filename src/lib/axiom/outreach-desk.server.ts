import "server-only";
import { getSql } from "@/lib/db";
import { AutopilotError, assertAutopilotDesk } from "./autopilot.server";
import { generateBackgroundMotion, generateProofTouchupSlot } from "./ai-client";
import { assertValidBranding } from "./studio-visual-blueprint";
import { founderOfferPitchUrl } from "@/lib/stripe/commercial";
import { resolvePublicAppOrigin } from "./public-app-url";
import {
  applyClaimUrl,
  industrialNoirHeroDirective,
  leadHasDatasetImages,
  leadHasPhone,
  outreachPresentationForVisualMode,
  parseDatasetImages,
  parseVisualMode,
  parseVisualStatus,
  VISUAL_MODE_CUSTOM,
  VISUAL_STATUS_APPROVED,
  type DatasetBatchRow,
  type DatasetInspectorFilter,
  type DatasetLeadRecord,
  type LeadVisualMode,
} from "./outreach-desk";

type Sql = Awaited<ReturnType<typeof getSql>>;

export type { DatasetBatchRow };

function missingColumn(err: unknown, column: string): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return new RegExp(column, "i").test(message);
}

function asLead(row: Record<string, unknown>): DatasetLeadRecord {
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
    heroImageUrl: String(row.hero_image_url ?? ""),
    heroVideoUrl: String(row.hero_video_url ?? ""),
    visualMode: parseVisualMode(row.visual_mode),
    visualStatus: parseVisualStatus(row.visual_status),
    phoneE164: String(row.phone_e164 ?? ""),
    lineType: String(row.line_type ?? "unknown"),
    carrierName: String(row.carrier_name ?? ""),
    verifiedCallerName: String(row.verified_caller_name ?? ""),
    phoneVerifiedAt: row.phone_verified_at ? String(row.phone_verified_at) : "",
    heroImageStatus: String(row.hero_image_status ?? "unchecked"),
    heroImageWidth: typeof row.hero_image_width === "number" ? row.hero_image_width : null,
    primeScore: Number(row.prime_score ?? 0) || 0,
    qaApproved: Boolean(row.qa_approved),
    qaNotes: String(row.qa_notes ?? ""),
  };
}

async function loadLeadsRaw(sql: Sql): Promise<DatasetLeadRecord[]> {
  try {
    const rows = await sql<Record<string, unknown>>`
      select id, lead_slug, business_name, trade_type, trade_label, contact_name, contact_phone, contact_email,
        street_address, city, county, state, zip_code, website, source, claimed, dataset_images,
        hero_image_url, hero_video_url, visual_mode, visual_status
      from preloaded_leads
      order by source asc, county asc, lead_slug asc
      limit 4000
    `;
    return rows.map(asLead);
  } catch (err) {
    if (!missingColumn(err, "visual_mode") && !missingColumn(err, "dataset_images") && !missingColumn(err, "street_address")) {
      throw err;
    }
    const rows = await sql<Record<string, unknown>>`
      select id, lead_slug, business_name, trade_type, trade_label, contact_name, contact_phone, contact_email,
        city, county, state, zip_code, website, source, claimed
      from preloaded_leads
      order by source asc, county asc, lead_slug asc
      limit 4000
    `;
    return rows.map(asLead);
  }
}

export function filterInspectorLeads(leads: DatasetLeadRecord[], filters: DatasetInspectorFilter): DatasetLeadRecord[] {
  return leads.filter((lead) => {
    if (filters.hasPhone && !leadHasPhone(lead)) return false;
    if (filters.hasDatasetImages && !leadHasDatasetImages(lead)) return false;
    if (filters.unverified && lead.visualStatus === VISUAL_STATUS_APPROVED && lead.visualMode === VISUAL_MODE_CUSTOM) {
      return false;
    }
    return true;
  });
}

export async function listDatasetBatches(request: Request): Promise<DatasetBatchRow[]> {
  await assertAutopilotDesk(request);
  const sql = await getSql();
  const leads = await loadLeadsRaw(sql);
  const buckets = new Map<string, DatasetBatchRow>();
  for (const lead of leads) {
    const id = `${lead.source || "import"}|${lead.county}|${lead.tradeType}`;
    const current = buckets.get(id);
    if (current) current.leadCount += 1;
    else {
      buckets.set(id, {
        id,
        source: lead.source || "import",
        county: lead.county,
        tradeType: lead.tradeType,
        leadCount: 1,
      });
    }
  }
  return [...buckets.values()].sort((a, b) => b.leadCount - a.leadCount);
}

export async function inspectDatasetLead(
  request: Request,
  input: { batchId?: string; leadId?: string; index?: number } & DatasetInspectorFilter,
): Promise<{ lead: DatasetLeadRecord | null; index: number; total: number; batchId: string }> {
  await assertAutopilotDesk(request);
  const sql = await getSql();
  const all = await loadLeadsRaw(sql);
  const [source, county, tradeType] = String(input.batchId ?? "").split("|");
  const scoped = all.filter((lead) => {
    if (source && lead.source !== source) return false;
    if (county && lead.county !== county) return false;
    if (tradeType && lead.tradeType !== tradeType) return false;
    return true;
  });
  const filtered = filterInspectorLeads(scoped, {
    hasPhone: input.hasPhone,
    hasDatasetImages: input.hasDatasetImages,
    unverified: input.unverified,
  });
  const batchId = input.batchId || scoped[0] ? `${scoped[0]?.source}|${scoped[0]?.county}|${scoped[0]?.tradeType}` : "";
  if (!filtered.length) return { lead: null, index: 0, total: 0, batchId };
  let index = Number(input.index) || 0;
  if (input.leadId) {
    const found = filtered.findIndex((lead) => lead.id === input.leadId || lead.leadSlug === input.leadId);
    if (found >= 0) index = found;
  }
  index = Math.min(filtered.length - 1, Math.max(0, index));
  return { lead: filtered[index] ?? null, index, total: filtered.length, batchId };
}

export async function saveLeadPhone(request: Request, leadId: string, phone: string): Promise<DatasetLeadRecord> {
  await assertAutopilotDesk(request);
  const digits = phone.replace(/\D/g, "").slice(-15);
  if (digits.length < 10) throw new AutopilotError(400, "Enter the real cell this shop carries.");
  const current = await inspectDatasetLead(request, { leadId });
  if (!current.lead) throw new AutopilotError(404, "Lead not found");
  const check = assertValidBranding({ shopName: current.lead.businessName, phone: digits });
  if (!check.ok) throw new AutopilotError(400, check.reason);
  const sql = await getSql();
  await sql`
    update preloaded_leads
    set contact_phone = ${digits}
    where id = ${leadId} or lead_slug = ${leadId}
  `;
  const next = await inspectDatasetLead(request, { leadId });
  if (!next.lead) throw new AutopilotError(404, "Lead not found");
  return next.lead;
}

export async function attachLeadDatasetImage(request: Request, leadId: string, imageUrl: string): Promise<DatasetLeadRecord> {
  await assertAutopilotDesk(request);
  const url = imageUrl.trim();
  if (!url || url.length > 4000) throw new AutopilotError(400, "Upload a shop or truck photograph.");
  const sql = await getSql();
  const current = await inspectDatasetLead(request, { leadId });
  if (!current.lead) throw new AutopilotError(404, "Lead not found");
  const images = [...current.lead.datasetImages, url].slice(-12);
  try {
    await sql`
      update preloaded_leads
      set dataset_images = ${JSON.stringify(images)}::jsonb,
          hero_image_url = case when btrim(coalesce(hero_image_url, '')) = '' then ${url} else hero_image_url end
      where id = ${current.lead.id}
    `;
  } catch (err) {
    if (!missingColumn(err, "dataset_images")) throw err;
  }
  const next = await inspectDatasetLead(request, { leadId: current.lead.id });
  if (!next.lead) throw new AutopilotError(404, "Lead not found");
  return next.lead;
}

export async function recreateAnimatedHero(
  request: Request,
  input: { leadId: string; imageUrl?: string; shopName?: string; city?: string; niche?: string },
): Promise<DatasetLeadRecord> {
  await assertAutopilotDesk(request);
  const current = await inspectDatasetLead(request, { leadId: input.leadId });
  const lead = current.lead;
  if (!lead) throw new AutopilotError(404, "Lead not found");
  const shopName = (input.shopName || lead.businessName).replace(/\s+/g, " ").trim().slice(0, 80);
  const niche = (input.niche || lead.tradeType).trim();
  const source = (input.imageUrl || lead.heroImageUrl || lead.datasetImages[0] || "").trim();
  if (!source) throw new AutopilotError(400, "Drop a shop or truck photograph first.");
  const branding = assertValidBranding({ shopName, phone: lead.contactPhone || undefined });
  if (!branding.ok) throw new AutopilotError(400, branding.reason);

  const slug = lead.leadSlug || lead.id.replace(/[^a-z0-9-]/gi, "-").slice(0, 80);
  void industrialNoirHeroDirective(shopName);
  void input.city;
  let still = source;
  let motion = lead.heroVideoUrl;
  if (/^https:\/\//i.test(source)) {
    const remade = await generateProofTouchupSlot({
      shopSlug: slug,
      sourceImageUrl: source,
      slotLabel: "Hero",
      niche,
      shopName,
      brandColor: "#00ffcc",
    });
    still = remade.imageUrl;
    const loop = await generateBackgroundMotion({
      shopSlug: slug,
      sourceImageUrl: still,
      niche,
      shopName,
      brandColor: "#FFE500",
      motion: "subtle",
    });
    motion = loop.videoUrl;
  }

  const sql = await getSql();
  const images = [...new Set([still, ...lead.datasetImages])].slice(0, 12);
  try {
    await sql`
      update preloaded_leads
      set hero_image_url = ${still},
          hero_video_url = ${motion},
          dataset_images = ${JSON.stringify(images)}::jsonb,
          visual_mode = ${VISUAL_MODE_CUSTOM},
          visual_status = ${VISUAL_STATUS_APPROVED}
      where id = ${lead.id}
    `;
  } catch (err) {
    if (!missingColumn(err, "visual_mode")) throw err;
    throw new AutopilotError(409, "Run migration 0103_lead_visual_hero before attaching custom heroes.");
  }
  const next = await inspectDatasetLead(request, { leadId: lead.id });
  if (!next.lead) throw new AutopilotError(404, "Lead not found");
  return next.lead;
}

export function claimUrlForLead(origin: string, lead: { leadSlug: string; county: string }): string {
  return founderOfferPitchUrl(resolvePublicAppOrigin(origin), { leadSlug: lead.leadSlug, county: lead.county });
}

export function renderLeadOutreach(
  lead: { visualMode?: LeadVisualMode | string; businessName: string; leadSlug: string; county: string; contactName?: string },
  origin: string,
): { sms: string; emailSubject: string; emailBody: string; visualMode: LeadVisualMode } {
  const pack = outreachPresentationForVisualMode(lead.visualMode);
  const claimUrl = claimUrlForLead(origin, lead);
  const fill = (template: string) =>
    applyClaimUrl(template, claimUrl)
      .replaceAll("{business}", lead.businessName)
      .replaceAll("{owner}", lead.contactName || lead.businessName)
      .replaceAll("{url}", claimUrl);
  return {
    visualMode: pack.visualMode,
    sms: fill(pack.sms),
    emailSubject: fill(pack.emailSubject),
    emailBody: fill(pack.emailBody),
  };
}
