"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { CharacterBust } from "@/components/character-morph-studio";
import { Button } from "@/components/ui/button";
import { CHARACTER_ROSTERS, type MorphGender } from "@/lib/axiom/character-morph";
import { parseCompanionDesk, type CompanionDesk, type CompanionMode, type CompanionTurn, type MentorPrompt } from "@/lib/axiom/companion-desk";

const STORAGE_KEY = "axiom-companion-desk";

const PARTICLES = [
  { top: "8%", left: "6%", delay: "0s", signal: false },
  { top: "18%", left: "88%", delay: "1.1s", signal: true },
  { top: "46%", left: "14%", delay: "2s", signal: false },
  { top: "70%", left: "92%", delay: "0.4s", signal: true },
  { top: "84%", left: "22%", delay: "1.6s", signal: false },
];

const MENTOR_ACTIONS: { kind: MentorPrompt; label: string }[] = [
  { kind: "stress-reset", label: "Request Stress Reset" },
  { kind: "daily-strategy", label: "Get Daily Strategy" },
  { kind: "workflow", label: "Workflow Optimization" },
];

type StudioMode = "frame" | CompanionMode;

export function HolographicCompanion() {
  const reduce = useReducedMotion();
  const [ready, setReady] = useState(false);
  const [gender, setGender] = useState<MorphGender>("female");
  const [index, setIndex] = useState(0);
  const [desk, setDesk] = useState<CompanionDesk>({ businessName: "", greeting: "", pricing: "", instructions: "" });
  const [mode, setMode] = useState<StudioMode>("frame");
  const [threads, setThreads] = useState<Record<CompanionMode, CompanionTurn[]>>({ storefront: [], mentor: [] });
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const roster = CHARACTER_ROSTERS[gender];
  const profile = roster[index] ?? roster[0];
  const thread = mode === "frame" ? [] : threads[mode];

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Record<string, unknown>;
        const nextGender = saved.gender === "male" ? "male" : "female";
        const nextRoster = CHARACTER_ROSTERS[nextGender];
        const found = nextRoster.findIndex((item) => item.id === saved.profileId);
        setGender(nextGender);
        setIndex(found >= 0 ? found : 0);
        setDesk(parseCompanionDesk(saved.desk));
      }
    } catch {
      /* A bad local desk should not block the studio. */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ gender, profileId: profile.id, desk }));
  }, [ready, gender, profile.id, desk]);

  function chooseGender(next: MorphGender) {
    setGender(next);
    setIndex(0);
  }

  async function ask(kind: MentorPrompt | "customer", message: string) {
    const nextMode: CompanionMode = kind === "customer" ? "storefront" : "mentor";
    if (busy) return;
    if (kind === "customer" && !message.trim()) return;
    const history = threads[nextMode].slice(-6);
    const label = kind === "customer" ? message.trim() : (MENTOR_ACTIONS.find((item) => item.kind === kind)?.label ?? "Mindset");
    setBusy(true);
    setError(null);
    setThreads((current) => ({ ...current, [nextMode]: [...current[nextMode], { role: "user", content: label }] }));
    try {
      const res = await fetch("/api/companion", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ profileId: profile.id, mode: nextMode, kind, message, history, desk }),
      });
      const body = (await res.json()) as { ok?: boolean; text?: string; error?: string };
      if (!res.ok || !body.ok || !body.text) throw new Error(body.error || "The companion is unavailable");
      setThreads((current) => ({ ...current, [nextMode]: [...current[nextMode], { role: "assistant", content: body.text ?? "" }] }));
      if (kind === "customer") setQuestion("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "The companion is unavailable");
    } finally {
      setBusy(false);
    }
  }

  async function hearGreeting() {
    if (busy || !desk.greeting.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/companion/voice", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: desk.greeting }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error || "Voice is unavailable");
      }
      const url = URL.createObjectURL(await res.blob());
      const audio = new Audio(url);
      audio.onended = () => URL.revokeObjectURL(url);
      await audio.play();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Voice is unavailable");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-label="Axiom Holographic Companion and Morph Studio" className="morph-studio pointer-events-auto relative min-h-dvh overflow-hidden px-4 py-8 sm:px-8">
      {PARTICLES.map((particle) => (
        <span
          key={`${particle.top}-${particle.left}`}
          className="morph-particle"
          style={{
            top: particle.top,
            left: particle.left,
            animationDelay: particle.delay,
            background: particle.signal ? "var(--color-signal)" : "var(--color-accent)",
          }}
        />
      ))}
      <div className="relative mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-widest text-accent">Axiom</p>
            <h1 className="mt-2 font-display text-4xl text-fg sm:text-5xl">Holographic Companion & Morph Studio</h1>
            <p className="mt-3 text-sm leading-6 text-muted">
              Swipe a partner, tune the frame, then set the desk they use with customers and the coaching they give you.
            </p>
          </div>
          <div role="radiogroup" aria-label="Partner catalog" className="grid w-full grid-cols-2 gap-1 rounded-full border border-line p-1 sm:w-72">
            {(["female", "male"] as const).map((option) => {
              const selected = gender === option;
              return (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => chooseGender(option)}
                  className={`h-11 rounded-full text-sm font-medium ${selected ? (option === "female" ? "bg-accent text-bg" : "bg-signal text-bg") : "text-muted"}`}
                >
                  {option === "female" ? "Female" : "Male"}
                </button>
              );
            })}
          </div>
        </header>

        <div className="relative">
          <div className="overflow-hidden">
            <motion.div
              className="flex"
              animate={{ x: `${-index * (100 / roster.length)}%` }}
              transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 32 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.16}
              onDragEnd={(_, info) => {
                if (info.offset.x < -48) setIndex((current) => Math.min(roster.length - 1, current + 1));
                else if (info.offset.x > 48) setIndex((current) => Math.max(0, current - 1));
              }}
            >
              {roster.map((item) => (
                <article key={item.id} className="shrink-0 px-1" style={{ width: `${100 / roster.length}%` }}>
                  <div className={`glass-panel flex gap-4 rounded-2xl p-3 ${item.id === profile.id ? "ring-2 ring-accent" : ""}`}>
                    <img src={item.portraitUrl} alt="" className="h-28 w-24 shrink-0 rounded-xl object-cover" />
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-widest text-accent">{item.category}</p>
                      <h2 className="font-display text-3xl text-fg">{item.name}</h2>
                      <p className="mt-1 text-sm leading-6 text-muted">{item.bio}</p>
                      <p className="mt-2 text-xs text-fg">Voice · {item.voice}</p>
                      <p className="text-xs text-faint">{item.behavior}</p>
                    </div>
                  </div>
                </article>
              ))}
            </motion.div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <button type="button" className="grid h-11 w-11 place-items-center rounded-full border border-line text-fg disabled:opacity-40" aria-label="Previous partner" onClick={() => setIndex((current) => Math.max(0, current - 1))} disabled={index === 0}>
              <ChevronLeft aria-hidden="true" className="h-4 w-4" />
            </button>
            <p className="text-xs uppercase tracking-widest text-muted">Swipe the roster · {index + 1} / {roster.length}</p>
            <button type="button" className="grid h-11 w-11 place-items-center rounded-full border border-line text-fg disabled:opacity-40" aria-label="Next partner" onClick={() => setIndex((current) => Math.min(roster.length - 1, current + 1))} disabled={index === roster.length - 1}>
              <ChevronRight aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div role="tablist" aria-label="Companion modes" className="grid grid-cols-3 gap-2">
          {([
            ["frame", "Frame"],
            ["storefront", "Storefront"],
            ["mentor", "Mindset"],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={mode === id}
              onClick={() => setMode(id)}
              className={`h-11 rounded-full text-sm font-medium ${mode === id ? "bg-accent text-bg" : "glass-panel text-muted"}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="glass-panel relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-2xl">
            <div className="pointer-events-none absolute inset-0">
              <CharacterBust profile={profile} traits={profile.base} />
            </div>
            <div className="morph-scan pointer-events-none absolute inset-x-8 top-0 h-8" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-bg to-transparent" />
            <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="rounded-full border border-line bg-bg/70 px-3 py-1 text-xs uppercase tracking-widest text-accent">Live render</p>
                <p className="text-right text-xs uppercase tracking-widest text-signal">{profile.category}</p>
              </div>
              <p className="text-xs uppercase tracking-widest text-muted">{profile.name}</p>
            </div>
          </div>

          {mode === "frame" ? (
            <div className="glass-panel flex flex-col gap-4 rounded-2xl p-5">
              <p className="text-xs uppercase tracking-widest text-accent">Presence</p>
              <h2 className="font-display text-3xl text-fg">{profile.name}</h2>
              <p className="text-sm leading-6 text-muted">{profile.bio}</p>
            </div>
          ) : null}

          {mode === "storefront" ? (
            <form
              className="glass-panel flex flex-col gap-4 rounded-2xl p-5"
              onSubmit={(event) => {
                event.preventDefault();
                void ask("customer", question);
              }}
            >
              <div>
                <p className="text-xs uppercase tracking-widest text-accent">Client desk</p>
                <h2 className="mt-1 font-display text-3xl text-fg">{profile.name} on the storefront</h2>
                <p className="mt-2 text-sm leading-6 text-muted">These notes are what the partner is allowed to say about the shop. A question here is asked the way a customer would.</p>
              </div>
              <label className="block text-sm text-fg">
                Business name
                <input value={desk.businessName} onChange={(event) => setDesk({ ...desk, businessName: event.target.value })} className="mt-2 h-11 w-full rounded-xl border border-line bg-bg/60 px-3 text-sm" />
              </label>
              <label className="block text-sm text-fg">
                Greeting script
                <textarea value={desk.greeting} onChange={(event) => setDesk({ ...desk, greeting: event.target.value })} rows={3} className="mt-2 w-full rounded-xl border border-line bg-bg/60 px-3 py-2 text-sm" />
              </label>
              <label className="block text-sm text-fg">
                Pricing
                <textarea value={desk.pricing} onChange={(event) => setDesk({ ...desk, pricing: event.target.value })} rows={2} placeholder="Diagnostic $89. After-hours visit $149." className="mt-2 w-full rounded-xl border border-line bg-bg/60 px-3 py-2 text-sm placeholder:text-faint" />
              </label>
              <label className="block text-sm text-fg">
                Custom instructions
                <textarea value={desk.instructions} onChange={(event) => setDesk({ ...desk, instructions: event.target.value })} rows={3} className="mt-2 w-full rounded-xl border border-line bg-bg/60 px-3 py-2 text-sm" />
              </label>
              <Thread thread={thread} name={profile.name} />
              <label className="block text-sm text-fg">
                Customer question
                <input value={question} onChange={(event) => setQuestion(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-line bg-bg/60 px-3 text-sm" />
              </label>
              {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
              <div className="grid gap-2 sm:grid-cols-2">
                <Button type="submit" variant="accent" size="lg" className="w-full" disabled={busy || !question.trim()}>
                  {busy ? "Asking…" : "Ask the partner"}
                </Button>
                <Button type="button" variant="secondary" size="lg" className="w-full" disabled={busy || !desk.greeting.trim()} onClick={() => void hearGreeting()}>
                  Hear greeting
                </Button>
              </div>
            </form>
          ) : null}

          {mode === "mentor" ? (
            <div className="glass-panel flex flex-col gap-4 rounded-2xl p-5">
              <div>
                <p className="text-xs uppercase tracking-widest text-signal">Stress & mindset</p>
                <h2 className="mt-1 font-display text-3xl text-fg">{profile.name} for the owner</h2>
                <p className="mt-2 text-sm leading-6 text-muted">This pass is private. It is a coaching note for the person running the shop, not a medical service and not a promise about money.</p>
              </div>
              <div className="grid gap-2">
                {MENTOR_ACTIONS.map((action) => (
                  <Button key={action.kind} type="button" variant="secondary" size="lg" className="w-full" disabled={busy} onClick={() => void ask(action.kind, "")}>
                    {action.label}
                  </Button>
                ))}
              </div>
              <Thread thread={thread} name={profile.name} />
              {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function Thread({ thread, name }: { thread: CompanionTurn[]; name: string }) {
  if (!thread.length) return <p className="text-sm text-faint">No exchange yet.</p>;
  return (
    <ol className="flex max-h-64 flex-col gap-3 overflow-y-auto" aria-live="polite">
      {thread.map((turn, turnIndex) => (
        <li key={`${turn.role}-${turnIndex}`} className="text-sm leading-6">
          <span className="block text-xs uppercase tracking-widest text-faint">{turn.role === "user" ? "You" : name}</span>
          <p className={turn.role === "assistant" ? "text-accent" : "text-fg"}>{turn.content}</p>
        </li>
      ))}
    </ol>
  );
}
