"use client";

import { useCallback, useEffect, useState } from "react";
import { masterDeskFetch } from "@/lib/axiom/master-desk-client";

type Proposal = {
  id: string;
  category: string;
  status: string;
  title: string;
  summary: string;
  evidence: Record<string, unknown>;
  proposedPayload: Record<string, unknown>;
  estimatedCostCents: number;
  riskLevel: string;
  sandboxChecks: { tsc: boolean; unitTests: boolean; verifyE2e: boolean };
  sandboxChecksPassed: boolean;
  expiresAt: string;
  rejectionReason?: string;
  executionResult?: Record<string, unknown>;
  decidedAt?: string | null;
  executedAt?: string | null;
};

type Shot = { pending: Proposal[]; audit: Proposal[]; connectFeeBps: number };

function money(cents: number): string {
  return `$${(Math.max(0, cents) / 100).toFixed(2)}`;
}

function Check({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`font-mono text-[10px] uppercase tracking-[0.12em] ${ok ? "text-[#00ffcc]" : "text-[#ff2a3d]"}`}>
      {ok ? "pass" : "fail"} {label}
    </span>
  );
}

export function AutopilotApprovalQueue({ attached }: { attached: boolean }) {
  const [shot, setShot] = useState<Shot | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [reason, setReason] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    if (!attached) return;
    const res = await masterDeskFetch("/api/master/proposals");
    if (!res.ok) {
      setNote(`Queue ${res.status}`);
      return;
    }
    setShot((await res.json()) as Shot);
    setNote("");
  }, [attached]);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 15_000);
    return () => window.clearInterval(id);
  }, [load]);

  async function decide(id: string, action: "approve" | "disapprove") {
    setBusy(`${action}:${id}`);
    const res = await masterDeskFetch("/api/master/proposals", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, action, reason: reason[id] || "" }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setNote(body.error || `Decision ${res.status}`);
    } else {
      setShot((await res.json()) as Shot);
      setNote("");
    }
    setBusy(null);
  }

  return (
    <section className="mt-4 rounded-2xl border border-[#FFE500]/35 bg-white/[0.04] p-5 backdrop-blur-xl">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#FFE500]">Autopilot action queue</p>
      <h2 className="mt-1 text-xl font-semibold tracking-tight">Approve or disapprove before anything consequential runs</h2>
      <p className="mt-2 max-w-3xl text-sm text-white/60">
        Diagnostics and Voice AI → missed-call 1/2 SMS stay automatic. Code, spend increases, and public/outbound launches wait for a one-tap decision. Silence expires a card — it never auto-approves. Connect fee stays 1.5%.
      </p>
      {!attached ? (
        <p className="mt-4 text-sm text-white/50">Attach the master session to load the queue.</p>
      ) : (
        <>
          {(shot?.pending || []).length === 0 ? (
            <p className="mt-4 font-mono text-xs text-white/45">No pending proposals. Autopilot is holding for your next instruction.</p>
          ) : (
            <ul className="mt-4 grid gap-4">
              {(shot?.pending || []).map((item) => (
                <li key={item.id} className="rounded-xl border border-[#00f2fe]/25 bg-[#050507]/70 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#00f2fe]">
                        {item.category.replaceAll("_", " ")} · {item.riskLevel} risk · {money(item.estimatedCostCents)} exposure
                      </p>
                      <h3 className="mt-1 text-lg font-semibold">{item.title}</h3>
                    </div>
                    <p className="font-mono text-[10px] text-white/40">expires {String(item.expiresAt).slice(0, 16)}</p>
                  </div>
                  <p className="mt-2 text-sm text-white/70">{item.summary}</p>
                  <pre className="mt-3 max-h-40 overflow-auto rounded-lg border border-white/10 bg-black/40 p-3 font-mono text-[11px] text-[#00ffcc]/90">
                    {JSON.stringify(item.proposedPayload, null, 2)}
                  </pre>
                  <pre className="mt-2 max-h-28 overflow-auto rounded-lg border border-white/10 bg-black/30 p-3 font-mono text-[11px] text-white/55">
                    evidence {JSON.stringify(item.evidence)}
                  </pre>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <Check ok={item.sandboxChecks.tsc} label="tsc" />
                    <Check ok={item.sandboxChecks.unitTests} label="unit" />
                    <Check ok={item.sandboxChecks.verifyE2e} label="verify:e2e" />
                  </div>
                  <label className="mt-3 block">
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">Disapprove reason (optional)</span>
                    <input
                      value={reason[item.id] || ""}
                      onChange={(event) => setReason((prev) => ({ ...prev, [item.id]: event.target.value }))}
                      className="mt-1 min-h-11 w-full rounded-md border border-white/15 bg-[#050507] px-3 text-sm text-white"
                      placeholder="Off-brand, wrong market, too expensive…"
                    />
                  </label>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => void decide(item.id, "approve")}
                      className="min-h-12 min-w-[9.5rem] rounded-lg border border-[#00ffcc] bg-[#00ffcc]/15 px-5 font-mono text-xs uppercase tracking-[0.18em] text-[#00ffcc] disabled:opacity-40"
                    >
                      {busy === `approve:${item.id}` ? "Executing…" : "Approve"}
                    </button>
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => void decide(item.id, "disapprove")}
                      className="min-h-12 min-w-[9.5rem] rounded-lg border border-[#ff2a3d] bg-[#ff2a3d]/15 px-5 font-mono text-xs uppercase tracking-[0.18em] text-[#ff6b7a] disabled:opacity-40"
                    >
                      {busy === `disapprove:${item.id}` ? "Cancelling…" : "Disapprove"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">Executed & rejected audit log</p>
            {(shot?.audit || []).length === 0 ? (
              <p className="mt-2 text-sm text-white/45">Empty. Decisions stay here immutably once you tap.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {(shot?.audit || []).map((item) => (
                  <li key={item.id} className="flex flex-wrap justify-between gap-2 border-b border-white/10 py-2 font-mono text-[11px] text-white/55">
                    <span>
                      {item.status} · {item.category} · {item.title}
                      {item.rejectionReason ? ` · ${item.rejectionReason}` : ""}
                    </span>
                    <span className="text-white/35">{String(item.executedAt || item.decidedAt || "").slice(0, 19)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {note ? <p className="mt-3 text-xs text-[#ffb020]">{note}</p> : null}
        </>
      )}
    </section>
  );
}
