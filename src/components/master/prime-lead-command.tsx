"use client";

import { useCallback, useEffect, useState } from "react";
import { COMMAND_NICHES, type CommandLeadFilter, type CommandLeadNiche } from "@/lib/axiom/lead-verification";
import type { DatasetLeadRecord } from "@/lib/axiom/outreach-desk";
import { claimMasterSession, fetchMasterSession } from "@/lib/axiom/master-session-client";
import { beginMasterSessionClaimOnce, captureMasterUrlKeyOnce } from "@/lib/axiom/master-session-url";
import {
  compileMasterHero,
  fetchCommandLeads,
  pullPrimeConversionBatch,
  saveLeadIdentityFields,
  saveLeadQa,
  verifyMasterLead,
  verifyMasterLeadBatch,
} from "@/lib/axiom/outreach-desk-api";
import { PRIME_BATCH_PULL_DEFAULT } from "@/lib/axiom/prime-conversion";

const FILTERS: { id: CommandLeadFilter; label: string }[] = [
  { id: "prime_candidates", label: "Prime Candidates" },
  { id: "prime", label: "Prime Ready (75+)" },
  { id: "all", label: "All Leads" },
  { id: "needs_hero", label: "Needs Hero Fix" },
  { id: "needs_phone", label: "Needs Phone/Name Check" },
];

function lineLabel(lead: DatasetLeadRecord): string {
  const line = String(lead.lineType ?? "unknown").toLowerCase();
  if (line === "mobile" || line === "nonfixedvoip") return "MOBILE";
  if (line === "landline" || line === "fixedvoip") return "LANDLINE";
  return "UNCHECKED";
}

function scoreTone(score: number): string {
  if (score >= 75) return "border-[#00ffcc]/50 text-[#00ffcc]";
  if (score >= 40) return "border-[#FFE500]/50 text-[#FFE500]";
  return "border-white/20 text-white/55";
}

export function PrimeLeadCommand({ sessionAttached }: { sessionAttached?: boolean }) {
  const [filter, setFilter] = useState<CommandLeadFilter>("prime_candidates");
  const [niche, setNiche] = useState<CommandLeadNiche>("plumbing");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [leads, setLeads] = useState<DatasetLeadRecord[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [pullCount, setPullCount] = useState(PRIME_BATCH_PULL_DEFAULT);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [attached, setAttached] = useState(sessionAttached === true);
  const [configured, setConfigured] = useState(false);
  const [keyDraft, setKeyDraft] = useState("");

  const load = useCallback(async () => {
    const rows = await fetchCommandLeads(filter, 40, { niche, search: query });
    setLeads(rows);
    setSelected((ids) => ids.filter((id) => rows.some((row) => row.id === id)));
  }, [filter, niche, query]);

  useEffect(() => {
    if (sessionAttached === true) {
      setAttached(true);
      return;
    }
    if (sessionAttached === false) {
      setAttached(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const urlKey = captureMasterUrlKeyOnce();
        if (urlKey.length >= 16 && beginMasterSessionClaimOnce()) {
          await claimMasterSession(urlKey);
        }
        const session = await fetchMasterSession();
        setConfigured(session.configured);
        if (cancelled) return;
        setAttached(session.attached);
      } catch (err) {
        if (!cancelled) setNote(err instanceof Error ? err.message : "Desk failed.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionAttached]);

  useEffect(() => {
    if (!attached) return;
    void load().catch((err) => setNote(err instanceof Error ? err.message : "Desk failed."));
  }, [attached, load]);

  const patch = (id: string, next: DatasetLeadRecord) => {
    setLeads((rows) => rows.map((row) => (row.id === id ? { ...row, ...next } : row)));
  };

  const run = (key: string, work: () => Promise<void>) => {
    setBusy(key);
    setNote("");
    void work()
      .catch((err) => setNote(err instanceof Error ? err.message : "Action failed."))
      .finally(() => setBusy(null));
  };

  return (
    <section className="rounded-2xl border border-[#00ffcc]/25 bg-[#050507] p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#00ffcc]">Prime conversion · hero candidates</h2>
          <p className="mt-2 max-w-2xl text-sm text-white/65">
            Score <span className="font-mono text-white/80">preloaded_leads</span> by phone, web/image, booking gap, reviews, and 24/7 demand. Pull the top fit for Hero Studio recreation or an approved niche fallback loop, then queue outreach under daily caps.
          </p>
        </div>
        <button
          type="button"
          disabled={busy !== null || !attached || leads.length === 0}
          className="rounded-lg border border-[#FFE500]/50 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#FFE500] disabled:opacity-40"
          onClick={() =>
            run("batch", async () => {
              const ids = leads.slice(0, 25).map((lead) => lead.id);
              const next = await verifyMasterLeadBatch(ids);
              setLeads(next.length ? next : leads);
              setNote(`Verified ${next.length || ids.length} lead${ids.length === 1 ? "" : "s"} (simulation if Twilio is unset).`);
            })
          }
        >
          {busy === "batch" ? "Verifying…" : "Batch Verify Top 25"}
        </button>
      </div>

      {!attached && sessionAttached === undefined ? (
        <form
          className="mt-4 grid gap-3 rounded-xl border border-[#FFE500]/30 bg-[#050507] p-4 sm:grid-cols-[1fr_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            run("session", async () => {
              await claimMasterSession(keyDraft);
              setAttached(true);
              setConfigured(true);
              setKeyDraft("");
              await load();
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
            disabled={busy !== null || keyDraft.trim().length < 16}
            className="self-end rounded-lg border border-[#00ffcc]/50 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#00ffcc] disabled:opacity-40"
          >
            Attach desk
          </button>
          <p className="sm:col-span-2 text-xs text-white/50">
            {configured
              ? "Bypass is configured. Attach it here to load Stedfast, Grants Pass Electric, and the plumbing queue."
              : "No bypass key in env yet. Sign in with a platform owner session, or set MASTER_ADMIN_BYPASS_KEY and attach it here."}
          </p>
        </form>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {COMMAND_NICHES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setNiche(item.id)}
            className={`rounded-full border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] ${
              niche === item.id ? "border-[#FFE500] text-[#FFE500]" : "border-white/15 text-white/50"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <form
        className="mt-3 flex flex-wrap gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          setQuery(search.trim());
        }}
      >
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search Stedfast, Grants Pass Electric, city, or phone"
          className="min-h-11 min-w-[220px] flex-1 rounded-md border border-white/15 bg-[#050507] px-3 text-sm text-white"
        />
        <button type="submit" className="rounded-lg border border-[#00ffcc]/40 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#00ffcc]">
          Search
        </button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={`rounded-full border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] ${
              filter === item.id ? "border-[#00ffcc] text-[#00ffcc]" : "border-white/15 text-white/50"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {attached ? (
        <div className="mt-4 flex flex-wrap items-end gap-2">
          <label className="grid gap-1">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">Top pull</span>
            <input
              type="number"
              min={1}
              max={25}
              value={pullCount}
              onChange={(event) => setPullCount(Number(event.target.value) || PRIME_BATCH_PULL_DEFAULT)}
              className="min-h-11 w-20 rounded-md border border-white/15 bg-[#050507] px-3 text-sm text-white"
            />
          </label>
          <button
            type="button"
            disabled={busy !== null}
            className="rounded-lg border border-[#00ffcc]/50 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#00ffcc] disabled:opacity-40"
            onClick={() =>
              run("pull", async () => {
                const rows = await fetchCommandLeads("prime_candidates", 80, { niche, search: query });
                const ids = rows.slice(0, Math.min(25, Math.max(1, pullCount))).map((lead) => lead.id);
                setLeads(rows);
                setSelected(ids);
                setFilter("prime_candidates");
                setNote(`Selected ${ids.length} prime candidate${ids.length === 1 ? "" : "s"} for ${niche}.`);
              })
            }
          >
            Pull top prime
          </button>
          <button
            type="button"
            disabled={busy !== null || selected.length === 0}
            className="rounded-lg border border-[#FFE500]/50 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#FFE500] disabled:opacity-40"
            onClick={() =>
              run("hero-batch", async () => {
                const result = await pullPrimeConversionBatch({
                  niche,
                  leadIds: selected,
                  compileHero: true,
                  assignFallback: true,
                  queueOutreach: false,
                });
                await load();
                setNote(
                  `Hero Studio: ${result.heroes.length} recreated · ${result.fallbacks.length} fallback loops${
                    result.errors.length ? ` · ${result.errors.length} failed` : ""
                  }.`,
                );
              })
            }
          >
            {busy === "hero-batch" ? "Compiling…" : "Send to Hero Studio"}
          </button>
          <button
            type="button"
            disabled={busy !== null || selected.length === 0}
            className="rounded-lg border border-white/20 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-white/80 disabled:opacity-40"
            onClick={() =>
              run("queue", async () => {
                const result = await pullPrimeConversionBatch({
                  niche,
                  leadIds: selected,
                  compileHero: false,
                  assignFallback: false,
                  queueOutreach: true,
                });
                setNote(
                  `Outreach queue (${result.mode}): ${result.queued} queued · ${result.skippedOutreach.length} held at cap.`,
                );
              })
            }
          >
            {busy === "queue" ? "Queuing…" : "Queue outreach"}
          </button>
        </div>
      ) : null}

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-[960px] w-full border-collapse text-left text-sm">
          <thead>
            <tr className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/40">
              <th className="pb-2 pr-3">
                <input
                  type="checkbox"
                  className="accent-[#00ffcc]"
                  checked={leads.length > 0 && selected.length === leads.length}
                  onChange={(event) => setSelected(event.target.checked ? leads.map((lead) => lead.id) : [])}
                  aria-label="Select all visible leads"
                />
              </th>
              <th className="pb-2 pr-3">Business</th>
              <th className="pb-2 pr-3">City</th>
              <th className="pb-2 pr-3">Phone</th>
              <th className="pb-2 pr-3">Line & name</th>
              <th className="pb-2 pr-3">Hero</th>
              <th className="pb-2">Prime / QA</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-t border-white/10 align-top">
                <td className="py-3 pr-3">
                  <input
                    type="checkbox"
                    className="accent-[#00ffcc]"
                    checked={selected.includes(lead.id)}
                    onChange={(event) =>
                      setSelected((ids) =>
                        event.target.checked ? [...ids, lead.id] : ids.filter((id) => id !== lead.id),
                      )
                    }
                    aria-label={`Select ${lead.businessName}`}
                  />
                </td>
                <td className="py-3 pr-3">
                  <InlineField
                    value={lead.businessName}
                    disabled={busy !== null}
                    onSave={(businessName) =>
                      run(`name-${lead.id}`, async () => patch(lead.id, await saveLeadIdentityFields(lead.id, { businessName })))
                    }
                  />
                </td>
                <td className="py-3 pr-3">
                  <InlineField
                    value={lead.city}
                    disabled={busy !== null}
                    onSave={(city) => run(`city-${lead.id}`, async () => patch(lead.id, await saveLeadIdentityFields(lead.id, { city })))}
                  />
                </td>
                <td className="py-3 pr-3">
                  <InlineField
                    value={lead.contactPhone}
                    disabled={busy !== null}
                    onSave={(phone) => run(`phone-${lead.id}`, async () => patch(lead.id, await saveLeadIdentityFields(lead.id, { phone })))}
                  />
                </td>
                <td className="py-3 pr-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-[#00ffcc]/35 px-2 py-0.5 font-mono text-[9px] tracking-[0.12em] text-[#00ffcc]">
                      {lineLabel(lead)}
                    </span>
                    <span className="text-xs text-white/70">{lead.verifiedCallerName || "No caller name"}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy !== null}
                      className="rounded-md border border-white/15 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-white/70"
                      onClick={() => run(`verify-${lead.id}`, async () => patch(lead.id, await verifyMasterLead(lead.id)))}
                    >
                      Verify Now
                    </button>
                    <button
                      type="button"
                      disabled={busy !== null || !lead.verifiedCallerName}
                      className="rounded-md border border-[#FFE500]/40 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-[#FFE500] disabled:opacity-40"
                      onClick={() =>
                        run(`caller-${lead.id}`, async () => patch(lead.id, await verifyMasterLead(lead.id, { useCallerName: true })))
                      }
                    >
                      Use Caller Name
                    </button>
                  </div>
                </td>
                <td className="py-3 pr-3">
                  <div className="flex items-center gap-2">
                    {lead.heroImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={lead.heroImageUrl} alt="" className="h-10 w-16 rounded object-cover" />
                    ) : (
                      <span className="grid h-10 w-16 place-items-center rounded border border-white/10 font-mono text-[9px] text-white/35">
                        none
                      </span>
                    )}
                    <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/55">
                      {lead.heroImageStatus || "unchecked"}
                      {lead.heroImageWidth ? ` · ${lead.heroImageWidth}px` : ""}
                    </span>
                  </div>
                  {lead.heroImageStatus === "missing" || lead.heroImageStatus === "low_res" || !lead.heroImageUrl ? (
                    <button
                      type="button"
                      disabled={busy !== null}
                      className="mt-2 rounded-md border border-[#FFE500]/40 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-[#FFE500]"
                      onClick={() =>
                        run(`hero-${lead.id}`, async () =>
                          patch(
                            lead.id,
                            await compileMasterHero(lead.id, lead.heroImageUrl || lead.datasetImages?.[0], {
                              shopName: lead.businessName,
                              city: lead.city,
                              niche: lead.tradeType,
                            }),
                          ),
                        )
                      }
                    >
                      Recreate Hero
                    </button>
                  ) : null}
                </td>
                <td className="py-3">
                  <div className={`inline-flex rounded-full border px-2 py-0.5 font-mono text-[10px] ${scoreTone(Number(lead.primeScore ?? 0))}`}>
                    {Number(lead.primeScore ?? 0)}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(lead.primeReasons ?? []).map((reason) => (
                      <span
                        key={reason}
                        className="rounded-full border border-[#00ffcc]/25 px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.08em] text-[#00ffcc]/90"
                      >
                        {reason}
                      </span>
                    ))}
                  </div>
                  <label className="mt-2 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.12em] text-white/60">
                    <input
                      type="checkbox"
                      className="accent-[#00ffcc]"
                      checked={Boolean(lead.qaApproved)}
                      disabled={busy !== null}
                      onChange={(event) =>
                        run(`qa-${lead.id}`, async () => patch(lead.id, await saveLeadQa(lead.id, event.target.checked)))
                      }
                    />
                    Approve & Queue ($0 Card)
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {attached && leads.length === 0 ? (
          <p className="py-6 text-sm text-white/50">No leads in this filter. Search Stedfast or Grants Pass Electric, or switch niche.</p>
        ) : null}
      </div>
      {note ? <p className="mt-3 font-mono text-[11px] text-white/55">{note}</p> : null}
    </section>
  );
}

function InlineField({
  value,
  disabled,
  onSave,
}: {
  value: string;
  disabled: boolean;
  onSave: (next: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <input
      className="min-h-10 w-full rounded-md border border-white/10 bg-[#050507] px-2 text-sm text-white"
      value={draft}
      disabled={disabled}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => {
        if (draft.trim() && draft.trim() !== value) onSave(draft.trim());
      }}
    />
  );
}
