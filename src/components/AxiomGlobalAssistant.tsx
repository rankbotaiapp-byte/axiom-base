"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { AXIOM_COMPACT_FAB_CLASS, AxiomChatDrawer } from "@/components/AxiomChatDrawer";

type AxiomGlobalAssistantProps = {
  /** When true, click routes straight to /companion instead of the quick hub. */
  directToCompanion?: boolean;
};

/** Single global floating companion — bottom-right; never remount inside StudioWorkspace. */
export function AxiomGlobalAssistant({ directToCompanion = false }: AxiomGlobalAssistantProps) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const onActivate = () => {
    if (directToCompanion) {
      router.push("/companion");
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <div
        className="pointer-events-none fixed bottom-5 right-5 z-[55] overflow-visible sm:bottom-7 sm:right-7"
        style={{ overflow: "visible" }}
      >
        <button
          type="button"
          onClick={onActivate}
          className={`pointer-events-auto ${AXIOM_COMPACT_FAB_CLASS}`}
          aria-label="Open Axiom assistant"
        >
          ▶ Ask Axiom
        </button>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-[70] flex items-end justify-center bg-zinc-950/55 p-4 backdrop-blur-sm sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Axiom quick actions"
              initial={{ y: 28, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 16, opacity: 0, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className="w-full max-w-sm rounded-2xl border border-cyan-500/30 bg-zinc-950/95 p-5 shadow-[0_24px_60px_rgba(0,0,0,0.75),0_0_40px_rgba(6,182,212,0.15)]"
              onClick={(event) => event.stopPropagation()}
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#00f2fe]">AI Assistant</p>
              <h2 className="mt-2 text-lg font-bold text-white">Talk to Axiom</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                Pick a quick action, or open the full companion desk.
              </p>
              <div className="mt-5 grid gap-2">
                <button
                  type="button"
                  className="rounded-xl border border-[#00f2fe]/35 bg-[#00f2fe]/10 px-4 py-3 text-left text-sm font-semibold text-[#00f2fe] transition hover:bg-[#00f2fe]/20"
                  onClick={() => {
                    setOpen(false);
                    setChatOpen(true);
                  }}
                >
                  Open receptionist chat
                </button>
                <Link
                  href="/companion"
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-zinc-100 transition hover:border-white/25 hover:bg-white/[0.07]"
                  onClick={() => setOpen(false)}
                >
                  Open companion studio
                </Link>
                <Link
                  href="/axiom-studio"
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-zinc-100 transition hover:border-white/25 hover:bg-white/[0.07]"
                  onClick={() => setOpen(false)}
                >
                  Launch brand studio
                </Link>
                <button
                  type="button"
                  className="rounded-xl border border-white/10 px-4 py-3 text-sm text-zinc-400 transition hover:text-white"
                  onClick={() => setOpen(false)}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AxiomChatDrawer
        open={chatOpen}
        onOpenChange={setChatOpen}
        hideTrigger
        deskLabel="Axiom desk"
      />
    </>
  );
}
