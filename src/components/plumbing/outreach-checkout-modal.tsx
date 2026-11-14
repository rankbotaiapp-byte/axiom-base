import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { CheckCircle2, LoaderCircle, Lock, MessageSquareText, ShieldCheck, Smartphone, TriangleAlert, X } from "lucide-react";
import { ensureFunnelSession } from "@/lib/axiom/master";
import { onboardSuccessHref } from "@/lib/axiom/onboard-success";
import {
  checkDispatchMobile,
  fillTemplate,
  type OutreachTenant,
  type PlumberOutreachConfig,
} from "@/lib/axiom/plumber-outreach";
import {
  beginOutreachCheckout,
  confirmOutreachCheckout,
  lockDispatchMobile,
  sendTestDispatch,
} from "@/lib/axiom/plumber-outreach.functions";
import { axiomTactile } from "@/lib/axiom/tactile-engine";
import { KineticButton } from "./kinetic-button";

const stripeCache = new Map<string, Promise<Stripe | null>>();
function stripeFor(key: string) {
  let p = stripeCache.get(key);
  if (!p) {
    p = loadStripe(key);
    stripeCache.set(key, p);
  }
  return p;
}

/** Survives a reload between paying and locking the number, so the lock can never be skipped. */
export function outreachSessionKey(slug: string) {
  return `axiom.po.session:${slug}`;
}

function remember(slug: string, sessionId: string | null) {
  try {
    if (sessionId) sessionStorage.setItem(outreachSessionKey(slug), sessionId);
    else sessionStorage.removeItem(outreachSessionKey(slug));
  } catch {
    /* storage can be unavailable in private modes */
  }
}

type Stage =
  | { kind: "loading" }
  | { kind: "pay"; sessionId: string; clientSecret: string; publishableKey: string }
  | { kind: "blocked"; message: string }
  | { kind: "error"; message: string }
  | { kind: "confirming"; sessionId: string }
  | { kind: "mobile"; sessionId: string }
  | { kind: "test"; sessionId: string; display: string }
  | { kind: "preview-pay" };

type TestState =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent"; to: string }
  | { kind: "note"; tone: "warn" | "bad"; message: string };

const PREVIEW_SESSION = "preview";

/**
 * $1 Choose Your Price trial, start to finish, without leaving the page:
 * Stripe Embedded Checkout bound to this link's territory → a mandatory direct
 * cell number (555 placeholder lines refused) → "Test Live SMS Dispatch".
 *
 * `preview` (admin studio) walks the same screens with nothing charged and nothing sent.
 */
export function OutreachCheckoutModal({
  open,
  onClose,
  tenant,
  config,
  vars,
  resumeSessionId = null,
  preview = false,
}: {
  open: boolean;
  onClose: () => void;
  tenant: OutreachTenant;
  config: PlumberOutreachConfig;
  vars: Record<string, string>;
  /** A paid session found in this browser — reopen straight at the mobile lock. */
  resumeSessionId?: string | null;
  preview?: boolean;
}) {
  const slug = tenant.slug;
  const [deskSlug, setDeskSlug] = useState(tenant.slug);
  const [claimToken, setClaimToken] = useState("");
  const [stage, setStage] = useState<Stage>({ kind: "loading" });
  const [dollars, setDollars] = useState(config.checkout.defaultDollars);
  const [custom, setCustom] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [saving, setSaving] = useState(false);
  const [test, setTest] = useState<TestState>({ kind: "idle" });
  const run = useRef(0);
  const wasOpen = useRef(false);

  const start = useCallback(
    async (amount: number) => {
      const id = ++run.current;
      setDollars(amount);
      if (preview) {
        setStage({ kind: "preview-pay" });
        return;
      }
      setStage({ kind: "loading" });
      try {
        await ensureFunnelSession();
        const res = await beginOutreachCheckout({ data: { slug, dollars: amount } });
        if (id !== run.current) return;
        if (res.status === "ready") setStage({ kind: "pay", ...res });
        else if (res.status === "unconfigured") setStage({ kind: "blocked", message: "Card checkout isn't switched on for this page yet." });
        else setStage({ kind: "blocked", message: res.reason });
      } catch (err) {
        if (id !== run.current) return;
        setStage({ kind: "error", message: err instanceof Error ? err.message : "Checkout could not open" });
      }
    },
    [preview, slug],
  );

  const confirm = useCallback(
    async (sessionId: string) => {
      const id = ++run.current;
      setStage({ kind: "confirming", sessionId });
      try {
        const res = await confirmOutreachCheckout({ data: { slug, sessionId } });
        if (id !== run.current) return;
        if (res.shopSlug) setDeskSlug(res.shopSlug);
        if (res.claimToken) setClaimToken(res.claimToken);
        remember(slug, sessionId);
        axiomTactile.triggerStripeSettlement();
        if (!preview) {
          window.location.assign(onboardSuccessHref(sessionId));
          return;
        }
        if (res.lockedPhone) {
          const check = checkDispatchMobile(res.lockedPhone);
          setStage({ kind: "test", sessionId, display: check.ok ? check.display : res.lockedPhone });
        } else {
          setStage({ kind: "mobile", sessionId });
        }
      } catch (err) {
        if (id !== run.current) return;
        setStage({ kind: "error", message: err instanceof Error ? err.message : "Payment could not be confirmed" });
      }
    },
    [slug],
  );

  // Kick off the moment the modal opens — no extra "continue" tap before the card form.
  useEffect(() => {
    if (!open) {
      wasOpen.current = false;
      return;
    }
    if (wasOpen.current) return;
    wasOpen.current = true;
    setTest({ kind: "idle" });
    setPhoneError("");
    if (resumeSessionId && !preview) {
      window.location.assign(onboardSuccessHref(resumeSessionId));
      return;
    }
    void start(config.checkout.defaultDollars);
  }, [open, resumeSessionId, preview, confirm, start, config.checkout.defaultDollars]);

  const mustFinish = stage.kind === "confirming" || stage.kind === "mobile";

  async function saveNumber(event: FormEvent) {
    event.preventDefault();
    if (stage.kind !== "mobile") return;
    const check = checkDispatchMobile(phone);
    if (!check.ok) {
      setPhoneError(check.reason);
      return;
    }
    setPhoneError("");
    if (stage.sessionId === PREVIEW_SESSION) {
      setStage({ kind: "test", sessionId: PREVIEW_SESSION, display: check.display });
      return;
    }
    setSaving(true);
    try {
      const saved = await lockDispatchMobile({ data: { slug, sessionId: stage.sessionId, phone } });
      setStage({ kind: "test", sessionId: stage.sessionId, display: saved.display });
    } catch (err) {
      setPhoneError(err instanceof Error ? err.message : "That number could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function fireTest() {
    if (stage.kind !== "test" || test.kind === "sending") return;
    if (stage.sessionId === PREVIEW_SESSION) {
      setTest({ kind: "note", tone: "warn", message: "Studio preview — no text was sent. Buyers get a real Twilio alert here." });
      return;
    }
    setTest({ kind: "sending" });
    try {
      const res = await sendTestDispatch({ data: { slug, sessionId: stage.sessionId } });
      if (res.status === "sent") setTest({ kind: "sent", to: res.to });
      else if (res.status === "throttled") setTest({ kind: "note", tone: "warn", message: res.detail });
      else if (res.status === "skipped") {
        setTest({ kind: "note", tone: "warn", message: "Text alerts aren't switched on for this account yet — your number is saved and will be used the moment they are." });
      } else {
        setTest({ kind: "note", tone: "bad", message: res.detail || "The text did not go through. Check the number and try again." });
      }
    } catch (err) {
      setTest({ kind: "note", tone: "bad", message: err instanceof Error ? err.message : "The text did not go through." });
    }
  }

  function close() {
    if (mustFinish) return;
    if (stage.kind === "test") remember(slug, null);
    run.current += 1;
    onClose();
  }

  const step = stage.kind === "mobile" || stage.kind === "confirming" ? 2 : stage.kind === "test" ? 3 : 1;

  return (
    <Dialog.Root open={open} onOpenChange={(next) => (!next ? close() : undefined)}>
      <Dialog.Portal>
        <Dialog.Overlay className="po-modal-veil" />
        <Dialog.Content
          className="po-modal"
          aria-describedby={undefined}
          onEscapeKeyDown={(e) => (mustFinish ? e.preventDefault() : undefined)}
          onPointerDownOutside={(e) => (mustFinish || stage.kind === "pay" ? e.preventDefault() : undefined)}
          onInteractOutside={(e) => (mustFinish || stage.kind === "pay" ? e.preventDefault() : undefined)}
        >
          <header className="po-modal-head">
            <div className="min-w-0">
              <p className="po-modal-kicker">
                {preview ? "Studio preview · nothing is charged" : `Territory · ${vars.business}`}
              </p>
              <Dialog.Title className="po-modal-title">
                {step === 1 ? config.checkout.title : step === 2 ? config.mobileLock.title : config.mobileLock.doneTitle}
              </Dialog.Title>
            </div>
            <button type="button" className="po-modal-x" onClick={close} disabled={mustFinish} aria-label="Close">
              <X size={18} />
            </button>
          </header>

          <ol className="po-steps" aria-label="Progress">
            {["Pay", "Your cell", "Test alert"].map((label, i) => (
              <li key={label} data-state={i + 1 < step ? "done" : i + 1 === step ? "now" : "next"}>
                <span>{i + 1 < step ? <CheckCircle2 size={13} /> : i + 1}</span>
                {label}
              </li>
            ))}
          </ol>

          <div className="po-modal-body">
            {(stage.kind === "loading" || stage.kind === "pay" || stage.kind === "preview-pay") && (
              <>
                {config.checkout.blurb ? <p className="po-modal-blurb">{fillTemplate(config.checkout.blurb, vars)}</p> : null}
                <div className="po-amounts" role="group" aria-label="First month price">
                  {config.checkout.presets.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      className="po-amount"
                      aria-pressed={dollars === amount}
                      disabled={stage.kind === "loading"}
                      onClick={() => (dollars === amount ? undefined : void start(amount))}
                    >
                      ${amount}
                    </button>
                  ))}
                  <form
                    className="po-amount-custom"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const n = Math.round(Number(custom));
                      if (Number.isFinite(n) && n >= 1) void start(Math.min(n, 5000));
                    }}
                  >
                    <span aria-hidden>$</span>
                    <input
                      inputMode="numeric"
                      pattern="[0-9]*"
                      aria-label="Custom amount in dollars"
                      placeholder="Other"
                      value={custom}
                      onChange={(e) => setCustom(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    />
                    <button type="submit" disabled={!custom || stage.kind === "loading"}>
                      Set
                    </button>
                  </form>
                </div>
              </>
            )}

            {stage.kind === "loading" && (
              <div className="po-modal-wait">
                <LoaderCircle className="po-btn-spin" size={22} aria-hidden />
                Opening secure checkout…
              </div>
            )}

            {stage.kind === "pay" && (
              <div className="po-embed">
                <EmbeddedCheckoutProvider
                  key={stage.sessionId}
                  stripe={stripeFor(stage.publishableKey)}
                  options={{ clientSecret: stage.clientSecret, onComplete: () => void confirm(stage.sessionId) }}
                >
                  <EmbeddedCheckout />
                </EmbeddedCheckoutProvider>
              </div>
            )}

            {stage.kind === "preview-pay" && (
              <div className="po-modal-note">
                <ShieldCheck size={18} aria-hidden />
                <div>
                  <p>
                    Buyers see the Stripe card form here for <strong>${dollars}</strong>, bound to their territory.
                  </p>
                  <KineticButton size="md" variant="glass" onPress={() => setStage({ kind: "mobile", sessionId: PREVIEW_SESSION })}>
                    Preview the next step
                  </KineticButton>
                </div>
              </div>
            )}

            {stage.kind === "blocked" && (
              <div className="po-modal-note">
                <TriangleAlert size={18} aria-hidden />
                <div>
                  <p>{stage.message}</p>
                  <KineticButton size="md" href={config.checkout.fallbackHref}>
                    Continue to setup
                  </KineticButton>
                </div>
              </div>
            )}

            {stage.kind === "error" && (
              <div className="po-modal-note is-bad" role="alert">
                <TriangleAlert size={18} aria-hidden />
                <div>
                  <p>{stage.message}</p>
                  <KineticButton size="md" variant="glass" onPress={() => void start(dollars)}>
                    Try again
                  </KineticButton>
                </div>
              </div>
            )}

            {stage.kind === "confirming" && (
              <div className="po-modal-wait">
                <LoaderCircle className="po-btn-spin" size={22} aria-hidden />
                Payment cleared — opening your shop desk…
              </div>
            )}

            {stage.kind === "mobile" && (
              <form className="po-lock" onSubmit={saveNumber} noValidate>
                <p className="po-lock-paid">
                  <CheckCircle2 size={16} aria-hidden /> Payment confirmed — one step left.
                </p>
                {config.mobileLock.blurb ? <p className="po-modal-blurb">{fillTemplate(config.mobileLock.blurb, vars)}</p> : null}
                <label className="po-field" htmlFor="po-cell">
                  <span>
                    <Smartphone size={14} aria-hidden /> Direct cell number
                  </span>
                  <input
                    id="po-cell"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    autoFocus
                    required
                    placeholder="Your cell, area code first"
                    value={phone}
                    aria-invalid={phoneError ? true : undefined}
                    aria-describedby={phoneError ? "po-cell-error" : undefined}
                    onChange={(e) => {
                      setPhone(e.target.value.slice(0, 24));
                      if (phoneError) setPhoneError("");
                    }}
                  />
                </label>
                {phoneError ? (
                  <p id="po-cell-error" className="po-field-error" role="alert">
                    {phoneError}
                  </p>
                ) : (
                  <p className="po-field-hint">
                    <Lock size={12} aria-hidden /> Used only for your dispatch alerts. Message and data rates may apply.
                  </p>
                )}
                <KineticButton type="submit" block busy={saving} icon={<Lock size={18} />}>
                  Lock in my number
                </KineticButton>
              </form>
            )}

            {stage.kind === "test" && (
              <div className="po-lock">
                <p className="po-lock-paid">
                  <CheckCircle2 size={16} aria-hidden /> Alerts locked to <strong>{stage.display}</strong>
                </p>
                <KineticButton
                  block
                  variant="dispatch"
                  pulse={test.kind === "idle"}
                  busy={test.kind === "sending"}
                  icon={<MessageSquareText size={18} />}
                  onPress={() => void fireTest()}
                >
                  {config.mobileLock.testLabel}
                </KineticButton>
                <div aria-live="polite">
                  {test.kind === "sent" ? (
                    <div className="po-test-ok">
                      <CheckCircle2 size={18} aria-hidden />
                      <div>
                        <strong>Text sent to {test.to}.</strong>
                        {config.mobileLock.doneBody ? <p>{fillTemplate(config.mobileLock.doneBody, vars)}</p> : null}
                      </div>
                    </div>
                  ) : test.kind === "note" ? (
                    <p className={`po-test-note${test.tone === "bad" ? " is-bad" : ""}`}>{test.message}</p>
                  ) : (
                    <p className="po-field-hint">Tap it — your phone should buzz within a few seconds.</p>
                  )}
                </div>
                <button type="button" className="po-link" onClick={() => setStage({ kind: "mobile", sessionId: stage.sessionId })}>
                  Use a different number
                </button>
                {test.kind === "sent" || test.kind === "note" ? (
                  <>
                    <KineticButton
                      size="md"
                      variant="primary"
                      block
                      href={`/${encodeURIComponent(deskSlug)}/admin${claimToken ? `?claim=${encodeURIComponent(claimToken)}` : ""}`}
                    >
                      Open your shop desk
                    </KineticButton>
                    <KineticButton size="md" variant="glass" block onPress={close}>
                      Done
                    </KineticButton>
                  </>
                ) : null}
              </div>
            )}
          </div>

          <p className="po-modal-foot">
            <Lock size={12} aria-hidden /> Payments secured by Stripe · {config.ctas.trialNote}
          </p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
