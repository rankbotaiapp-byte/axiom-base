import { useCallback, useEffect, useRef, useState } from "react";
import { Drawer } from "vaul";
import { useNavigate } from "@tanstack/react-router";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { CheckCircle2, LoaderCircle, Lock, Mail, X } from "lucide-react";
import { beginLaunchCheckout, confirmLaunchCheckout } from "@/lib/axiom/launch-checkout";
import { rememberLandingPlan } from "@/lib/axiom/funnel";
import { LAUNCH_PLAN_STORAGE_KEY, provisioningPath, type LaunchPlan } from "@/lib/axiom/launch-plans";
import { ParticleBurst } from "./ParticleBurst";
import { cn } from "@/lib/utils";

const ACCENT_HEX: Record<LaunchPlan["hue"], string> = {
  cyan: "#00ffcc",
  signal: "#ff4fd8",
  amber: "#f5b942",
};

const stripeCache = new Map<string, Promise<Stripe | null>>();
function stripeFor(key: string) {
  let p = stripeCache.get(key);
  if (!p) {
    p = loadStripe(key);
    stripeCache.set(key, p);
  }
  return p;
}

type Stage =
  | { kind: "loading" }
  | { kind: "ready"; sessionId: string; clientSecret: string; publishableKey: string }
  | { kind: "unconfigured" }
  | { kind: "confirming" }
  | { kind: "success"; next: string }
  | { kind: "error"; message: string };

/**
 * Frosted-glass slide-up drawer: Stripe Embedded Checkout inline, then a particle-burst
 * success state that hands the buyer straight to tenant provisioning.
 */
export function LaunchCheckoutDrawer({ plan, onClose }: { plan: LaunchPlan | null; onClose: () => void }) {
  const open = plan !== null;
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>({ kind: "loading" });
  const opened = useRef<string | null>(null);
  const routeTimer = useRef(0);

  const start = useCallback(async (p: LaunchPlan) => {
    setStage({ kind: "loading" });
    try {
      const res = await beginLaunchCheckout({ data: { planId: p.id } });
      if (res.status === "ready") setStage({ kind: "ready", ...res });
      else setStage({ kind: "unconfigured" });
    } catch (err) {
      setStage({ kind: "error", message: err instanceof Error ? err.message : "Checkout could not open" });
    }
  }, []);

  useEffect(() => {
    if (!plan) {
      opened.current = null;
      return;
    }
    if (opened.current === plan.id) return;
    opened.current = plan.id;
    void start(plan);
  }, [plan, start]);

  useEffect(() => () => window.clearTimeout(routeTimer.current), []);

  const succeed = useCallback(
    (p: LaunchPlan, next: string, sessionId: string | null) => {
      try {
        rememberLandingPlan(p.id === "lifetime" ? "lifetime" : "trial");
        sessionStorage.setItem(
          LAUNCH_PLAN_STORAGE_KEY,
          JSON.stringify({ planId: p.id, sessionId, settledAt: new Date().toISOString() }),
        );
      } catch {
        /* storage can be unavailable in private modes */
      }
      setStage({ kind: "success", next });
      routeTimer.current = window.setTimeout(() => {
        void navigate({ href: next });
      }, 1900);
    },
    [navigate],
  );

  const onComplete = useCallback(() => {
    if (!plan || stage.kind !== "ready") return;
    const sessionId = stage.sessionId;
    setStage({ kind: "confirming" });
    void confirmLaunchCheckout({ data: sessionId })
      .then((res) => succeed(plan, res.next, sessionId))
      .catch((err) =>
        setStage({ kind: "error", message: err instanceof Error ? err.message : "Payment could not be confirmed" }),
      );
  }, [plan, stage, succeed]);

  const locked = stage.kind === "confirming" || stage.kind === "success";

  return (
    <Drawer.Root
      open={open}
      onOpenChange={(next) => {
        if (!next && !locked) onClose();
      }}
      handleOnly
      dismissible={!locked}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-[80] bg-obsidian/60 backdrop-blur-[3px]" />
        <Drawer.Content
          className="checkout-drawer fixed inset-x-0 bottom-0 z-[90] mx-auto flex max-h-[92dvh] w-full max-w-xl flex-col outline-none"
          style={{ ["--card-accent" as string]: plan ? ACCENT_HEX[plan.hue] : ACCENT_HEX.cyan }}
          aria-describedby={undefined}
        >
          <div className="checkout-drawer-glass relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-[28px]">
            <Drawer.Handle className="checkout-drawer-handle mx-auto mt-3" />
            <div className="flex items-start justify-between gap-4 px-6 pt-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.24em]" style={{ color: "var(--card-accent)" }}>
                  {plan?.tagline ?? "Checkout"}
                </p>
                <Drawer.Title className="mt-1.5 font-display text-2xl text-fg">
                  {plan ? `Axiom ${plan.name}` : "Checkout"}
                </Drawer.Title>
                {plan ? (
                  <p className="mt-1 text-sm text-muted">
                    <span className="font-semibold text-fg">{plan.priceLabel}</span> {plan.priceNote}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={locked}
                className="grid size-11 shrink-0 place-items-center rounded-full border border-line text-muted transition hover:text-fg disabled:opacity-40"
                aria-label="Close checkout"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="relative mt-5 min-h-[22rem] flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-6">
              {plan ? (
                <StageBody
                  plan={plan}
                  stage={stage}
                  onComplete={onComplete}
                  onRetry={() => void start(plan)}
                  onSimulate={() => succeed(plan, provisioningPath(plan.id), null)}
                />
              ) : null}
            </div>

            <p className="flex items-center justify-center gap-1.5 border-t border-line px-6 py-3 text-[11px] text-faint">
              <Lock className="size-3" aria-hidden /> Payments secured by Stripe · Gear Guardian LLC
            </p>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

function StageBody({
  plan,
  stage,
  onComplete,
  onRetry,
  onSimulate,
}: {
  plan: LaunchPlan;
  stage: Stage;
  onComplete: () => void;
  onRetry: () => void;
  onSimulate: () => void;
}) {
  if (stage.kind === "loading" || stage.kind === "confirming") {
    return (
      <div className="grid h-full min-h-[20rem] place-items-center">
        <div className="flex flex-col items-center gap-3 text-sm text-muted">
          <LoaderCircle className="size-6 animate-spin" style={{ color: "var(--card-accent)" }} aria-hidden />
          {stage.kind === "loading" ? "Opening secure checkout…" : "Confirming payment with Stripe…"}
        </div>
      </div>
    );
  }

  if (stage.kind === "ready") {
    return (
      <div className="checkout-embed overflow-hidden rounded-2xl">
        <EmbeddedCheckoutProvider
          key={stage.sessionId}
          stripe={stripeFor(stage.publishableKey)}
          options={{ clientSecret: stage.clientSecret, onComplete }}
        >
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      </div>
    );
  }

  if (stage.kind === "success") {
    return (
      <div className="relative grid min-h-[22rem] place-items-center overflow-hidden">
        <ParticleBurst accent={ACCENT_HEX[plan.hue]} />
        <div className="relative flex flex-col items-center gap-3 text-center">
          <span className="checkout-success-ring grid size-16 place-items-center rounded-full">
            <CheckCircle2 className="size-8" style={{ color: "var(--card-accent)" }} aria-hidden />
          </span>
          <p className="font-display text-2xl text-fg">You’re in.</p>
          <p className="max-w-xs text-sm text-muted" aria-live="polite">
            Provisioning your Axiom tenant — routing you to setup now.
          </p>
        </div>
      </div>
    );
  }

  if (stage.kind === "unconfigured") {
    return (
      <div className="grid min-h-[20rem] content-center gap-4 text-center">
        <p className="text-sm text-muted">Card checkout isn’t switched on for this site yet.</p>
        <a
          href={`mailto:hello@axiom.shop?subject=${encodeURIComponent(`Axiom ${plan.name}`)}`}
          className="mx-auto inline-flex min-h-12 items-center gap-2 rounded-full border border-line px-6 font-mono text-xs uppercase tracking-[0.18em] text-fg transition hover:border-accent/60"
        >
          <Mail className="size-4" aria-hidden /> Reserve by email
        </a>
        <a
          href={provisioningPath(plan.id)}
          className="mx-auto font-mono text-[11px] uppercase tracking-[0.18em] text-faint underline-offset-4 hover:text-fg hover:underline"
        >
          Continue to setup · /start
        </a>
        {import.meta.env.DEV ? (
          <button
            type="button"
            onClick={onSimulate}
            className="mx-auto font-mono text-[11px] uppercase tracking-[0.18em] text-faint underline-offset-4 hover:text-fg hover:underline"
          >
            Dev only · simulate a paid checkout
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="grid min-h-[20rem] content-center gap-4 text-center">
      <p className="text-sm text-danger">{stage.message}</p>
      <button
        type="button"
        onClick={onRetry}
        className={cn(
          "mx-auto inline-flex min-h-12 items-center rounded-full border border-line px-6",
          "font-mono text-xs uppercase tracking-[0.18em] text-fg transition hover:border-accent/60",
        )}
      >
        Try again
      </button>
    </div>
  );
}
