"use client";

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { Facebook, FilePlus2, Instagram, Pencil, Upload, Youtube } from "lucide-react";

const LOGO_LOOP = "/media/axiom/axiom-logo-loop.mp4";
const LOGO_POSTER = "/media/axiom/axiom-logo-poster.jpg";

type Phase = "idle" | "generating" | "ready";

type Project = {
  id: string;
  name: string;
  createdAt: number;
};

type Stats = {
  content: string;
  engagement: string;
  revenue: string;
};

const IDLE_STATS: Stats = {
  content: "10,184",
  engagement: "8.2%",
  revenue: "$12,420",
};

function hashNiche(value: string) {
  let hash = 0;
  for (const char of value.toLowerCase()) hash = (hash * 33 + char.charCodeAt(0)) >>> 0;
  return hash;
}

function statsFor(niche: string): Stats {
  const hash = hashNiche(niche);
  return {
    content: (900 + (hash % 6400)).toLocaleString(),
    engagement: `${(3.1 + (hash % 68) / 10).toFixed(1)}%`,
    revenue: `$${(4200 + (hash % 18600)).toLocaleString()}`,
  };
}

function accentFor(niche: string) {
  const name = niche.toLowerCase();
  if (/fish|river|guide|boat/.test(name)) return { wash: "#083344", ink: "#67e8f9", label: "River desk" };
  if (/plumb|otter|drain|pipe/.test(name)) return { wash: "#0c4a6e", ink: "#22d3ee", label: "Dispatch desk" };
  if (/shark|ocean|abyss|dive/.test(name)) return { wash: "#082f49", ink: "#7dd3fc", label: "Depth desk" };
  if (/leopard|safari|wild/.test(name)) return { wash: "#3f2a12", ink: "#fbbf24", label: "Field desk" };
  if (/hvac|heat|air|cool/.test(name)) return { wash: "#134e4a", ink: "#5eead4", label: "Climate desk" };
  if (/elect|volt|wire/.test(name)) return { wash: "#1e1b4b", ink: "#c4b5fd", label: "Line desk" };
  return { wash: "#1e1b4b", ink: "#22d3ee", label: "Live desk" };
}

function ago(createdAt: number, now: number) {
  const seconds = Math.max(0, Math.round((now - createdAt) / 1000));
  if (seconds < 15) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.max(1, Math.round(seconds / 60));
  return `${minutes}m ago`;
}

function spinValue(): Stats {
  return {
    content: Math.floor(400 + Math.random() * 9600).toLocaleString(),
    engagement: `${(Math.random() * 14).toFixed(1)}%`,
    revenue: `$${Math.floor(800 + Math.random() * 24000).toLocaleString()}`,
  };
}

export default function AxiomStudioHub({ onLaunch }: { onLaunch?: () => void }) {
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const nicheRef = useRef<HTMLInputElement>(null);
  const [niche, setNiche] = useState("");
  const [fileName, setFileName] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [stats, setStats] = useState<Stats>(IDLE_STATS);
  const [projects, setProjects] = useState<Project[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [linked, setLinked] = useState<string | null>(null);
  const readyNiche = useRef("");

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 15000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (phase !== "generating") return;
    const id = window.setInterval(() => setStats(spinValue()), 70);
    const done = window.setTimeout(() => {
      window.clearInterval(id);
      const name = readyNiche.current;
      setStats(statsFor(name));
      setProjects((current) => [
        { id: `${Date.now()}`, name, createdAt: Date.now() },
        ...current,
      ].slice(0, 6));
      setPhase("ready");
      setNow(Date.now());
    }, 1700);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(done);
    };
  }, [phase]);

  const accent = useMemo(() => accentFor(readyNiche.current || niche || "axiom"), [niche, phase]);
  const canSpin = niche.trim().length > 1 && Boolean(previewUrl) && phase !== "generating";

  function takeFile(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) return;
    setFileName(file.name);
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
  }

  function spin() {
    const name = niche.trim();
    if (!previewUrl || name.length < 2 || phase === "generating") return;
    readyNiche.current = name;
    setPhase("generating");
  }

  function resetTemplate() {
    setNiche("");
    setFileName("");
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    setPhase("idle");
    setStats(IDLE_STATS);
    readyNiche.current = "";
    window.setTimeout(() => nicheRef.current?.focus(), 40);
  }

  return (
    <section id="top" className="hub-shell relative overflow-hidden px-4 pb-16 pt-24 sm:px-6 sm:pt-28">
      <style>{`
        .hub-shell {
          background:
            radial-gradient(920px 460px at 12% -8%, rgba(56, 189, 248, 0.22), transparent 58%),
            radial-gradient(780px 520px at 96% 108%, rgba(168, 85, 247, 0.34), transparent 56%),
            linear-gradient(165deg, #07051c 0%, #14083a 52%, #1c0a48 100%);
        }
        .hub-chamfer {
          clip-path: polygon(22px 0, calc(100% - 40px) 0, 100% 28px, 100% calc(100% - 16px), calc(100% - 22px) 100%, 30px 100%, 0 calc(100% - 26px), 0 16px);
        }
        .hub-stat {
          clip-path: polygon(14% 18%, 50% 0, 86% 18%, 100% 18%, 100% 100%, 0 100%, 0 18%);
        }
        .hub-scanline {
          background: linear-gradient(180deg, transparent 0%, rgba(62, 231, 255, 0) 35%, rgba(62, 231, 255, 0.72) 48%, rgba(217, 70, 239, 0.45) 54%, transparent 70%);
          animation: hub-scan 1.35s linear infinite;
        }
        .hub-scanline-slow {
          background: linear-gradient(180deg, transparent 0%, rgba(62, 231, 255, 0.18) 48%, transparent 62%);
          animation: hub-scan 3.8s linear infinite;
        }
        @keyframes hub-scan {
          from { transform: translateY(-120%); }
          to { transform: translateY(140%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .hub-scanline, .hub-scanline-slow { animation: none; opacity: 0.25; }
        }
      `}</style>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => takeFile(event.target.files?.[0])}
      />
      <div className="mx-auto max-w-6xl">
        <p className="mb-3 text-center text-sm text-white/70 sm:text-base">
          A live trade desk in three minutes for plumbers, HVAC, electricians &amp; outfitters.
        </p>
        <p className="mb-4 text-center font-mono text-[11px] font-semibold uppercase tracking-[0.42em] text-white sm:text-xs">
          Active Project Preview
        </p>

        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(260px,0.72fr)] lg:gap-5">
          <div>
            <div className="hub-glow relative">
              <div
                className="hub-chamfer p-[2px]"
                style={{ background: "linear-gradient(100deg, #3ee7ff 0%, #2563eb 42%, #7c3aed 72%, #e879f9 100%)" }}
              >
                <div className="hub-chamfer relative bg-[#07122e]">
                  <div className="relative min-h-[280px] sm:min-h-[360px]">
                    <div className="pointer-events-none absolute inset-0 opacity-40" aria-hidden>
                      <div className="absolute inset-6 border border-cyan-300/15" />
                      <div className="absolute left-8 top-8 h-3 w-3 border-l border-t border-cyan-300" />
                      <div className="absolute right-8 top-8 h-3 w-3 border-r border-t border-fuchsia-300" />
                      <div className="absolute bottom-16 left-8 h-3 w-3 border-b border-l border-cyan-300" />
                      <div className="absolute bottom-16 right-8 h-3 w-3 border-b border-r border-fuchsia-300" />
                    </div>

                    {phase === "idle" ? (
                      <form
                        className="relative z-10 flex min-h-[280px] flex-col justify-center gap-4 px-5 py-8 sm:min-h-[360px] sm:px-10"
                        onSubmit={(event) => {
                          event.preventDefault();
                          spin();
                        }}
                      >
                        <div
                          className={`grid min-h-36 place-items-center border border-dashed px-4 py-6 text-center transition ${
                            dragging ? "border-cyan-300 bg-cyan-300/10" : "border-cyan-200/40 bg-white/[0.03]"
                          }`}
                          onDragOver={(event) => {
                            event.preventDefault();
                            setDragging(true);
                          }}
                          onDragLeave={() => setDragging(false)}
                          onDrop={(event) => {
                            event.preventDefault();
                            setDragging(false);
                            takeFile(event.dataTransfer.files?.[0]);
                          }}
                        >
                          {previewUrl ? (
                            <img
                              src={previewUrl}
                              alt=""
                              className="mx-auto block h-auto max-h-28 w-full object-contain"
                              style={{ objectFit: "contain" }}
                            />
                          ) : (
                            <div>
                              <Upload className="mx-auto h-6 w-6 text-cyan-200" aria-hidden />
                              <p className="mt-2 text-sm text-white">Drop your logo or reference image</p>
                            </div>
                          )}
                          <button
                            type="button"
                            className="mt-3 min-h-11 px-3 text-xs uppercase tracking-[0.18em] text-cyan-200"
                            onClick={() => fileRef.current?.click()}
                          >
                            {fileName ? fileName : "Browse files"}
                          </button>
                        </div>

                        <label className="grid gap-2 text-left" htmlFor={inputId}>
                          <span className="sr-only">Niche</span>
                          <input
                            ref={nicheRef}
                            id={inputId}
                            value={niche}
                            maxLength={60}
                            onChange={(event) => setNiche(event.target.value)}
                            placeholder="Enter Your Niche (e.g., Plumbing, Fishing Guide)"
                            className="min-h-12 w-full border border-cyan-200/30 bg-black/40 px-4 text-sm text-white outline-none placeholder:text-white/40 focus:border-cyan-300"
                          />
                        </label>
                        <button
                          type="submit"
                          disabled={!canSpin}
                          className="min-h-12 bg-cyan-300 px-4 text-sm font-semibold uppercase tracking-[0.16em] text-[#041018] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Spin Up My Niche Site
                        </button>
                      </form>
                    ) : (
                      <div
                        className={`relative z-10 px-4 pb-4 pt-5 transition duration-700 sm:px-6 ${
                          phase === "ready" ? "opacity-100" : "opacity-80"
                        }`}
                      >
                        <div className="overflow-hidden border border-white/10 bg-[#050816]">
                          {previewUrl ? (
                            <img
                              src={previewUrl}
                              alt=""
                              className="block h-auto max-h-40 w-full object-contain"
                              style={{ objectFit: "contain", background: accent.wash }}
                            />
                          ) : null}
                          <div className="grid gap-3 p-4 sm:grid-cols-[1.2fr_0.8fr] sm:p-5">
                            <div>
                              <p className="font-mono text-[10px] uppercase tracking-[0.28em]" style={{ color: accent.ink }}>
                                {accent.label}
                              </p>
                              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                                {readyNiche.current || niche}
                              </h2>
                              <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/70">
                                Bookings, a cinematic hero, and a field logger for cash and checks. Card bookings stay at 1.5%.
                              </p>
                            </div>
                            <div className="grid content-start gap-2 text-xs uppercase tracking-[0.14em] text-white/80">
                              {["Dispatch", "Book a window", "Field payment"].map((item) => (
                                <div key={item} className="border border-white/10 px-3 py-2" style={{ color: accent.ink }}>
                                  {item}
                                </div>
                              ))}
                              <button
                                type="button"
                                className="min-h-11 bg-white px-3 text-[11px] font-semibold tracking-[0.16em] text-[#07122e]"
                                onClick={() => onLaunch?.()}
                              >
                                Start the $1 · 14-day trial
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {phase === "generating" ? (
                      <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden" aria-hidden>
                        <div className="hub-scanline absolute inset-x-0 h-1/2" />
                      </div>
                    ) : null}
                    {phase === "ready" ? (
                      <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden opacity-70" aria-hidden>
                        <div className="hub-scanline-slow absolute inset-x-0 h-1/3" />
                      </div>
                    ) : null}
                  </div>

                  <div
                    className="relative flex items-center justify-center gap-3 px-4 py-3"
                    style={{ background: "linear-gradient(90deg, #0b3b78, #12306a 40%, #3b1570)" }}
                  >
                    <video
                      className="block h-8 w-auto max-w-[5.5rem] object-contain"
                      style={{ objectFit: "contain" }}
                      src={LOGO_LOOP}
                      poster={LOGO_POSTER}
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      aria-hidden
                    />
                    <p className="font-mono text-sm font-semibold uppercase tracking-[0.34em] text-white sm:text-base">
                      Axiom Brand Engine
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
              <Stat label="Content Processed" value={stats.content} />
              <Stat label="Engagement Rate" value={stats.engagement} />
              <Stat label="Revenue Tracking" value={stats.revenue} />
            </div>
          </div>

          <aside className="grid gap-4">
            <Panel title="Quick Actions">
              <div className="grid grid-cols-3 gap-2">
                <Action icon={<Upload className="h-5 w-5" />} label="Upload Media" onClick={() => fileRef.current?.click()} />
                <Action icon={<FilePlus2 className="h-5 w-5" />} label="New Template" onClick={resetTemplate} />
                <Action
                  icon={<Pencil className="h-5 w-5" />}
                  label="Edit Metadata"
                  onClick={() => {
                    setPhase("idle");
                    window.setTimeout(() => nicheRef.current?.focus(), 40);
                  }}
                />
              </div>
            </Panel>

            <Panel title="Recent Projects" kicker="Axiom Studio Dashboard">
              {projects.length === 0 ? (
                <p className="px-1 py-6 text-center text-sm text-white/55">Spin up a niche to pin it here.</p>
              ) : (
                <ul className="grid gap-2">
                  {projects.map((project) => (
                    <li key={project.id} className="border border-cyan-200/20 bg-black/30 px-3 py-2">
                      <p className="text-sm text-white">{project.name}</p>
                      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-200/80">
                        Generated {ago(project.createdAt, now)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title="Linked Accounts — Click to view">
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { id: "facebook", label: "Facebook", icon: <Facebook className="h-5 w-5" /> },
                  { id: "youtube", label: "YouTube", icon: <Youtube className="h-5 w-5" /> },
                  { id: "instagram", label: "Instagram", icon: <Instagram className="h-5 w-5" /> },
                ].map((account) => (
                  <button
                    key={account.id}
                    type="button"
                    aria-pressed={linked === account.id}
                    onClick={() => setLinked(account.id)}
                    className={`grid min-h-16 place-items-center gap-1 border px-1 py-2 text-[10px] uppercase tracking-[0.12em] ${
                      linked === account.id ? "border-cyan-300 text-cyan-200" : "border-white/15 text-white/80"
                    }`}
                  >
                    {account.icon}
                    {account.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">AxiomMediaCo</p>
            </Panel>
          </aside>
        </div>
      </div>
    </section>
  );
}

function Panel({ title, kicker, children }: { title: string; kicker?: string; children: ReactNode }) {
  return (
    <div
      className="p-[2px]"
      style={{
        background: "linear-gradient(135deg, #3ee7ff, #7c3aed 55%, #e879f9)",
        clipPath: "polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)",
      }}
    >
      <div
        className="bg-[#0b1738] p-3"
        style={{ clipPath: "polygon(13px 0, 100% 0, 100% calc(100% - 13px), calc(100% - 13px) 100%, 0 100%, 0 13px)" }}
      >
        <p className="text-center font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-white">{title}</p>
        {kicker ? <p className="mt-1 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-100/70">{kicker}</p> : null}
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}

function Action({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="grid min-h-20 place-items-center gap-2 border border-cyan-200/25 bg-white/[0.03] px-1 py-2 text-[10px] uppercase leading-tight tracking-[0.08em] text-cyan-100"
    >
      {icon}
      {label}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="hub-stat px-2 pb-3 pt-5 text-center sm:px-3"
      style={{ background: "linear-gradient(180deg, #12315f, #0a1836)", boxShadow: "0 0 18px rgba(62, 231, 255, 0.25)" }}
    >
      <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-cyan-100/80 sm:text-[10px]">{label}</p>
      <p className="mt-1 font-mono text-sm font-semibold text-white sm:text-lg">{value}</p>
    </div>
  );
}
