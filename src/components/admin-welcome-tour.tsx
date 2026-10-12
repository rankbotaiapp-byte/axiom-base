import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const SEEN_PREFIX = "axiom:admin-welcome:";
export const ADMIN_WELCOME_SRC = "/media/heroes/admin-welcome.mp4";

function welcomeSeen(shopSlug: string): boolean {
  try {
    return localStorage.getItem(SEEN_PREFIX + shopSlug) === "1";
  } catch {
    return false;
  }
}

function markWelcomeSeen(shopSlug: string) {
  try {
    localStorage.setItem(SEEN_PREFIX + shopSlug, "1");
  } catch {
    /* a private window still closes for this visit */
  }
}

export function AdminWelcomeTour({
  shopSlug,
  shopName,
  active,
}: {
  shopSlug: string;
  shopName: string;
  active: boolean;
}) {
  const [open, setOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!active || welcomeSeen(shopSlug)) return;
    setOpen(true);
  }, [active, shopSlug]);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") dismiss();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, shopSlug]);

  function dismiss() {
    videoRef.current?.pause();
    markWelcomeSeen(shopSlug);
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-bg/80 p-4 sm:items-center" role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-welcome-title"
        className="w-full max-w-2xl rounded-[24px] bg-surface p-5 shadow-[0_0_0_1px_rgba(243,241,235,0.08)] sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted">First visit</p>
            <h2 id="admin-welcome-title" className="mt-1 font-display text-3xl leading-none">
              {shopName}
            </h2>
            <p className="mt-2 text-sm text-muted">A short tour of the desk. It stays closed after this.</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={dismiss}
            aria-label="Close welcome tour"
            className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-2 text-muted hover:text-fg"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="mt-4 overflow-hidden rounded-xl bg-bg shadow-[0_0_0_1px_rgba(243,241,235,0.08)]">
          <video
            ref={videoRef}
            className="aspect-video w-full"
            src={ADMIN_WELCOME_SRC}
            autoPlay
            muted
            playsInline
            controls
          />
        </div>
        <div className="mt-4 flex justify-end">
          <Button type="button" onClick={dismiss}>
            Enter the desk
          </Button>
        </div>
      </div>
    </div>
  );
}
