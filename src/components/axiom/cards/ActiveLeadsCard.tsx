"use client";

import { useCallback, useEffect, useState } from "react";
import { AxiomBotCanvas, type AxiomBotMood } from "@/components/axiom/AxiomBotCanvas";
import { masterDeskFetch } from "@/lib/axiom/master-desk-client";

const POLL_MS = 15_000;

export type ActiveLeadsCardProps = {
  /** Optional seed from the parent desk load; card still polls independently. */
  initialLeads?: number | null;
  blocked?: boolean;
  pollMs?: number;
};

type LeadsStatus = "loading" | "live" | "error";

function moodFromLeads(leads: number | null, status: LeadsStatus): AxiomBotMood {
  if (status === "error") return "ALERT";
  if (leads != null && leads > 0) return "JOYFUL";
  return "STEADY";
}

function footerLabel(status: LeadsStatus, blocked: boolean): string {
  if (blocked || status === "error") return "Session required";
  if (status === "loading") return "Syncing feed…";
  return "Last 24 hours · LIVE FEED";
}

export function ActiveLeadsCard({
  initialLeads = null,
  blocked = false,
  pollMs = POLL_MS,
}: ActiveLeadsCardProps) {
  const [leads, setLeads] = useState<number | null>(initialLeads);
  const [status, setStatus] = useState<LeadsStatus>(initialLeads == null ? "loading" : "live");

  const fetchLeads = useCallback(async () => {
    if (blocked) {
      setStatus("error");
      setLeads(null);
      return;
    }
    try {
      const res = await masterDeskFetch("/api/master/telemetry");
      if (res.status === 401 || res.status === 403) {
        setStatus("error");
        setLeads(null);
        return;
      }
      if (!res.ok) {
        setStatus((prev) => (prev === "live" ? "live" : "error"));
        return;
      }
      const body = (await res.json()) as { leadsLast24h?: number };
      const next = Number(body.leadsLast24h ?? 0);
      setLeads(Number.isFinite(next) ? next : 0);
      setStatus("live");
    } catch {
      setStatus((prev) => (prev === "live" ? "live" : "error"));
    }
  }, [blocked]);

  useEffect(() => {
    if (initialLeads != null && !blocked) {
      setLeads(initialLeads);
      setStatus("live");
    }
  }, [initialLeads, blocked]);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      if (cancelled) return;
      await fetchLeads();
    };
    void tick();
    const id = window.setInterval(() => {
      void tick();
    }, pollMs);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [fetchLeads, pollMs]);

  const mood = moodFromLeads(leads, status);
  const display = blocked || status === "loading" || leads == null ? "—" : String(leads);

  return (
    <article className="relative flex h-44 w-full flex-col justify-between overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-950/80 p-4">
      {/* Full 3D co-pilot helmet behind telemetry */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <AxiomBotCanvas mood={mood} embedded className="h-full w-full" />
      </div>

      <p className="relative z-10 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-400">
        Active inbound leads
      </p>

      <div className="relative z-10">
        <p className="font-mono text-2xl font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">{display}</p>
        <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-zinc-500">{footerLabel(status, blocked)}</p>
      </div>
    </article>
  );
}
