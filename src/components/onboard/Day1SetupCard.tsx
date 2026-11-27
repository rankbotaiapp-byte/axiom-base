"use client";

import { useState, type FormEvent } from "react";

export function Day1SetupCard({
  slug,
  businessName,
  initialPhone,
  initialCity,
  initialNiche,
  initialReviewUrl,
  hoursStart = "07:00",
  hoursEnd = "19:00",
  adminHref,
}: {
  slug: string;
  businessName: string;
  initialPhone?: string;
  initialCity?: string;
  initialNiche?: string;
  initialReviewUrl?: string;
  hoursStart?: string;
  hoursEnd?: string;
  adminHref: string;
}) {
  const [phone, setPhone] = useState(initialPhone || "");
  const [reviewUrl, setReviewUrl] = useState(initialReviewUrl || "");
  const [skipReview, setSkipReview] = useState(false);
  const [start, setStart] = useState(hoursStart);
  const [end, setEnd] = useState(hoursEnd);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/onboarding/day1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          ownerPhone: phone,
          googleReviewUrl: skipReview ? "" : reviewUrl,
          skipReview,
          hoursStart: start,
          hoursEnd: end,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setError(json.error || "Could not save. Check the mobile number.");
        setSaving(false);
        return;
      }
      window.location.assign(adminHref);
    } catch {
      setError("Save failed. Try again.");
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-[#00ffcc]/30 bg-[#050507] p-5 text-[#f4f7fb] shadow-[0_0_40px_rgba(0,255,204,0.08)]"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#00ffcc]">60-second Day-1 setup</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight">{businessName || slug}</h2>
      <p className="mt-2 text-sm text-white/60">
        Arm missed-call booking, QUOTE / OMW / PAID texts, and the Google review drip before you open the desk.
        {initialCity ? ` ${initialCity}` : ""}
        {initialNiche ? ` · ${initialNiche}` : ""}
      </p>

      <label className="mt-5 block">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#FFE500]">Owner mobile</span>
        <input
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+15415550100"
          inputMode="tel"
          autoComplete="tel"
          className="mt-1 w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-3 text-base text-white outline-none focus:border-[#00ffcc]"
        />
      </label>

      <label className="mt-4 block">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#FFE500]">Google review link</span>
        <input
          value={reviewUrl}
          onChange={(e) => setReviewUrl(e.target.value)}
          disabled={skipReview}
          placeholder="https://g.page/r/…"
          className="mt-1 w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-3 text-base text-white outline-none focus:border-[#00ffcc] disabled:opacity-40"
        />
      </label>
      <label className="mt-2 flex items-center gap-2 text-sm text-white/55">
        <input type="checkbox" checked={skipReview} onChange={(e) => setSkipReview(e.target.checked)} />
        Skip for now — +30m review drip stays off until you add a link
      </label>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <label>
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#FFE500]">Service start</span>
          <input
            type="time"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-3 text-white"
          />
        </label>
        <label>
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#FFE500]">Quiet / close</span>
          <input
            type="time"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/15 bg-white/[0.04] px-3 py-3 text-white"
          />
        </label>
      </div>
      <p className="mt-2 font-mono text-[10px] text-white/40">Default 07:00–19:00 local. Missed-call windows and review texts use this.</p>

      {error ? <p className="mt-3 text-sm text-[#ff6b7a]">{error}</p> : null}

      <button
        type="submit"
        disabled={saving}
        className="mt-5 w-full rounded-xl bg-[#00ffcc] px-4 py-3 text-sm font-semibold text-[#050507] disabled:opacity-60"
      >
        {saving ? "Arming…" : "Save and open the desk"}
      </button>
    </form>
  );
}
