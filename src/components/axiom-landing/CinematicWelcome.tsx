import { useEffect, useState } from "react";
import { ArrowRight, Check } from "lucide-react";

const KEY = "axiom_pending_tenant";

/** Stripe Payment Link success → poll until the webhook marks the tenant active. */
export function CinematicWelcome({ initialSlug }: { initialSlug?: string }) {
  const [slug, setSlug] = useState<string | null>(initialSlug ?? null);
  const [state, setState] = useState<"waiting" | "active" | "slow" | "missing">("waiting");
  const [name, setName] = useState("");

  useEffect(() => {
    let s: string | null = initialSlug ?? null;
    try {
      s ||= localStorage.getItem(KEY);
    } catch {
      /* ignore */
    }
    if (!s) {
      setState("missing");
      return;
    }
    setSlug(s);
    let tries = 0;
    let timer: number;
    const poll = async () => {
      tries++;
      try {
        const r = await fetch(`/api/tenants/${encodeURIComponent(s!)}`, { cache: "no-store" });
        if (r.ok) {
          const j = (await r.json()) as { business_name?: string; status?: string };
          setName(j.business_name ?? "");
          if (j.status === "active") {
            try {
              localStorage.removeItem(KEY);
            } catch {
              /* ignore */
            }
            setState("active");
            return;
          }
        }
      } catch {
        /* retry */
      }
      if (tries > 45) {
        setState("slow");
        return;
      }
      timer = window.setTimeout(poll, 2000);
    };
    void poll();
    return () => window.clearTimeout(timer);
  }, [initialSlug]);

  return (
    <main className="axiom-master grid min-h-svh place-items-center bg-ink px-6 text-center">
      <div className="max-w-md">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-ember to-copper text-3xl text-ink shadow-[0_0_50px_-8px_rgb(224_138_60/0.9)]">
          {state === "active" ? <Check className="h-8 w-8" strokeWidth={2.5} aria-hidden /> : "…"}
        </div>
        {state === "active" && slug && (
          <>
            <h1 className="mt-6 font-display text-3xl font-bold text-white">{name} is live.</h1>
            <p className="mt-3 text-mist">
              Your site already shows your name, phone and logo. Bookmark it and share it with customers.
            </p>
            <a href={`/t/${slug}`} className="btn btn-primary mt-8">
              Open my site <ArrowRight className="ml-1 inline-block h-4 w-4" aria-hidden />
            </a>
          </>
        )}
        {state === "waiting" && (
          <>
            <h1 className="mt-6 font-display text-3xl font-bold text-white">Payment received — building your site</h1>
            <p className="mt-3 text-mist">This usually takes a few seconds.</p>
          </>
        )}
        {state === "slow" && (
          <>
            <h1 className="mt-6 font-display text-3xl font-bold text-white">Almost there</h1>
            <p className="mt-3 text-mist">Your payment is in. Your site link will be emailed to you as soon as setup finishes.</p>
          </>
        )}
        {state === "missing" && (
          <>
            <h1 className="mt-6 font-display text-3xl font-bold text-white">Thanks for your purchase</h1>
            <p className="mt-3 text-mist">Check your email for your site link.</p>
          </>
        )}
      </div>
    </main>
  );
}
