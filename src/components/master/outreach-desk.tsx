"use client";

import { useCallback, useEffect, useState } from "react";
import type { DatasetBatchRow, DatasetLeadRecord } from "@/lib/axiom/outreach-desk";
import {
  fetchDatasetBatches,
  fetchInspectorLead,
  recreateInspectorHero,
  saveInspectorPhone,
  uploadInspectorImage,
} from "@/lib/axiom/outreach-desk-api";

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read that photograph."));
    reader.readAsDataURL(file);
  });
}

export function OutreachDesk() {
  const [batches, setBatches] = useState<DatasetBatchRow[]>([]);
  const [batchId, setBatchId] = useState("");
  const [lead, setLead] = useState<DatasetLeadRecord | null>(null);
  const [index, setIndex] = useState(0);
  const [total, setTotal] = useState(0);
  const [hasPhone, setHasPhone] = useState(false);
  const [hasDatasetImages, setHasDatasetImages] = useState(false);
  const [unverified, setUnverified] = useState(false);
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [open, setOpen] = useState(false);

  const loadBatches = useCallback(async () => {
    const next = await fetchDatasetBatches();
    setBatches(next);
    if (!batchId && next[0]) setBatchId(next[0].id);
  }, [batchId]);

  const loadLead = useCallback(
    async (nextIndex = index) => {
      const page = await fetchInspectorLead({
        batchId,
        index: nextIndex,
        hasPhone,
        hasDatasetImages,
        unverified,
      });
      setLead(page.lead);
      setIndex(page.index);
      setTotal(page.total);
      setPhone(page.lead?.contactPhone ?? "");
      if (page.batchId && !batchId) setBatchId(page.batchId);
    },
    [batchId, hasDatasetImages, hasPhone, index, unverified],
  );

  useEffect(() => {
    if (!open) return;
    void loadBatches().catch((err) => setNote(err instanceof Error ? err.message : "Inspector failed."));
  }, [open, loadBatches]);

  useEffect(() => {
    if (!open || !batchId) return;
    void loadLead(0).catch((err) => setNote(err instanceof Error ? err.message : "Inspector failed."));
  }, [open, batchId, hasPhone, hasDatasetImages, unverified]); // eslint-disable-line react-hooks/exhaustive-deps

  const images = lead ? [...lead.datasetImages, lead.heroImageUrl].filter(Boolean) : [];

  return (
    <section className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/50">Dataset Inspector</h2>
          <p className="mt-2 text-sm text-white/70">Step one lead at a time. Recreate the industrial-noir hero from the photograph on file.</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="rounded-lg border border-[#00ffcc]/40 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#00ffcc]"
        >
          {open ? "Close drawer" : "Open inspector"}
        </button>
      </div>

      {open ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="space-y-3">
            <label className="block text-xs text-white/60">
              Dataset / batch
              <select
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#050507] px-2 py-2 text-sm text-white"
                value={batchId}
                onChange={(event) => setBatchId(event.target.value)}
              >
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {(batch.source || "import") + " · " + (batch.county || "all") + " · " + (batch.tradeType || "trade") + " (" + batch.leadCount + ")"}
                  </option>
                ))}
              </select>
            </label>
            {(
              [
                ["Has Phone", hasPhone, setHasPhone],
                ["Has Dataset Images", hasDatasetImages, setHasDatasetImages],
                ["Unverified", unverified, setUnverified],
              ] as const
            ).map(([label, value, setValue]) => (
              <label key={label} className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-white/70">
                <input type="checkbox" checked={value} onChange={(event) => setValue(event.target.checked)} className="accent-[#00ffcc]" />
                {label}
              </label>
            ))}
            <div className="flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-lg border border-white/15 px-2 py-2 text-xs text-white disabled:opacity-40"
                disabled={index <= 0 || busy !== null}
                onClick={() => void loadLead(index - 1)}
              >
                Previous
              </button>
              <button
                type="button"
                className="flex-1 rounded-lg border border-white/15 px-2 py-2 text-xs text-white disabled:opacity-40"
                disabled={index + 1 >= total || busy !== null}
                onClick={() => void loadLead(index + 1)}
              >
                Next
              </button>
            </div>
            <p className="font-mono text-[11px] text-white/45">
              {total ? `${index + 1} / ${total}` : "No leads in this filter."}
            </p>
          </aside>

          {lead ? (
            <div className="space-y-4">
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <Field label="Exact name" value={lead.businessName} />
                <Field label="Trade" value={lead.tradeLabel || lead.tradeType} />
                <Field label="Street address" value={lead.streetAddress || [lead.city, lead.state, lead.zipCode].filter(Boolean).join(", ")} />
                <Field label="Website" value={lead.website || "—"} />
                <Field label="Visual" value={`${lead.visualMode} · ${lead.visualStatus}`} />
                <Field label="Slug" value={lead.leadSlug} />
              </dl>
              <label className="block text-sm text-white/70">
                Phone
                <span className="mt-1 flex gap-2">
                  <input
                    className="min-h-11 flex-1 rounded-lg border border-white/10 bg-[#050507] px-3 text-white"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                  />
                  <button
                    type="button"
                    disabled={busy !== null}
                    className="rounded-lg bg-[#00ffcc] px-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[#03140f]"
                    onClick={() => {
                      setBusy("phone");
                      void saveInspectorPhone(lead.id, phone)
                        .then((next) => {
                          setLead(next);
                          setNote("Phone saved.");
                        })
                        .catch((err) => setNote(err instanceof Error ? err.message : "Save failed"))
                        .finally(() => setBusy(null));
                    }}
                  >
                    Save
                  </button>
                </span>
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                {images.length ? (
                  images.map((src) => (
                    <figure key={src} className="overflow-hidden rounded-xl border border-[#00ffcc]/25 bg-[#050507]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" className="h-40 w-full object-cover" />
                      <figcaption className="flex items-center justify-between gap-2 p-2">
                        <span className="truncate font-mono text-[10px] text-white/45">{src}</span>
                        <button
                          type="button"
                          disabled={busy !== null}
                          className="shrink-0 rounded-md border border-[#FFE500]/40 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-[#FFE500]"
                          onClick={() => {
                            setBusy("hero");
                            void recreateInspectorHero(lead.id, src)
                              .then((next) => {
                                setLead(next);
                                setNote("Custom hero approved.");
                              })
                              .catch((err) => setNote(err instanceof Error ? err.message : "Hero failed"))
                              .finally(() => setBusy(null));
                          }}
                        >
                          Recreate Animated Hero
                        </button>
                      </figcaption>
                    </figure>
                  ))
                ) : (
                  <label className="grid min-h-40 place-items-center rounded-xl border border-dashed border-white/20 bg-[#050507] text-center text-xs text-white/55">
                    Drop a shop or truck photograph
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        setBusy("upload");
                        void readFileAsDataUrl(file)
                          .then((url) => uploadInspectorImage(lead.id, url))
                          .then((next) => {
                            setLead(next);
                            setNote("Photograph attached.");
                          })
                          .catch((err) => setNote(err instanceof Error ? err.message : "Upload failed"))
                          .finally(() => setBusy(null));
                      }}
                    />
                  </label>
                )}
              </div>
              {lead.heroVideoUrl ? (
                <p className="font-mono text-[11px] text-[#00ffcc]">Loop attached · {lead.heroVideoUrl}</p>
              ) : null}
              {note ? <p className="text-sm text-white/60">{note}</p> : null}
            </div>
          ) : (
            <p className="text-sm text-white/55">Select a batch to inspect a lead.</p>
          )}
        </div>
      ) : null}
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/40">{label}</dt>
      <dd className="mt-1 text-white">{value || "—"}</dd>
    </div>
  );
}

export default OutreachDesk;
