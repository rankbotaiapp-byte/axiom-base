import { useRef, useState, type FormEvent, type PointerEvent, type TouchEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { DOLLY_MAX, useBiokineticEngine } from "@/hooks/use-biokinetic-engine";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getShopAccess } from "@/lib/axiom/server";
import type { AccessMode } from "@/lib/axiom/types";

type Phase = "idle" | "scanning" | "routing" | "pin";

type Desk = "admin" | "employee";

const SCAN_MS = 1400;

function deskFor(mode: AccessMode): Desk | null {
  if (mode === "owner" || mode === "preview") return "admin";
  if (mode === "employee") return "employee";
  return null;
}

export function BiometricAuthGateway({ shopSlug }: { shopSlug: string }) {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const { user, isPending } = useCurrentUserState();
  const biokinetic = useBiokineticEngine({ cameraGranted: false, reducedMotion: reduce });
  const [phase, setPhase] = useState<Phase>("idle");
  const [ripples, setRipples] = useState<number[]>([]);
  const [pin, setPin] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const busy = useRef(false);
  const rippleId = useRef(0);
  const fromPin = useRef(false);
  const sessionRef = useRef({ user, isPending });
  sessionRef.current = { user, isPending };

  function pushRipple() {
    const id = rippleId.current + 1;
    rippleId.current = id;
    setRipples((current) => [...current, id]);
    window.setTimeout(() => {
      setRipples((current) => current.filter((item) => item !== id));
    }, reduce ? 0 : 700);
  }

  async function openDesk(desk: Desk) {
    setPhase("routing");
    if (reduce) biokinetic.cameraDollyScale.jump(DOLLY_MAX);
    else biokinetic.cameraDollyScale.set(DOLLY_MAX);
    window.setTimeout(() => {
      void navigate({
        to: desk === "admin" ? "/$shopSlug/admin" : "/$shopSlug/employee",
        params: { shopSlug },
      });
    }, reduce ? 0 : 480);
  }

  async function finishScan() {
    const session = sessionRef.current;
    if (session.isPending) {
      setNote("The session is still resolving.");
      setPhase("idle");
      busy.current = false;
      return;
    }
    if (!session.user) {
      setNote(fromPin.current ? "No signed-in session on this station." : null);
      fromPin.current = false;
      setPhase("pin");
      busy.current = false;
      return;
    }
    try {
      const access = await getShopAccess({ data: shopSlug });
      const desk = deskFor(access.mode);
      if (!desk) {
        setNote("This session is not on the crew for this shop.");
        setPhase("pin");
        busy.current = false;
        return;
      }
      await openDesk(desk);
    } catch {
      setNote("The session could not be read.");
      setPhase("pin");
      busy.current = false;
    }
  }

  function arm(event: PointerEvent<HTMLButtonElement> | TouchEvent<HTMLButtonElement>) {
    if (event.type === "touchstart" && busy.current) return;
    if (busy.current || phase === "scanning" || phase === "routing") return;
    busy.current = true;
    setNote(null);
    pushRipple();
    setPhase("scanning");
    window.setTimeout(() => {
      void finishScan();
    }, reduce ? 0 : SCAN_MS);
  }

  async function tryWebAuthn() {
    if (!window.PublicKeyCredential) {
      setNote("This browser has no device authenticator.");
      return;
    }
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().catch(() => false);
    if (!available) {
      setNote("No platform authenticator on this device.");
      return;
    }
    await finishScan();
  }

  function submitPin(event: FormEvent) {
    event.preventDefault();
    if (pin.length < 4) return;
    setPin("");
    fromPin.current = true;
    void finishScan();
  }

  function pressDigit(digit: string) {
    setPin((current) => (current.length >= 6 ? current : `${current}${digit}`));
  }

  return (
    <motion.section
      className="bio-gate"
      style={{ scale: biokinetic.cameraDollyScale }}
      aria-label="Biometric station"
    >
      <p className="text-[11px] uppercase tracking-[0.22em] text-muted">Station lock</p>
      <h1 className="mt-2 font-display text-4xl text-fg">{shopSlug}</h1>
      <p className="mt-2 max-w-sm text-sm text-muted">Hold the pad. The scan reads the signed-in session, then opens the right desk.</p>
      <div className="bio-stage">
      <button
        type="button"
        className={phase === "scanning" ? "bio-pad is-scanning" : "bio-pad"}
        onPointerDown={arm}
        onTouchStart={arm}
        aria-label="Start fingerprint scan"
      >
        <span className="bio-ring" aria-hidden />
        <svg className="bio-print" viewBox="0 0 120 160" aria-hidden>
          <path d="M60 18c22 0 40 18 40 44v28" />
          <path d="M28 78V62c0-18 14-32 32-32" />
          <path d="M40 96V66c0-12 9-22 20-22s20 10 20 22v36" />
          <path d="M52 108V70c0-6 4-10 8-10s8 4 8 10v30" />
          <path d="M60 128V86" />
          <path d="M34 118c6 16 16 26 26 26s20-10 26-26" />
        </svg>
        <span className="bio-laser" aria-hidden />
        {ripples.map((id) => (
          <span key={id} className="bio-ripple" aria-hidden />
        ))}
      </button>
      {phase === "pin" ? (
        <form className="bio-pin" onSubmit={submitPin} aria-label="Session PIN">
          <p className="text-[11px] uppercase tracking-[0.2em] text-accent">Session PIN</p>
          <p className="mt-2 text-sm text-muted">The pad does not mint a session. Enter a PIN to read the one already signed in.</p>
          <p className="bio-pin-dots" aria-live="polite">
            {Array.from({ length: 6 }, (_, index) => (
              <span key={index} className={index < pin.length ? "is-on" : ""} />
            ))}
          </p>
          <div className="bio-pin-grid">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
              <button key={digit} type="button" className="bio-key" onClick={() => pressDigit(digit)}>
                {digit}
              </button>
            ))}
            <button type="button" className="bio-key" onClick={() => setPin((current) => current.slice(0, -1))}>
              Del
            </button>
            <button type="button" className="bio-key" onClick={() => pressDigit("0")}>
              0
            </button>
            <button type="submit" className="bio-key is-go">
              Read
            </button>
          </div>
          <button type="button" className="bio-key mt-3 w-full" onClick={() => void tryWebAuthn()}>
            Use this device
          </button>
          <Link
            to="/login"
            search={{ next: `/${shopSlug}/gate` }}
            className="mt-3 inline-flex h-11 items-center justify-center text-sm text-accent"
          >
            Sign in
          </Link>
        </form>
      ) : null}
      </div>
      <p className="mt-4 text-xs uppercase tracking-[0.18em] text-accent">
        {phase === "scanning" ? "Scanning" : phase === "routing" ? "Opening the desk" : "Ready"}
      </p>
      {note ? <p className="mt-2 text-sm text-muted">{note}</p> : null}
    </motion.section>
  );
}
