import { notFound } from "next/navigation";
import { OutboundStorefront } from "@/components/outbound/OutboundStorefront";
import { firstQuery } from "@/lib/axiom/outbound-preview";
import { resolveOutboundLead } from "@/lib/axiom/outbound-preview.server";
import { previewStockForBusiness } from "@/lib/axiom/preview-stock";
import { readPublicShop } from "@/lib/axiom/shop-accent.server";
import { readStudioAccess } from "@/lib/axiom/studio-credits.server";
import { AXIOM_THEMES } from "@/lib/axiom/themes";
import { LiveShopCroShell, LiveShopQuoteSection } from "@/components/conversion/LiveShopCroShell";
import { PublicStudioFraming } from "@/components/studio/fx/PublicStudioFraming";
import { getStudioFxState } from "@/lib/axiom/studio-fx/server";
import { shopCity } from "@/lib/axiom/avatar";

export default async function ShopPage({
  params,
  searchParams,
}: {
  params: Promise<{ shopSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { shopSlug } = await params;
  const query = await searchParams;
  const shop = await readPublicShop(shopSlug);
  const lead = firstQuery(query.lead);

  if (!lead) {
    if (!shop) notFound();

    // Theme from brand pack (shops have accent, not a theme id column yet)
    const activeTheme = AXIOM_THEMES["neon-cyan"] ?? Object.values(AXIOM_THEMES)[0]!;
    const city = shopCity(shop.address);
    const stock = previewStockForBusiness({
      niche: shop.niche,
      businessName: shop.name,
      accent: shop.accent,
      city,
    });
    const services = [
      { title: `Emergency ${shop.niche}`, description: "Priority dispatch with live booking confirmation." },
      { title: "Diagnostics & Repair", description: "On-site assessment and fixed-rate repair options." },
      { title: "Install & Upgrade", description: "New installs and system upgrades, scheduled same-day when available." },
      { title: "Maintenance Plans", description: "Recurring service windows to keep your systems mission-ready." },
    ];
    const gallery = [stock.still, stock.proof, stock.services];

    const themeStyles = `
      .immutable-storefront {
        --shop-primary: ${shop.accent || activeTheme.primary};
        --shop-secondary: ${activeTheme.secondary};
        --shop-glow: ${activeTheme.glowColor};
        --shop-badge-bg: ${activeTheme.badgeBg};
        --shop-highlight: ${activeTheme.textHighlight};
      }
    `;

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: shop.name,
      description: `Open 24/7 for emergency ${shop.niche} bookings.`,
      url: `/${shop.slug}`,
    };

    const studioFx = await getStudioFxState(shop.slug);

    return (
      <LiveShopCroShell
        shopSlug={shop.slug}
        shopName={shop.name}
        city={city}
        niche={shop.niche}
        accentPrimary={shop.accent || activeTheme.primary}
      >
        <div className="immutable-storefront min-h-screen bg-[#050507] pb-[calc(6.25rem+env(safe-area-inset-bottom))] text-white selection:bg-cyan-500 selection:text-slate-950 font-sans lg:pb-[5.5rem]">
        <style>{themeStyles}</style>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />

        {/* --- SECTION 1: HERO & 3D COMPANION --- */}
        <header className="relative px-6 py-16 lg:py-24 overflow-hidden border-b border-slate-800/80">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            
            {/* Left Column: Tenant Branding & Booking CTA */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-6 border" style={{ backgroundColor: 'var(--shop-badge-bg)', borderColor: 'var(--shop-primary)' }}>
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--shop-primary)' }} />
                <span className="font-mono text-xs uppercase tracking-[0.22em]" style={{ color: 'var(--shop-primary)' }}>
                  Open 24/7 • AI Telemetry Active
                </span>
              </div>
              
              <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight text-white">
                {shop.name}
              </h1>

              <p
                className="mt-3 inline-flex max-w-xl items-center gap-2 rounded-lg border border-[#FFE500]/25 bg-[#FFE500]/10 px-3 py-2 font-mono text-[11px] leading-snug tracking-wide text-[#FFE500] sm:text-xs"
                role="status"
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#FFE500] shadow-[0_0_8px_rgba(255,229,0,0.8)]" aria-hidden />
                Set up your 24/7 AI dispatcher in 3 minutes—no credit card required
              </p>
              
              <p className="mt-4 max-w-xl text-lg leading-relaxed" style={{ color: 'var(--shop-highlight)' }}>
                {shop.tagline || `Emergency ${shop.niche} dispatch and bookings, day and night.`}
              </p>

              <div className="mt-8 flex flex-wrap gap-3 items-center">
                <a
                  href={`/${shop.slug}/admin/studio`}
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#00f2fe]/55 bg-[#00f2fe]/10 px-6 py-3 font-mono text-[11px] font-black uppercase tracking-[0.16em] text-[#00f2fe] shadow-[0_0_24px_rgba(0,242,254,0.16)] transition hover:bg-[#00f2fe]/18"
                >
                  Studio
                </a>
                <a
                  href={`/${shop.slug}/admin/studio`}
                  className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#FFE500] px-6 py-3 font-mono text-[11px] font-black uppercase tracking-[0.12em] text-[#030712] shadow-[0_20px_60px_-20px_#FFE500] transition hover:brightness-110"
                >
                  Upgrade your own shop photo
                </a>
                <a
                  href={`/${shop.slug}/book`}
                  className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#00f2fe] px-8 py-3 font-mono text-[11px] font-black uppercase tracking-[0.16em] text-[#030712] shadow-[0_14px_40px_-12px_#00f2fe] transition hover:brightness-110"
                >
                  Book
                </a>
                <a
                  href="tel:5418908126"
                  className="inline-flex items-center justify-center px-4 py-3 font-mono text-[10px] uppercase tracking-[0.14em] text-white/55 transition hover:text-white"
                >
                  Call dispatch
                </a>
              </div>
            </div>

            <div className="w-full min-w-0">
              <PublicStudioFraming
                variant="embed"
                slug={shop.slug}
                initial={studioFx}
                studioHref={`/${shop.slug}/admin/studio`}
              />
            </div>

          </div>
        </header>

        {/* --- SECTION 2: TRUST & VERIFIED METRICS BAR --- */}
        <section className="border-b border-slate-800/60 bg-slate-950/40 py-8 px-6">
          <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
              <p className="text-2xl lg:text-3xl font-extrabold" style={{ color: 'var(--shop-primary)' }}>100%</p>
              <p className="text-xs font-mono text-slate-400 mt-1 uppercase">Licensed & Insured</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
              <p className="text-2xl lg:text-3xl font-extrabold" style={{ color: 'var(--shop-primary)' }}>&lt; 5m</p>
              <p className="text-xs font-mono text-slate-400 mt-1 uppercase">Avg. Dispatch Response</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
              <p className="text-2xl lg:text-3xl font-extrabold" style={{ color: 'var(--shop-primary)' }}>24/7</p>
              <p className="text-xs font-mono text-slate-400 mt-1 uppercase">Emergency Availability</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
              <p className="text-2xl lg:text-3xl font-extrabold" style={{ color: 'var(--shop-primary)' }}>4.9 ★</p>
              <p className="text-xs font-mono text-slate-400 mt-1 uppercase">Customer Rating</p>
            </div>
          </div>
        </section>

        <LiveShopQuoteSection shopName={shop.name} niche={shop.niche} />

        {/* --- SECTION 3: CORE SERVICES GRID --- */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <span className="text-xs font-mono uppercase tracking-[0.2em]" style={{ color: 'var(--shop-primary)' }}>// PROFESSIONAL TRADE CAPABILITIES</span>
            <h2 className="text-3xl font-bold mt-2">Specialized {shop.niche} Services</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((svc, idx) => (
              <div key={idx} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-mono text-sm mb-4" style={{ color: 'var(--shop-primary)' }}>
                    0{idx + 1}
                  </div>
                  <h3 className="font-bold text-lg text-white mb-2">{svc.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{svc.description}</p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500">Fixed Rate Ready</span>
                  <span style={{ color: 'var(--shop-primary)' }}>Inquire →</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* --- SECTION 4: PROOF OF WORK GALLERY --- */}
        <section className="border-t border-slate-800/80 bg-slate-950/60 py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12">
              <div>
                <span className="text-xs font-mono uppercase tracking-[0.2em]" style={{ color: 'var(--shop-primary)' }}>// VERIFIED TELEMETRY</span>
                <h2 className="text-3xl font-bold mt-2">Recent Proof of Work</h2>
              </div>
              <p className="text-sm text-slate-400 mt-2 md:mt-0 font-mono">Active Projects across Southern Oregon</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {gallery.map((imgUrl, idx) => (
                <div key={idx} className="group relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 aspect-[4/3]">
                  <img src={imgUrl} alt="Project proof" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="text-[10px] font-mono px-2 py-1 rounded bg-slate-900/80 border border-slate-700" style={{ color: 'var(--shop-primary)' }}>
                      Verified Job #{104 + idx}
                    </span>
                    <p className="text-sm font-semibold text-white mt-2">Completed {shop.niche} Deployment</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>
      </LiveShopCroShell>
    );
  }

  // --- OUTBOUND LEAD PREVIEW FLOW ---
  const accent = shop?.accent ?? "";
  const theme = accent ? <style>{`.immutable-storefront{--shop-accent:${accent} !important}`}</style> : null;

  const profile = await resolveOutboundLead({
    slug: shopSlug,
    lead,
    name: firstQuery(query.name),
    city: firstQuery(query.city),
    county: firstQuery(query.county),
    niche: firstQuery(query.niche),
  });
  
  const access = await readStudioAccess(profile.slug);
  
  return (
    <>
      {theme}
      <OutboundStorefront
        profile={profile}
        stock={previewStockForBusiness({
          niche: profile.niche,
          businessName: profile.businessName,
          city: profile.city,
          accent,
        })}
        studioUnlocked={access.isActive && access.credits > 0}
      />
    </>
  );
}