"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { GROK_PROVIDERS, authClient, signIn } from "@/lib/auth/client";
import {
  LOCAL_DEV_CHANNEL_TOKEN,
  LOCAL_DEV_DEFAULT_EMAIL,
  localDevAuthAllowedClient,
} from "@/lib/auth/local-dev-bypass";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { claimMasterBypass, masterEntry, masterGate } from "@/lib/axiom/master";
import { GlassButton, HudAudioProvider, HudOverlay, OrbitStage, SITE } from "@/components/obsidian-core";
import { cn } from "@/lib/utils";
import "@/components/obsidian-core/obsidian-core.css";

const VOID_DEST = "/shops";
const ADMIN_DEST = "/admin/master-dashboard";

type PortalIntent = "void" | "admin" | null;
type AuthPanel = "idle" | "credential" | "master-key" | "denied";

function safePath(value: string | undefined, fallback: string): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\") || value.includes("://")) {
    return fallback;
  }
  return value;
}

function authErrorMessage(message: string | undefined) {
  if (!message || message === "Invalid email or password" || message === "User not found") {
    return "Channel rejected — credentials do not match a linked account.";
  }
  return message;
}

function goToPath(path: string) {
  if (typeof window !== "undefined") {
    window.location.assign(path);
    return;
  }
}

type SignInPortalProps = {
  next?: string;
  /**
   * When true (local `?dev=1` only), show the local bypass button and auto-sign-in.
   * Must stay false in production builds and whenever `dev` is not explicitly enabled.
   */
  autoDevBypass?: boolean;
};

/**
 * Dual-entry sign-in portal on the OBSIDIAN//CORE cinematic shell.
 * ENTER THE VOID → /shops (or `next`) · ADMIN ACCESS → master desk / `next`
 * Local dev: any email + empty OTP provisions admin without Supabase OTP.
 */
export function SignInPortal({ next, autoDevBypass = false }: SignInPortalProps = {}) {
  const navigate = useNavigate();
  const { user, isPending } = useCurrentUserState();
  const localDev = localDevAuthAllowedClient();
  // Bypass chrome only when local/dev runtime AND `?dev=1` (autoDevBypass). Never in production.
  const showLocalBypassUi = localDev && autoDevBypass;

  const [intent, setIntent] = useState<PortalIntent>(null);
  const [panel, setPanel] = useState<AuthPanel>("idle");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState(showLocalBypassUi ? LOCAL_DEV_DEFAULT_EMAIL : "");
  const [otp, setOtp] = useState("");
  const [masterKey, setMasterKey] = useState("");
  const autoRan = useRef(false);

  const resolvedVoid = useMemo(() => safePath(next, VOID_DEST), [next]);
  const deepLink = useMemo(() => {
    const path = safePath(next, "");
    return path || null;
  }, [next]);

  const finishTo = useCallback(
    async (target: string) => {
      const path = safePath(target, VOID_DEST);
      // Arbitrary shop/admin paths are not typed routes — hard navigate.
      if (
        path === "/shops" ||
        path === "/welcome" ||
        path === "/onboard" ||
        path === ADMIN_DEST ||
        path === "/admin" ||
        path === "/master"
      ) {
        if (path === "/shops") await navigate({ to: "/shops" });
        else if (path === "/welcome") await navigate({ to: "/welcome" });
        else if (path === "/onboard") await navigate({ to: "/onboard" });
        else if (path === ADMIN_DEST || path === "/admin" || path === "/master") {
          await navigate({ to: "/admin/master-dashboard" });
        }
        return;
      }
      goToPath(path);
    },
    [navigate],
  );

  const routeAuthorized = useCallback(
    async (target: "void" | "admin") => {
      // Prefer the requested `next` deep-link (e.g. /axiom-auto/admin) after auth.
      if (deepLink && deepLink !== VOID_DEST && deepLink !== "/login") {
        const isMasterDesk =
          deepLink === ADMIN_DEST || deepLink === "/admin" || deepLink === "/master";
        if (!isMasterDesk || target === "void") {
          await finishTo(deepLink);
          return;
        }
      }

      if (target === "void") {
        await finishTo(resolvedVoid);
        return;
      }

      try {
        const entry = await masterEntry();
        if (entry.access === "bypass") {
          await finishTo(ADMIN_DEST);
          return;
        }
        try {
          const gate = await masterGate();
          if (gate.open) {
            await finishTo(ADMIN_DEST);
            return;
          }
        } catch {
          /* not platform owner */
        }
        if (entry.configured) {
          setPanel("master-key");
          setError(null);
          return;
        }
        // Local/dev: skip master-key dead-end and honor next or master desk.
        if (localDev) {
          await finishTo(deepLink ?? ADMIN_DEST);
          return;
        }
        setPanel("denied");
        setError("Master clearance required. Sign in with a platform owner account.");
      } catch {
        if (localDev) {
          await finishTo(deepLink ?? ADMIN_DEST);
          return;
        }
        setPanel("denied");
        setError("Secure gate unreachable. Retry or use owner credentials.");
      }
    },
    [deepLink, finishTo, localDev, resolvedVoid],
  );

  const beginIntent = useCallback(
    async (nextIntent: "void" | "admin") => {
      setIntent(nextIntent);
      setError(null);
      setBusy(true);
      try {
        if (isPending) return;
        if (!user) {
          setPanel("credential");
          return;
        }
        await routeAuthorized(nextIntent);
      } finally {
        setBusy(false);
      }
    },
    [isPending, routeAuthorized, user],
  );

  useEffect(() => {
    if (!user || !intent || panel === "master-key" || panel === "denied") return;
    if (panel !== "idle" && panel !== "credential") return;
    void (async () => {
      setBusy(true);
      try {
        await routeAuthorized(intent);
      } finally {
        setBusy(false);
      }
    })();
  }, [intent, panel, routeAuthorized, user]);

  async function submitCredentials(e?: FormEvent, laneOverride?: "void" | "admin") {
    e?.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const trimmedEmail = email.trim() || LOCAL_DEV_DEFAULT_EMAIL;
      const password =
        localDev && (!otp.trim() || otp.trim().toLowerCase() === "dev" || otp.trim().toLowerCase() === "local")
          ? LOCAL_DEV_CHANNEL_TOKEN
          : otp;

      if (localDev && password === LOCAL_DEV_CHANNEL_TOKEN) {
        // Ensure account exists even if Better Auth rejects empty-body edge cases.
        await authClient.signUp.email({
          email: trimmedEmail,
          password: LOCAL_DEV_CHANNEL_TOKEN,
          name: trimmedEmail.split("@")[0] || "Local Admin",
        }).catch(() => undefined);
      }

      const { error: err } = await authClient.signIn.email({
        email: trimmedEmail,
        password,
      });
      if (err) throw new Error(authErrorMessage(err.message));
      setPanel("idle");
      const lane =
        laneOverride ?? intent ?? (deepLink?.includes("/admin") ? "admin" : "void");
      setIntent(lane);
      await routeAuthorized(lane);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  async function submitMasterKey(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await claimMasterBypass({ data: { key: masterKey.trim() } });
      await finishTo(deepLink && deepLink.includes("/admin") ? deepLink : ADMIN_DEST);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Key rejected");
    } finally {
      setBusy(false);
    }
  }

  function closePanel() {
    setPanel("idle");
    setIntent(null);
    setError(null);
    setMasterKey("");
  }

  // `?dev=1` (or autoDevBypass) — local only: open credential lane and sign in.
  useEffect(() => {
    if (!localDev || !autoDevBypass || autoRan.current || isPending || user) return;
    autoRan.current = true;
    setIntent(deepLink?.includes("/admin") ? "admin" : "void");
    setPanel("credential");
    setEmail((prev) => prev || LOCAL_DEV_DEFAULT_EMAIL);
    setOtp("");
    void (async () => {
      setBusy(true);
      setError(null);
      try {
        const trimmedEmail = LOCAL_DEV_DEFAULT_EMAIL;
        await authClient.signUp.email({
          email: trimmedEmail,
          password: LOCAL_DEV_CHANNEL_TOKEN,
          name: "Local Admin",
        }).catch(() => undefined);
        const { error: err } = await authClient.signIn.email({
          email: trimmedEmail,
          password: LOCAL_DEV_CHANNEL_TOKEN,
        });
        if (err) throw new Error(authErrorMessage(err.message));
        setPanel("idle");
        await routeAuthorized(deepLink?.includes("/admin") ? "admin" : "void");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Local bypass failed");
        setPanel("credential");
      } finally {
        setBusy(false);
      }
    })();
  }, [autoDevBypass, deepLink, isPending, localDev, routeAuthorized, user]);

  return (
    <HudAudioProvider>
      <div className="obsidian-core relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#030712] text-white">
        <OrbitStage src={SITE.home.video} poster={SITE.home.poster}>
          <div className="relative z-10 mx-auto flex h-full w-full max-w-4xl flex-col items-center justify-center space-y-8 px-6 text-center">
            <div className="space-y-2">
              <h1 className="text-4xl font-black tracking-wider text-[#00ffcc] drop-shadow-[0_0_15px_rgba(0,255,204,0.4)] md:text-6xl">
                AXIOM
              </h1>
              <p className="text-sm uppercase tracking-widest text-gray-400 md:text-base">
                Storefront / Secure Encrypted Portal V4.2
              </p>
            </div>

            <div className="mx-auto mt-4 grid w-full max-w-2xl grid-cols-1 gap-6 md:grid-cols-2">
              <GlassButton
                tone="cyan"
                disabled={busy || isPending}
                onClick={() => void beginIntent("void")}
                className="w-full"
              >
                ENTER THE VOID
              </GlassButton>
              <GlassButton
                tone="amber"
                disabled={busy || isPending}
                onClick={() => void beginIntent("admin")}
                className="w-full"
              >
                ADMIN ACCESS
              </GlassButton>
            </div>

            <p className="obsidian-glass-3d max-w-md rounded-2xl border border-white/10 px-4 py-2 text-xs text-gray-400 backdrop-blur-md">
              Access client storefronts or the master command terminal. Unauthorized sessions are intercepted at the gate.
            </p>

            {showLocalBypassUi ? (
              <button
                type="button"
                disabled={busy || isPending}
                onClick={() => {
                  const lane = deepLink?.includes("/admin") ? "admin" : "void";
                  setIntent(lane);
                  setEmail(LOCAL_DEV_DEFAULT_EMAIL);
                  setOtp("");
                  setPanel("credential");
                  void submitCredentials(undefined, lane);
                }}
                className="rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-amber-200 hover:bg-amber-400/20 disabled:opacity-60"
              >
                Local dev bypass · {LOCAL_DEV_DEFAULT_EMAIL}
              </button>
            ) : null}

            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gray-500">
              {user ? `Linked · ${user.primaryEmail ?? user.displayName ?? "operator"}` : "Uplink standby · auth required"}
            </p>
          </div>
        </OrbitStage>

        <HudOverlay node="AUTH-01" depth="PORTAL" />

        {panel !== "idle" ? (
          <div className="absolute inset-0 z-40 grid place-items-center bg-[#030712]/75 px-4 backdrop-blur-md">
            <div
              className={cn(
                "w-full max-w-md rounded-2xl border bg-[#0a0f1a]/95 p-6 text-left shadow-[0_0_48px_rgba(0,255,204,0.12)]",
                panel === "master-key" ? "border-amber-400/35" : "border-[#00ffcc]/30",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p
                    className={cn(
                      "font-mono text-[10px] uppercase tracking-[0.24em]",
                      panel === "master-key" ? "text-amber-300/80" : "text-[#00ffcc]/80",
                    )}
                  >
                    {panel === "master-key"
                      ? "Master key exchange"
                      : panel === "denied"
                        ? "Access denied"
                        : showLocalBypassUi
                          ? "Local development channel"
                          : "Secure OTP channel"}
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-white">
                    {panel === "master-key"
                      ? "Claim bypass"
                      : panel === "denied"
                        ? "Clearance failed"
                        : intent === "admin"
                          ? "Admin authentication"
                          : "Operator authentication"}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={closePanel}
                  className="rounded-lg border border-white/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-gray-400 hover:text-white"
                >
                  Close
                </button>
              </div>

              {panel === "credential" ? (
                <form onSubmit={(e) => void submitCredentials(e)} className="mt-5 grid gap-3">
                  <p className="text-sm text-gray-400">
                    {showLocalBypassUi
                      ? "Local mode: any email signs you in as shop admin. OTP optional — leave blank or use “dev”."
                      : "Email + channel token (Supabase-bridged Better Auth). Unauthorized sessions are intercepted."}
                  </p>
                  <label className="grid gap-1.5">
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">Email</span>
                    <input
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={showLocalBypassUi ? LOCAL_DEV_DEFAULT_EMAIL : undefined}
                      className="h-11 rounded-xl border border-[#00ffcc]/30 bg-[#030712] px-3 text-sm text-white outline-none focus:border-[#00ffcc]/70"
                    />
                  </label>
                  <label className="grid gap-1.5">
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">
                      {showLocalBypassUi ? "OTP / Channel token (optional)" : "OTP / Channel token"}
                    </span>
                    <input
                      type="password"
                      autoComplete="current-password"
                      required={!showLocalBypassUi}
                      minLength={showLocalBypassUi ? 0 : 8}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder={showLocalBypassUi ? "leave blank for local bypass" : undefined}
                      className="h-11 rounded-xl border border-[#00ffcc]/30 bg-[#030712] px-3 text-sm text-white outline-none focus:border-[#00ffcc]/70"
                    />
                  </label>
                  {error ? <p className="text-sm text-red-400">{error}</p> : null}
                  <button
                    type="submit"
                    disabled={busy}
                    className="mt-1 h-11 rounded-xl border border-[#00ffcc]/50 bg-[#00ffcc]/15 font-medium text-white hover:bg-[#00ffcc]/25 disabled:opacity-60"
                  >
                    {busy ? "Verifying…" : "Authenticate"}
                  </button>
                  <div className="my-1 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.18em] text-gray-600">
                    <span className="h-px flex-1 bg-white/10" />
                    or
                    <span className="h-px flex-1 bg-white/10" />
                  </div>
                  <div className="grid gap-2">
                    {GROK_PROVIDERS.map((p) => (
                      <button
                        key={p.providerId}
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          const dest = deepLink ?? (intent === "admin" ? ADMIN_DEST : resolvedVoid);
                          void signIn(p.providerId, { callbackURL: dest, errorCallbackURL: "/login" });
                        }}
                        className="h-10 rounded-xl border border-white/12 bg-white/5 text-sm text-white hover:border-[#00ffcc]/40 hover:bg-[#00ffcc]/10"
                      >
                        Continue with {p.label}
                      </button>
                    ))}
                  </div>
                </form>
              ) : null}

              {panel === "master-key" ? (
                <form onSubmit={(e) => void submitMasterKey(e)} className="mt-5 grid gap-3">
                  <p className="text-sm text-gray-400">
                    Platform owner session missing. Enter the master bypass key to open the desk.
                  </p>
                  <label className="grid gap-1.5">
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-amber-300/70">Owner key</span>
                    <input
                      type="password"
                      required
                      minLength={16}
                      value={masterKey}
                      onChange={(e) => setMasterKey(e.target.value)}
                      className="h-11 rounded-xl border border-amber-400/35 bg-[#030712] px-3 text-sm text-white outline-none focus:border-amber-300/70"
                    />
                  </label>
                  {error ? <p className="text-sm text-red-400">{error}</p> : null}
                  <button
                    type="submit"
                    disabled={busy}
                    className="h-11 rounded-xl border border-amber-400/50 bg-amber-400/15 font-medium text-white hover:bg-amber-400/25 disabled:opacity-60"
                  >
                    {busy ? "Opening…" : "Unlock master desk"}
                  </button>
                </form>
              ) : null}

              {panel === "denied" ? (
                <div className="mt-5 grid gap-3">
                  <p className="text-sm text-red-400">{error ?? "Unauthorized."}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setPanel("credential");
                      setError(null);
                    }}
                    className="h-11 rounded-xl border border-[#00ffcc]/40 bg-[#00ffcc]/12 text-sm text-white"
                  >
                    Retry authentication
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </HudAudioProvider>
  );
}

export { VOID_DEST, ADMIN_DEST, safePath as safePortalPath };
