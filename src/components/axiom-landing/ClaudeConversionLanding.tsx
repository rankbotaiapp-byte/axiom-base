"use client";

import { lazy, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import { AxiomParticleCanvasBackground } from "@/components/AxiomParticleCanvasBackground";
import AxiomLanding from "@/components/components/axiom/AxiomLanding";
import DemoModal from "./DemoModal";
import { FunnelProvider, useFunnel } from "./FunnelProvider";
import Nav from "./Nav";
import OnboardingWizard from "./OnboardingWizard";
import ProofOfWork from "./ProofOfWork";
import ShowcaseModal from "./ShowcaseModal";

const ParticleTrail = lazy(() => import("./ParticleTrail"));

const LINKS = [
  { href: "#how", label: "How it works" },
  { href: "#proof", label: "Templates" },
  { href: "#book", label: "Pricing" },
  { href: "/axiom-studio", label: "Studio" },
];

function CreatorDashboardNavLink() {
  return (
    <Link
      href="/content-creator"
      className="group inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/5 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-cyan-300/90 transition hover:border-cyan-400/50 hover:bg-cyan-500/10 hover:text-cyan-200"
      aria-label="Open Creator Dashboard"
    >
      <LayoutGrid className="h-3.5 w-3.5 text-cyan-400 transition group-hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
      <span className="hidden sm:inline">Creator Dashboard</span>
    </Link>
  );
}

function DeferredTrail() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const start = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 450));
    const id = start(() => setReady(true));
    return () => {
      if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(id as number);
      else window.clearTimeout(id as number);
    };
  }, []);
  if (!ready) return null;
  return (
    <Suspense fallback={null}>
      <ParticleTrail />
    </Suspense>
  );
}

function ClaudePage({ readyIds, showPending }: { readyIds: string[]; showPending: boolean }) {
  const { startOnboarding } = useFunnel();

  useEffect(() => {
    const plan = new URLSearchParams(window.location.search).get("plan");
    if (plan === "trial" || plan === "lifetime" || plan === "free-setup") startOnboarding({ plan });
  }, [startOnboarding]);

  return (
    <div className="relative isolate min-h-svh overflow-x-hidden bg-transparent text-white">
      <AxiomParticleCanvasBackground fixed logoAnchor="header" />
      {/* relative z-10 — keeps nav / hero text / cards above the particle canvas */}
      <div className="relative z-10 bg-transparent">
        <Nav
          links={LINKS}
          ctaLabel="Start the $1 · 14-day trial"
          headerSlot={<CreatorDashboardNavLink />}
        />
        <AxiomLanding
          onLaunch={() => startOnboarding({ plan: "trial" })}
          onCheckout={async (signup) => {
            startOnboarding({ plan: signup.plan === "lifetime" ? "lifetime" : "trial" });
          }}
          midSlot={<ProofOfWork readyIds={readyIds} showPending={showPending} />}
        />
        <footer className="border-t border-white/10 bg-[#030712]/95 py-10 shadow-[0_0_20px_rgba(0,242,254,0.05)]">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-5 text-sm text-slate-400 sm:flex-row sm:px-8">
            <p className="font-display font-bold tracking-[0.2em] text-white">AXIOM</p>
            <div className="flex flex-wrap items-center justify-center gap-5">
              <Link
                href="/content-creator"
                className="font-mono text-[11px] uppercase tracking-[0.16em] text-cyan-300 transition hover:text-cyan-200"
              >
                Creator Dashboard
              </Link>
              <p className="text-slate-400">
                © {new Date().getFullYear()} New Era Apps · A Gear Guardian LLC company
              </p>
            </div>
          </div>
        </footer>
        <DemoModal />
        <ShowcaseModal />
        <OnboardingWizard />
        <DeferredTrail />
      </div>
    </div>
  );
}

export function ClaudeConversionLanding({
  readyIds,
  showPending = false,
}: {
  readyIds: string[];
  showPending?: boolean;
}) {
  return (
    <FunnelProvider>
      <ClaudePage readyIds={readyIds} showPending={showPending} />
    </FunnelProvider>
  );
}
