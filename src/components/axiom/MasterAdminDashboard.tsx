"use client";

import { useCallback, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ActiveLeadsCard } from "@/components/axiom/cards/ActiveLeadsCard";
import { MarginProtectionCard } from "@/components/axiom/cards/MarginProtectionCard";
import { AxiomSpaceOrbitCanvas } from "@/components/axiom/AxiomSpaceOrbitCanvas";
import { AXIOM_COMPACT_FAB_CLASS } from "@/components/AxiomChatDrawer";
import { AxiomTelemetryProvider, useAxiomTelemetry } from "@/context/AxiomTelemetryContext";
import { useMasterSessionClaim } from "@/hooks/use-master-session-claim";
import { masterDeskError, masterDeskFetch } from "@/lib/axiom/master-desk-client";
import { claimMasterSession, fetchMasterSession } from "@/lib/axiom/master-session-client";
import { OutreachDesk } from "@/components/master/outreach-desk";
import { PrimeLeadCommand } from "@/components/master/prime-lead-command";
import { GrowthTreasuryCard } from "@/components/master/GrowthTreasuryCard";
import { AutopilotApprovalQueue } from "@/components/master/AutopilotApprovalQueue";

const CREDIT_CENTS = 4;

const NAV = [
  { id: "command", label: "Command Center" },
  { id: "queue", label: "Action Queue" },
  { id: "studio", label: "Studio & Branding" },
  { id: "leads", label: "Autopilot Leads" },
  { id: "trials", label: "Stripe Trials ($1)" },
  { id: "margin", label: "Margin Protection" },
  { id: "growth", label: "Growth & Treasury" },
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

type DeskPhase = "loading" | "need-key" | "attached" | "denied" | "offline";

const EMPTY: DeskNumbers = {
  trials: 0,
  leads: 0,
  credits: 0,
  creditCents: 0,
  states: [],
  tenants: [],
  note: "",
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
  const [phase, setPhase] = useState<DeskPhase>("need-key");
  const [numbers, setNumbers] = useState<DeskNumbers>(EMPTY);
  const [configured, setConfigured] = useState(false);
  const [keyDraft, setKeyDraft] = useState("");
  const [attachBusy, setAttachBusy] = useState(false);
  const [pulseNote, setPulseNote] = useState("");
  const [pulsing, setPulsing] = useState<"good" | "warning" | "alert" | null>(null);
  const sweep = "Standing by. A sweep stays a dry run unless outreach is live.";

  const loadDesk = useCallback(async (claimKey?: string) => {
    const urlKey = claimKey?.trim() ?? "";
    if (urlKey.length >= 16) setPhase("loading");
    try {
      if (urlKey.length >= 16) {
        const claimed = await claimMasterSession(urlKey);
        setConfigured(claimed.configured);
      } else {
        const session = await fetchMasterSession();
        setConfigured(session.configured);
        if (!session.attached) {
          setPhase("need-key");
          setNumbers({
            ...EMPTY,
            note: session.configured
              ? "Attach MASTER_ADMIN_BYPASS_KEY (or ?key=) so the desk can load live counts."
              : "No bypass key in env yet. Sign in as a platform owner, or set MASTER_ADMIN_BYPASS_KEY.",
          });
          return;
        }
      }

      const [telemetryRes, tenantsRes] = await Promise.all([
        masterDeskFetch("/api/master/telemetry"),
        masterDeskFetch("/api/master/tenants"),
      ]);
      const denied = [telemetryRes, tenantsRes].find((res) => res.status === 401 || res.status === 403);
      if (denied) {
        const message = await masterDeskError(denied);
        setPhase(denied.status === 401 ? "need-key" : "denied");
        setNumbers({ ...EMPTY, note: message, sessionError: message });
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
        setPhase("offline");
        setNumbers({
          ...EMPTY,
          note: "The desk session did not return telemetry. Counts stay blank so a $1 trial cannot show a fake profit.",
          sessionError: "Telemetry unavailable",
        });
        return;
      }
      setPhase("attached");
      setNumbers(next);
    } catch (err) {
      const message = err instanceof Error ? err.message : "The desk is offline.";
      setPhase("need-key");
      setNumbers({
        ...EMPTY,
        note: message,
        sessionError: message,
      });
    }
  }, []);

  useMasterSessionClaim(loadDesk);

  const margin = exposureOf(numbers);
  const live = phase === "attached";
  const blocked = !live;

  return (
    <div className="axiom-master-desk relative min-h-dvh bg-[#050507] text-white">
      <AxiomSpaceOrbitCanvas anchor={null} />
      <div className="relative z-10 mx-auto min-h-dvh max-w-[1400px] px-4 py-6 pb-28 sm:px-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#00ffcc]">Axiom</p>
        <p className="mt-1 font-mono text-xs text-white/50">Master desk</p>
        <nav className="axiom-master-nav mt-6" aria-label="Master sections">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              className={`shrink-0 rounded-full border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] sm:text-[11px] ${
                section === item.id ? "border-[#00ffcc] bg-[#00ffcc]/10 text-[#00ffcc]" : "border-white/15 text-white/55 hover:bg-white/5 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <main className="min-w-0">
          <header className="mb-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#ffb020]">
              {phase === "attached" ? "Live desk" : phase === "loading" ? "Attaching session" : "Session required"}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">{NAV.find((item) => item.id === section)?.label}</h1>
            {numbers.note ? <p className="mt-2 max-w-xl text-sm text-white/55">{numbers.note}</p> : null}
          </header>

          {phase !== "attached" ? (
            <form
              className="mb-6 grid gap-3 rounded-2xl border border-[#FFE500]/30 bg-white/[0.04] p-4 sm:grid-cols-[1fr_auto]"
              onSubmit={(event) => {
                event.preventDefault();
                const key = keyDraft.trim();
                if (key.length < 16) return;
                setAttachBusy(true);
                void loadDesk(key)
                  .catch(() => undefined)
                  .finally(() => {
                    setAttachBusy(false);
                    setKeyDraft("");
                  });
              }}
            >
              <label className="grid gap-1">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#FFE500]">Master session</span>
                <input
                  type="password"
                  minLength={16}
                  value={keyDraft}
                  onChange={(event) => setKeyDraft(event.target.value)}
                  placeholder={configured ? "MASTER_ADMIN_BYPASS_KEY" : "Owner key (16+ characters)"}
                  className="min-h-11 rounded-md border border-white/15 bg-[#050507] px-3 text-sm text-white"
                />
              </label>
              <button
                type="submit"
                disabled={attachBusy || keyDraft.trim().length < 16}
                className="self-end rounded-lg border border-[#00ffcc]/50 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#00ffcc] disabled:opacity-40"
              >
                {attachBusy ? "Attaching…" : "Attach desk"}
              </button>
            </form>
          ) : null}

          {section === "command" || section === "queue" || section === "growth" ? (
            <AutopilotApprovalQueue attached={live} />
          ) : null}

          {section === "command" || section === "margin" ? (
            <>
              <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Metric label="Today's $1 trials" value={live ? String(numbers.trials) : "—"} detail={live ? money(margin.revenueCents) : "Waiting on the desk session"} />
                <Metric label="Net profit (post-API)" value={live ? money(margin.netCents) : "—"} detail="Trial dollars minus credit cost" />
                <Metric label="AI credit consumption" value={live ? String(numbers.credits) : "—"} detail={live ? `${money(margin.creditCents)} at ${money(CREDIT_CENTS)} each` : "Waiting on the desk session"} />
                <ActiveLeadsCard initialLeads={live ? numbers.leads : null} blocked={blocked} />
              </section>
              <MarginGuard margin={margin} blocked={blocked} />
              <MarginProtectionCard />
              <GrowthTreasuryCard attached={live} />
            </>
          ) : null}

          {section === "growth" ? <GrowthTreasuryCard attached={live} /> : null}

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
                This desk is internal. Client shops do not get companion-face customizers or AI generation studios.
                They upload a hero clip and proof-of-work photos from <span className="font-mono text-white/80">/[slug]/admin</span>.
              </p>
              <p className="mt-3 text-sm text-white/55">
                Assigned default heroes stay on the storefront until the owner uploads a replacement or resets the slot.
              </p>
            </Panel>
          ) : null}

          {section === "leads" ? (
            <>
              <PrimeLeadCommand sessionAttached={live} />
              <OutreachDesk />
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
            </>
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
        {blocked ? sessionError || "Waiting on the desk session" : `${leads} inbound in the last day · ${sweep}`}
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

