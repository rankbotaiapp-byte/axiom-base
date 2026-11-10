import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, LoaderCircle, Mail, MessageSquare, ShieldCheck, Smartphone } from "lucide-react";
import { PwaInstallButton } from "@/components/onboard/pwa-install-button";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { getOnboardSuccess, grantOnboardLaunch } from "@/lib/axiom/plumber-outreach.functions";
import { checkDispatchMobile } from "@/lib/axiom/plumber-outreach";
import { isCheckoutSessionId, shopAdminHref, type OnboardSuccessRead } from "@/lib/axiom/onboard-success";
import { isNotifyEmail } from "@/lib/axiom/notify-target";

type Search = { session_id?: string };

export const Route = createFileRoute("/onboard/success")({
  validateSearch: (search: Record<string, unknown>): Search => {
    const raw = typeof search.session_id === "string" ? search.session_id.trim() : "";
    return isCheckoutSessionId(raw) ? { session_id: raw } : {};
  },
  head: () => ({
    meta: [
      { title: "Launch your shop desk — Axiom" },
      { name: "robots", content: "noindex" },
      { name: "theme-color", content: "#030712" },
    ],
  }),
  component: OnboardSuccess,
});

function OnboardSuccess() {
  const { session_id: sessionId } = Route.useSearch();
  const [page, setPage] = useState<OnboardSuccessRead | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [sms, setSms] = useState(true);
  const [emailChannel, setEmailChannel] = useState(true);
  const [push, setPush] = useState(true);
  const [fieldError, setFieldError] = useState("");
  const [launching, setLaunching] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    void getOnboardSuccess({ data: sessionId })
      .then((next) => {
        if (cancelled) return;
        setPage(next);
        setPhone(next.phone);
        setEmail(next.email);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "This checkout session could not be confirmed.");
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  async function onGrant(event: FormEvent) {
    event.preventDefault();
    if (!sessionId || launching) return;
    const cell = checkDispatchMobile(phone);
    if (!cell.ok) {
      setFieldError(cell.reason);
      return;
    }
    if (!isNotifyEmail(email)) {
      setFieldError("Enter the inbox that should get booking alerts.");
      return;
    }
    setFieldError("");
    setLaunching(true);
    if (push && "Notification" in window && Notification.permission === "default") {
      try {
        await Notification.requestPermission();
      } catch {
        /* permission APIs can be missing in embedded browsers */
      }
    }
    try {
      const launched = await grantOnboardLaunch({
        data: { sessionId, phone, email, sms, emailChannel, push },
      });
      window.location.assign(launched.deskPath || shopAdminHref(launched.shopSlug, launched.claimToken));
    } catch (err) {
      setLaunching(false);
      setFieldError(err instanceof Error ? err.message : "Launch did not finish. Try again.");
    }
  }

  if (!sessionId) {
    return (
      <main className="grid min-h-dvh place-items-center bg-bg px-4 text-fg">
        <div className="max-w-md text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent">Checkout</p>
          <h1 className="mt-3 font-display text-2xl font-bold tracking-tight">Finish payment first</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">This launch desk only opens after Stripe confirms the $1 trial.</p>
          <Link to="/onboard" className="mt-6 inline-flex text-sm text-accent underline-offset-4 hover:underline">
            Back to onboarding
          </Link>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="grid min-h-dvh place-items-center bg-bg px-4 text-fg">
        <div className="max-w-md text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-danger">Payment</p>
          <h1 className="mt-3 font-display text-2xl font-bold tracking-tight">We could not open this desk</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">{error}</p>
        </div>
      </main>
    );
  }

  if (!page) {
    return (
      <main className="grid min-h-dvh place-items-center bg-bg text-fg">
        <p className="flex items-center gap-2 text-sm text-muted">
          <LoaderCircle className="animate-spin" size={18} aria-hidden /> Confirming Stripe…
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-bg px-4 py-8 text-fg">
      <div className="mx-auto grid w-full max-w-lg gap-6">
        <header className="grid gap-2">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent">Paid · {page.businessName}</p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-balance">Put the desk on this phone.</h1>
          <p className="text-sm leading-relaxed text-muted">
            {page.city ? `${page.city} is locked. ` : ""}
            Add the app, confirm where jobs should ring, then Grant & Launch. Your shop opens in a few seconds.
          </p>
        </header>

        <section className="grid gap-3 rounded-2xl bg-surface p-5 shadow-[0_0_0_1px_var(--color-line)]">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">Home screen</p>
          <PwaInstallButton />
        </section>

        <form className="grid gap-4 rounded-2xl bg-surface p-5 shadow-[0_0_0_1px_var(--color-line)]" onSubmit={onGrant}>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">Permission handshake</p>

          <div>
            <Label htmlFor="onboard-phone">Booking phone</Label>
            <Input
              id="onboard-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.slice(0, 24))}
              placeholder="Cell that should get dispatch texts"
              required
            />
          </div>
          <div>
            <Label htmlFor="onboard-email">Notification email</Label>
            <Input
              id="onboard-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value.slice(0, 120))}
              placeholder="Inbox for booking alerts"
              required
            />
          </div>

          <fieldset className="grid gap-2">
            <legend className="mb-1 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">Channels</legend>
            <label className="flex min-h-11 items-center gap-3 text-sm">
              <input type="checkbox" checked={sms} onChange={(e) => setSms(e.target.checked)} className="size-4 accent-accent" />
              <MessageSquare size={16} className="text-accent" aria-hidden /> Twilio SMS dispatch
            </label>
            <label className="flex min-h-11 items-center gap-3 text-sm">
              <input type="checkbox" checked={emailChannel} onChange={(e) => setEmailChannel(e.target.checked)} className="size-4 accent-accent" />
              <Mail size={16} className="text-accent" aria-hidden /> Resend email alerts
            </label>
            <label className="flex min-h-11 items-center gap-3 text-sm">
              <input type="checkbox" checked={push} onChange={(e) => setPush(e.target.checked)} className="size-4 accent-accent" />
              <Bell size={16} className="text-accent" aria-hidden /> Browser push (this device)
            </label>
          </fieldset>

          {fieldError ? (
            <p className="text-sm font-medium text-danger" role="alert">
              {fieldError}
            </p>
          ) : (
            <p className="flex items-start gap-2 text-xs leading-relaxed text-muted">
              <ShieldCheck size={14} className="mt-0.5 shrink-0 text-accent" aria-hidden />
              Saves to your shop, arms SMS and email in the background, then opens the live desk.
            </p>
          )}

          <Button type="submit" variant="accent" size="lg" className="w-full min-h-12" disabled={launching}>
            {launching ? (
              <>
                <LoaderCircle className="animate-spin" size={18} aria-hidden /> Launching desk…
              </>
            ) : (
              <>
                <Smartphone size={18} aria-hidden /> Grant & Launch
              </>
            )}
          </Button>
        </form>
      </div>
    </main>
  );
}
