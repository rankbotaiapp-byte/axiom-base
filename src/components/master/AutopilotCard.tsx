import { useState, type ReactNode } from "react";
import { Mail, Radar, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

type Proposal = {
  mode: "simulation" | "live";
  totalLeads: number;
  dailySent: number;
  remainingQueue: number;
  county: string;
  tradeType: string;
  tradeLabel: string;
  emailCount: number;
  smsCount: number;
  summary: string;
  queued?: number;
};

function count(value: number): string {
  return value.toLocaleString("en-US");
}

export function AutopilotCard({
  mode,
  onDispatched,
}: {
  mode: "simulation" | "live";
  onDispatched?: () => void;
}) {
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [busy, setBusy] = useState<"read" | "dispatch" | null>(null);
  const [approved, setApproved] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const simulation = (proposal?.mode ?? mode) !== "live";
  const ready = proposal != null && proposal.emailCount + proposal.smsCount > 0 && !approved;

  async function engage() {
    setBusy("read");
    setError(null);
    setNote(null);
    setApproved(false);
    try {
      const response = await fetch("/api/master/autopilot", { credentials: "same-origin" });
      const body = (await response.json()) as Proposal & { error?: string };
      if (!response.ok) throw new Error(body.error || "Autopilot could not read the desk");
      setProposal(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Autopilot could not read the desk");
    } finally {
      setBusy(null);
    }
  }

  async function approve() {
    if (!ready) return;
    setBusy("dispatch");
    setError(null);
    try {
      const response = await fetch("/api/master/autopilot", { method: "POST", credentials: "same-origin" });
      const body = (await response.json()) as Proposal & { error?: string };
      if (!response.ok) throw new Error(body.error || "The batch stayed on the desk");
      setProposal(body);
      setApproved(true);
      const queued = body.queued ?? body.emailCount + body.smsCount;
      setNote(
        body.mode === "live"
          ? `Queued ${count(queued)} leads. The outreach worker releases them on its timer.`
          : `Queued ${count(queued)} leads in simulation. No email or SMS was sent.`,
      );
      onDispatched?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "The batch stayed on the desk");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="autopilot-card mt-10 rounded-2xl bg-surface px-5 py-5 text-fg">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Radar className="size-5 text-accent" aria-hidden />
          <p className="text-xs uppercase tracking-[0.22em] text-muted">Axiom Autopilot</p>
        </div>
        <p className="rounded-full bg-surface-2 px-3 py-1 text-xs uppercase tracking-[0.16em] text-muted">
          {simulation ? "Simulation" : "Live"}
        </p>
      </div>
      <h2 className="mt-3 font-display text-3xl leading-none">Next local batch</h2>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
        {simulation
          ? "Outreach is in simulation. One approval writes the queue and does not contact anyone."
          : "Outreach is live. One approval waits on the existing send timer."}
      </p>

      {proposal ? (
        <>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <Metric label="Leads" value={count(proposal.totalLeads)} />
            <Metric label="Sent today" value={count(proposal.dailySent)} />
            <Metric label="Unclaimed" value={count(proposal.remainingQueue)} />
          </div>
          <div className="mt-4 rounded-xl bg-surface-2 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.16em] text-muted">Batch proposal</p>
            {proposal.county ? (
              <p className="mt-2 font-display text-2xl leading-none">
                {proposal.county}
                <span className="text-muted"> · {proposal.tradeLabel}</span>
              </p>
            ) : (
              <p className="mt-2 text-sm text-muted">No local batch is ready.</p>
            )}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Split icon={<Mail className="size-4" aria-hidden />} label="Email" value={proposal.emailCount} />
              <Split icon={<Smartphone className="size-4" aria-hidden />} label="SMS" value={proposal.smsCount} />
            </div>
            <p className="mt-4 text-sm leading-relaxed">{proposal.summary}</p>
          </div>
        </>
      ) : null}

      {note ? <p className="mt-4 text-sm text-ok">{note}</p> : null}
      {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Button type="button" variant="secondary" disabled={busy !== null} onClick={() => void engage()}>
          {busy === "read" ? "Reading the desk" : "Engage Autopilot"}
        </Button>
        {proposal && !approved ? (
          <Button type="button" variant="accent" size="lg" className="sm:min-w-56" disabled={!ready || busy !== null} onClick={() => void approve()}>
            {busy === "dispatch" ? "Queuing" : "Approve & Dispatch"}
          </Button>
        ) : null}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-surface-2 px-3 py-3">
      <p className="text-xs uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="mt-1 truncate font-display text-xl leading-none tabular sm:text-2xl">{value}</p>
    </div>
  );
}

function Split({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-surface px-3 py-3">
      <span className="flex items-center gap-2 text-sm text-muted">
        {icon}
        {label}
      </span>
      <span className="font-display text-2xl leading-none tabular">{count(value)}</span>
    </div>
  );
}
