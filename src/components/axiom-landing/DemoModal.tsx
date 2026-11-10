"use client";

import { useEffect, useState } from "react";
import { Check, ChevronRight, X } from "lucide-react";
import { getTemplate, type NicheTemplate } from "@/lib/axiom-landing/templates";
import { useFunnel } from "./FunnelProvider";

type Tab = "book" | "dispatch" | "admin" | "live";

const STATUS_COLOR: Record<string, string> = {
  "En route": "#ffd23f",
  Scheduled: "#9aa7b8",
  "On site": "#3fd8ff",
  Done: "#7cf0c5",
};

export default function DemoModal() {
  const { previewId, closePreview } = useFunnel();
  const t = getTemplate(previewId);
  const [tab, setTab] = useState<Tab>("book");

  useEffect(() => setTab("book"), [previewId]);

  useEffect(() => {
    if (!t) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closePreview();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [t, closePreview]);

  if (!t) return null;

  const tabs: { id: Tab; label: string }[] = [
    { id: "book", label: "Customer booking" },
    { id: "dispatch", label: "Dispatch board" },
    { id: "admin", label: "Your admin" },
    ...(t.liveUrl ? [{ id: "live" as Tab, label: "Live site" }] : []),
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center" role="dialog" aria-modal aria-label={`${t.trade} demo`}>
      <button aria-label="Close demo" className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closePreview} />

      <div className="pop relative z-10 flex max-h-[92svh] w-full max-w-5xl flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-slate sm:rounded-3xl">
        {/* header */}
        <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-7">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{t.icon}</span>
            <div>
              <p className="font-display text-lg font-semibold text-white">{t.trade} template</p>
              <p className="text-xs text-mist">Interactive preview · everything here is editable from your admin</p>
            </div>
          </div>
          <button
            onClick={closePreview}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-mist transition hover:scale-105 hover:border-white/40 hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid flex-1 gap-0 overflow-y-auto pb-28 md:grid-cols-[1fr_340px] md:pb-0">
          {/* left: info */}
          <div className="p-5 sm:p-7">
            <div className="flex flex-wrap gap-2">
              {tabs.map((x) => (
                <button
                  key={x.id}
                  onClick={() => setTab(x.id)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    tab === x.id ? "text-ink" : "border border-white/10 text-mist hover:border-white/30 hover:text-white"
                  }`}
                  style={tab === x.id ? { background: t.accent, boxShadow: `0 0 24px -6px ${t.accent}` } : undefined}
                >
                  {x.label}
                </button>
              ))}
            </div>

            <p className="mt-6 text-lg text-white">{t.tagline}</p>
            <h4 className="mt-7 text-xs font-semibold uppercase tracking-[0.18em] text-mist">Runs on autopilot</h4>
            <ul className="mt-3 space-y-2.5">
              {t.automations.map((a) => (
                <li key={a} className="flex items-start gap-3 text-mist">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: t.accent }} />
                  {a}
                </li>
              ))}
            </ul>
            <p className="mt-7 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-mist">
              Swap in your logo, colors, services and prices from the admin dashboard — your customers see your brand,
              not ours.
            </p>
          </div>

          {/* right: phone */}
          <div className="flex justify-center border-t border-white/10 bg-ink/60 p-6 md:border-l md:border-t-0">
            {tab === "live" && t.liveUrl ? (
              <iframe src={t.liveUrl} title={`${t.trade} live demo`} className="h-[600px] w-[300px] rounded-[2rem] border-4 border-black bg-white" />
            ) : (
              <Phone t={t} tab={tab} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Phone({ t, tab }: { t: NicheTemplate; tab: Tab }) {
  const [picked, setPicked] = useState<number | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [booked, setBooked] = useState(false);
  useEffect(() => {
    setPicked(null);
    setSlot(null);
    setBooked(false);
  }, [t.id, tab]);

  return (
    <div
      className="relative h-[600px] w-[300px] overflow-hidden rounded-[2.4rem] border-[6px] border-black bg-[#0b0f15] shadow-[0_30px_80px_-20px_rgb(0_0_0/0.9)]"
      style={{ boxShadow: `0 0 0 1px rgb(255 255 255 / 0.08), 0 30px 90px -30px ${t.accent}` }}
    >
      <div className="absolute left-1/2 top-2 h-5 w-24 -translate-x-1/2 rounded-full bg-black" />
      <div className="h-full overflow-y-auto px-4 pb-6 pt-10 text-sm">
        <div className="mb-4 flex items-center justify-between">
          <span className="font-display font-semibold text-white">Your Business</span>
          <span className="h-7 w-7 rounded-full" style={{ background: t.accent }} />
        </div>

        {tab === "book" && (
          <div className="space-y-3">
            {booked ? (
              <div className="pop rounded-2xl p-5 text-center" style={{ background: `${t.accent}22`, border: `1px solid ${t.accent}66` }}>
                <p className="flex justify-center text-white"><Check className="h-8 w-8" strokeWidth={2.5} aria-hidden /></p>
                <p className="mt-2 font-semibold text-white">You&apos;re booked!</p>
                <p className="mt-1 text-xs text-mist">
                  {t.services[picked ?? 0].name} · {slot}. Confirmation text sent. Your tech gets the job + route automatically.
                </p>
              </div>
            ) : (
              <>
                <p className="text-xs uppercase tracking-wider text-mist">1 · Choose a service</p>
                {t.services.map((s, i) => (
                  <button
                    key={s.name}
                    onClick={() => setPicked(i)}
                    className="flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all hover:scale-[1.02]"
                    style={{ borderColor: picked === i ? t.accent : "rgb(255 255 255 / 0.1)", background: picked === i ? `${t.accent}1a` : "transparent" }}
                  >
                    <span>
                      <span className="block font-medium text-white">{s.name}</span>
                      <span className="text-xs text-mist">{s.duration}</span>
                    </span>
                    <span className="font-semibold" style={{ color: t.accent }}>
                      {s.price}
                    </span>
                  </button>
                ))}
                {picked !== null && (
                  <div className="pop">
                    <p className="mt-2 text-xs uppercase tracking-wider text-mist">2 · Pick a time</p>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {["9:00", "10:30", "1:00", "2:30", "4:00", "5:30"].map((s) => (
                        <button
                          key={s}
                          onClick={() => setSlot(s)}
                          className="rounded-lg border py-2 text-xs transition-all hover:scale-105"
                          style={{ borderColor: slot === s ? t.accent : "rgb(255 255 255 / 0.1)", color: slot === s ? t.accent : "#cbd5e1" }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <button
                  disabled={picked === null || !slot}
                  onClick={() => setBooked(true)}
                  className="mt-2 w-full rounded-xl py-3 font-semibold text-ink transition-all enabled:hover:scale-[1.02] disabled:opacity-30"
                  style={{ background: t.accent }}
                >
                  Book now
                </button>
              </>
            )}
          </div>
        )}

        {tab === "dispatch" && (
          <div className="space-y-3">
            <div className="relative h-32 overflow-hidden rounded-xl border border-white/10 bg-[#0e1520]">
              <svg viewBox="0 0 280 128" className="absolute inset-0 h-full w-full">
                <path d="M20 100 C 80 20, 140 120, 200 50 S 260 30, 265 20" fill="none" stroke={t.accent} strokeWidth="2" strokeDasharray="5 5" />
                {[
                  [20, 100],
                  [120, 72],
                  [200, 50],
                  [265, 20],
                ].map(([x, y], i) => (
                  <circle key={i} cx={x} cy={y} r="5" fill={i === 1 ? t.accent : "#e8edf3"} />
                ))}
              </svg>
              <span className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] text-mist">Optimized route · 3 stops · 41 min</span>
            </div>
            {t.jobs.map((j) => (
              <div key={j.customer} className="flex items-center justify-between rounded-xl border border-white/10 p-3">
                <div>
                  <p className="font-medium text-white">{j.customer}</p>
                  <p className="text-xs text-mist">
                    {j.time} · {j.address}
                  </p>
                </div>
                <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ color: STATUS_COLOR[j.status], background: `${STATUS_COLOR[j.status]}1f` }}>
                  {j.status}
                </span>
              </div>
            ))}
          </div>
        )}

        {tab === "admin" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {[
                ["Booked today", "7"],
                ["Revenue (wk)", "$4,280"],
                ["Missed calls saved", "12"],
                ["5-star reviews", "+9"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl border border-white/10 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-mist">{k}</p>
                  <p className="mt-1 font-display text-lg font-semibold text-white">{v}</p>
                </div>
              ))}
            </div>
            <p className="pt-1 text-xs uppercase tracking-wider text-mist">Edit in seconds</p>
            {["Brand colors", "Services & prices", "Hours & service area", "Crew & schedules"].map((x) => (
              <div key={x} className="flex items-center justify-between rounded-xl border border-white/10 p-3">
                <span className="text-white">{x}</span>
                <span className="inline-flex items-center gap-0.5" style={{ color: t.accent }}>
                  Edit <ChevronRight className="h-4 w-4" aria-hidden />
                </span>
              </div>
            ))}
            <p className="text-center text-[10px] text-mist/70">Sample numbers for illustration</p>
          </div>
        )}
      </div>
    </div>
  );
}
