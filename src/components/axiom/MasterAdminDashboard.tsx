"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ActiveLeadsCard } from "@/components/axiom/cards/ActiveLeadsCard";
import { MarginProtectionCard } from "@/components/axiom/cards/MarginProtectionCard";
import { AxiomSpaceOrbitCanvas } from "@/components/axiom/AxiomSpaceOrbitCanvas";
import { AXIOM_COMPACT_FAB_CLASS } from "@/components/AxiomChatDrawer";
import { AxiomTelemetryProvider, useAxiomTelemetry } from "@/context/AxiomTelemetryContext";
import { masterDeskError, masterDeskFetch } from "@/lib/axiom/master-desk-client";

const CREDIT_CENTS = 4;

const NAV = [
  { id: "command", label: "Command Center" },
  { id: "studio", label: "Studio & Branding" },
  { id: "leads", label: "Autopilot Leads" },
  { id: "trials", label: "Stripe Trials ($1)" },
  { id: "margin", label: "Margin Protection" },
  { id: "settings", label: "System Settings" },
] as const;

type SectionId = (typeof NAV)[number]["id"];

type TenantRow = {
  name: string;
  slug: string;
  niche: string;
  subscriptionStatus: string;
  mrrCents: number;
};

type DeskNumbers = {
  trials: number;
  leads: number;
  credits: number;
  creditCents: number;
  states: { state: string; count: number }[];
  tenants: TenantRow[];
  note: string;
  sessionError: string;
};

const EMPTY: DeskNumbers = {
  trials: 0,
  leads: 0,
  credits: 0,
  creditCents: 0,
  states: [],
  tenants: [],
  note: "Desk numbers load when the master session answers.",
  sessionError: "",
};

function money(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  return `${sign}$${(Math.abs(cents) / 100).toFixed(2)}`;
}

function exposureOf(numbers: DeskNumbers) {
  const revenueCents = numbers.trials * 100;
  const creditCents = numbers.creditCents;
  const covered = creditCents <= revenueCents;
  const ratio = revenueCents === 0 ? (creditCents === 0 ? 0 : 1) : Math.min(1, creditCents / revenueCents);
  return { revenueCents, creditCents, covered, ratio, netCents: revenueCents - creditCents };
}

export function MasterAdminDashboard() {
  return (
    <AxiomTelemetryProvider>
      <MasterAdminDashboardInner />
    </AxiomTelemetryProvider>
  );
}

function MasterAdminDashboardInner() {
  const router = useRouter();
  const telemetry = useAxiomTelemetry();
  const [section, setSection] = useState<SectionId>("command");
  const [numbers, setNumbers] = useState<DeskNumbers>(EMPTY);
  const [pulseNote, setPulseNote] = useState("");
  const [pulsing, setPulsing] = useState<"good" | "warning" | "alert" | null>(null);
  const sweep = "Standing by. A sweep stays a dry run unless outreach is live.";

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [telemetryRes, tenantsRes] = await Promise.all([
          masterDeskFetch("/api/master/telemetry"),
          masterDeskFetch("/api/master/tenants"),
        ]);
        if (cancelled) return;
        const denied = [telemetryRes, tenantsRes].find((res) => res.status === 401 || res.status === 403);
        if (denied) {
          const message = await masterDeskError(denied);
          if (!cancelled) setNumbers({ ...EMPTY, note: message, sessionError: message });
          return;
        }
        const next = { ...EMPTY, note: "" };
        if (telemetryRes.ok) {
          const body = (await telemetryRes.json()) as {
            leadsLast24h?: number;
            leadsByState?: { state: string; count: number }[];
            trials?: number;
            creditSpend?: number;
          };
          next.leads = Number(body.leadsLast24h ?? 0);
          next.states = Array.isArray(body.leadsByState) ? body.leadsByState : [];
          if (typeof body.trials === "number") next.trials = body.trials;
          if (typeof body.creditSpend === "number") {
            next.creditCents = Math.round(body.creditSpend * 100);
            next.credits = CREDIT_CENTS > 0 ? Math.round(next.creditCents / CREDIT_CENTS) : 0;
          }
        }
        if (tenantsRes.ok) {
          const body = (await tenantsRes.json()) as { tenants?: TenantRow[]; creditSpendCents?: number };
          const tenants = Array.isArray(body.tenants) ? body.tenants : [];
          next.tenants = tenants;
          if (!telemetryRes.ok) {
            next.trials = tenants.filter((row) => row.subscriptionStatus === "trialing").length;
            next.creditCents = Number(body.creditSpendCents ?? 0);
            next.credits = CREDIT_CENTS > 0 ? Math.round(next.creditCents / CREDIT_CENTS) : 0;
          }
        }
        if (!telemetryRes.ok && !tenantsRes.ok) {
          next.note = "The desk session did not return telemetry. Counts stay at zero so a $1 trial cannot show a fake profit.";
        }
        if (!cancelled) setNumbers(next);
      } catch {
        if (!cancelled) {
          setNumbers({ ...EMPTY, note: "The desk is offline. Counts stay at zero." });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const margin = exposureOf(numbers);
  const blocked = Boolean(numbers.sessionError);

  return (
    <div className="relative min-h-dvh bg-[#050507] text-white">
      <AxiomSpaceOrbitCanvas anchor={null} />
      <div className="relative z-10 mx-auto flex min-h-dvh max-w-[1400px]">
        <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-white/[0.03] px-4 py-6 md:block">
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#00ffcc]">Axiom</p>
          <p className="mt-1 font-mono text-xs text-white/50">Master desk</p>
          <nav className="mt-8 grid gap-1" aria-label="Master sections">
            {NAV.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSection(item.id)}
                className={`rounded-lg px-3 py-2 text-left font-mono text-[11px] uppercase tracking-[0.14em] ${
                  section === item.id ? "bg-[#00ffcc]/10 text-[#00ffcc]" : "text-white/55 hover:bg-white/5 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6 pb-28 sm:px-8">
          <div className="mb-6 flex gap-2 overflow-x-auto md:hidden">
            {NAV.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSection(item.id)}
                className={`shrink-0 rounded-full border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] ${
                  section === item.id ? "border-[#00ffcc] text-[#00ffcc]" : "border-white/15 text-white/55"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <header className="mb-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#ffb020]">Live desk</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">{NAV.find((item) => item.id === section)?.label}</h1>
            {numbers.note ? <p className="mt-2 max-w-xl text-sm text-white/55">{numbers.note}</p> : null}
          </header>

          {section === "command" || section === "margin" ? (
            <>
              <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Metric label="Today's $1 trials" value={blocked ? "—" : String(numbers.trials)} detail={blocked ? "Waiting on the desk session" : money(margin.revenueCents)} />
                <Metric label="Net profit (post-API)" value={blocked ? "—" : money(margin.netCents)} detail="Trial dollars minus credit cost" />
                <Metric label="AI credit consumption" value={blocked ? "—" : String(numbers.credits)} detail={blocked ? "Waiting on the desk session" : `${money(margin.creditCents)} at ${money(CREDIT_CENTS)} each`} />
                <ActiveLeadsCard initialLeads={blocked ? null : numbers.leads} blocked={blocked} />
              </section>
              <MarginGuard margin={margin} blocked={blocked} />
              <MarginProtectionCard />
            </>
          ) : null}

          {section === "command" ? (
            <>
              <FieldDispatcher leads={numbers.leads} sweep={sweep} blocked={blocked} sessionError={numbers.sessionError} />
              <Panel title="Companion telemetry pulse">
                <p className="text-sm text-white/65">
                  Live hue:{" "}
                  <span className="font-mono uppercase tracking-[0.16em] text-[#00f2fe]">{telemetry.status}</span>
                  {telemetry.source ? (
                    <span className="text-white/45"> · {telemetry.source}</span>
                  ) : null}
                </p>
                <p className="mt-2 text-xs text-white/45">
                  Stripe trials light emerald. Twilio delivery failures go crimson. Window is the last 5 minutes.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(
                    [
                      { id: "good" as const, label: "Test Green Pulse", tone: "border-emerald-400/50 text-emerald-300" },
                      { id: "warning" as const, label: "Test Amber Pulse", tone: "border-amber-400/50 text-amber-300" },
                      { id: "alert" as const, label: "Test Red Pulse", tone: "border-[#ff2a3d]/55 text-[#ff6b7a]" },
                    ] as const
                  ).map((btn) => (
                    <button
                      key={btn.id}
                      type="button"
                      disabled={pulsing !== null || blocked}
                      onClick={() => {
                        setPulsing(btn.id);
                        setPulseNote("");
                        void telemetry
                          .pulseTest(btn.id)
                          .then(() => setPulseNote(`${btn.label} sent.`))
                          .catch((err) =>
                            setPulseNote(err instanceof Error ? err.message : "Pulse failed"),
                          )
                          .finally(() => setPulsing(null));
                      }}
                      className={`rounded-lg border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] disabled:opacity-40 ${btn.tone}`}
                    >
                      {pulsing === btn.id ? "Pulsing…" : btn.label}
                    </button>
                  ))}
                </div>
                {pulseNote ? <p className="mt-3 font-mono text-[11px] text-white/55">{pulseNote}</p> : null}
              </Panel>
            </>
          ) : null}

          {section === "studio" ? (
            <Panel title="Studio & branding">
              <p className="text-sm text-white/70">
                Logo workspace builds storefront loops. The 3D landing studio edits CRO copy, companion face,
                and particles — persisted to Supabase <span className="font-mono text-[#00ffcc]">app_settings</span> as{" "}
                <span className="font-mono text-white/80">axiom_landing:&lt;slug&gt;</span>.
              </p>
              <div className="mt-4 flex flex-wrap gap-4">
                <Link
                  href="/axiom-studio"
                  className="inline-flex min-h-11 items-center font-mono text-xs uppercase tracking-[0.16em] text-[#00ffcc]"
                >
                  Open logo studio
                </Link>
                <Link
                  href="/axiom/studio"
                  className="inline-flex min-h-11 items-center font-mono text-xs uppercase tracking-[0.16em] text-[#00ffcc]"
                >
                  Open 3D landing studio
                </Link>
                <Link
                  href="/axiom"
                  className="inline-flex min-h-11 items-center font-mono text-xs uppercase tracking-[0.16em] text-white/70"
                >
                  Preview /axiom
                </Link>
              </div>
            </Panel>
          ) : null}

          {section === "leads" ? (
            <Panel title="Autopilot leads">
              {numbers.states.length === 0 ? (
                <p className="text-sm text-white/60">No state breakdown yet. A dry sweep will not invent leads.</p>
              ) : (
                <ul className="grid gap-2">
                  {numbers.states.map((row) => (
                    <li key={row.state} className="flex items-center justify-between font-mono text-xs">
                      <span>{row.state}</span>
                      <span className="text-[#00ffcc]">{row.count}</span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-4 text-sm text-white/55">{sweep}</p>
            </Panel>
          ) : null}

          {section === "trials" ? (
            <Panel title="Stripe trials at $1">
              {numbers.tenants.filter((row) => row.subscriptionStatus === "trialing").length === 0 ? (
                <p className="text-sm text-white/60">No trialing shops on the desk response.</p>
              ) : (
                <ul className="grid gap-2">
                  {numbers.tenants
                    .filter((row) => row.subscriptionStatus === "trialing")
                    .map((row) => (
                      <li key={row.slug} className="flex items-center justify-between gap-3 text-sm">
                        <span>{row.name}</span>
                        <span className="font-mono text-[11px] text-white/50">{row.niche}</span>
                      </li>
                    ))}
                </ul>
              )}
            </Panel>
          ) : null}

          {section === "settings" ? (
            <Panel title="System settings">
              <p className="text-sm text-white/70">Outreach stays in simulation unless the server is set to live. This desk does not store keys in the browser.</p>
              <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.16em] text-[#ffb020]">Simulation lock on</p>
            </Panel>
          ) : null}
        </main>
      </div>
      <button
        type="button"
        onClick={() => router.push("/companion")}
        className={`fixed bottom-6 right-6 z-[66] sm:bottom-8 sm:right-8 ${AXIOM_COMPACT_FAB_CLASS}`}
        aria-label="Open Axiom companion"
      >
        ▶ Ask Axiom
      </button>
    </div>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">{label}</p>
      <p className="mt-3 font-mono text-2xl text-[#00ffcc]">{value}</p>
      <p className="mt-2 text-xs text-white/50">{detail}</p>
    </article>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
      <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/50">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function FieldDispatcher({ leads, sweep, blocked, sessionError }: { leads: number; sweep: string; blocked: boolean; sessionError: string }) {
  return (
    <section className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/50">Autonomous AI Field Dispatcher</h2>
        <span className="rounded-full border border-[#ffb020]/50 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[#ffb020]">
          Simulation
        </span>
      </div>
      <p className="mt-3 max-w-2xl text-sm text-white/70">
        Inbound SMS and new bookings wait here. The dispatcher keeps them on the desk and speaks through the assistant in the corner.
      </p>
      <p className="mt-3 font-mono text-[11px] text-white/45">
        {blocked ? sessionError : `${leads} inbound in the last day · ${sweep}`}
      </p>
    </section>
  );
}

function MarginGuard({ margin, blocked }: { margin: ReturnType<typeof exposureOf>; blocked: boolean }) {
  return (
    <section className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/50">Margin protection</h2>
          <p className="mt-2 text-sm text-white/70">Credit spend is capped by the $1 already collected. The bar is exposure divided by trial revenue.</p>
        </div>
        <span
          className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] ${
            blocked ? "border-[#ffb020]/60 text-[#ffb020]" : margin.covered ? "border-[#00ffcc]/50 text-[#00ffcc]" : "border-[#ff2a3d]/60 text-[#ff2a3d]"
          }`}
        >
          {blocked ? "Session required" : margin.covered ? "Zero negative balance" : "Exposure over trial cash"}
        </span>
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-[#00ffcc]" style={{ width: `${Math.round(margin.ratio * 100)}%` }} />
      </div>
      <p className="mt-3 font-mono text-[11px] text-white/45">
        {blocked ? "Credit exposure waits until the desk session answers." : `${money(margin.creditCents)} exposed · ${money(margin.revenueCents)} trial cash · net ${money(margin.netCents)}`}
      </p>
    </section>
  );
}

