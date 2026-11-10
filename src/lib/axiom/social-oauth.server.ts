import { createHmac, timingSafeEqual } from "node:crypto";
import { getSql } from "@/lib/db";
import { env } from "@/lib/env.server";
import { requireUserId } from "@/lib/auth/verify.server";
import { assertCanModifyShopById } from "./shop-server.server";
import { GRAPH_BASE, isPublishPlatform, type PublishPlatform } from "./social-publish.ts";
import { upsertSocialAccount } from "./social-publish.server";

const FACEBOOK_SCOPES = [
  "pages_show_list",
  "pages_manage_posts",
  "pages_read_engagement",
  "instagram_basic",
  "instagram_content_publish",
  "business_management",
].join(",");

const GBP_SCOPES = ["https://www.googleapis.com/auth/business.manage", "openid", "email"].join(" ");

function oauthSecret(): string {
  return env("BETTER_AUTH_SECRET") || env("FUNNEL_HIT_SECRET") || "axiom-social-oauth";
}

function signState(payload: string): string {
  const mac = createHmac("sha256", oauthSecret()).update(payload).digest("hex");
  return `${Buffer.from(payload).toString("base64url")}.${mac}`;
}

function readState(token: string): { shopId: string; platform: PublishPlatform; exp: number } | null {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  let raw = "";
  try {
    raw = Buffer.from(payload, "base64url").toString("utf8");
  } catch {
    return null;
  }
  const expected = createHmac("sha256", oauthSecret()).update(raw).digest("hex");
  if (expected.length !== mac.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(mac))) return null;
  try {
    const parsed = JSON.parse(raw) as { shopId?: string; platform?: string; exp?: number };
    if (!isPublishPlatform(parsed.platform)) return null;
    if (!parsed.shopId || Date.now() > Number(parsed.exp ?? 0)) return null;
    return { shopId: parsed.shopId, platform: parsed.platform, exp: Number(parsed.exp) };
  } catch {
    return null;
  }
}

async function resolveShopId(shopIdOrSlug: string, userId: string): Promise<string> {
  const key = shopIdOrSlug.trim();
  if (/^shop_[a-zA-Z0-9]+$/.test(key)) {
    await assertCanModifyShopById(key, userId);
    return key;
  }
  const sql = await getSql();
  const rows = await sql<{ id: string }>`select id from shops where slug = ${key} limit 1`;
  const id = rows[0]?.id;
  if (!id) throw new Error("Shop not found");
  await assertCanModifyShopById(id, userId);
  return id;
}

function callbackUrl(origin: string): string {
  return `${origin.replace(/\/$/, "")}/api/social/oauth/callback`;
}

export async function socialConnectUrl(input: {
  origin: string;
  platform: string;
  shop: string;
}): Promise<{ url: string }> {
  const userId = await requireUserId();
  if (!isPublishPlatform(input.platform)) throw new Error("Unknown social network");
  const shopId = await resolveShopId(input.shop, userId);
  const state = signState(JSON.stringify({ shopId, platform: input.platform, exp: Date.now() + 15 * 60 * 1000 }));
  const redirect = callbackUrl(input.origin);

  if (input.platform === "gbp") {
    const clientId = env("GOOGLE_CLIENT_ID") || env("GBP_CLIENT_ID");
    if (!clientId) throw new Error("Google Business OAuth is not configured");
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirect);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "consent");
    url.searchParams.set("scope", GBP_SCOPES);
    url.searchParams.set("state", `gbp.${state}`);
    return { url: url.toString() };
  }

  const clientId = env("META_APP_ID") || env("FACEBOOK_APP_ID");
  if (!clientId) throw new Error("Facebook OAuth is not configured");
  const url = new URL("https://www.facebook.com/v21.0/dialog/oauth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirect);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", FACEBOOK_SCOPES);
  url.searchParams.set("state", `${input.platform}.${state}`);
  return { url: url.toString() };
}

async function exchangeFacebookCode(code: string, origin: string) {
  const clientId = env("META_APP_ID") || env("FACEBOOK_APP_ID");
  const clientSecret = env("META_APP_SECRET") || env("FACEBOOK_APP_SECRET");
  if (!clientId || !clientSecret) throw new Error("Facebook OAuth is not configured");
  const url = new URL(`${GRAPH_BASE}/oauth/access_token`);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("client_secret", clientSecret);
  url.searchParams.set("redirect_uri", callbackUrl(origin));
  url.searchParams.set("code", code);
  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  const json = (await res.json()) as { access_token?: string; expires_in?: number; error?: { message?: string } };
  if (!res.ok || !json.access_token) {
    throw new Error(json.error?.message || "Facebook did not return an access token");
  }
  return { accessToken: json.access_token, expiresIn: json.expires_in ?? 60 * 24 * 60 * 60 };
}

async function exchangeGoogleCode(code: string, origin: string) {
  const clientId = env("GOOGLE_CLIENT_ID") || env("GBP_CLIENT_ID");
  const clientSecret = env("GOOGLE_CLIENT_SECRET") || env("GBP_CLIENT_SECRET");
  if (!clientId || !clientSecret) throw new Error("Google Business OAuth is not configured");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: callbackUrl(origin),
      grant_type: "authorization_code",
      code,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  const json = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error_description?: string;
  };
  if (!res.ok || !json.access_token) {
    throw new Error(json.error_description || "Google did not return an access token");
  }
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? "",
    expiresIn: json.expires_in ?? 3600,
  };
}

export async function handleSocialOAuthCallback(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const err = url.searchParams.get("error");
  if (err) {
    return Response.redirect(`${url.origin}/admin/tenant?social=denied`, 302);
  }
  const code = url.searchParams.get("code") ?? "";
  const stateRaw = url.searchParams.get("state") ?? "";
  const dot = stateRaw.indexOf(".");
  const platformHint = dot > 0 ? stateRaw.slice(0, dot) : "";
  const token = dot > 0 ? stateRaw.slice(dot + 1) : stateRaw;
  const state = readState(token);
  if (!code || !state) {
    return Response.redirect(`${url.origin}/admin/tenant?social=invalid`, 302);
  }
  const platform = isPublishPlatform(platformHint) ? platformHint : state.platform;
  try {
    const userId = await requireUserId();
    await assertCanModifyShopById(state.shopId, userId);
    if (platform === "gbp") {
      const tok = await exchangeGoogleCode(code, url.origin);
      const accountsRes = await fetch("https://mybusinessaccountmanagement.googleapis.com/v1/accounts", {
        headers: { Authorization: `Bearer ${tok.accessToken}` },
        signal: AbortSignal.timeout(15_000),
      });
      const accounts = (await accountsRes.json()) as { accounts?: { name?: string }[] };
      const accountName = accounts.accounts?.[0]?.name ?? "";
      const accountId = accountName.replace(/^accounts\//, "");
      let locationId = "";
      if (accountId) {
        const locRes = await fetch(
          `https://mybusinessbusinessinformation.googleapis.com/v1/accounts/${accountId}/locations?readMask=name`,
          { headers: { Authorization: `Bearer ${tok.accessToken}` }, signal: AbortSignal.timeout(15_000) },
        );
        const locJson = (await locRes.json()) as { locations?: { name?: string }[] };
        const locName = locJson.locations?.[0]?.name ?? "";
        locationId = locName.split("/").pop() ?? "";
      }
      await upsertSocialAccount({
        shopId: state.shopId,
        platform: "gbp",
        accessToken: tok.accessToken,
        refreshToken: tok.refreshToken,
        expiresIn: tok.expiresIn,
        gbpAccountId: accountId,
        gbpLocationId: locationId,
        scopes: GBP_SCOPES,
      });
    } else {
      const tok = await exchangeFacebookCode(code, url.origin);
      const pagesRes = await fetch(`${GRAPH_BASE}/me/accounts?access_token=${encodeURIComponent(tok.accessToken)}`, {
        signal: AbortSignal.timeout(15_000),
      });
      const pages = (await pagesRes.json()) as {
        data?: { id?: string; access_token?: string; instagram_business_account?: { id?: string } }[];
      };
      const page = pages.data?.[0];
      const pageToken = page?.access_token || tok.accessToken;
      const pageId = page?.id ?? "";
      let igUserId = page?.instagram_business_account?.id ?? "";
      if (pageId && !igUserId) {
        const igRes = await fetch(
          `${GRAPH_BASE}/${pageId}?fields=instagram_business_account&access_token=${encodeURIComponent(pageToken)}`,
          { signal: AbortSignal.timeout(15_000) },
        );
        const igJson = (await igRes.json()) as { instagram_business_account?: { id?: string } };
        igUserId = igJson.instagram_business_account?.id ?? "";
      }
      await upsertSocialAccount({
        shopId: state.shopId,
        platform: "facebook",
        accessToken: pageToken,
        expiresIn: tok.expiresIn,
        pageId,
        scopes: FACEBOOK_SCOPES,
      });
      if (igUserId) {
        await upsertSocialAccount({
          shopId: state.shopId,
          platform: "instagram",
          accessToken: pageToken,
          expiresIn: tok.expiresIn,
          pageId,
          igUserId,
          scopes: FACEBOOK_SCOPES,
        });
      }
    }
    return Response.redirect(`${url.origin}/admin/tenant?social=connected&platform=${platform}`, 302);
  } catch {
    return Response.redirect(`${url.origin}/admin/tenant?social=failed`, 302);
  }
}
