"use client";

import { useEffect, useState } from "react";
import { Calendar, MessageCircle, X, Zap } from "lucide-react";
import { AxiomChatDrawer } from "@/components/AxiomChatDrawer";
import { AxiomVideoCompanion } from "@/components/AxiomVideoCompanion";
import { formatQuoteRange, type InstantQuoteSelection } from "@/lib/axiom/instant-quote-catalog";
import { cn } from "@/lib/utils";

export function AxiomVideoBookingModal({
  open,
  onClose,
  shopSlug,
  shopName,
  bookPath,
  quote,
  emergency,
}: {
  open: boolean;
  onClose: () => void;
  shopSlug: string;
  shopName: string;
  bookPath: string;
  quote: InstantQuoteSelection | null;
  emergency: boolean;
}) {
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      setChatOpen(false);
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open && (emergency || quote)) {
      const id = window.setTimeout(() => setChatOpen(true), 450);
      return () => window.clearTimeout(id);
    }
    return undefined;
  }, [open, emergency, quote]);

  if (!open) return null;

  const headline = emergency
    ? "Emergency dispatch — Axiom is live"
    : quote
      ? `Lock ${formatQuoteRange(quote.min, quote.max)} with Axiom`
      : "Video booking — talk to Axiom";

  return (
    <>
      <div
        className="fixed inset-0 z-[80] flex items-end justify-center bg-[#050507]/88 p-3 backdrop-blur-md sm:items-center sm:p-6"
        role="presentation"
        onClick={onClose}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Axiom video booking"
          className={cn(
            "storefront-video-booking-shell storefront-cro-glass relative w-full max-w-lg overflow-hidden p-5 sm:p-6",
          )}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/70 transition hover:border-white/35 hover:text-white"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--brand-primary)]">
            {emergency ? "Emergency channel" : "AI booking modal"}
          </p>
          <h2 className="mt-2 pr-10 font-display text-xl font-semibold text-white sm:text-2xl">{headline}</h2>
          {quote ? (
            <p className="mt-2 text-sm text-white/60">
              {quote.serviceLabel} · {quote.urgencyLabel}. Axiom confirms scope on camera before dispatch.
            </p>
          ) : (
            <p className="mt-2 text-sm text-white/60">
              {shopName} — live receptionist paired to {shopSlug}. No hold music.
            </p>
          )}

          <div className="mt-5 flex flex-col items-center gap-4">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
              <AxiomVideoCompanion size="md" attentionLook status="good" onClick={() => setChatOpen(true)} />
            </div>
            <div className="grid w-full gap-2 sm:grid-cols-2">
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[var(--brand-primary)]/45 bg-[var(--brand-primary)]/10 px-4 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--brand-glow)] transition hover:bg-[var(--brand-primary)]/18"
                onClick={() => setChatOpen(true)}
              >
                <MessageCircle className="h-4 w-4" />
                Talk to Axiom now
              </button>
              <a
                href={bookPath}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 font-mono text-[10px] uppercase tracking-[0.14em] text-white transition hover:border-white/30"
                onClick={onClose}
              >
                <Calendar className="h-4 w-4" />
                Pick a time slot
              </a>
            </div>
            {emergency ? (
              <p className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-emerald-300/90">
                <Zap className="h-3.5 w-3.5" />
                Under-45-min routing armed for {shopSlug}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <AxiomChatDrawer
        open={chatOpen}
        onOpenChange={setChatOpen}
        hideTrigger
        deskLabel={shopName}
        seedDraft={
          quote
            ? `I want to book ${quote.serviceLabel} (${quote.urgencyLabel}). Quote range ${formatQuoteRange(quote.min, quote.max)}.`
            : emergency
              ? "Emergency dispatch — need a tech in under 45 minutes."
              : undefined
        }
      />
    </>
  );
}
