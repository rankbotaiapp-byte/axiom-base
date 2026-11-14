"use client";

import { useState } from "react";
import { RadioTower } from "lucide-react";

export function TestLiveDispatchButton({
  slug,
  compact = false,
  onSent,
}: {
  slug: string;
  compact?: boolean;
  onSent?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function run() {
    if (busy) return;
    setBusy(true);
    setNote(null);
    setOk(false);
    try {
      const res = await fetch("/api/axiom/test-dispatch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const body = (await res.json().catch(() => ({}))) as { masked?: string; sid?: string; error?: string };
      if (!res.ok) throw new Error(body.error || "Dispatch test failed");
      setOk(true);
      onSent?.();
      setNote(
        body.masked
          ? `Text sent to ${body.masked}. Check your phone — it should land in a few seconds.`
          : "Text sent. Check your phone — it should land in a few seconds.",
      );
    } catch (err) {
      setOk(false);
      setNote(err instanceof Error ? err.message : "Dispatch test failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={compact ? "tenant-dispatch-cta is-compact" : "tenant-dispatch-cta"}>
      <button
        type="button"
        className="tenant-dispatch-btn is-pulse"
        disabled={busy}
        onClick={() => void run()}
      >
        <RadioTower size={16} aria-hidden />
        {busy ? "Sending live SMS…" : "Test Live SMS Dispatch"}
      </button>
      {note ? (
        <p className={ok ? "tenant-dispatch-note is-ok" : "tenant-dispatch-note is-bad"} role="status">
          {note}
        </p>
      ) : null}
    </div>
  );
}
