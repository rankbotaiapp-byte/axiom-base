import "server-only";
import { revalidatePath } from "next/cache";
import { createPosts, duePosts, listChannels, listPosts, updatePost } from "@/lib/tenants/store";
import type { Post, Tenant } from "@/lib/tenants/types";
import { generateUnits, unitsToPosts } from "./generate";
import { articleUrlFor, imageUrlFor, publishers } from "./publishers";

const DAY = 24 * 3600_000;

/** Keep a week of content queued at the tenant's cadence. Returns # of new units. */
export async function topUpQueue(t: Tenant, now = new Date()): Promise<number> {
  const cadence = Math.max(1, Math.min(14, t.config.content.cadencePerWeek));
  const recent = await listPosts(t.id, { kind: "article", limit: 60 });
  const upcoming = recent.filter((p) => p.status === "scheduled" && new Date(p.scheduledFor) > now).length;
  const need = cadence - upcoming;
  if (need <= 0) return 0;

  const units = await generateUnits(t, need, recent.map((p) => p.title));
  const lastScheduled = recent
    .filter((p) => p.status === "scheduled")
    .reduce((max, p) => Math.max(max, new Date(p.scheduledFor).getTime()), now.getTime());
  const spacingHours = Math.round((7 * 24) / cadence);
  const start = new Date(Math.max(lastScheduled + spacingHours * 3600_000, now.getTime() + 2 * 3600_000));
  await createPosts(unitsToPosts(t, units, start, spacingHours));
  return units.length;
}

/** Publish everything that is due, on every enabled channel that supports the post kind. */
export async function publishDue(t: Tenant, now = new Date()) {
  if (!t.config.content.autoPublish || t.status === "paused") return { published: 0, failed: 0 };
  const [due, channels] = await Promise.all([duePosts(t.id, now), listChannels(t.id)]);
  let published = 0;
  let failed = 0;

  for (const post of due) {
    const articleSlug = post.slug.replace(/--(gbp|social)$/, "");
    const results: Post["results"] = { ...post.results };
    const targets = channels.filter((c) => c.enabled && publishers[c.platform].kinds.includes(post.kind));
    // Social/GBP posts with no connected channel simply stay on-site history (marked published).
    for (const channel of targets) {
      if (results[channel.platform]?.ok) continue; // idempotent retries
      try {
        const r = await publishers[channel.platform].publish({
          tenant: t,
          post,
          channel,
          articleUrl: articleUrlFor(t, articleSlug),
          imageUrl: imageUrlFor(t, articleSlug),
        });
        results[channel.platform] = { ok: true, id: r.id, at: new Date().toISOString() };
      } catch (e) {
        results[channel.platform] = { ok: false, error: (e as Error).message.slice(0, 300), at: new Date().toISOString() };
      }
    }
    const anyFail = Object.values(results).some((r) => !r.ok);
    const tooOld = now.getTime() - new Date(post.scheduledFor).getTime() > 2 * DAY;
    const status: Post["status"] = !anyFail ? "published" : tooOld ? "failed" : "scheduled";
    await updatePost(post.id, { results, status, publishedAt: status === "published" ? now.toISOString() : null });
    if (status === "published") published++;
    if (anyFail) failed++;
  }

  if (published) {
    revalidatePath(`/b/${t.slug}`);
    revalidatePath(`/b/${t.slug}/posts`, "layout");
    revalidatePath("/sitemap.xml");
  }
  return { published, failed };
}

export async function runContentCycle(t: Tenant, now = new Date()) {
  const generated = await topUpQueue(t, now);
  const { published, failed } = await publishDue(t, now);
  return { tenant: t.slug, generated, published, failed };
}

/** Day-one content for a brand-new tenant: one article live immediately, more queued. */
export async function bootstrapContent(t: Tenant) {
  const units = await generateUnits(t, 1, []);
  const posts = unitsToPosts(t, units, new Date(Date.now() - 60_000), 0);
  await createPosts(posts);
  await publishDue(t);
  await topUpQueue(t);
}
