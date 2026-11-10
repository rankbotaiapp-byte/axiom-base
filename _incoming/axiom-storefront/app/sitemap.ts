import type { MetadataRoute } from "next";
import { site } from "@/config/storefront";
import { listPosts, listTenants } from "@/lib/tenants/store";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const tenants = await listTenants({ status: ["active"] });
  const entries: MetadataRoute.Sitemap = [{ url: site.url, changeFrequency: "weekly", priority: 1 }];
  for (const t of tenants) {
    const posts = await listPosts(t.id, { kind: "article", status: "published", limit: 500 });
    entries.push({ url: `${site.url}/b/${t.slug}`, lastModified: posts[0]?.publishedAt ?? t.updatedAt, changeFrequency: "weekly", priority: 0.9 });
    for (const p of posts) {
      entries.push({ url: `${site.url}/b/${t.slug}/posts/${p.slug}`, lastModified: p.publishedAt ?? p.scheduledFor, changeFrequency: "monthly", priority: 0.7 });
    }
  }
  return entries;
}
