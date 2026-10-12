import { useEffect, useState } from "react";
import { listTenantLeads, scanTenantProspects, sendTenantOutreach, type TenantLead } from "@/lib/axiom/tenant-leads";
import { Button } from "@/components/ui/button";

export function ProspectScan({
  slug,
  city,
  disabled,
}: {
  slug: string;
  city: string;
  disabled: boolean;
}) {
  const [leads, setLeads] = useState<TenantLead[]>([]);
  const [added, setAdded] = useState<number | null>(null);
  const [sent, setSent] = useState<number | null>(null);
  const [waiting, setWaiting] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"scan" | "send" | null>(null);

  useEffect(() => {
    let cancelled = false;
    void listTenantLeads({ data: slug })
      .then((result) => {
        if (!cancelled) setLeads(result.leads);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <section className="rounded-[24px] bg-surface p-5 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]">
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Today in {city || "your city"}</p>
      <h3 className="mt-1 font-display text-3xl">Prospects</h3>
      <p className="mt-2 text-sm text-muted">Scan pulls today's names for this trade and city into your queue.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={disabled || busy !== null || !city}
          onClick={() => {
            setBusy("scan");
            setError(null);
            void scanTenantProspects({ data: slug })
              .then((result) => {
                setLeads(result.leads);
                setAdded(result.added);
              })
              .catch((err: unknown) => setError(err instanceof Error ? err.message : "The scan did not finish"))
              .finally(() => setBusy(null));
          }}
        >
          {busy === "scan" ? "Scanning" : "Scan"}
        </Button>
        <Button
          type="button"
          disabled={disabled || busy !== null}
          onClick={() => {
            setBusy("send");
            setError(null);
            void sendTenantOutreach({ data: slug })
              .then((result) => {
                setLeads(result.leads);
                setSent(result.sent);
                setWaiting(result.waiting);
              })
              .catch((err: unknown) => setError(err instanceof Error ? err.message : "The campaign did not send"))
              .finally(() => setBusy(null));
          }}
        >
          {busy === "send" ? "Sending" : "Send Today's Outreach Campaign"}
        </Button>
      </div>
      {added !== null ? (
        <p className="mt-3 text-sm text-muted">
          {added === 0 ? "No new prospects for today." : `${added} added to the queue.`}
        </p>
      ) : null}
      {sent !== null ? (
        <p className="mt-3 text-sm text-muted">
          {sent === 0 && waiting === 0
            ? "No new leads to contact."
            : sent === 0
              ? `${waiting} still waiting.`
              : `${sent} sent. They are marked contacted.${waiting > 0 ? ` ${waiting} still waiting.` : ""}`}
        </p>
      ) : null}
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      {leads.length === 0 ? (
        <p className="mt-4 text-sm text-faint">The queue is empty.</p>
      ) : (
        <ul className="mt-4 grid gap-2">
          {leads.map((lead) => (
            <li key={lead.id} className="rounded-2xl bg-bg px-4 py-3">
              <p className="text-sm font-medium">{lead.consumerName}</p>
              <p className="text-sm text-muted">
                {lead.consumerContact}
                {lead.status === "contacted" ? " · Contacted" : " · New"}
              </p>
              {lead.note ? <p className="mt-1 text-sm text-faint">{lead.note}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
