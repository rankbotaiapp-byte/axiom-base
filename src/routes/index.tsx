import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AxiomMasterLanding } from "@/components/axiom-landing/AxiomMasterLanding";
import { buildAutonomousContentPlan, cinematicLandingMeta } from "@/lib/axiom/cinematic-content-seo";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";
import { LEAD_STORAGE_KEY, parseFunnelSearch } from "@/lib/axiom/funnel";
import { ensureFunnelSession, masterGate, recordFunnelHit } from "@/lib/axiom/master";
import { listMyShops } from "@/lib/axiom/server";
import type { Shop } from "@/lib/axiom/types";
import { OutreachStorefront } from "@/components/outreach-storefront";
import { isOutreachVisit } from "@/lib/axiom/outreach-visit";
import { LeadTerritory } from "@/components/territory-offer";

/**
 * Corporate root landing (`/`).
 * Outbound personalized funnels stay on `/$shopSlug` and outreach query visits.
 * This file route always wins over `/$shopSlug` — never treats the root as a tenant named "index".
 */
const LANDING_SEO = buildAutonomousContentPlan({
  niche: "contractor",
  city: "Southern Oregon",
  businessName: "Axiom",
});

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => parseFunnelSearch(search),
  loader: async () => {
    const { readyShowcaseIds } = await import("@/lib/axiom-landing/ready.server");
    return {
      readyIds: readyShowcaseIds(),
      showPending: import.meta.env.DEV,
    };
  },
  head: () => ({
    meta: [
      ...cinematicLandingMeta(LANDING_SEO),
      { title: "Axiom — The Fully Automated Back Office for Contractors" },
      {
        name: "description",
        content:
          "Booking, routing & dispatch on autopilot. Pick your trade's template, edit it in minutes, and pay once — own it forever.",
      },
    ],
    links: [{ rel: "preload", as: "image", href: "/media/axioms-heart-poster.jpg" }],
  }),
  component: Home,
});

function Home() {
  const search = Route.useSearch();
  const { readyIds, showPending } = Route.useLoaderData();
  const { user, isPending } = useCurrentUserState();
  const [mine, setMine] = useState<Shop[] | null>(null);
  const [masterOpen, setMasterOpen] = useState(false);
  const [, setLeadName] = useState("");

  useEffect(() => {
    const leadSlug = search.b || search.lead_slug || "";
    const utmSource = search.utm_source || "";
    const county = search.county || "";
    const stopToken = search.t || "";
    if (search.pitch) return;
    if (!leadSlug && !utmSource && !county) return;
    const seen = `axiom.hit:${leadSlug}|${utmSource}|${county}|${stopToken}`;
    if (sessionStorage.getItem(seen) === "1") return;
    sessionStorage.setItem(seen, "1");
    if (leadSlug) {
      sessionStorage.setItem(
        LEAD_STORAGE_KEY,
        JSON.stringify({ leadSlug, utmSource, county }),
      );
    }
    void ensureFunnelSession()
      .then(() => recordFunnelHit({ data: { leadSlug, utmSource, county, stopToken } }))
      .then((hit) => {
        if (!hit.businessName) return;
        setLeadName(hit.businessName);
        sessionStorage.setItem(
          LEAD_STORAGE_KEY,
          JSON.stringify({
            leadSlug: leadSlug || undefined,
            tradeType: hit.tradeType,
            county: hit.county,
            utmSource,
          }),
        );
      })
      .catch(() => undefined);
  }, [search.b, search.county, search.lead_slug, search.pitch, search.t, search.utm_source]);

  useEffect(() => {
    if (!user) {
      setMine(null);
      setMasterOpen(false);
      return;
    }
    void listMyShops()
      .then(setMine)
      .catch(() => setMine([]));
    void masterGate()
      .then((gate) => setMasterOpen(gate.open))
      .catch(() => setMasterOpen(false));
  }, [user]);

  const owned = mine?.filter((s) => s.ownerUserId === user?.id) ?? [];
  const leadSlug = search.b || search.lead_slug || "";

  if (isOutreachVisit(search) && !search.pitch) {
    return <OutreachStorefront search={search} />;
  }

  if (search.pitch && leadSlug) {
    return (
      <LeadTerritory
        leadSlug={leadSlug}
        layout="pitch"
        sessionId={search.session_id}
        greet={search.greet}
        businessName={search.biz}
        trade={search.trade}
        city={search.city}
        simulate={search.utm_source === "desk"}
        logoUrl={search.logo}
        accent={search.accent}
        phone={search.phone}
        email={search.email}
      />
    );
  }

  const authHeader = isPending ? (
    <div className="size-8 animate-pulse rounded-full bg-fg/10" />
  ) : (
    <>
      <SignedOut>
        <Link to="/login" className="font-mono text-sm text-muted hover:text-fg">
          Login
        </Link>
      </SignedOut>
      <SignedIn>
        {masterOpen ? (
          <Link to="/master-admin" className="text-sm text-muted hover:text-fg">
            Master
          </Link>
        ) : null}
        {owned[0] ? (
          <Link
            to="/$shopSlug/admin"
            params={{ shopSlug: owned[0].slug }}
            className="text-sm text-muted hover:text-fg"
          >
            Desk
          </Link>
        ) : null}
        <UserButton />
      </SignedIn>
    </>
  );

  return <AxiomMasterLanding readyIds={readyIds} showPending={showPending} headerSlot={authHeader} />;
}
