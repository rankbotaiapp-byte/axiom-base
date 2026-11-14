import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { articleLd, breadcrumbLd, JsonLd, localBusinessLd, tenantUrl } from "@/lib/seo/jsonld";
import { RichText } from "@/lib/seo/RichText";
import { getPost, getTenantBySlug } from "@/lib/tenants/store";

export const revalidate = 3600;

type Params = { params: Promise<{ slug: string; post: string }> };

async function load(slug: string, postSlug: string) {
  const t = await getTenantBySlug(slug);
  if (!t || t.status === "paused") return null;
  const p = await getPost(t.id, postSlug);
  if (!p || p.kind !== "article" || p.status !== "published") return null;
  return { t, p };
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug, post } = await params;
  const d = await load(slug, post);
  if (!d) return {};
  return {
    title: { absolute: `${d.p.title} | ${d.t.name}` },
    description: d.p.excerpt,
    keywords: d.p.keywords,
    alternates: { canonical: `/b/${d.t.slug}/posts/${d.p.slug}` },
    openGraph: { type: "article", title: d.p.title, description: d.p.excerpt, publishedTime: d.p.publishedAt ?? undefined, siteName: d.t.name },
    twitter: { card: "summary_large_image", title: d.p.title, description: d.p.excerpt },
  };
}

export default async function PostPage({ params }: Params) {
  const { slug, post } = await params;
  const d = await load(slug, post);
  if (!d) notFound();
  const { t, p } = d;
  const url = `${tenantUrl(t)}/posts/${p.slug}`;

  return (
    <main className="ambient min-h-svh px-5 py-10">
      <JsonLd data={articleLd(t, p)} />
      <JsonLd data={localBusinessLd(t)} />
      <JsonLd data={breadcrumbLd([{ name: t.name, url: tenantUrl(t) }, { name: p.title, url }])} />
      <article className="mx-auto max-w-2xl">
        <nav className="text-sm text-white/50">
          <Link href={`/b/${t.slug}`} className="hover:text-white">← {t.name}</Link>
        </nav>
        <h1 className="display mt-6 text-[clamp(2rem,5.5vw,3.2rem)]">{p.title}</h1>
        <p className="mt-3 text-sm text-white/45">
          {t.name} · {t.city}, {t.region}
          {p.publishedAt ? ` · ${new Date(p.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}` : ""}
        </p>
        <div className="mt-8">
          <RichText text={p.body} />
        </div>
        <div className="glass mt-12 flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-semibold">Ready when you are in {t.city}.</p>
          <Link href={`/b/${t.slug}#book`} className="tb tb-ember"><span className="tb-label">{p.cta ?? "Book now"}</span></Link>
        </div>
      </article>
    </main>
  );
}
