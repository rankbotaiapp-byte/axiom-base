import Link from "next/link";
import { CinematicHero } from "@/components/hero/CinematicHero";
import { TactileButton } from "@/components/ui/TactileButton";
import { plans, site } from "@/config/storefront";
import { JsonLd, storefrontLd } from "@/lib/seo/jsonld";

const steps = [
  { n: "01", t: "Tell Axiom about your business", d: "Name, trade, town, phone. Sixty seconds, from your phone." },
  { n: "02", t: "Your app goes live", d: "Booking page, admin dashboard and local SEO structure are generated and live on a real URL in minutes. Add it to your home screen like any app." },
  { n: "03", t: "The engine runs 24/7", d: "Bookings land in your dashboard day and night. Fresh local articles, Google Business posts and social captions publish on a schedule." },
];

const features = [
  { t: "24/7 booking app", d: "Mobile-first booking that never sleeps. Requests go straight to your dashboard and phone." },
  { t: "Admin dashboard", d: "See bookings, edit services and hours, approve or pause content — all from your phone." },
  { t: "Autonomous content engine", d: "Writes local articles, Google Business Profile posts and social captions for your trade and town, then publishes them for you." },
  { t: "Local SEO structure", d: "Schema markup, fast pages, sitemaps and a growing library of local articles, built the way Google reads local businesses." },
];

const faqs = [
  { q: "How fast is “minutes”?", a: "Your booking app and dashboard are live on a real URL as soon as you finish the form. Connecting Google Business Profile and social accounts takes a few more minutes of logins." },
  { q: "Will this put me at the top of Google?", a: "Nobody can honestly guarantee rankings. Axiom handles the on-site and posting work that local rankings depend on — structured data, speed, consistent business info and steady fresh content. Reviews and your Google Business Profile still matter a lot, and we'll show you how to grow both." },
  { q: "What's the 2-week custom build?", a: "A fully custom app built personally with you over two weeks — custom features, integrations and design beyond the standard system." },
];

export default function Home() {
  return (
    <main className="ambient">
      <JsonLd data={storefrontLd()} />

      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
        <Link href="/" className="display text-xl tracking-tight">
          {site.name}
          <span className="ml-1 text-[var(--color-ice)]">.</span>
        </Link>
        <nav className="flex items-center gap-5 text-sm text-white/70">
          <a href="#how" className="hidden hover:text-white sm:inline">How it works</a>
          <a href="#pricing" className="hidden hover:text-white sm:inline">Pricing</a>
          <Link href="/admin" className="hover:text-white">Sign in</Link>
        </nav>
      </header>

      {/* HERO — media first on mobile, side-by-side on desktop. */}
      <section className="mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-12 lg:px-8 lg:pb-16 lg:pt-6">
        <div className="order-1 lg:order-2">
          <CinematicHero />
        </div>
        <div className="order-2 px-5 pb-6 lg:order-1 lg:px-0 lg:pb-0">
          <p className="eyebrow">Local business automation · {site.region}</p>
          <h1 className="display mt-4 text-[clamp(2.4rem,6.2vw,4.6rem)]">
            Your complete business app.
            <span className="block bg-gradient-to-r from-[#9be9ff] via-white to-[#ffb36b] bg-clip-text text-transparent">Live in minutes.</span>
          </h1>
          <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-white/72">
            Booking that works while you sleep, a dashboard in your pocket, and a content engine that keeps your business showing up in local search — set up from your phone.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <TactileButton href={`/start?plan=${plans.custom.id}`} tone="ghost" sub={plans.custom.fine} track="hero_custom">
              {plans.custom.cta}
            </TactileButton>
            <a href="#how" className="px-2 text-sm text-white/60 underline-offset-4 hover:text-white hover:underline">See how it works ↓</a>
          </div>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <p className="eyebrow">How it works</p>
        <h2 className="display mt-3 text-4xl sm:text-5xl">From sign-up to booked, today.</h2>
        <ol className="mt-10 grid gap-4 md:grid-cols-3">
          {steps.map((s) => (
            <li key={s.n} className="glass p-6">
              <span className="font-mono text-xs text-[var(--color-ice)]">{s.n}</span>
              <h3 className="mt-3 text-lg font-semibold">{s.t}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-white/65">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-20 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2">
          {features.map((f) => (
            <article key={f.t} className="glass p-6">
              <h3 className="text-lg font-semibold">{f.t}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-white/65">{f.d}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl px-5 pb-20 lg:px-8">
        <p className="eyebrow">Pricing</p>
        <h2 className="display mt-3 text-4xl sm:text-5xl">Pick your path.</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {(Object.values(plans) as (typeof plans)[keyof typeof plans][]).map((p) => (
            <div key={p.id} className="glass flex flex-col p-6">
              <h3 className="text-lg font-semibold">{p.label}</h3>
              <p className="display mt-4 text-3xl">{p.price}</p>
              <p className="mt-1 text-sm text-white/55">{p.fine}</p>
              <div className="mt-6 flex-1" />
              <TactileButton href={`/start?plan=${p.id}`} tone={p.tone} track={`pricing_${p.id}`} className="w-full">
                {p.cta}
              </TactileButton>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 pb-24 lg:px-8">
        <h2 className="display text-3xl">Straight answers</h2>
        <dl className="mt-6 divide-y divide-white/10">
          {faqs.map((f) => (
            <div key={f.q} className="py-5">
              <dt className="font-semibold">{f.q}</dt>
              <dd className="mt-2 leading-relaxed text-white/65">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <footer className="border-t border-white/10 px-5 py-8 text-center text-sm text-white/45">
        © {new Date().getFullYear()} {site.legalName}
      </footer>
    </main>
  );
}
