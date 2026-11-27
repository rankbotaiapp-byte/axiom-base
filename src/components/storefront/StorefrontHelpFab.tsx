"use client";

import { useEffect, useId, useState } from "react";
import { CalendarDays, Phone, X } from "lucide-react";
import "./storefront-help-fab.css";

export type StorefrontHelpFabProps = {
  shopName: string;
  slug?: string;
  phone?: string;
  bookHref?: string;
  onBook?: () => void;
  onEmergency?: () => void;
  className?: string;
};

function telHref(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return null;
  return `tel:+1${digits.slice(-10)}`;
}

/** Lightweight bottom-right HELP control — no 3D companion, no studio. */
export function StorefrontHelpFab({
  shopName,
  slug = "",
  phone = "",
  bookHref,
  onBook,
  onEmergency,
  className = "",
}: StorefrontHelpFabProps) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [thread, setThread] = useState<Array<{ role: "you" | "desk"; text: string }>>([]);
  const titleId = useId();
  const call = telHref(phone);

  async function askHelper() {
    const message = prompt.trim();
    if (!message || !slug || busy) return;
    setBusy(true);
    setThread((rows) => [...rows, { role: "you", text: message }]);
    setPrompt("");
    try {
      const response = await fetch("/api/storefront/helper", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug, message }),
      });
      const json = (await response.json().catch(() => ({}))) as { reply?: string; error?: string };
      setThread((rows) => [...rows, { role: "desk", text: json.reply || json.error || "Dispatch could not answer." }]);
    } catch {
      setThread((rows) => [...rows, { role: "desk", text: "Check the connection and try again." }]);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className={`storefront-help-fab ${className}`.trim()}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        HELP
      </button>
      {open ? (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 p-3 sm:items-center">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="w-full max-w-md rounded-2xl border border-white/15 bg-[#0B0D12] p-5 text-[#f4f7fb] shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#00ffcc]">24/7 dispatch</p>
                <h2 id={titleId} className="mt-1 text-xl font-semibold">
                  {shopName}
                </h2>
                <p className="mt-1 text-sm text-white/65">Ask hours, area, or book a visit. Name + mobile locks a desk request.</p>
              </div>
              <button
                type="button"
                className="grid size-11 place-items-center rounded-full border border-white/15 text-white/70"
                onClick={() => setOpen(false)}
                aria-label="Close help"
              >
                <X className="size-4" />
              </button>
            </div>
            {thread.length ? (
              <div className="mt-3 grid max-h-40 gap-2 overflow-y-auto text-sm">
                {thread.map((row, index) => (
                  <p key={`${row.role}-${index}`} className={row.role === "you" ? "text-white/80" : "text-[#00ffcc]"}>
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">
                      {row.role === "you" ? "You" : "Desk"} ·{" "}
                    </span>
                    {row.text}
                  </p>
                ))}
              </div>
            ) : null}
            {slug ? (
              <form
                className="mt-3 grid gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  void askHelper();
                }}
              >
                <label className="sr-only" htmlFor={`${titleId}-ask`}>
                  Ask dispatch
                </label>
                <input
                  id={`${titleId}-ask`}
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="Hours? Book Ada 541-555-0148"
                  className="min-h-11 rounded-xl border border-white/15 bg-[#050507] px-3 text-sm outline-none focus:border-[#00ffcc]"
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#00ffcc] text-sm font-semibold text-[#00ffcc]"
                >
                  {busy ? "Sending…" : "Ask dispatch"}
                </button>
              </form>
            ) : null}
            <div className="mt-4 grid gap-2">
              {call ? (
                <a
                  href={call}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#FF9900] px-4 text-sm font-semibold text-[#050507]"
                >
                  <Phone className="size-4" /> Call now
                </a>
              ) : null}
              <button
                type="button"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#00ffcc] px-4 text-sm font-semibold text-[#050507]"
                onClick={() => {
                  setOpen(false);
                  if (onBook) onBook();
                  else if (bookHref) window.location.assign(bookHref);
                }}
              >
                <CalendarDays className="size-4" /> Book a visit
              </button>
              {onEmergency ? (
                <button
                  type="button"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#ff2a3d]/60 px-4 text-sm font-semibold text-[#ff6b7a]"
                  onClick={() => {
                    setOpen(false);
                    onEmergency();
                  }}
                >
                  Emergency dispatch
                </button>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
