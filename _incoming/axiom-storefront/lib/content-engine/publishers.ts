import "server-only";
import { createHmac } from "node:crypto";
import type { Channel, ChannelPlatform, Post, PostKind, Tenant } from "@/lib/tenants/types";
import { site } from "@/config/storefront";

export interface PublishContext {
  tenant: Tenant;
  post: Post;
  channel: Channel;
  /** Canonical URL of the article this post promotes. */
  articleUrl: string;
  /** Branded 1200×630 card generated for the article (PNG). */
  imageUrl: string;
}

export interface Publisher {
  platform: ChannelPlatform;
  kinds: PostKind[];
  publish(ctx: PublishContext): Promise<{ id?: string }>;
}

const GRAPH = "https://graph.facebook.com/v21.0";

async function ok(res: Response, label: string) {
  if (!res.ok) throw new Error(`${label} ${res.status}: ${(await res.text()).slice(0, 400)}`);
  return res.json().catch(() => ({}));
}

/** On-site article: publishing = flipping status (handled by the runner) + ISR revalidation. */
const web: Publisher = {
  platform: "web",
  kinds: ["article"],
  async publish() {
    return {};
  },
};

/**
 * Generic webhook — the fastest way to reach every network today: point it at a
 * Make / Zapier / n8n / Buffer scenario. Signed with HMAC-SHA256 if a secret is set.
 * credentials: { url, secret? }
 */
const webhook: Publisher = {
  platform: "webhook",
  kinds: ["social", "gbp", "article"],
  async publish({ tenant, post, channel, articleUrl, imageUrl }) {
    const payload = JSON.stringify({
      event: "axiom.post.publish",
      tenant: { slug: tenant.slug, name: tenant.name, city: tenant.city, region: tenant.region, phone: tenant.phone },
      post: { id: post.id, kind: post.kind, title: post.title, text: post.body, excerpt: post.excerpt, keywords: post.keywords },
      link: articleUrl,
      image: imageUrl,
      sentAt: new Date().toISOString(),
    });
    const headers: Record<string, string> = { "content-type": "application/json" };
    if (channel.credentials.secret) {
      headers["x-axiom-signature"] = createHmac("sha256", channel.credentials.secret).update(payload).digest("hex");
    }
    await ok(await fetch(channel.credentials.url, { method: "POST", headers, body: payload }), "Webhook");
    return {};
  },
};

/** Facebook Page feed post. credentials: { pageId, pageAccessToken } */
const facebook: Publisher = {
  platform: "facebook",
  kinds: ["social"],
  async publish({ post, channel, articleUrl }) {
    const body = new URLSearchParams({
      message: post.body,
      link: articleUrl,
      access_token: channel.credentials.pageAccessToken,
    });
    const data = (await ok(await fetch(`${GRAPH}/${channel.credentials.pageId}/feed`, { method: "POST", body }), "Facebook")) as {
      id?: string;
    };
    return { id: data.id };
  },
};

/**
 * Instagram (Business/Creator account linked to a Page). Requires a public JPEG,
 * so set credentials.imageUrlTemplate to a JPEG renderer (or route IG via the webhook).
 * credentials: { igUserId, accessToken, imageUrlTemplate? } — template may use {imageUrl}
 */
const instagram: Publisher = {
  platform: "instagram",
  kinds: ["social"],
  async publish({ post, channel, imageUrl }) {
    const img = channel.credentials.imageUrlTemplate
      ? channel.credentials.imageUrlTemplate.replace("{imageUrl}", encodeURIComponent(imageUrl))
      : imageUrl;
    const create = (await ok(
      await fetch(`${GRAPH}/${channel.credentials.igUserId}/media`, {
        method: "POST",
        body: new URLSearchParams({ image_url: img, caption: post.body, access_token: channel.credentials.accessToken }),
      }),
      "Instagram media",
    )) as { id: string };
    const pub = (await ok(
      await fetch(`${GRAPH}/${channel.credentials.igUserId}/media_publish`, {
        method: "POST",
        body: new URLSearchParams({ creation_id: create.id, access_token: channel.credentials.accessToken }),
      }),
      "Instagram publish",
    )) as { id?: string };
    return { id: pub.id };
  },
};

/**
 * Google Business Profile local post (the single biggest on-platform lever for
 * the local map pack). credentials: { accountId, locationId, clientId, clientSecret, refreshToken }
 */
const gbp: Publisher = {
  platform: "gbp",
  kinds: ["gbp"],
  async publish({ post, channel, articleUrl }) {
    const c = channel.credentials;
    const tok = (await ok(
      await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        body: new URLSearchParams({
          client_id: c.clientId,
          client_secret: c.clientSecret,
          refresh_token: c.refreshToken,
          grant_type: "refresh_token",
        }),
      }),
      "Google OAuth",
    )) as { access_token: string };
    const data = (await ok(
      await fetch(`https://mybusiness.googleapis.com/v4/accounts/${c.accountId}/locations/${c.locationId}/localPosts`, {
        method: "POST",
        headers: { Authorization: `Bearer ${tok.access_token}`, "content-type": "application/json" },
        body: JSON.stringify({
          languageCode: "en-US",
          topicType: "STANDARD",
          summary: post.body.slice(0, 1500),
          callToAction: { actionType: "LEARN_MORE", url: articleUrl },
        }),
      }),
      "GBP",
    )) as { name?: string };
    return { id: data.name };
  },
};

export const publishers: Record<ChannelPlatform, Publisher> = { web, webhook, facebook, instagram, gbp };

export function articleUrlFor(tenant: Tenant, articleSlug: string) {
  return `${site.url}/b/${tenant.slug}/posts/${articleSlug}`;
}
export function imageUrlFor(tenant: Tenant, articleSlug: string) {
  return `${site.url}/b/${tenant.slug}/posts/${articleSlug}/opengraph-image`;
}
