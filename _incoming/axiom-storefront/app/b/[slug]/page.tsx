import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { niches, site } from "@/config/storefront";
import { BookingForm } from "@/components/funnel/BookingForm";
import { breadcrumbLd, faqLd, JsonLd, localBusinessLd, tenantUrl } from "@/lib/seo/jsonld";
import { getTenantBySlug, listPosts } from "@/lib/tenants/store";

export const revalidate = 3600;

type Params = { params: Promise<{ slug: string }>; searchParams: Promise<{ welcome?: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const t = await getTenantBySlug(slug);
  if (!t) return {};
  const primary = t.config.services[0]?.name ?? niches[t.niche].label;
  const title = `${t.name} — ${primary} in ${t.city}, ${t.region}`;
  const description = `${t.name} is a ${niches[t.niche].label.toLowerCase()} in ${t.city}, ${t.region}. ${t.config.services
    .slice(0, 3)
    .map((s) => s.name)
    .join(", ")}. Book online 24/7.`.slice(0, 158);
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/b/${t.slug}` },
    manifest: `/b/${t.slug}/manifest.webmanifest`,
    openGraph: { type: "website", title, description, url: tenantUrl(t), siteName: t.name, locale: "en_US" },
    twitter: { card: "summary_large_image", title, description },
    robots: { index: t.status !== "paused", follow: true },
    appleWebApp: { capable: true, title: t.name, statusBarStyle: "black-translucent" },
    other: { "geo.placename": `${t.city}, ${t.region}`, "geo.region": `US-${t.region}` },
  };
}

export default async function TenantHome({ params, searchParams }: Params) {
  const [{ slug }, { welcome }] = await Promise.all([params, searchParams]);
  const t = await getTenantBySlug(slug);
  if (!t || t.status === "paused") notFound();
  const posts = await listPosts(t.id, { kind: "article", status: "published", limit: 6 });
  const n = niches[t.niche];

  return (
    <main className="ambient min-h-svh">
      <JsonLd data={localBusinessLd(t)} />
      <JsonLd data={faqLd(t)} />
      <JsonLd data={breadcrumbLd([{ name: t.name, url: tenantUrl(t) }])} />

      {welcome ? (
        <div className="border-b border-[var(--color-ice)]/30 bg-[var(--color-ice)]/10 px-5 py-3 text-center text-sm">
          {welcome === "custom"
            ? "Thanks — your build request is in. Here's a preview of your starter app while we schedule the kickoff."
            : "🎉 Your app is live. On your phone: Share → Add to Home Screen to install it."}{" "}
          {t.status === "preview" ? <span className="text-white/60">(Preview until payment completes.)</span> : null}
        </div>
      ) : null}

      <section className="mx-auto max-w-5xl px-5 pb-10 pt-12">
        <p className="eyebrow">{n.label} · {t.city}, {t.region}</p>
        <h1 className="display mt-4 text-[clamp(2.4rem,7vw,4.4rem)]">{t.name}</h1>
        <p className="mt-4 max-w-2xl text-lg text-white/70">
          {t.config.services.map((s) => s.name).join(" · ")} — serving {t.config.serviceArea.join(", ")}. Book online any time.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <a href="#book" className="tb tb-ember"><span className="tb-label">Book now</span></a>
          <a href={`tel:${t.phone.replace(/[^+\d]/g, "")}`} className="tb tb-ghost"><span className="tb-label">Call {t.phone}</span></a>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 pb-12">
        <h2 className="display text-3xl">Services in {t.city}</h2>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {t.config.services.map((s) => (
            <li key={s.name} className="glass flex items-center justify-between p-5">
              <span className="font-semibold">{s.name}</span>
              {s.price ? <span className="text-white/60">{s.price}</span> : null}
            </li>
          ))}
        </ul>
      </section>

      <section id="book" className="mx-auto max-w-5xl scroll-mt-6 px-5 pb-14">
        <h2 className="display text-3xl">Book with {t.name}</h2>
        <p className="mt-2 text-white/60">Requests come straight to us, 24/7. We confirm by text.</p>
        <div className="mt-6">
          <BookingForm slug={t.slug} services={t.config.services.map((s) => s.name)} cta="Request booking" />
        </div>
      </section>

      {posts.length ? (
        <section className="mx-auto max-w-5xl px-5 pb-14">
          <h2 className="display text-3xl">Guides & news</h2>
          <ul className="mt-6 grid gap-3 md:grid-cols-2">
            {posts.map((p) => (
              <li key={p.id}>
                <Link href={`/b/${t.slug}/posts/${p.slug}`} className="glass block p-5 hover:border-[var(--color-ice)]/50">
                  <h3 className="font-semibold leading-snug">{p.title}</h3>
                  <p className="mt-2 text-sm text-white/60">{p.excerpt}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mx-auto max-w-3xl px-5 pb-16">
        <h2 className="display text-3xl">FAQ</h2>
        <dl className="mt-4 divide-y divide-white/10">
          {t.config.faqs.map((f) => (
            <div key={f.q} className="py-4">
              <dt className="font-semibold">{f.q}</dt>
              <dd className="mt-1.5 text-white/65">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* NAP block — identical name/address/phone everywhere is a core local ranking signal. */}
      <footer className="border-t border-white/10 px-5 py-8 text-center text-sm text-white/50">
        <address className="not-italic">
          <strong className="text-white/80">{t.name}</strong> · {t.street ? `${t.street}, ` : ""}{t.city}, {t.region} {t.postalCode ?? ""} ·{" "}
          <a href={`tel:${t.phone.replace(/[^+\d]/g, "")}`}>{t.phone}</a>
        </address>
        <p className="mt-2">
          Powered by <Link href="/" className="underline-offset-4 hover:underline">{site.name}</Link>
        </p>
      </footer>
    </main>
  );
}
