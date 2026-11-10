import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Bot,
  CalendarCheck,
  CreditCard,
  Images,
  LayoutTemplate,
  Palette,
  Smartphone,
} from "lucide-react";
import { AxiomHero } from "@/components/AxiomHero";
import { FreezePanStage } from "@/components/cinematic/FreezePanStage";
import { EmergencyTradeHero } from "@/components/marketing/EmergencyTradeHero";
import { InboundSignup } from "@/components/marketing/InboundSignup";
import { IndustryMarquee } from "@/components/marketing/IndustryMarquee";
import { PricingSection } from "@/components/pricing/PricingSection";
import { rememberLandingPlan, type LandingPlanId } from "@/lib/axiom/funnel";
import { Reveal } from "@/components/reveal";
import { PoweredBy, Wordmark } from "@/components/shop-chrome";
import { CATALOG, CATALOG_BY_ID } from "@/config/catalog";
import { cn } from "@/lib/utils";
import type { PlanId } from "@/config/storefront";

function startPlan(plan: LandingPlanId | PlanId): PlanId {
  if (plan === "lifetime") return "lifetime";
  if (plan === "custom") return "custom";
  return "starter";
}

type AxiomPublicLandingProps = {
  headerSlot?: ReactNode;
  leadName?: string;
};

/** Cinematic public landing: freeze-pan leopard, holo glass, 3D pricing, `/start` funnel. */
export function AxiomPublicLanding({ headerSlot, leadName = "" }: AxiomPublicLandingProps) {
  const navigate = useNavigate();
  const [reduceMotion, setReduceMotion] = useState(false);
  const [leavingHero, setLeavingHero] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  async function enterFunnel(plan: LandingPlanId | PlanId) {
    rememberLandingPlan(plan === "lifetime" ? "lifetime" : "trial");
    setLeavingHero(true);
    await new Promise((resolve) => window.setTimeout(resolve, reduceMotion ? 80 : 420));
    await navigate({ to: "/start", search: { plan: startPlan(plan) } });
  }

  return (
    <main className="neon-shell snap-y snap-mandatory overflow-y-auto bg-obsidian">
      <FreezePanStage
        leaving={leavingHero}
        onEnter={() => enterFunnel("trial")}
        onLifetime={() => enterFunnel("lifetime")}
        onboardHref="/start?plan=starter"
        niche="contractor"
        city="Southern Oregon"
        headerSlot={headerSlot}
      />

      <AxiomHero leaving={leavingHero} onEnter={() => enterFunnel("trial")} ctaLabel="Start for $1" />

      <EmergencyTradeHero
        className="shrink-0"
        reduceMotion={reduceMotion}
        leaving={leavingHero}
        onEnter={() => enterFunnel("trial")}
      />

      <section id="app-build" className="relative isolate snap-start bg-obsidian px-5 py-16 sm:px-10 sm:py-20">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-accent/80">Main build</p>
            <h2 className="mt-3 font-display text-3xl text-fg sm:text-4xl">
              Automate your service business. Zero coding required.
            </h2>
            {leadName ? (
              <p className="mt-4 text-sm text-copper">This link is saved for {leadName}.</p>
            ) : (
              <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
                Type your shop name, pick any local trade, and spin up a live booking storefront in seconds.
              </p>
            )}
            <IndustryMarquee className="mt-5 mb-1 sm:mt-6" />
            <button
              type="button"
              onClick={() => void enterFunnel("trial")}
              disabled={leavingHero}
              className={cn(
                "mt-6 inline-flex min-h-12 items-center gap-3 rounded-full border border-accent/40 bg-obsidian/70 px-6 py-3",
                "font-mono text-xs uppercase tracking-[0.18em] text-accent backdrop-blur-md",
                "transition hover:border-accent hover:bg-accent/10 disabled:opacity-60",
              )}
            >
              Enter desk · $1 trial
            </button>
          </div>
          <div className="w-full max-w-xl">
            <InboundSignup />
          </div>
        </div>
      </section>

      <section id="how" className="bg-obsidian px-5 py-20 sm:px-10">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-accent/80">How it works</p>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl">Three moves. Live book.</h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
              Claim a niche, lock brand in Zero-Code Studio, then take bookings and Stripe payments around the clock.
            </p>
          </Reveal>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Claim your niche",
                body: `Pick from ${CATALOG.length} local trades — HVAC to landscaping — and stand up a tenant in seconds.`,
                icon: CalendarCheck,
              },
              {
                step: "02",
                title: "Lock in your brand",
                body: "Zero-Code Studio sets hero film, palette, and copy. No engineers. No theme rabbit holes.",
                icon: Palette,
              },
              {
                step: "03",
                title: "Launch 24/7 booking",
                body: "Automated booking calendar plus Stripe checkout so the shop takes money while you are on the job.",
                icon: CreditCard,
              },
            ].map((item) => (
              <Reveal key={item.step}>
                <article
                  className={cn(
                    "glass-card relative flex h-full flex-col rounded-2xl p-5 backdrop-blur-md",
                    "shadow-[0_16px_40px_color-mix(in_srgb,var(--color-obsidian)_45%,transparent),0_0_28px_color-mix(in_srgb,var(--color-accent)_8%,transparent),inset_0_1px_0_color-mix(in_srgb,var(--color-fg)_12%,transparent)]",
                    "transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_48px_color-mix(in_srgb,var(--color-obsidian)_50%,transparent),0_0_36px_color-mix(in_srgb,var(--color-accent)_14%,transparent)]",
                  )}
                >
                  <span className="film-bracket film-bracket-nw text-accent/50" aria-hidden />
                  <span className="film-bracket film-bracket-se text-amber/45" aria-hidden />
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent/80">{item.step}</span>
                    <item.icon className="size-5 text-accent" aria-hidden />
                  </div>
                  <h3 className="mt-4 font-display text-xl text-fg">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{item.body}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <PricingSection />

      <section id="features" className="bg-obsidian px-5 py-16 sm:px-10">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-accent/80">Platform</p>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl">Built for the bay, the chair, the site.</h2>
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {[
              {
                title: "AI Avatar Assistant",
                body: "Voice and chat concierge that greets guests, answers hours, and routes booking intent.",
                icon: Bot,
              },
              {
                title: "Master Tenant Templates",
                body: "Catalog-backed niches with verified hero loops, services, and desk defaults — not empty shells.",
                icon: LayoutTemplate,
              },
              {
                title: "Proof of Work Galleries",
                body: "Portfolio plates and crew proof that sell the next job before the first call is returned.",
                icon: Images,
              },
              {
                title: "Instant mobile responsiveness",
                body: "Storefront, book page, and brand studio are phone-first — the crew runs them from the truck.",
                icon: Smartphone,
              },
            ].map((feature) => (
              <Reveal key={feature.title}>
                <article className="glass-card rounded-2xl p-5 backdrop-blur-md">
                  <feature.icon className="size-5 text-accent" aria-hidden />
                  <h3 className="mt-4 font-display text-xl text-fg">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{feature.body}</p>
                </article>
              </Reveal>
            ))}
          </div>

          <div className="mt-10">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-faint">
              {CATALOG.length} niches live on this door
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {CATALOG.map((row) => (
                <span
                  key={row.id}
                  className={cn(
                    "rounded-full border border-line bg-obsidian/60 px-3 py-1.5 backdrop-blur-md",
                    "font-mono text-[10px] uppercase tracking-[0.16em] text-muted",
                  )}
                >
                  {row.id === "contractor" ? "Construction" : CATALOG_BY_ID[row.id].label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer id="footer" className="bg-obsidian px-5 pb-10 pt-6 sm:px-10">
        <Reveal>
          <div className="glass-panel relative mx-auto flex max-w-6xl flex-col gap-6 rounded-[28px] px-6 py-8 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
            <span className="film-bracket film-bracket-nw text-accent/55" aria-hidden />
            <span className="film-bracket film-bracket-se text-amber/50" aria-hidden />
            <div>
              <Wordmark />
              <p className="mt-3 max-w-sm text-sm text-muted">
                Axiom · booking OS for local service businesses. Corporate inbound at the root. Personalized demos on
                each shop slug.
              </p>
            </div>
            <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm" aria-label="Corporate">
              <Link to="/terms" className="inline-flex h-11 items-center text-muted transition-colors hover:text-fg">
                Terms
              </Link>
              <Link to="/privacy" className="inline-flex h-11 items-center text-muted transition-colors hover:text-fg">
                Privacy
              </Link>
              <a
                href="mailto:hello@axiom.shop"
                className="inline-flex h-11 items-center text-muted transition-colors hover:text-fg"
              >
                Contact
              </a>
              <Link to="/login" className="inline-flex h-11 items-center text-muted transition-colors hover:text-fg">
                Login
              </Link>
              <a href="#how" className="inline-flex h-11 items-center text-muted transition-colors hover:text-fg">
                How it works
              </a>
              <a href="#pricing" className="inline-flex h-11 items-center text-muted transition-colors hover:text-fg">
                Pricing
              </a>
            </nav>
          </div>
        </Reveal>
        <PoweredBy />
      </footer>
    </main>
  );
}
