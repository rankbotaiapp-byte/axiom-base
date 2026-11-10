import { getSql } from "@/lib/db";
import { env } from "@/lib/env.server";
import { newId } from "@/lib/utils";
import { resolvePublicAppOrigin } from "./public-app-url";
import {
  defaultAutopilotChannels,
  facebookTokenNeedsRefresh,
  mergeDeliveries,
  parseDeliveredJson,
  parsePublishPlatforms,
  publicMediaUrl,
  tokenNeedsRefresh,
  type GbpLocalPostPayload,
  type GraphFeedPayload,
  type InstagramMediaPayload,
  type PublishPlatform,
  type SocialDelivery,
} from "./social-publish.ts";
import { shopMediaPath } from "./media-slots";
import { composeSocialPublishJob } from "./autopilot-content.ts";

const GRAPH = "https://graph.facebook.com/v21.0";

export type SocialAccountRow = {
  id: string;
  shop_id: string;
  platform: PublishPlatform;
  page_id: string;
  ig_user_id: string;
  gbp_account_id: string;
  gbp_location_id: string;
  access_token: string;
  refresh_token: string;
  token_expires_at: string | Date | null;
  token_refreshed_at: string | Date | null;
  status: "active" | "needs_reauth" | "revoked";
  scopes: string;
};

type PostRow = {
  id: string;
  shop_id: string;
  asset_id: string | null;
  caption: string;
  channels: string;
  status: string;
  delivered: unknown;
};

function missingRelation(err: unknown, table: string): boolean {
  const message = err instanceof Error ? err.message : "";
  return new RegExp(table, "i").test(message) && /does not exist|undefined table/i.test(message);
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

function supabaseRest(): { url: string; key: string } | null {
  const url = (env("SUPABASE_URL") || env("NEXT_PUBLIC_SUPABASE_URL") || env("VITE_SUPABASE_URL") || "").replace(/\/$/, "");
  const key =
    env("SUPABASE_SERVICE_ROLE_KEY") ||
    env("SUPABASE_SERVICE_KEY") ||
    env("SUPABASE_ANON_KEY") ||
    env("VITE_SUPABASE_ANON_KEY") ||
    env("NEXT_PUBLIC_SUPABASE_ANON_KEY") ||
    "";
  if (!url || !key) return null;
  return { url, key };
}

function envSocialAccounts(shopId: string): SocialAccountRow[] {
  const rows: SocialAccountRow[] = [];
  const fbToken = env("FACEBOOK_PAGE_ACCESS_TOKEN") || env("META_PAGE_ACCESS_TOKEN");
  const pageId = env("FACEBOOK_PAGE_ID") || env("META_PAGE_ID") || "";
  const igUserId = env("INSTAGRAM_USER_ID") || env("IG_USER_ID") || "";
  if (fbToken && pageId) {
    rows.push({
      id: `env_fb_${shopId}`,
      shop_id: shopId,
      platform: "facebook",
      page_id: pageId,
      ig_user_id: igUserId,
      gbp_account_id: "",
      gbp_location_id: "",
      access_token: fbToken,
      refresh_token: "",
      token_expires_at: null,
      token_refreshed_at: null,
      status: "active",
      scopes: "pages_manage_posts",
    });
    if (igUserId) {
      rows.push({
        id: `env_ig_${shopId}`,
        shop_id: shopId,
        platform: "instagram",
        page_id: pageId,
        ig_user_id: igUserId,
        gbp_account_id: "",
        gbp_location_id: "",
        access_token: fbToken,
        refresh_token: "",
        token_expires_at: null,
        token_refreshed_at: null,
        status: "active",
        scopes: "instagram_content_publish",
      });
    }
  }
  const gbpRefresh = env("GOOGLE_REFRESH_TOKEN") || env("GBP_REFRESH_TOKEN") || "";
  const gbpAccount = env("GBP_ACCOUNT_ID") || "";
  const gbpLocation = env("GBP_LOCATION_ID") || "";
  if (gbpRefresh && gbpAccount && gbpLocation) {
    rows.push({
      id: `env_gbp_${shopId}`,
      shop_id: shopId,
      platform: "gbp",
      page_id: "",
      ig_user_id: "",
      gbp_account_id: gbpAccount,
      gbp_location_id: gbpLocation,
      access_token: env("GOOGLE_ACCESS_TOKEN") || "",
      refresh_token: gbpRefresh,
      token_expires_at: new Date(0).toISOString(),
      token_refreshed_at: null,
      status: "active",
      scopes: "https://www.googleapis.com/auth/business.manage",
    });
  }
  return rows;
}

function asAccountRow(row: Record<string, unknown>, shopId: string): SocialAccountRow | null {
  const platform = row.platform;
  if (platform !== "facebook" && platform !== "instagram" && platform !== "gbp") return null;
  const access = String(row.access_token ?? "").trim();
  if (!access && !String(row.refresh_token ?? "").trim()) return null;
  return {
    id: String(row.id ?? `${platform}_${shopId}`),
    shop_id: String(row.shop_id ?? shopId),
    platform,
    page_id: String(row.page_id ?? ""),
    ig_user_id: String(row.ig_user_id ?? ""),
    gbp_account_id: String(row.gbp_account_id ?? ""),
    gbp_location_id: String(row.gbp_location_id ?? ""),
    access_token: access,
    refresh_token: String(row.refresh_token ?? ""),
    token_expires_at: (row.token_expires_at as string | null) ?? null,
    token_refreshed_at: (row.token_refreshed_at as string | null) ?? null,
    status: row.status === "needs_reauth" || row.status === "revoked" ? row.status : "active",
    scopes: String(row.scopes ?? ""),
  };
}

async function loadAccountsFromSupabase(shopId: string): Promise<SocialAccountRow[]> {
  const rest = supabaseRest();
  if (!rest) return [];
  try {
    const res = await fetch(
      `${rest.url}/rest/v1/shop_social_accounts?shop_id=eq.${encodeURIComponent(shopId)}&status=neq.revoked&select=*`,
      {
        headers: {
          apikey: rest.key,
          authorization: `Bearer ${rest.key}`,
        },
        signal: AbortSignal.timeout(8000),
      },
    );
    if (!res.ok) return [];
    const rows = (await res.json()) as Record<string, unknown>[];
    return rows.map((row) => asAccountRow(row, shopId)).filter((row): row is SocialAccountRow => Boolean(row));
  } catch {
    return [];
  }
}

async function loadDueAccountsFromSupabase(): Promise<SocialAccountRow[]> {
  const rest = supabaseRest();
  if (!rest) return [];
  try {
    const res = await fetch(
      `${rest.url}/rest/v1/shop_social_accounts?status=in.(active,needs_reauth)&select=*&limit=40`,
      {
        headers: {
          apikey: rest.key,
          authorization: `Bearer ${rest.key}`,
        },
        signal: AbortSignal.timeout(8000),
      },
    );
    if (!res.ok) return [];
    const rows = (await res.json()) as Record<string, unknown>[];
    return rows
      .map((row) => asAccountRow(row, String(row.shop_id ?? "")))
      .filter((row): row is SocialAccountRow => Boolean(row));
  } catch {
    return [];
  }
}

async function persistAccountToSupabase(account: SocialAccountRow): Promise<void> {
  const rest = supabaseRest();
  if (!rest) return;
  await fetch(`${rest.url}/rest/v1/shop_social_accounts?on_conflict=shop_id,platform`, {
    method: "POST",
    headers: {
      apikey: rest.key,
      authorization: `Bearer ${rest.key}`,
      "content-type": "application/json",
      prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify({
      id: account.id,
      shop_id: account.shop_id,
      platform: account.platform,
      page_id: account.page_id,
      ig_user_id: account.ig_user_id,
      gbp_account_id: account.gbp_account_id,
      gbp_location_id: account.gbp_location_id,
      access_token: account.access_token,
      refresh_token: account.refresh_token,
      token_expires_at: account.token_expires_at,
      token_refreshed_at: account.token_refreshed_at ?? new Date().toISOString(),
      status: account.status,
      scopes: account.scopes,
      updated_at: new Date().toISOString(),
    }),
    signal: AbortSignal.timeout(8000),
  }).catch(() => undefined);
}

export async function loadShopSocialAccounts(shopId: string): Promise<SocialAccountRow[]> {
  let rows: SocialAccountRow[] = [];
  try {
    const sql = await getSql();
    rows = await sql<SocialAccountRow>`
      select id, shop_id, platform, page_id, ig_user_id, gbp_account_id, gbp_location_id,
             access_token, refresh_token, token_expires_at, token_refreshed_at, status, scopes
      from shop_social_accounts
      where shop_id = ${shopId} and status <> 'revoked'
    `;
  } catch (err) {
    if (!missingRelation(err, "shop_social_accounts")) throw err;
  }
  if (rows.length === 0) rows = await loadAccountsFromSupabase(shopId);
  if (rows.length === 0) rows = envSocialAccounts(shopId);
  return rows;
}

async function markNeedsReauth(accountId: string, detail: string): Promise<void> {
  const sql = await getSql();
  await sql`
    update shop_social_accounts
    set status = ${"needs_reauth"},
        last_error = ${detail.slice(0, 400)},
        updated_at = now()
    where id = ${accountId}
  `.catch(async () => {
    await sql`
      update shop_social_accounts
      set status = ${"needs_reauth"}, updated_at = now()
      where id = ${accountId}
    `;
  });
}

async function persistTokens(
  account: SocialAccountRow,
  patch: { accessToken: string; refreshToken?: string; expiresIn?: number },
): Promise<SocialAccountRow> {
  const sql = await getSql();
  const expiresAt =
    typeof patch.expiresIn === "number" && patch.expiresIn > 0
      ? new Date(Date.now() + patch.expiresIn * 1000).toISOString()
      : null;
  const refresh = patch.refreshToken ?? account.refresh_token;
  const next: SocialAccountRow = {
    ...account,
    access_token: patch.accessToken,
    refresh_token: refresh,
    token_expires_at: expiresAt,
    token_refreshed_at: new Date().toISOString(),
    status: "active",
  };
  if (!account.id.startsWith("env_")) {
    await sql`
      update shop_social_accounts
      set access_token = ${patch.accessToken},
          refresh_token = ${refresh},
          token_expires_at = ${expiresAt},
          token_refreshed_at = now(),
          status = ${"active"},
          updated_at = now()
      where id = ${account.id}
    `.catch(() => undefined);
  }
  await persistAccountToSupabase(next);
  return next;
}

async function refreshFacebookToken(account: SocialAccountRow): Promise<SocialAccountRow> {
  const clientId = env("META_APP_ID") || env("FACEBOOK_APP_ID");
  const clientSecret = env("META_APP_SECRET") || env("FACEBOOK_APP_SECRET");
  if (!clientId || !clientSecret) return account;
  const url = new URL(`${GRAPH}/oauth/access_token`);
  url.searchParams.set("grant_type", "fb_exchange_token");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("client_secret", clientSecret);
  url.searchParams.set("fb_exchange_token", account.access_token);
  const res = await fetch(url, { signal: AbortSignal.timeout(12_000) });
  const body = await graphJson(res, "Facebook token refresh");
  const accessToken = String(body.access_token ?? "").trim();
  if (!accessToken) throw new Error("Facebook did not return a refreshed token");
  const expiresIn = Number(body.expires_in ?? 0);
  return persistTokens(account, {
    accessToken,
    expiresIn: Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn : 60 * 24 * 60 * 60,
  });
}

async function refreshGoogleToken(account: SocialAccountRow): Promise<SocialAccountRow> {
  const clientId = env("GOOGLE_CLIENT_ID") || env("GBP_CLIENT_ID");
  const clientSecret = env("GOOGLE_CLIENT_SECRET") || env("GBP_CLIENT_SECRET");
  if (!clientId || !clientSecret) throw new Error("Google OAuth is not configured");
  if (!account.refresh_token) throw new Error("Google refresh token is missing");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: account.refresh_token,
      grant_type: "refresh_token",
    }),
    signal: AbortSignal.timeout(12_000),
  });
  const body = await graphJson(res, "Google token refresh");
  const accessToken = String(body.access_token ?? "").trim();
  if (!accessToken) throw new Error("Google did not return an access token");
  const expiresIn = Number(body.expires_in ?? 3600);
  return persistTokens(account, {
    accessToken,
    refreshToken: String(body.refresh_token ?? account.refresh_token),
    expiresIn: Number.isFinite(expiresIn) ? expiresIn : 3600,
  });
}

/** Silent re-auth: refresh before Graph/GBP calls. Marks needs_reauth only after refresh fails. */
export async function ensureFreshSocialToken(account: SocialAccountRow): Promise<SocialAccountRow> {
  if (account.status === "revoked") throw new Error("Social account was revoked");
  try {
    if (account.platform === "gbp") {
      if (tokenNeedsRefresh(account.token_expires_at) || !account.access_token) {
        return await refreshGoogleToken(account);
      }
      return account;
    }
    if (facebookTokenNeedsRefresh(account.token_expires_at) || account.status === "needs_reauth") {
      return await refreshFacebookToken(account);
    }
    return account;
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Token refresh failed";
    await markNeedsReauth(account.id, detail);
    throw err;
  }
}

export async function refreshExpiringSocialTokens(): Promise<{ refreshed: number; failed: number }> {
  let accounts: SocialAccountRow[] = [];
  try {
    const sql = await getSql();
    accounts = await sql<SocialAccountRow>`
      select id, shop_id, platform, page_id, ig_user_id, gbp_account_id, gbp_location_id,
             access_token, refresh_token, token_expires_at, token_refreshed_at, status, scopes
      from shop_social_accounts
      where status in ('active', 'needs_reauth')
      limit 40
    `;
  } catch (err) {
    if (!missingRelation(err, "shop_social_accounts")) throw err;
  }
  if (accounts.length === 0) {
    accounts = await loadDueAccountsFromSupabase();
  }
  let refreshed = 0;
  let failed = 0;
  for (const account of accounts) {
    const due =
      account.platform === "gbp"
        ? tokenNeedsRefresh(account.token_expires_at) || !account.access_token || account.status === "needs_reauth"
        : facebookTokenNeedsRefresh(account.token_expires_at) || account.status === "needs_reauth";
    if (!due) continue;
    try {
      await ensureFreshSocialToken(account);
      refreshed += 1;
    } catch {
      failed += 1;
    }
  }
  return { refreshed, failed };
}

async function publishFacebook(account: SocialAccountRow, payload: GraphFeedPayload): Promise<string> {
  const live = await ensureFreshSocialToken(account);
  const body = new URLSearchParams({ ...payload.body, access_token: live.access_token });
  const res = await fetch(payload.endpoint, { method: "POST", body, signal: AbortSignal.timeout(20_000) });
  const json = await graphJson(res, "Facebook");
  const id = String(json.id ?? "").trim();
  if (!id) throw new Error("Facebook did not return a post id");
  return id;
}

async function publishInstagram(account: SocialAccountRow, payload: InstagramMediaPayload): Promise<string> {
  if (!/^https:\/\//i.test(payload.imageUrl)) {
    throw new Error("Instagram needs a public HTTPS image URL");
  }
  const live = await ensureFreshSocialToken(account);
  const created = await graphJson(
    await fetch(payload.createEndpoint, {
      method: "POST",
      body: new URLSearchParams({
        image_url: payload.imageUrl,
        caption: payload.caption,
        access_token: live.access_token,
      }),
      signal: AbortSignal.timeout(20_000),
    }),
    "Instagram media",
  );
  const creationId = String(created.id ?? "").trim();
  if (!creationId) throw new Error("Instagram did not return a creation id");
  const published = await graphJson(
    await fetch(payload.publishEndpoint, {
      method: "POST",
      body: new URLSearchParams({ creation_id: creationId, access_token: live.access_token }),
      signal: AbortSignal.timeout(20_000),
    }),
    "Instagram publish",
  );
  const id = String(published.id ?? "").trim();
  if (!id) throw new Error("Instagram did not return a post id");
  return id;
}

async function publishGbp(account: SocialAccountRow, payload: GbpLocalPostPayload): Promise<string> {
  const live = await ensureFreshSocialToken(account);
  const res = await fetch(payload.endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${live.access_token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload.body),
    signal: AbortSignal.timeout(20_000),
  });
  const json = await graphJson(res, "GBP");
  const id = String(json.name ?? json.id ?? "").trim();
  if (!id) throw new Error("Google Business did not return a post id");
  return id;
}

async function imageUrlForPost(origin: string, assetId: string | null): Promise<string> {
  if (assetId && /^med_[a-zA-Z0-9]+$/.test(assetId)) {
    return publicMediaUrl(origin, shopMediaPath(assetId, Date.now()));
  }
  if (assetId && (assetId.startsWith("/media/") || /^https:\/\//i.test(assetId))) {
    return publicMediaUrl(origin, assetId);
  }
  return "";
}

export async function publishSocialPostForShop(input: {
  shopId: string;
  postId: string;
  caption: string;
  channels: unknown;
  assetId?: string | null;
  existing?: unknown;
  origin?: string;
}): Promise<{ delivered: SocialDelivery[]; pending: PublishPlatform[]; lastError: string }> {
  const wanted = parsePublishPlatforms(input.channels);
  const targets = wanted.length ? wanted : defaultAutopilotChannels();
  const already = parseDeliveredJson(input.existing);
  const remaining = targets.filter((channel) => !already.some((row) => row.channel === channel && row.ok));
  if (remaining.length === 0) {
    return { delivered: already, pending: [], lastError: "" };
  }
  const accounts = await loadShopSocialAccounts(input.shopId);
  const origin = input.origin || resolvePublicAppOrigin();
  const imageUrl = await imageUrlForPost(origin, input.assetId ?? null);
  let slug = "";
  try {
    const sql = await getSql();
    const shops = await sql<{ slug: string }>`select slug from shops where id = ${input.shopId} limit 1`;
    slug = shops[0]?.slug ?? "";
  } catch {
    slug = "";
  }
  const link = publicMediaUrl(origin, slug ? `/t/${slug}` : "/");
  const permalink = /^https:\/\//i.test(link) ? link : origin;
  const facebook = accounts.find((row) => row.platform === "facebook");
  const instagram = accounts.find((row) => row.platform === "instagram");
  const gbp = accounts.find((row) => row.platform === "gbp");
  const job = composeSocialPublishJob({
    caption: input.caption,
    storefrontUrl: permalink,
    imageUrl: imageUrl || permalink,
    pageId: facebook?.page_id,
    igUserId: instagram?.ig_user_id,
    gbpAccountId: gbp?.gbp_account_id,
    gbpLocationId: gbp?.gbp_location_id,
  });
  const next: SocialDelivery[] = [];
  const errors: string[] = [];
  for (const channel of remaining) {
    const account = accounts.find((row) => row.platform === channel && row.status !== "revoked");
    if (!account || (!account.access_token && !account.refresh_token)) {
      errors.push(`${channel}: not linked`);
      continue;
    }
    try {
      let platformPostId = "";
      if (channel === "facebook") platformPostId = await publishFacebook(account, job.facebook);
      else if (channel === "instagram") platformPostId = await publishInstagram(account, job.instagram);
      else platformPostId = await publishGbp(account, job.gbp);
      next.push({
        channel,
        platformPostId,
        deliveredAt: new Date().toISOString(),
        ok: true,
      });
    } catch (err) {
      const error = err instanceof Error ? err.message : "Publish failed";
      errors.push(`${channel}: ${error}`);
    }
  }
  const delivered = mergeDeliveries(already, next);
  const pending = targets.filter((channel) => !delivered.some((row) => row.channel === channel && row.ok));
  return { delivered, pending, lastError: errors.join("; ").slice(0, 400) };
}

export async function persistSocialDelivery(
  postId: string,
  shopId: string,
  result: { delivered: SocialDelivery[]; lastError: string },
): Promise<void> {
  const sql = await getSql();
  const published = result.delivered.some((row) => row.ok);
  try {
    await sql`
      update shop_social_posts
      set status = ${published ? "published" : "approved"},
          delivered = ${JSON.stringify(result.delivered)}::jsonb,
          published_at = ${published ? new Date().toISOString() : null},
          last_error = ${result.lastError}
      where id = ${postId} and shop_id = ${shopId}
    `;
  } catch (err) {
    if (missingRelation(err, "shop_social_posts")) {
      await persistDeliveryToSupabase(postId, shopId, result, published);
      return;
    }
    const message = err instanceof Error ? err.message : "";
    if (/delivered|published_at|last_error|jsonb/i.test(message)) {
      await sql`
        update shop_social_posts
        set status = ${published ? "published" : "approved"}
        where id = ${postId} and shop_id = ${shopId}
      `;
      await persistDeliveryToSupabase(postId, shopId, result, published);
      return;
    }
    throw err;
  }
  await persistDeliveryToSupabase(postId, shopId, result, published);
}

async function persistDeliveryToSupabase(
  postId: string,
  shopId: string,
  result: { delivered: SocialDelivery[]; lastError: string },
  published: boolean,
): Promise<void> {
  const rest = supabaseRest();
  if (!rest) return;
  await fetch(`${rest.url}/rest/v1/shop_social_posts?id=eq.${encodeURIComponent(postId)}&shop_id=eq.${encodeURIComponent(shopId)}`, {
    method: "PATCH",
    headers: {
      apikey: rest.key,
      authorization: `Bearer ${rest.key}`,
      "content-type": "application/json",
      prefer: "return=minimal",
    },
    body: JSON.stringify({
      status: published ? "published" : "approved",
      delivered: result.delivered,
      published_at: published ? new Date().toISOString() : null,
      last_error: result.lastError,
    }),
    signal: AbortSignal.timeout(8000),
  }).catch(() => undefined);
}

export async function publishQueuedSocialPosts(limit = 12): Promise<{
  published: number;
  failed: number;
  deliveries: number;
}> {
  let rows: PostRow[] = [];
  try {
    const sql = await getSql();
    rows = await sql<PostRow>`
      select id, shop_id, asset_id, caption, channels, status, delivered
      from shop_social_posts
      where status in ('queued', 'approved')
      order by created_at asc
      limit ${limit}
    `;
  } catch (err) {
    if (missingRelation(err, "shop_social_posts")) return { published: 0, failed: 0, deliveries: 0 };
    const message = err instanceof Error ? err.message : "";
    if (/delivered/i.test(message)) {
      const sql = await getSql();
      rows = await sql<PostRow>`
        select id, shop_id, asset_id, caption, channels, status
        from shop_social_posts
        where status in ('queued', 'approved')
        order by created_at asc
        limit ${limit}
      `;
    } else {
      throw err;
    }
  }
  let published = 0;
  let failed = 0;
  let deliveries = 0;
  for (const row of rows) {
    const result = await publishSocialPostForShop({
      shopId: row.shop_id,
      postId: row.id,
      caption: row.caption,
      channels: row.channels,
      assetId: row.asset_id,
      existing: row.delivered,
    }).catch((err: unknown) => ({
      delivered: parseDeliveredJson(row.delivered),
      pending: parsePublishPlatforms(row.channels),
      lastError: err instanceof Error ? err.message : "Publish failed",
    }));
    await persistSocialDelivery(row.id, row.shop_id, result);
    if (result.delivered.some((item) => item.ok)) published += 1;
    else if (result.lastError) failed += 1;
    deliveries += result.delivered.filter((item) => item.ok).length;
  }
  return { published, failed, deliveries };
}

export async function upsertSocialAccount(input: {
  shopId: string;
  platform: PublishPlatform;
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  pageId?: string;
  igUserId?: string;
  gbpAccountId?: string;
  gbpLocationId?: string;
  scopes?: string;
}): Promise<void> {
  const sql = await getSql();
  const id = newId("socacc");
  const expiresAt =
    typeof input.expiresIn === "number" && input.expiresIn > 0
      ? new Date(Date.now() + input.expiresIn * 1000).toISOString()
      : null;
  await sql`
    insert into shop_social_accounts (
      id, shop_id, platform, page_id, ig_user_id, gbp_account_id, gbp_location_id,
      access_token, refresh_token, token_expires_at, token_refreshed_at, status, scopes, created_at, updated_at
    ) values (
      ${id}, ${input.shopId}, ${input.platform}, ${input.pageId ?? ""}, ${input.igUserId ?? ""},
      ${input.gbpAccountId ?? ""}, ${input.gbpLocationId ?? ""}, ${input.accessToken},
      ${input.refreshToken ?? ""}, ${expiresAt}, now(), ${"active"}, ${input.scopes ?? ""}, now(), now()
    )
    on conflict (shop_id, platform) do update set
      page_id = excluded.page_id,
      ig_user_id = excluded.ig_user_id,
      gbp_account_id = excluded.gbp_account_id,
      gbp_location_id = excluded.gbp_location_id,
      access_token = excluded.access_token,
      refresh_token = case when excluded.refresh_token <> '' then excluded.refresh_token else shop_social_accounts.refresh_token end,
      token_expires_at = excluded.token_expires_at,
      token_refreshed_at = now(),
      status = ${"active"},
      scopes = excluded.scopes,
      updated_at = now()
  `;
  await persistAccountToSupabase({
    id,
    shop_id: input.shopId,
    platform: input.platform,
    page_id: input.pageId ?? "",
    ig_user_id: input.igUserId ?? "",
    gbp_account_id: input.gbpAccountId ?? "",
    gbp_location_id: input.gbpLocationId ?? "",
    access_token: input.accessToken,
    refresh_token: input.refreshToken ?? "",
    token_expires_at: expiresAt,
    token_refreshed_at: new Date().toISOString(),
    status: "active",
    scopes: input.scopes ?? "",
  });
}
