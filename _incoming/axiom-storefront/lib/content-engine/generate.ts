import "server-only";
import { z } from "zod";
import { niches } from "@/config/storefront";
import { slugify } from "@/lib/tenants/factory";
import type { Post, Tenant } from "@/lib/tenants/types";

/**
 * One "content unit" = an on-site article (the indexable asset that ranks) plus a
 * Google Business Profile post and a social caption that both point back to it.
 * Every channel reinforces the same local topic + URL.
 */
const unitSchema = z.object({
  topic: z.string(),
  article: z.object({
    title: z.string().min(10).max(90),
    excerpt: z.string().min(20).max(200),
    body: z.string().min(300),
    keywords: z.array(z.string()).min(2).max(8),
    cta: z.string().max(40),
  }),
  gbp: z.object({ summary: z.string().min(40).max(1400) }),
  social: z.object({ caption: z.string().min(40).max(2000), hashtags: z.array(z.string()).max(12) }),
  imagePrompt: z.string().max(400),
});
type Unit = z.infer<typeof unitSchema>;

const MODEL = process.env.AXIOM_CONTENT_MODEL ?? "claude-sonnet-4-5";

function buildPrompt(t: Tenant, count: number, avoid: string[]) {
  const n = niches[t.niche];
  return `You write marketing content for a real local business. Output ONLY a JSON array of ${count} objects, no prose.

Business: ${t.name}
Type: ${n.label}
Location: ${t.city}, ${t.region} (also serves: ${t.config.serviceArea.join(", ")})
Services: ${t.config.services.map((s) => s.name).join(", ")}
Content pillars to rotate through: ${t.config.content.pillars.join(", ")}
Already published (do not repeat these topics): ${avoid.length ? avoid.join(" | ") : "none"}

Each object:
{
 "topic": short topic label,
 "article": {
   "title": 40-70 chars, include a service + the city naturally,
   "excerpt": 1-2 sentences, under 160 chars (used as meta description),
   "body": 350-650 words. Plain text: paragraphs separated by blank lines, "## " for subheadings, "- " for bullets. Genuinely useful to a local customer; specific, practical, no filler, no fake statistics, no invented reviews, prices or awards. Mention the city/area naturally 2-3 times, not stuffed. End with a one-line invitation to book online.,
   "keywords": 3-6 local search phrases a customer would type,
   "cta": 2-4 word button label
 },
 "gbp": { "summary": 2-4 sentence Google Business Profile update teasing the article, under 1200 chars, no URLs, no phone numbers },
 "social": { "caption": Instagram/Facebook caption, friendly, 2-4 short lines + a call to book via link in bio, "hashtags": 5-10 relevant local + niche hashtags without spaces },
 "imagePrompt": one-sentence description of an on-brand photo to pair with it
}`;
}

async function callClaude(prompt: string): Promise<unknown> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 8000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { content: { type: string; text?: string }[] };
  const text = data.content.map((c) => c.text ?? "").join("");
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start < 0 || end < 0) throw new Error("Model did not return a JSON array");
  return JSON.parse(text.slice(start, end + 1));
}

/** Deterministic fallback so demo mode (no API key) still produces usable content. */
function templateUnits(t: Tenant, count: number, avoid: string[]): Unit[] {
  const n = niches[t.niche];
  const out: Unit[] = [];
  const pillars = t.config.content.pillars;
  for (let i = 0; out.length < count && i < pillars.length * t.config.services.length; i++) {
    const pillar = pillars[i % pillars.length];
    const service = t.config.services[i % t.config.services.length].name;
    const title = `${service} in ${t.city}: ${pillar.replace(/^\w/, (c) => c.toUpperCase())} from ${t.name}`.slice(0, 88);
    if (avoid.includes(title)) continue;
    out.push({
      topic: `${service} · ${pillar}`,
      article: {
        title,
        excerpt: `${t.name} shares ${pillar} on ${service.toLowerCase()} for customers in ${t.city}, ${t.region}.`.slice(0, 158),
        body: [
          `If you're looking for ${service.toLowerCase()} in ${t.city}, here's what ${t.name} wants every customer to know before they book.`,
          `## What to expect`,
          `Every ${service.toLowerCase()} starts with a quick conversation about what you want and how you live day to day. That way the result fits you, not a template.`,
          `## ${pillar.replace(/^\w/, (c) => c.toUpperCase())}`,
          `- Ask questions up front — there are no bad ones.`,
          `- Book a time that suits your week, any time of day, online.`,
          `- Tell us about anything specific in the booking message so we can prepare.`,
          `## Serving ${t.config.serviceArea.join(", ")}`,
          `${t.name} is a ${n.label.toLowerCase()} serving ${t.city} and nearby communities. We're local, we're reachable, and we take the details seriously.`,
          `Ready when you are — book ${service.toLowerCase()} online in under a minute.`,
        ].join("\n\n"),
        keywords: [`${service.toLowerCase()} ${t.city}`, `${n.label.toLowerCase()} ${t.city} ${t.region}`, `${service.toLowerCase()} near me`],
        cta: `Book ${service.toLowerCase()}`.slice(0, 38),
      },
      gbp: {
        summary: `New from ${t.name}: ${pillar} for anyone booking ${service.toLowerCase()} in ${t.city}. Read the full guide on our site and book online any time — day or night.`,
      },
      social: {
        caption: `${pillar.replace(/^\w/, (c) => c.toUpperCase())} 👇\n${service} done right in ${t.city}.\nBook in under a minute — link in bio.`,
        hashtags: [slugify(t.city).replace(/-/g, ""), slugify(service).replace(/-/g, ""), slugify(n.label).replace(/-/g, ""), "smallbusiness", "shoplocal"],
      },
      imagePrompt: `${service} at ${t.name}, natural light, clean on-brand photo`,
    });
  }
  return out;
}

export async function generateUnits(t: Tenant, count: number, avoid: string[]): Promise<Unit[]> {
  if (!process.env.ANTHROPIC_API_KEY) return templateUnits(t, count, avoid);
  const raw = await callClaude(buildPrompt(t, count, avoid));
  const parsed = z.array(unitSchema).safeParse(raw);
  if (!parsed.success) {
    // Keep valid units, drop malformed ones; fall back if nothing survived.
    const ok = Array.isArray(raw) ? raw.map((r) => unitSchema.safeParse(r)).filter((r) => r.success).map((r) => r.data!) : [];
    return ok.length ? ok : templateUnits(t, count, avoid);
  }
  return parsed.data;
}

/** Turns units into scheduled posts (article + gbp + social), spread across the coming days. */
export function unitsToPosts(t: Tenant, units: Unit[], startAt: Date, everyHours: number): Omit<Post, "id" | "createdAt">[] {
  const posts: Omit<Post, "id" | "createdAt">[] = [];
  units.forEach((u, i) => {
    const when = new Date(startAt.getTime() + i * everyHours * 3600_000).toISOString();
    const base = slugify(u.article.title) || `post-${Date.now()}-${i}`;
    const shared = { tenantId: t.id, status: "scheduled" as const, scheduledFor: when, publishedAt: null, results: {}, imagePrompt: u.imagePrompt };
    posts.push({
      ...shared,
      slug: base,
      kind: "article",
      title: u.article.title,
      excerpt: u.article.excerpt,
      body: u.article.body,
      keywords: u.article.keywords,
      cta: u.article.cta,
    });
    posts.push({
      ...shared,
      slug: `${base}--gbp`,
      kind: "gbp",
      title: u.article.title,
      excerpt: u.article.excerpt,
      body: u.gbp.summary,
      keywords: u.article.keywords,
      cta: u.article.cta,
    });
    posts.push({
      ...shared,
      slug: `${base}--social`,
      kind: "social",
      title: u.article.title,
      excerpt: u.article.excerpt,
      body: `${u.social.caption}\n\n${u.social.hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" ")}`,
      keywords: u.article.keywords,
      cta: u.article.cta,
    });
  });
  return posts;
}
