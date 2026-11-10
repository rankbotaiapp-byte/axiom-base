import { useEffect, useState, useTransition } from "react";
import { useNavigate } from "@tanstack/react-router";
import { catalogNicheForStorefront, type PlanId } from "@/config/storefront";
import { tradeLoopUrl } from "@/config/catalog";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { leadSlugFrom, rememberLandingPlan } from "@/lib/axiom/funnel";
import { readInboundPending, writeInboundPending } from "@/lib/axiom/inbound-signup";
import { createShopFromNiche } from "@/lib/axiom/server";

interface Props {
  plan: PlanId;
  niches: { id: string; label: string }[];
}

const STAGES = ["Creating your app", "Writing your first local article", "Setting up booking", "Going live"];

export function StartForm({ plan, niches }: Props) {
  const navigate = useNavigate();
  const { user } = useCurrentUserState();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState(-1);
  const [form, setForm] = useState({
    name: "",
    niche: niches[0]?.id ?? "other",
    city: "",
    region: "OR",
    phone: "",
    email: "",
    website: "",
    notes: "",
  });
  const [pending, start] = useTransition();

  useEffect(() => {
    const saved = readInboundPending();
    if (!saved) return;
    setForm((f) => ({ ...f, name: f.name || saved.name }));
  }, []);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const canNext = form.name.trim().length > 1 && form.city.trim().length > 1;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    rememberLandingPlan(plan === "lifetime" || plan === "custom" ? "lifetime" : "trial");
    const catalogNiche = catalogNicheForStorefront(form.niche);
    writeInboundPending({ name: form.name.trim(), niche: catalogNiche });

    if (!user) {
      void navigate({
        to: "/login",
        search: { next: `/start?plan=${plan}`, dev: true },
      });
      return;
    }

    start(async () => {
      setStage(0);
      const timer = window.setInterval(() => setStage((s) => Math.min(STAGES.length - 2, s + 1)), 900);
      try {
        const result = await createShopFromNiche({
          data: {
            niche: catalogNiche,
            name: form.name.trim(),
            solo: true,
            ownerName: form.email.trim() || user.displayName || "",
            leadSlug: leadSlugFrom(form.name, form.city),
            heroFilm: tradeLoopUrl(catalogNiche),
          },
        });
        setStage(STAGES.length - 1);
        await navigate({ to: "/$shopSlug", params: { shopSlug: result.slug } });
      } catch (err) {
        setError((err as Error).message);
        setStage(-1);
      } finally {
        window.clearInterval(timer);
      }
    });
  };

  if (pending || stage >= 0) {
    return (
      <div className="glass mt-8 p-6" role="status" aria-live="polite">
        <ul className="space-y-3">
          {STAGES.map((s, i) => (
            <li key={s} className={`flex items-center gap-3 text-[15px] transition-opacity ${i <= stage ? "opacity-100" : "opacity-35"}`}>
              <span className={`h-2 w-2 rounded-full ${i < stage ? "bg-[var(--color-ice)]" : i === stage ? "animate-pulse bg-[var(--color-ember)]" : "bg-white/30"}`} />
              {s}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-4">
      <div className="flex gap-2" aria-hidden>
        {[0, 1].map((i) => (
          <span key={i} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-[var(--color-ice)]" : "bg-white/10"}`} />
        ))}
      </div>

      {step === 0 ? (
        <>
          <label className="block">
            <span className="mb-1.5 block text-sm text-white/70">Business name</span>
            <input className="field" required autoComplete="organization" value={form.name} onChange={set("name")} placeholder="Ridgeline Barber Co." />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm text-white/70">What kind of business?</span>
            <select className="field" value={form.niche} onChange={set("niche")}>
              {niches.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.label}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-[1fr_90px] gap-3">
            <label className="block">
              <span className="mb-1.5 block text-sm text-white/70">City</span>
              <input className="field" required autoComplete="address-level2" value={form.city} onChange={set("city")} placeholder="Medford" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm text-white/70">State</span>
              <input className="field uppercase" required maxLength={2} autoComplete="address-level1" value={form.region} onChange={set("region")} />
            </label>
          </div>
          <button type="button" disabled={!canNext} onClick={() => setStep(1)} className="tb tb-ice w-full disabled:opacity-40">
            <span className="tb-label">Continue</span>
          </button>
        </>
      ) : (
        <>
          <label className="block">
            <span className="mb-1.5 block text-sm text-white/70">Mobile number (booking alerts go here)</span>
            <input className="field" required type="tel" autoComplete="tel" inputMode="tel" value={form.phone} onChange={set("phone")} placeholder="(541) 555-0142" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm text-white/70">Email</span>
            <input className="field" required type="email" autoComplete="email" value={form.email} onChange={set("email")} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm text-white/70">Current website (optional)</span>
            <input className="field" type="url" inputMode="url" value={form.website} onChange={set("website")} placeholder="https://" />
          </label>
          {error ? <p className="text-sm text-[#ff9b8a]">{error}</p> : null}
          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(0)} className="tb tb-ghost">
              <span className="tb-label">Back</span>
            </button>
            <button type="submit" className={`tb ${plan === "lifetime" || plan === "custom" ? "tb-ice" : "tb-ember"} flex-1`}>
              <span className="tb-label">Launch my app</span>
            </button>
          </div>
          <p className="text-xs text-white/40">By continuing you agree to the terms. Cancel monthly plans anytime.</p>
        </>
      )}
    </form>
  );
}
