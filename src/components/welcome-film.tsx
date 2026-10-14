import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const EMPLOYEE_SEEN_PREFIX = "axiom:employee-welcome:";
export const EMPLOYEE_WELCOME_SRC = "/media/heroes/employee-welcome.mp4";
export const OUTREACH_WELCOME_SRC = "/media/heroes/outreach-welcome.mp4";
const OUTREACH_DELAY_MS = 2500;

function welcomeSeen(key: string): boolean {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function markWelcomeSeen(key: string) {
  try {
    localStorage.setItem(key, "1");
  } catch {
    /* a private window still closes for this visit */
  }
}

function WelcomeDialog({
  titleId,
  kicker,
  title,
  body,
  action,
  src,
  onClose,
}: {
  titleId: string;
  kicker: string;
  title: string;
  body: string;
  action: string;
  src: string;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  function close() {
    videoRef.current?.pause();
    onCloseRef.current();
  }

  useEffect(() => {
    closeRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      videoRef.current?.pause();
      onCloseRef.current();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-bg/80 p-4 sm:items-center" role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-2xl rounded-[24px] bg-surface p-5 shadow-[0_0_0_1px_rgba(243,241,235,0.08)] sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted">{kicker}</p>
            <h2 id={titleId} className="mt-1 font-display text-3xl leading-none">
              {title}
            </h2>
            <p className="mt-2 text-sm text-muted">{body}</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={close}
            aria-label="Close welcome film"
            className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-2 text-muted hover:text-fg"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="mt-4 overflow-hidden rounded-xl bg-bg shadow-[0_0_0_1px_rgba(243,241,235,0.08)]">
          <video
            ref={videoRef}
            className="aspect-video w-full"
            src={src}
            autoPlay
            muted
            playsInline
            controls
          />
        </div>
        <div className="mt-4 flex justify-end">
          <Button type="button" onClick={close}>
            {action}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** First time this person opens the station on this browser. */
export function EmployeeWelcomeFilm({
  shopSlug,
  personId,
  shopName,
}: {
  shopSlug: string;
  personId: string;
  shopName: string;
}) {
  const storageKey = `${EMPLOYEE_SEEN_PREFIX}${shopSlug}:${personId}`;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (welcomeSeen(storageKey)) return;
    setOpen(true);
  }, [storageKey]);

  function dismiss() {
    markWelcomeSeen(storageKey);
    setOpen(false);
  }

  if (!open) return null;

  return (
    <WelcomeDialog
      titleId="employee-welcome-title"
      kicker="First visit"
      title={shopName}
      body="A short welcome for this station. It stays closed after this."
      action="Enter the station"
      src={EMPLOYEE_WELCOME_SRC}
      onClose={dismiss}
    />
  );
}

/** Plays a few seconds after a prospect opens an outreach link. */
export function OutreachWelcomeFilm({ active }: { active: boolean }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!active) return;
    const timer = window.setTimeout(() => setOpen(true), OUTREACH_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [active]);

  if (!open) return null;

  return (
    <WelcomeDialog
      titleId="outreach-welcome-title"
      kicker="Welcome"
      title="Your booking page"
      body="A short film for this visit."
      action="Continue"
      src={OUTREACH_WELCOME_SRC}
      onClose={() => setOpen(false)}
    />
  );
}
