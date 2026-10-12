import { useEffect, useSyncExternalStore } from "react";
import { useRouterState } from "@tanstack/react-router";
import { X } from "lucide-react";
import {
  avatarHelpFor,
  screenFromPath,
  type AvatarScreenId,
} from "@/config/avatarHelpContent";

let override: AvatarScreenId | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

/** The desk can name the tab the owner is on. Leaving the page clears it. */
export function setAvatarScreen(screen: AvatarScreenId | null) {
  override = screen;
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readOverride() {
  return override;
}

/**
 * Help for the screen in front of the owner.
 * The words are already written. Tapping the button does not call an assistant.
 */
export function AvatarHelpButton() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const pinned = useSyncExternalStore(subscribe, readOverride, () => null);
  const screen = pinned ?? screenFromPath(pathname);
  const entry = avatarHelpFor(screen);
  const open = useSyncExternalStore(subscribeOpen, readOpen, () => false);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="fixed bottom-36 left-4 z-40 flex w-[min(22rem,calc(100vw-2rem))] flex-col items-start gap-3 sm:bottom-4">
      {open ? (
        <section
          role="dialog"
          aria-labelledby="avatar-help-title"
          className="w-full rounded-[24px] bg-surface p-5 text-fg shadow-[0_0_0_1px_rgba(243,241,235,0.08)]"
        >
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-fg font-display text-xl text-bg" aria-hidden>
              E
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted">{entry.persona}</p>
              <h2 id="avatar-help-title" className="font-display text-2xl leading-none">
                {entry.title}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="grid size-11 place-items-center rounded-full text-muted hover:text-fg"
              aria-label="Close help"
            >
              <X className="size-4" />
            </button>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted">{entry.body}</p>
          <ol className="mt-4 grid gap-2 text-sm">
            {entry.steps.map((step, index) => (
              <li key={step} className="flex gap-3">
                <span className="font-display text-lg leading-none text-fg">{index + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex h-12 items-center gap-2 rounded-full bg-surface px-4 text-sm font-medium text-fg shadow-[0_0_0_1px_rgba(243,241,235,0.12)]"
        aria-expanded={open}
        aria-controls="avatar-help-title"
      >
        <span className="grid size-7 place-items-center rounded-full bg-fg font-display text-bg" aria-hidden>
          E
        </span>
        Help
      </button>
    </div>
  );
}

let openState = false;

function emitOpen() {
  for (const listener of openListeners) listener();
}

const openListeners = new Set<() => void>();

function subscribeOpen(listener: () => void) {
  openListeners.add(listener);
  return () => openListeners.delete(listener);
}

function readOpen() {
  return openState;
}

function setOpen(next: boolean) {
  openState = next;
  emitOpen();
}
