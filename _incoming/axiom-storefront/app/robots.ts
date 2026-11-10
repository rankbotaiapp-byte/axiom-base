import type { MetadataRoute } from "next";
import { site } from "@/config/storefront";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/admin", "/start"] }],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
