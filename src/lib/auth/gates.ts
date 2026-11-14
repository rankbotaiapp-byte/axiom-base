"use client";

import {
  Fragment,
  createElement,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { GROK_PROVIDERS, authEnabled, signIn, signOut } from "./client";
import { hasGateSessionMarker } from "./gate-session-marker";
import { resolveSignInGateState } from "./sign-in-gate";
import { useCurrentUser, useCurrentUserState } from "./use-current-user";

const subscribeToNothing = () => () => {};
const noGateSessionOnServer = () => false;

/** Where `RedirectToSignIn` sends signed-out visitors. */
export const SIGN_IN_PATH = "/login";

export type GateResult = { ok: true } | { ok: false; reason: string; redirectTo: string };

/** Server/client auth gate check used by App Router pages. */
export function checkGate(input?: { userId?: string | null; next?: string }): GateResult {
  if (input?.userId) return { ok: true };
  const next = input?.next && input.next.startsWith("/") ? input.next : undefined;
  return {
    ok: false,
    reason: "signed_out",
    redirectTo: next ? `${SIGN_IN_PATH}?next=${encodeURIComponent(next)}` : SIGN_IN_PATH,
  };
}

/** Alias used by desk routes. */
export function checkGateAccess(userId?: string | null, next?: string) {
  return checkGate({ userId, next });
}

export function requireAuth(userId?: string | null, next?: string): asserts userId is string {
  const gate = checkGate({ userId, next });
  if (!gate.ok) throw new Error(gate.reason);
}

export function SignedIn({ children }: { children: ReactNode }) {
  const { user } = useCurrentUserState();
  return user ? createElement(Fragment, null, children) : null;
}

export function SignedOut({ children }: { children: ReactNode }) {
  const { user, isPending } = useCurrentUserState();
  if (isPending || user) return null;
  return createElement(Fragment, null, children);
}

/** Client redirect to sign-in (Next.js App Router). */
export function RedirectToSignIn({
  to = SIGN_IN_PATH,
  next,
}: {
  to?: string;
  next?: string;
}) {
  const router = useRouter();
  const back =
    next && next.startsWith("/") && !next.startsWith("//") && !next.includes("://") ? next : undefined;
  useEffect(() => {
    const href = back ? `${to}?next=${encodeURIComponent(back)}` : to;
    router.replace(href);
  }, [back, router, to]);
  return createElement("div", {
    className: "grid min-h-dvh place-items-center bg-obsidian text-sm text-muted",
    children: "Opening sign-in…",
  });
}

/** Alias for callers that import `RedirectToSignin`. */
export const RedirectToSignin = RedirectToSignIn;

export function SignInGate({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { user, isPending } = useCurrentUserState();
  const state = resolveSignInGateState({ isPending, hasUser: user !== null });
  if (state === "pending") return null;
  if (state === "signed_in") return createElement(Fragment, null, children);
  return createElement(Fragment, null, fallback ?? createElement(SignInButtons));
}

export function SignInButtons() {
  return createElement(
    "div",
    { className: "flex w-full max-w-sm flex-col gap-2" },
    GROK_PROVIDERS.map((p) =>
      createElement(
        "button",
        {
          key: p.providerId,
          type: "button",
          onClick: () => signIn(p.providerId, { callbackURL: "/" }),
          className:
            "w-full cursor-pointer rounded-md border border-neutral-300 px-4 py-2 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900",
        },
        `Continue with ${p.label}`,
      ),
    ),
  );
}

export function UserButton() {
  const user = useCurrentUser();
  const [signingOut, setSigningOut] = useState(false);
  const gateSession = useSyncExternalStore(
    subscribeToNothing,
    hasGateSessionMarker,
    noGateSessionOnServer,
  );
  if (!user) return null;
  const label = user.displayName ?? user.primaryEmail ?? "Account";
  return createElement(
    "div",
    { className: "flex items-center gap-2" },
    user.profileImageUrl
      ? createElement("img", {
          src: user.profileImageUrl,
          alt: "",
          className: "h-8 w-8 rounded-full object-cover",
        })
      : createElement(
          "span",
          {
            className:
              "grid h-8 w-8 place-items-center rounded-full bg-black/10 text-sm font-medium dark:bg-white/20",
          },
          label.charAt(0).toUpperCase(),
        ),
    createElement("span", { className: "text-sm font-medium" }, label),
    authEnabled && !gateSession
      ? createElement(
          "button",
          {
            type: "button",
            disabled: signingOut,
            onClick: () => {
              setSigningOut(true);
              void signOut().catch(() => setSigningOut(false));
            },
            className:
              "cursor-pointer text-sm underline-offset-4 opacity-70 hover:underline disabled:cursor-wait disabled:no-underline",
          },
          signingOut ? "Signing out…" : "Sign out",
        )
      : null,
  );
}
