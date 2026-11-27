"use client";

import { useEffect, useState } from "react";
import { HudGlassPanel, HudSectionTitle } from "@/components/studio/ObsidianHudChrome";

type Job = {
  id: string;
  customer_name: string;
  customer_phone: string;
  starts_at: string;
  status: string;
  eta_minutes: number | null;
  dispatched_at: string | null;
};

export function DispatchJobsCard({ shopSlug }: { shopSlug: string }) {
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/admin/dispatch?slug=${encodeURIComponent(shopSlug)}`, { cache: "no-store" });
        const json = (await res.json()) as { jobs?: Job[] };
        if (!cancelled) setJobs(json.jobs || []);
      } catch {
        if (!cancelled) setJobs([]);
      }
    }
    void load();
    const id = window.setInterval(() => void load(), 20_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [shopSlug]);

  return (
    <HudGlassPanel>
      <HudSectionTitle
        kicker="Field dispatch"
        title="Today's book"
        subtitle="OMW marks a job En Route and texts the customer an ETA."
      />
      {jobs.length === 0 ? (
        <p className="mt-3 text-sm text-white/45">No live jobs yet. Missed-call locks and quotes land here.</p>
      ) : (
        <ul className="mt-4 grid gap-2">
          {jobs.map((job) => (
            <li
              key={job.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3"
            >
              <div>
                <p className="text-sm font-semibold text-white">{job.customer_name || "Customer"}</p>
                <p className="font-mono text-[11px] text-white/45">{job.customer_phone}</p>
              </div>
              {job.status === "en_route" ? (
                <span className="rounded-full border border-[#00ffcc]/40 bg-[#00ffcc]/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[#00ffcc]">
                  En Route{job.eta_minutes ? ` · ${job.eta_minutes}m` : ""}
                </span>
              ) : (
                <span className="rounded-full border border-[#FFE500]/30 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[#FFE500]">
                  {job.status}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </HudGlassPanel>
  );
}
