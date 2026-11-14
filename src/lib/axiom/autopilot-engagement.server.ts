import { getSql } from "@/lib/db";
import { env } from "@/lib/env.server";
import { newId } from "@/lib/utils";
import { notifyShop } from "./notify.server";
import { resolvePublicAppOrigin } from "./public-app-url";
import {
  GRAPH_BASE,
  type PublishPlatform,
} from "./social-publish.ts";
import {
  ensureFreshSocialToken,
  loadShopSocialAccounts,
  type SocialAccountRow,
} from "./social-publish.server";
import {
  brandSafeReply,
  classifySocialIntent,
  metaVerifyChallenge,
  parseClassifiedJson,
  parseGbpWebhookPayload,
  parseMetaWebhookPayload,
  metaSignatureMatches,
  storefrontUrl,
  type ClassifiedEngagement,
  type SocialInboundEvent,
} from "./autopilot-engagement.ts";

function missingRelation(err: unknown, table: string): boolean {
  const message = err instanceof Error ? err.message : "";
  return new RegExp(table, "i").test(message) && /does not exist|undefined table/i.test(message);
}

function metaAppSecret(): string | undefined {
  return env("META_APP_SECRET") || env("FACEBOOK_APP_SECRET");
}

function metaVerifyToken(): string | undefined {
  return env("META_VERIFY_TOKEN") || env("FACEBOOK_VERIFY_TOKEN") || env("CRON_SECRET");
}

function gbpWebhookSecret(): string | undefined {
  return env("GBP_WEBHOOK_SECRET") || env("GOOGLE_WEBHOOK_SECRET") || env("CRON_SECRET");
}

export function metaSignatureValid(raw: string, header: string | null): boolean {
  return metaSignatureMatches(raw, header, metaAppSecret() ?? "");
}

export function handleMetaWebhookVerify(request: Request): Response | null {
  if (request.method !== "GET") return null;
  const url = new URL(request.url);
  const token = metaVerifyToken();
  if (!token) return Response.json({ error: "Webhook is not configured" }, { status: 503 });
  const challenge = metaVerifyChallenge(url.searchParams, token);
  if (!challenge) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return new Response(challenge, { headers: { "content-type": "text/plain" } });
}

async function graphJson(res: Response, label: string): Promise<Record<string, unknown>> {
  const text = await res.text();
  let body: Record<string, unknown> = {};
  try {
    body = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    body = { raw: text.slice(0, 200) };
  }
  if (!res.ok) {
    const err = body.error && typeof body.error === "object" ? (body.error as { message?: string }) : {};
    throw new Error(`${label} ${res.status}: ${(err.message || text).slice(0, 280)}`);
  }
  return body;
}

async function findAccountForEvent(event: SocialInboundEvent): Promise<SocialAccountRow | null> {
  try {
    const sql = await getSql();
    const rows = await sql<SocialAccountRow>`
      select id, shop_id, platform, page_id, ig_user_id, gbp_account_id, gbp_location_id,
             access_token, refresh_token, token_expires_at, token_refreshed_at, status, scopes
      from shop_social_accounts
      where status <> 'revoked'
        and (
          page_id = ${event.pageId}
          or ig_user_id = ${event.pageId}
          or gbp_location_id = ${event.pageId}
          or gbp_account_id = ${event.pageId}
        )
      limit 1
    `;
    return rows[0] ?? null;
  } catch (err) {
    if (missingRelation(err, "shop_social_accounts")) return null;
    throw err;
  }
}

async function loadShop(shopId: string): Promise<{ id: string; slug: string; name: string; niche: string } | null> {
  const sql = await getSql();
  const rows = await sql<{ id: string; slug: string; name: string; niche: string }>`
    select id, slug, name, niche from shops where id = ${shopId} limit 1
  `;
  return rows[0] ?? null;
}

async function alreadyHandled(externalId: string): Promise<boolean> {
  try {
    const sql = await getSql();
    const rows = await sql<{ id: string; status: string }>`
      select id, status from shop_social_inbox where external_id = ${externalId} limit 1
    `;
    return rows[0]?.status === "replied";
  } catch (err) {
    if (missingRelation(err, "shop_social_inbox")) return false;
    throw err;
  }
}

async function classifyWithGrok(fallback: ClassifiedEngagement, text: string, shopName: string, link: string) {
  const apiKey = process.env.XAI_API_KEY?.trim();
  if (!apiKey || text.length < 4) return fallback;
  try {
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        max_tokens: 180,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "Classify a social comment for a local trade shop. Return JSON only: intent (pricing|booking|question|review), booking (bool), liveNeed (bool), confidence (0-1), reply (one short brand-safe sentence that MUST include the given storefront URL), name, phone, email, summary. Never invent prices, never insult, never collect card numbers.",
          },
          {
            role: "user",
            content: `Shop: ${shopName}\nStorefront: ${link}\nComment: ${text.slice(0, 600)}`,
          },
        ],
      }),
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return fallback;
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return parseClassifiedJson(body.choices?.[0]?.message?.content ?? "", fallback);
  } catch {
    return fallback;
  }
}

async function postSocialReply(account: SocialAccountRow, event: SocialInboundEvent, reply: string): Promise<string> {
  const live = await ensureFreshSocialToken(account);
  if (event.platform === "gbp") {
    if (event.kind === "review") {
      const name = event.parentId.includes("accounts/")
        ? event.parentId
        : `accounts/${live.gbp_account_id}/locations/${live.gbp_location_id}/reviews/${event.parentId}`;
      const res = await fetch(`https://mybusiness.googleapis.com/v4/${name}/reply`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${live.access_token}`, "content-type": "application/json" },
        body: JSON.stringify({ comment: reply.slice(0, 4000) }),
        signal: AbortSignal.timeout(15_000),
      });
      const json = await graphJson(res, "GBP review reply");
      return String(json.comment ?? "gbp-reply");
    }
    const qName = event.parentId.includes("locations/")
      ? event.parentId
      : `locations/${live.gbp_location_id}/questions/${event.parentId}`;
    const res = await fetch(`https://mybusinessqanda.googleapis.com/v1/${qName}/answers:upsert`, {
      method: "POST",
      headers: { Authorization: `Bearer ${live.access_token}`, "content-type": "application/json" },
      body: JSON.stringify({ answer: { text: reply.slice(0, 2000) } }),
      signal: AbortSignal.timeout(15_000),
    });
    const json = await graphJson(res, "GBP Q&A reply");
    return String((json.answer as { name?: string } | undefined)?.name ?? "gbp-answer");
  }

  if (event.kind === "dm") {
    const res = await fetch(`${GRAPH_BASE}/${live.page_id || event.pageId}/messages`, {
      method: "POST",
      body: new URLSearchParams({
        recipient: JSON.stringify({ id: event.fromId }),
        messaging_type: "RESPONSE",
        message: JSON.stringify({ text: reply.slice(0, 1600) }),
        access_token: live.access_token,
      }),
      signal: AbortSignal.timeout(15_000),
    });
    const json = await graphJson(res, "Messenger");
    return String(json.message_id ?? json.id ?? "");
  }

  const target = event.externalId.split(":")[1] || event.parentId;
  const path = event.platform === "instagram" ? `${target}/replies` : `${target}/comments`;
  const res = await fetch(`${GRAPH_BASE}/${path}`, {
    method: "POST",
    body: new URLSearchParams({ message: reply.slice(0, 700), access_token: live.access_token }),
    signal: AbortSignal.timeout(15_000),
  });
  const json = await graphJson(res, event.platform === "instagram" ? "Instagram reply" : "Facebook comment");
  return String(json.id ?? "");
}

async function logWarmLead(input: {
  shop: { id: string; slug: string; name: string; niche: string };
  event: SocialInboundEvent;
  classified: ClassifiedEngagement;
}): Promise<string> {
  const sql = await getSql();
  const meta = JSON.stringify({
    source: "social",
    platform: input.event.platform,
    kind: input.event.kind,
    external_id: input.event.externalId,
    intent: input.classified.intent,
    shop_id: input.shop.id,
    shop_slug: input.shop.slug,
  });
  let leadId = "";
  try {
    const inserted = await sql<{ id: string }>`
      insert into consumer_leads (
        niche, contact_name, contact_phone, contact_email, contact_meta, shop_id, source, active
      ) values (
        ${input.shop.niche || "plumbing"},
        ${input.classified.contactName},
        ${input.classified.contactPhone},
        ${input.classified.contactEmail},
        ${meta}::jsonb,
        ${input.shop.id},
        ${"social"},
        true
      )
      returning id::text as id
    `;
    leadId = inserted[0]?.id ?? "";
  } catch (err) {
    if (!missingRelation(err, "consumer_leads") && !/shop_id|source/i.test(err instanceof Error ? err.message : "")) {
      throw err;
    }
    const inserted = await sql<{ id: string }>`
      insert into consumer_leads (niche, contact_name, contact_phone, contact_email, contact_meta, active)
      values (
        ${input.shop.niche || "plumbing"},
        ${input.classified.contactName},
        ${input.classified.contactPhone},
        ${input.classified.contactEmail},
        ${meta}::jsonb,
        true
      )
      returning id::text as id
    `.catch(() => [] as { id: string }[]);
    leadId = inserted[0]?.id ?? "";
  }
  if (input.classified.booking || input.classified.liveNeed) {
    const requestId = newId("apr");
    await sql`
      insert into appointment_requests (
        id, consumer_lead_id, shop_id, caller_name, caller_phone, requested_service, transcript, vapi_call_id, status
      ) values (
        ${requestId},
        ${leadId || null},
        ${input.shop.id},
        ${input.classified.contactName},
        ${input.classified.contactPhone},
        ${input.classified.summary.slice(0, 120) || "Social booking request"},
        ${input.event.text.slice(0, 4000)},
        ${`soc_${input.event.externalId}`.slice(0, 120)},
        ${"new"}
      )
      on conflict (vapi_call_id) do nothing
    `.catch(() => undefined);
  }
  return leadId;
}

async function persistInbox(input: {
  shopId: string;
  event: SocialInboundEvent;
  classified: ClassifiedEngagement;
  status: "replied" | "skipped" | "failed";
  leadId: string;
}): Promise<void> {
  const sql = await getSql();
  try {
    await sql`
      insert into shop_social_inbox (
        id, shop_id, platform, kind, external_id, parent_id, from_id, from_name, body,
        intent, reply, replied_at, lead_id, status, created_at
      ) values (
        ${newId("sin")}, ${input.shopId}, ${input.event.platform}, ${input.event.kind},
        ${input.event.externalId}, ${input.event.parentId}, ${input.event.fromId}, ${input.event.fromName},
        ${input.event.text.slice(0, 4000)}, ${input.classified.intent}, ${input.classified.reply},
        ${input.status === "replied" ? new Date().toISOString() : null}, ${input.leadId || null},
        ${input.status}, now()
      )
      on conflict (external_id) do nothing
    `;
  } catch (err) {
    if (missingRelation(err, "shop_social_inbox")) return;
    throw err;
  }
}

export async function processSocialInbound(
  event: SocialInboundEvent,
  origin?: string,
): Promise<{ handled: boolean; replied: boolean; lead: boolean; intent?: string }> {
  if (await alreadyHandled(event.externalId)) {
    return { handled: false, replied: false, lead: false };
  }
  const account = await findAccountForEvent(event);
  if (!account) return { handled: false, replied: false, lead: false };
  const shop = await loadShop(account.shop_id);
  if (!shop) return { handled: false, replied: false, lead: false };
  const publicOrigin = origin || resolvePublicAppOrigin();
  const link = storefrontUrl(publicOrigin, shop.slug);
  const fallback = classifySocialIntent({
    text: event.text,
    shopName: shop.name,
    slug: shop.slug,
    origin: publicOrigin,
    fromName: event.fromName,
  });
  const classified = await classifyWithGrok(fallback, event.text, shop.name, link);
  if (!classified.reply.includes("/t/")) {
    classified.reply = brandSafeReply({
      shopName: shop.name,
      slug: shop.slug,
      origin: publicOrigin,
      intent: classified.intent,
      fromName: event.fromName,
    });
  }

  await persistInbox({ shopId: shop.id, event, classified, status: "skipped", leadId: "" });

  let replied = false;
  let status: "replied" | "skipped" | "failed" = "skipped";
  try {
    const postId = await postSocialReply(account, event, classified.reply);
    replied = Boolean(postId);
    status = replied ? "replied" : "failed";
  } catch {
    status = "failed";
  }

  let leadId = "";
  const warm = classified.booking || classified.liveNeed || classified.intent === "booking";
  if (warm) {
    leadId = await logWarmLead({ shop, event, classified }).catch(() => "");
    await notifyShop(shop.id, {
      kind: "inquiry",
      subject: classified.liveNeed ? "Live job from social" : "Booking ask from social",
      body: [
        `${classified.contactName || "A customer"} wrote on ${event.platform}:`,
        classified.summary || event.text.slice(0, 180),
        classified.contactPhone ? `Phone ${classified.contactPhone}` : "",
        classified.contactEmail ? `Email ${classified.contactEmail}` : "",
        `Booking page ${link}`,
        "If this is a real job, get the crew rolling.",
      ]
        .filter(Boolean)
        .join(" "),
    }).catch(() => undefined);
  }

  const sql = await getSql();
  await sql`
    update shop_social_inbox
    set status = ${status},
        reply = ${classified.reply},
        intent = ${classified.intent},
        lead_id = ${leadId || null},
        replied_at = ${status === "replied" ? new Date().toISOString() : null}
    where external_id = ${event.externalId}
  `.catch(() => undefined);
  return { handled: true, replied, lead: Boolean(leadId), intent: classified.intent };
}

export async function handleMetaWebhook(request: Request): Promise<Response> {
  const verify = handleMetaWebhookVerify(request);
  if (verify) return verify;
  const raw = await request.text();
  const sig = request.headers.get("x-hub-signature-256") || request.headers.get("x-hub-signature");
  if (!metaSignatureValid(raw, sig)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  let payload: unknown;
  try {
    payload = raw ? JSON.parse(raw) : null;
  } catch {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }
  const events = parseMetaWebhookPayload(payload);
  const origin = resolvePublicAppOrigin(new URL(request.url).origin);
  let replied = 0;
  let leads = 0;
  for (const event of events.slice(0, 20)) {
    const result = await processSocialInbound(event, origin).catch(() => ({
      handled: false,
      replied: false,
      lead: false,
    }));
    if (result.replied) replied += 1;
    if (result.lead) leads += 1;
  }
  return Response.json({ ok: true, received: events.length, replied, leads });
}

export async function handleGbpWebhook(request: Request): Promise<Response> {
  const secret = gbpWebhookSecret();
  const provided =
    request.headers.get("x-gbp-secret")?.trim() ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ||
    "";
  if (!secret || provided !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }
  const events = parseGbpWebhookPayload(payload);
  const origin = resolvePublicAppOrigin(new URL(request.url).origin);
  let replied = 0;
  let leads = 0;
  for (const event of events.slice(0, 20)) {
    const result = await processSocialInbound(event, origin).catch(() => ({
      handled: false,
      replied: false,
      lead: false,
    }));
    if (result.replied) replied += 1;
    if (result.lead) leads += 1;
  }
  return Response.json({ ok: true, received: events.length, replied, leads });
}

async function pollGbpForAccount(account: SocialAccountRow, origin: string): Promise<number> {
  const live = await ensureFreshSocialToken(account);
  if (!live.gbp_account_id || !live.gbp_location_id) return 0;
  const url = `https://mybusiness.googleapis.com/v4/accounts/${live.gbp_account_id}/locations/${live.gbp_location_id}/reviews?pageSize=10`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${live.access_token}` },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) return 0;
  const body = (await res.json()) as {
    reviews?: { reviewId?: string; comment?: string; starRating?: string; reviewer?: { displayName?: string } }[];
  };
  let n = 0;
  for (const review of body.reviews ?? []) {
    const event: SocialInboundEvent = {
      platform: "gbp",
      kind: "review",
      externalId: `gbp:review:${review.reviewId ?? ""}`,
      pageId: live.gbp_location_id,
      parentId: review.reviewId ?? "",
      fromId: review.reviewer?.displayName ?? "reviewer",
      fromName: review.reviewer?.displayName ?? "",
      text: review.comment || `${review.starRating ?? ""} star review`,
      createdAt: new Date().toISOString(),
    };
    if (!event.parentId) continue;
    const result = await processSocialInbound(event, origin).catch(() => ({ handled: false, replied: false, lead: false }));
    if (result.handled) n += 1;
  }
  return n;
}

async function pollGraphComments(account: SocialAccountRow, origin: string): Promise<number> {
  if (account.platform === "gbp") return 0;
  const live = await ensureFreshSocialToken(account);
  const id = account.platform === "instagram" ? account.ig_user_id : account.page_id;
  if (!id) return 0;
  const path =
    account.platform === "instagram"
      ? `${id}/media?fields=id,comments{id,text,username,timestamp}&limit=5`
      : `${id}/feed?fields=id,comments{id,message,from,created_time}&limit=5`;
  const res = await fetch(`${GRAPH_BASE}/${path}&access_token=${encodeURIComponent(live.access_token)}`, {
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) return 0;
  const body = (await res.json()) as {
    data?: {
      id?: string;
      comments?: {
        data?: { id?: string; message?: string; text?: string; from?: { id?: string; name?: string }; username?: string }[];
      };
    }[];
  };
  let n = 0;
  for (const media of body.data ?? []) {
    for (const comment of media.comments?.data ?? []) {
      const fromId = String(comment.from?.id ?? "").trim();
      if (fromId && fromId === id) continue;
      const event: SocialInboundEvent = {
        platform: account.platform,
        kind: "comment",
        externalId: `${account.platform}:${comment.id ?? ""}:${fromId || "anon"}`,
        pageId: id,
        parentId: comment.id ?? media.id ?? "",
        fromId: fromId || String(comment.username ?? ""),
        fromName: String(comment.from?.name ?? comment.username ?? ""),
        text: String(comment.message ?? comment.text ?? ""),
        createdAt: new Date().toISOString(),
      };
      if (!comment.id || !event.text) continue;
      const result = await processSocialInbound(event, origin).catch(() => ({ handled: false, replied: false, lead: false }));
      if (result.handled) n += 1;
    }
  }
  return n;
}

/** Cron backup when webhooks are delayed: poll Graph comments and GBP reviews. */
export async function tickSocialEngagement(): Promise<{ scanned: number; handled: number }> {
  const sql = await getSql();
  let accounts: SocialAccountRow[] = [];
  try {
    accounts = await sql<SocialAccountRow>`
      select id, shop_id, platform, page_id, ig_user_id, gbp_account_id, gbp_location_id,
             access_token, refresh_token, token_expires_at, token_refreshed_at, status, scopes
      from shop_social_accounts
      where status = 'active'
      limit 24
    `;
  } catch (err) {
    if (missingRelation(err, "shop_social_accounts")) return { scanned: 0, handled: 0 };
    throw err;
  }
  const origin = resolvePublicAppOrigin();
  let handled = 0;
  for (const account of accounts) {
    try {
      if (account.platform === "gbp") handled += await pollGbpForAccount(account, origin);
      else handled += await pollGraphComments(account, origin);
    } catch {
      /* keep scanning other connected pages */
    }
  }
  return { scanned: accounts.length, handled };
}

export async function listShopSocialAccountsForEngagement(shopId: string) {
  return loadShopSocialAccounts(shopId);
}

export type { PublishPlatform };
