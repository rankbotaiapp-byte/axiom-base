"use client";

import { useState } from "react";

export function BookingForm({ slug, services, cta }: { slug: string; services: string[]; cta: string }) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [err, setErr] = useState("");

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setState("sending");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug, ...Object.fromEntries(fd.entries()) }),
    });
    if (res.ok) setState("done");
    else {
      setErr(((await res.json().catch(() => ({}))) as { error?: string }).error ?? "Something went wrong.");
      setState("error");
    }
  };

  if (state === "done") {
    return (
      <div className="glass p-6 text-center" role="status">
        <p className="display text-2xl">Request received ✓</p>
        <p className="mt-2 text-white/65">We&apos;ll text you to confirm your time.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="glass grid gap-3 p-5 sm:grid-cols-2">
      <input name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <input className="field" name="name" required autoComplete="name" placeholder="Your name" />
      <input className="field" name="phone" required type="tel" inputMode="tel" autoComplete="tel" placeholder="Mobile number" />
      <select className="field" name="service" defaultValue={services[0]}>
        {services.map((s) => (
          <option key={s}>{s}</option>
        ))}
      </select>
      <input className="field" name="when" placeholder="Preferred day / time" />
      <textarea className="field min-h-24 sm:col-span-2" name="message" placeholder="Anything we should know? (optional)" />
      {state === "error" ? <p className="text-sm text-[#ff9b8a] sm:col-span-2">{err}</p> : null}
      <button type="submit" disabled={state === "sending"} className="tb tb-ember sm:col-span-2">
        <span className="tb-label">{state === "sending" ? "Sending…" : cta}</span>
      </button>
    </form>
  );
}
