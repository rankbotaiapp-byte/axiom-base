import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type StatusTone = "node" | "channel" | "latency";

type OsSnap = {
  online: boolean;
  secure: boolean;
  latency: number;
};

const listeners = new Set<(snap: OsSnap) => void>();
let snap: OsSnap = { online: true, secure: true, latency: 18 };
let timer = 0;
let raf = 0;

function publish(next: OsSnap) {
  snap = next;
  listeners.forEach((fn) => fn(next));
}

function sample() {
  const start = performance.now();
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame((now) => {
    const frame = Math.min(16, Math.abs(now - start));
    const drift = performance.now() % 29;
    publish({
      online: navigator.onLine,
      secure: window.isSecureContext,
      latency: Math.round(8 + drift + frame),
    });
  });
}

function onNet() {
  publish({ ...snap, online: navigator.onLine, secure: window.isSecureContext });
}

function ensure() {
  if (timer) return;
  sample();
  timer = window.setInterval(sample, 1000);
  window.addEventListener("online", onNet);
  window.addEventListener("offline", onNet);
}

function release() {
  if (listeners.size > 0) return;
  window.clearInterval(timer);
  timer = 0;
  cancelAnimationFrame(raf);
  window.removeEventListener("online", onNet);
  window.removeEventListener("offline", onNet);
}

/** One shared 1s ticker for every below-fold pill. */
export function useOsTicker() {
  const [state, setState] = useState(snap);
  useEffect(() => {
    listeners.add(setState);
    ensure();
    setState(snap);
    return () => {
      listeners.delete(setState);
      release();
    };
  }, []);
  return state;
}

export function toneAt(index: number): StatusTone {
  const tones: StatusTone[] = ["node", "channel", "latency"];
  return tones[index % tones.length] ?? "node";
}

export function StatusPill({
  tone = "node",
  className,
}: {
  tone?: StatusTone;
  className?: string;
}) {
  const link = useOsTicker();
  const synced = link.online && link.secure;
  const label =
    tone === "latency"
      ? link.online
        ? `link ${link.latency} ms`
        : "link standby"
      : tone === "channel"
        ? synced
          ? "channel sync"
          : link.online
            ? "channel open"
            : "channel standby"
        : link.online
          ? "node live"
          : "node standby";

  return (
    <span className={cn("status-pill", className)}>
      <span className={cn("status-dot", link.online ? "is-live" : "is-wait")} aria-hidden />
      <span className="min-w-0 truncate">{label}</span>
    </span>
  );
}

export function StatusRow({
  tones = ["node", "channel", "latency"],
  className,
}: {
  tones?: StatusTone[];
  className?: string;
}) {
  return (
    <div className={cn("status-row", className)}>
      {tones.map((tone) => (
        <StatusPill key={tone} tone={tone} />
      ))}
    </div>
  );
}
