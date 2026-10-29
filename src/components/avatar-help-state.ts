import type { AvatarScreenId } from "@/config/avatarHelpContent";

let override: AvatarScreenId | null = null;
const screenListeners = new Set<() => void>();

function emitScreen() {
  for (const listener of screenListeners) listener();
}

/** The desk can name the tab the owner is on. Leaving the page clears it. */
export function setAvatarScreen(screen: AvatarScreenId | null) {
  override = screen;
  emitScreen();
}

export function subscribeAvatarScreen(listener: () => void) {
  screenListeners.add(listener);
  return () => screenListeners.delete(listener);
}

export function readAvatarScreen() {
  return override;
}

let openState = false;
const openListeners = new Set<() => void>();

function emitOpen() {
  for (const listener of openListeners) listener();
}

export function subscribeAvatarHelpOpen(listener: () => void) {
  openListeners.add(listener);
  return () => openListeners.delete(listener);
}

export function readAvatarHelpOpen() {
  return openState;
}

export function setAvatarHelpOpen(next: boolean) {
  openState = next;
  emitOpen();
}
