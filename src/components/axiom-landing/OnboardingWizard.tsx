"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, Upload, X } from "lucide-react";
import { TEMPLATES, getTemplate } from "@/lib/axiom-landing/templates";
import { demoName } from "@/lib/axiom-landing/demos";
import { getShowcase, showcaseSrc } from "@/lib/axiom-landing/showcase";
import { PRICING, fmt, buildPrice } from "@/lib/axiom-landing/pricing";
import { publicStripeLink } from "@/lib/axiom-landing/public-env";
import { RippleButton } from "./RippleButton";
import { TrustMarks } from "./TrustMarks";
import { useFunnel, type Plan } from "./FunnelProvider";

const STRIPE_LINK = publicStripeLink("lifetime");
const STRIPE_BUILD_LINK = publicStripeLink("cinematic");

type Details = { business: string; name: string; phone: string; email: string; city: string; website: string };
const EMPTY: Details = { business: "", name: "", phone: "", email: "", city: "", website: "" };

const PLANS: { id: Plan; title: string; price: string; note: string }[] = [
  { id: "lifetime", title: "Lifetime Access", price: `${fmt(PRICING.lifetime.price)} once`, note: "No monthly fees, ever" },
  { id: "monthly", title: "Starter Monthly", price: `${fmt(PRICING.monthly.price)}/mo`, note: "Cancel any time" },
  { id: "free-setup", title: "Set it up free first", price: "$0 today", note: "Decide before you go live" },
];

export default function OnboardingWizard() {
  const { wizardOpen, wizardPlan, selectedTemplateId, closeWizard } = useFunnel();
  const [step, setStep] = useState(0);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan>("free-setup");
  const [d, setD] = useState<Details>(EMPTY);
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [siteUrl, setSiteUrl] = useState<string | null>(null);

  // Fast-track: if they came from a template, skip straight to their details.
  useEffect(() => {
    if (!wizardOpen) return;
    setTemplateId(selectedTemplateId);
    setPlan(wizardPlan);
    setStep(selectedTemplateId || wizardPlan === "cinematic" ? 1 : 0);
    setStatus("idle");
    setErrorMsg("");
    setSiteUrl(null);
  }, [wizardOpen, selectedTemplateId, wizardPlan]);

  useEffect(() => {
    if (!wizardOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeWizard();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [wizardOpen, closeWizard]);

  if (!wizardOpen) return null;

  const t = getTemplate(templateId);
  const pickedName = demoName(templateId);
  const build = getShowcase(templateId);
  const isBuild = plan === "cinematic" && !!build;
  const price = buildPrice(build?.price);
  const checkoutLink = isBuild ? STRIPE_BUILD_LINK : plan === "lifetime" ? STRIPE_LINK : "";
  const steps = isBuild ? ["Build", "Details", "Pay", "Done"] : ["Trade", "Business", "Plan", "Done"];
  const detailsValid = d.business.trim() && d.name.trim() && /\S+@\S+\.\S+/.test(d.email) && d.phone.replace(/\D/g, "").length >= 10;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const finalStep = isBuild ? 1 : 2; // builds check out straight from the details screen
    if (step !== finalStep) {
      // Enter key on the details step advances instead of submitting early
      if (step === 1 && detailsValid) setStep(2);
      return;
    }
    if (!detailsValid) return;
    setStatus("sending");
    setErrorMsg("");

    // Cinematic builds: provision a white-label tenant (logo + branding), then pay.
    if (isBuild && build) {
      try {
        const fd = new FormData();
        fd.set("build_id", build.id);
        fd.set("business_name", d.business);
        fd.set("owner_name", d.name);
        fd.set("phone", d.phone);
        fd.set("email", d.email);
        fd.set("website", d.website);
        if (logo) fd.set("logo", logo);
        const res = await fetch("/api/tenants", { method: "POST", body: fd, signal: AbortSignal.timeout(25000) });
        const j = await res.json().catch(() => ({}));
        if (!res.ok || !j.ok) throw new Error(j.error || "Something went wrong — please try again.");
        if (j.next === "checkout" && j.checkoutUrl) {
          try {
            localStorage.setItem("axiom_pending_tenant", j.slug);
          } catch {}
          window.location.href = j.checkoutUrl;
          return;
        }
        setSiteUrl(j.next === "live" ? j.siteUrl : null);
        setStep(3);
        setStatus("idle");
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Something went wrong — please try again.");
        setStatus("error");
      }
      return;
    }

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...d, template: pickedName ?? "Not chosen", plan, source: "axiom-landing" }),
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) throw new Error();
      if (checkoutLink) {
        const url = new URL(checkoutLink);
        url.searchParams.set("prefilled_email", d.email);
        url.searchParams.set("client_reference_id", `${templateId ?? "none"}_${Date.now()}`);
        window.location.href = url.toString();
        return;
      }
      setStep(3);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  };

  const field = (k: keyof Details, label: string, type = "text", auto?: string) => (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-mist">{label}</span>
      <input
        type={type}
        autoComplete={auto}
        value={d[k]}
        onChange={(e) => setD({ ...d, [k]: e.target.value })}
        className="w-full rounded-xl border border-white/10 bg-ink/70 px-4 py-3 text-white outline-none transition focus:border-volt/70 focus:shadow-[0_0_0_4px_rgb(63_216_255/0.12)]"
      />
    </label>
  );

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center" role="dialog" aria-modal aria-label="Set up your Axiom back office">
      <button aria-label="Close" className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={closeWizard} />
      <div className="pop relative z-10 flex max-h-[94svh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-slate sm:rounded-3xl">
        {/* progress */}
        <div className="border-b border-white/10 px-6 py-5 sm:px-8">
          <div className="flex items-center justify-between">
            <p className="font-display text-lg font-semibold text-white">
              {isBuild
                ? `Make ${build!.name} yours — about 60 seconds`
                : plan === "lifetime"
                  ? "Own the desk — lifetime"
                  : "Start your free setup"}
            </p>
            <button onClick={closeWizard} className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-mist transition hover:scale-105 hover:text-white" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2">
            {steps.map((s, i) => (
              <div key={s}>
                <div className={`h-1 rounded-full transition-colors duration-500 ${i <= step ? "bg-gradient-to-r from-ember to-copper" : "bg-white/10"}`} />
                <p className={`mt-1.5 text-[11px] uppercase tracking-wider ${i <= step ? "text-white" : "text-mist/60"}`}>{s}</p>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={submit} className="flex-1 overflow-y-auto px-6 py-6 sm:px-8">
          {step === 0 && (
            <div className="pop">
              <h3 className="font-display text-2xl font-semibold text-white">What&apos;s your trade?</h3>
              <p className="mt-1 text-mist">We&apos;ll load the template built for it.</p>
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {TEMPLATES.map((x) => (
                  <button
                    type="button"
                    key={x.id}
                    onClick={() => {
                      setTemplateId(x.id);
                      setStep(1);
                    }}
                    className="rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:scale-[1.02]"
                    style={{
                      borderColor: templateId === x.id ? x.accent : "rgb(255 255 255 / 0.1)",
                      boxShadow: templateId === x.id ? `0 0 30px -8px ${x.accent}` : undefined,
                    }}
                  >
                    <span className="text-2xl">{x.icon}</span>
                    <p className="mt-2 text-sm font-semibold text-white">{x.trade}</p>
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => setStep(1)} className="mt-5 text-sm text-mist underline-offset-4 hover:text-white hover:underline">
                My trade isn&apos;t listed — continue
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="pop space-y-4">
              {isBuild && build && (
                <div className="flex gap-4 rounded-2xl border p-3" style={{ borderColor: `${build.accent}66`, background: `${build.accent}10` }}>
                  {build.poster && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={showcaseSrc(build, build.poster)} alt="" className="h-20 w-32 shrink-0 rounded-xl object-cover sm:h-24 sm:w-40" />
                  )}
                  <div className="min-w-0">
                    <p className="font-display text-lg font-semibold text-white">{build.name}</p>
                    <p className="font-display text-2xl font-bold text-white">
                      {fmt(price)} <span className="text-sm font-normal text-mist">one time</span>
                    </p>
                    <p className="mt-1 hidden text-xs text-mist sm:block">{PRICING.cinematic.includes.join(" · ")}</p>
                    <p className="mt-1 text-xs text-mist sm:hidden">Your name on this site · Lifetime desk included</p>
                  </div>
                </div>
              )}
              <div className={isBuild ? "hidden" : ""}>
                <h3 className="font-display text-2xl font-semibold text-white">Tell us about your business</h3>
                <p className="mt-1 text-mist">
                  {pickedName ? (
                    <>
                      Loading the <span className="text-white">{pickedName}</span> {t ? "template" : "build style"}.{" "}
                      <button type="button" className="underline underline-offset-4 hover:text-white" onClick={() => setStep(0)}>
                        Change
                      </button>
                    </>
                  ) : (
                    "We'll match you to the closest template."
                  )}
                </p>
              </div>
              {field("business", isBuild ? "Business name — shown on your site" : "Business name", "text", "organization")}
              <div className="grid gap-4 sm:grid-cols-2">
                {field("name", "Your name", "text", "name")}
                {field("phone", isBuild ? "Business phone — shown on your site" : "Mobile phone", "tel", "tel")}
              </div>
              {isBuild ? (
                field("email", "Email", "email", "email")
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {field("email", "Email", "email", "email")}
                  {field("city", "City / service area", "text", "address-level2")}
                </div>
              )}
              {isBuild && d.business.trim() ? (
                <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-mist">
                  Customers will see{" "}
                  <span className="font-semibold text-white">{d.business}</span>
                  {d.phone.replace(/\D/g, "").length >= 10 ? (
                    <>
                      {" "}
                      and <span className="font-semibold text-white">{d.phone}</span>
                    </>
                  ) : null}{" "}
                  on the site you just played. Pay once — it stays yours.
                </p>
              ) : null}
              {isBuild && <LogoDrop file={logo} onChange={setLogo} accent={build!.accent} />}
              {/* honeypot */}
              <input tabIndex={-1} autoComplete="off" className="hidden" value={d.website} onChange={(e) => setD({ ...d, website: e.target.value })} aria-hidden />
              {isBuild ? (
                <div className="sticky -bottom-6 -mx-6 bg-gradient-to-t from-slate via-slate to-slate/0 px-6 pb-6 pt-4 sm:static sm:mx-0 sm:bg-none sm:p-0 sm:pt-2">
                  {status === "error" && <p className="mb-3 text-center text-sm text-red-400">{errorMsg || "Something went wrong sending that — please try again."}</p>}
                  <RippleButton
                    type="submit"
                    variant="primary"
                    disabled={!detailsValid || status === "sending"}
                    className="w-full text-base disabled:pointer-events-none disabled:opacity-40"
                  >
                    {status === "sending"
                      ? "Stamping your name on the site…"
                      : checkoutLink
                        ? `Put this site on my name — ${fmt(price)}`
                        : `Reserve this build — ${fmt(price)}`}
                  </RippleButton>
                  <p className="mt-3 text-center text-xs text-mist">{PRICING.guarantee}</p>
                  <TrustMarks compact />
                </div>
              ) : (
              <div className="flex justify-end pt-2">
                <RippleButton variant="primary" disabled={!detailsValid} className="disabled:pointer-events-none disabled:opacity-40" onClick={() => setStep(2)}>
                  Continue <ArrowRight className="ml-1 inline-block h-4 w-4" aria-hidden />
                </RippleButton>
              </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="pop">
              <h3 className="font-display text-2xl font-semibold text-white">Choose how you want to own it</h3>
              <div className="mt-6 space-y-3">
                {PLANS.map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => setPlan(p.id)}
                    className={`flex w-full items-center justify-between rounded-2xl border p-5 text-left transition-all hover:scale-[1.01] ${
                      plan === p.id ? "border-copper bg-copper/10 shadow-[0_0_40px_-12px_rgb(224_138_60/0.8)]" : "border-white/10"
                    }`}
                  >
                    <span>
                      <span className="flex items-center gap-2 font-semibold text-white">
                        {p.title}
                        {p.id === "lifetime" && <span className="rounded-full bg-copper px-2 py-0.5 text-[10px] font-bold uppercase text-ink">Best value</span>}
                      </span>
                      <span className="text-sm text-mist">{p.note}</span>
                    </span>
                    <span className="font-display text-lg font-semibold text-white">{p.price}</span>
                  </button>
                ))}
              </div>
              <p className="mt-4 text-center text-sm text-mist">{PRICING.guarantee}</p>
              {status === "error" && <p className="mt-4 text-center text-sm text-red-400">Something went wrong sending that — please try again.</p>}
              <div className="mt-6 flex items-center justify-between">
                <button type="button" onClick={() => setStep(1)} className="text-sm text-mist hover:text-white">
                  <ArrowLeft className="mr-1 inline-block h-4 w-4" aria-hidden /> Back
                </button>
                <RippleButton type="submit" variant="primary" disabled={status === "sending"} className="disabled:opacity-60">
                  {status === "sending"
                    ? "Setting up…"
                    : plan === "lifetime"
                      ? STRIPE_LINK
                        ? `Pay ${fmt(PRICING.lifetime.price)} & Launch`
                        : "Lock In Lifetime Access"
                      : "Launch My Back Office"}
                  {status !== "sending" ? <ArrowRight className="ml-1 inline-block h-4 w-4" aria-hidden /> : null}
                </RippleButton>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="pop py-6 text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-ember to-copper text-ink shadow-[0_0_50px_-8px_rgb(224_138_60/0.9)]">
                <Check className="h-8 w-8" strokeWidth={2.5} aria-hidden />
              </div>
              <h3 className="mt-6 font-display text-2xl font-semibold text-white">You&apos;re in, {d.name.split(" ")[0] || "boss"}.</h3>
              <p className="mx-auto mt-3 max-w-md text-mist">
                {isBuild ? (
                  <>
                    {siteUrl ? (
                      <>
                        Your <span className="text-white">{pickedName}</span> site is live with{" "}
                        <span className="text-white">{d.business}</span>&apos;s name, phone{logo ? " and logo" : ""}.
                      </>
                    ) : (
                      <>
                        <span className="text-white">{pickedName}</span> is reserved for <span className="text-white">{d.business}</span>. Your branded
                        site goes live as soon as it&apos;s confirmed — we&apos;ll email you the link.
                      </>
                    )}
                  </>
                ) : (
                  <>
                    Your {pickedName ? <span className="text-white">{pickedName}</span> : null} back office for{" "}
                    <span className="text-white">{d.business}</span> is being set up.
                  </>
                )}
                {!isBuild && (
                  <>
                    {" "}Your admin login is headed to <span className="text-white">{d.email}</span> and a text to {d.phone}.
                  </>
                )}
              </p>
              {siteUrl ? (
                <a href={siteUrl} target="_blank" rel="noopener" className="btn btn-primary mt-8">
                  Open My Live Site <ArrowUpRight className="ml-1 inline-block h-4 w-4" aria-hidden />
                </a>
              ) : (
                <RippleButton variant="volt" className="mt-8" onClick={closeWizard}>
                  Back to the site
                </RippleButton>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

function LogoDrop({ file, onChange, accent }: { file: File | null; onChange: (f: File | null) => void; accent: string }) {
  const [drag, setDrag] = useState(false);
  const [err, setErr] = useState("");
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) return setPreview(null);
    const u = URL.createObjectURL(file);
    setPreview(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  const take = (f?: File | null) => {
    setErr("");
    if (!f) return;
    if (!LOGO_TYPES.includes(f.type)) return setErr("Use a PNG, JPG, WEBP or SVG.");
    if (f.size > 2 * 1024 * 1024) return setErr("Logo must be under 2 MB.");
    onChange(f);
  };

  return (
    <div>
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-mist">
        Truck / van mark (optional — we stamp it on this site)
      </span>
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          take(e.dataTransfer.files?.[0]);
        }}
        className="flex cursor-pointer items-center gap-4 rounded-xl border border-dashed px-4 py-3 transition-colors"
        style={{ borderColor: drag ? accent : "rgb(255 255 255 / 0.18)", background: drag ? `${accent}14` : "rgb(6 8 11 / 0.7)" }}
      >
        <input type="file" accept={LOGO_TYPES.join(",")} className="sr-only" onChange={(e) => take(e.target.files?.[0])} />
        <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg border border-white/10 bg-white/5">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Logo preview" className="h-full w-full object-contain p-1" />
          ) : (
            <Upload className="h-5 w-5 text-mist" aria-hidden />
          )}
        </span>
        <span className="min-w-0 flex-1 text-sm">
          {file ? (
            <span className="block truncate text-white">{file.name}</span>
          ) : (
            <span className="text-white">
              Drop the mark already on the truck — or <span style={{ color: accent }}>browse</span>
            </span>
          )}
          <span className="block text-xs text-mist">PNG, JPG, WEBP or SVG · max 2 MB</span>
        </span>
        {file && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onChange(null);
            }}
            className="rounded-full border border-white/15 px-2.5 py-1 text-xs text-mist hover:text-white"
          >
            Remove
          </button>
        )}
      </label>
      {err && <p className="mt-1.5 text-xs text-red-400">{err}</p>}
    </div>
  );
}
