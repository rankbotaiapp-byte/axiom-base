"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { UPGRADE_PACKAGES, type UpgradePackageId } from "./data";
import { SectionHeading } from "./SectionHeading";

interface ModdingSectionProps {
  selectedPackage: UpgradePackageId;
  onSelectPackage: (id: UpgradePackageId) => void;
}

type FieldErrors = Partial<Record<"name" | "email" | "phone" | "packageId" | "consent", string>>;

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; reference: string }
  | { status: "error"; message: string };

interface LeadResponse {
  ok: boolean;
  reference?: string;
  error?: string;
  errors?: FieldErrors;
}

const inputCls =
  "w-full rounded-sm border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-neon-cyan focus:bg-white/[0.06] focus:shadow-[0_0_0_3px_rgba(34,230,255,0.12)] aria-[invalid=true]:border-neon-red";

function Field({
  label,
  error,
  htmlFor,
  children,
  className = "",
}: {
  label: string;
  error?: string;
  htmlFor: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block font-mono text-[10px] tracking-[0.25em] text-slate-400">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${htmlFor}-error`} className="mt-1 text-xs text-neon-red">
          {error}
        </p>
      )}
    </div>
  );
}

export function ModdingSection({ selectedPackage, onSelectPackage }: ModdingSectionProps) {
  const uid = useId();
  const [state, setState] = useState<SubmitState>({ status: "idle" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const today = new Date().toISOString().slice(0, 10);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      phone: String(data.get("phone") ?? ""),
      packageId: String(data.get("packageId") ?? ""),
      preferredDate: String(data.get("preferredDate") ?? ""),
      notes: String(data.get("notes") ?? ""),
      consent: data.get("consent") === "on",
      company: String(data.get("company") ?? ""),
      source: "cyber-augment-landing",
    };

    const clientErrors: FieldErrors = {};
    if (payload.name.trim().length < 2) clientErrors.name = "Enter your full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(payload.email.trim())) clientErrors.email = "Enter a valid email.";
    if (!payload.consent) clientErrors.consent = "Consent is required to contact you.";
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length > 0) return;

    setState({ status: "submitting" });
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as LeadResponse;
      if (!res.ok || !json.ok) {
        setErrors(json.errors ?? {});
        setState({ status: "error", message: json.error ?? "Something went wrong. Please try again." });
        return;
      }
      form.reset();
      setState({ status: "success", reference: json.reference ?? "" });
    } catch {
      setState({ status: "error", message: "Network error. Check your connection and try again." });
    }
  }

  const id = (name: string) => `${uid}-${name}`;
  const describedBy = (name: keyof FieldErrors) => (errors[name] ? `${id(name)}-error` : undefined);

  return (
    <section id="book" className="relative bg-obsidian px-4 py-24 sm:px-8 sm:py-32">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon-cyan/40 to-transparent" />
      <div className="relative mx-auto max-w-7xl">
        <SectionHeading
          index="04"
          eyebrow="CUSTOM MODDING & UPGRADES"
          title="Choose your build."
          description="Transparent pricing, real recovery windows, warranties that mean it. Pick a package and we'll schedule your consultation."
        />

        <div className="grid gap-10 lg:grid-cols-[1.25fr_1fr] lg:gap-14">
          {/* Specification table */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="overflow-x-auto"
          >
            <table className="w-full min-w-[560px] border-collapse text-left text-sm">
              <caption className="sr-only">Upgrade packages with install time, recovery, warranty and price</caption>
              <thead>
                <tr className="border-b border-white/15 font-mono text-[10px] tracking-[0.25em] text-slate-500">
                  <th scope="col" className="py-3 pr-4 font-normal">PACKAGE</th>
                  <th scope="col" className="px-3 py-3 font-normal">INSTALL</th>
                  <th scope="col" className="px-3 py-3 font-normal">RECOVERY</th>
                  <th scope="col" className="px-3 py-3 font-normal">WARRANTY</th>
                  <th scope="col" className="py-3 pl-3 text-right font-normal">FROM</th>
                </tr>
              </thead>
              <tbody>
                {UPGRADE_PACKAGES.map((p) => {
                  const selected = p.id === selectedPackage;
                  return (
                    <tr
                      key={p.id}
                      onClick={() => onSelectPackage(p.id)}
                      className={`cursor-pointer border-b border-white/5 transition-colors ${
                        selected ? "bg-neon-cyan/[0.06]" : "hover:bg-white/[0.03]"
                      }`}
                    >
                      <th scope="row" className="relative py-4 pr-4 font-normal">
                        {selected && (
                          <motion.span layoutId="pkg-marker" className="absolute inset-y-2 -left-3 w-[2px] bg-neon-cyan" />
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectPackage(p.id);
                          }}
                          aria-pressed={selected}
                          className="text-left outline-none focus-visible:underline"
                        >
                          <span className="block font-semibold text-white">{p.name}</span>
                          <span className="font-mono text-[10px] tracking-[0.2em] text-slate-500">
                            {p.category.toUpperCase()}
                          </span>
                        </button>
                      </th>
                      <td className="px-3 py-4 text-slate-300">{p.installTime}</td>
                      <td className="px-3 py-4 text-slate-300">{p.recovery}</td>
                      <td className="px-3 py-4 text-slate-300">{p.warranty}</td>
                      <td className={`py-4 pl-3 text-right font-semibold ${selected ? "text-neon-cyan" : "text-white"}`}>
                        {p.price}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="mt-4 font-mono text-[10px] tracking-[0.2em] text-slate-600">
              PRICING INCLUDES CONSULTATION, FITTING &amp; 90-DAY CALIBRATION FOLLOW-UP.
            </p>
          </motion.div>

          {/* Booking form */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="relative rounded-xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-2xl sm:p-8"
          >
            <span className="absolute left-0 top-0 h-6 w-6 border-l-2 border-t-2 border-neon-cyan/70" />
            <span className="absolute bottom-0 right-0 h-6 w-6 border-b-2 border-r-2 border-neon-red/70" />

            <AnimatePresence mode="wait">
              {state.status === "success" ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex min-h-[420px] flex-col items-center justify-center text-center"
                  role="status"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-neon-cyan shadow-[0_0_30px_var(--color-neon-cyan)]">
                    <svg viewBox="0 0 24 24" className="h-8 w-8 text-neon-cyan" aria-hidden>
                      <path d="M5 12l5 5L20 7" fill="none" stroke="currentColor" strokeWidth="2.5" />
                    </svg>
                  </div>
                  <h3 className="mt-6 text-2xl font-bold text-white">Request locked in.</h3>
                  <p className="mt-2 text-slate-400">A specialist will contact you within one business day.</p>
                  {state.reference && (
                    <p className="mt-4 font-mono text-xs tracking-[0.3em] text-neon-cyan">REF {state.reference}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => setState({ status: "idle" })}
                    className="mt-8 font-mono text-[11px] tracking-[0.25em] text-slate-400 underline-offset-4 hover:text-white hover:underline"
                  >
                    SUBMIT ANOTHER REQUEST
                  </button>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit}
                  noValidate
                  className="grid gap-4 sm:grid-cols-2"
                >
                  <h3 className="text-xl font-bold text-white sm:col-span-2">Book your upgrade consultation</h3>

                  <Field label="FULL NAME" htmlFor={id("name")} error={errors.name} className="sm:col-span-2">
                    <input
                      id={id("name")}
                      name="name"
                      autoComplete="name"
                      required
                      aria-invalid={!!errors.name}
                      aria-describedby={describedBy("name")}
                      className={inputCls}
                      placeholder="Jordan Vale"
                    />
                  </Field>
                  <Field label="EMAIL" htmlFor={id("email")} error={errors.email}>
                    <input
                      id={id("email")}
                      name="email"
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      required
                      aria-invalid={!!errors.email}
                      aria-describedby={describedBy("email")}
                      className={inputCls}
                      placeholder="you@domain.com"
                    />
                  </Field>
                  <Field label="PHONE (OPTIONAL)" htmlFor={id("phone")} error={errors.phone}>
                    <input
                      id={id("phone")}
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      inputMode="tel"
                      aria-invalid={!!errors.phone}
                      aria-describedby={describedBy("phone")}
                      className={inputCls}
                      placeholder="(555) 010-2077"
                    />
                  </Field>
                  <Field label="UPGRADE PACKAGE" htmlFor={id("packageId")} error={errors.packageId}>
                    <select
                      id={id("packageId")}
                      name="packageId"
                      value={selectedPackage}
                      onChange={(e) => onSelectPackage(e.target.value as UpgradePackageId)}
                      aria-invalid={!!errors.packageId}
                      className={`${inputCls} appearance-none pr-10 bg-[length:12px] bg-[right_1rem_center] bg-no-repeat`}
                      style={{
                        backgroundImage:
                          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' fill='none' stroke='%2322e6ff' stroke-width='1.5'/%3E%3C/svg%3E\")",
                      }}
                    >
                      {UPGRADE_PACKAGES.map((p) => (
                        <option key={p.id} value={p.id} className="bg-slate-950">
                          {p.name} — {p.price}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="PREFERRED DATE" htmlFor={id("preferredDate")}>
                    <input
                      id={id("preferredDate")}
                      name="preferredDate"
                      type="date"
                      min={today}
                      className={`${inputCls} [color-scheme:dark]`}
                    />
                  </Field>
                  <Field label="BUILD NOTES" htmlFor={id("notes")} className="sm:col-span-2">
                    <textarea
                      id={id("notes")}
                      name="notes"
                      rows={3}
                      className={`${inputCls} resize-none`}
                      placeholder="Goals, existing hardware, timeline…"
                    />
                  </Field>

                  {/* Honeypot: hidden from people, irresistible to bots */}
                  <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                    <label htmlFor={id("company")}>Company</label>
                    <input id={id("company")} name="company" tabIndex={-1} autoComplete="off" />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="flex cursor-pointer items-start gap-3 text-xs text-slate-400">
                      <input
                        type="checkbox"
                        name="consent"
                        aria-invalid={!!errors.consent}
                        aria-describedby={describedBy("consent")}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-[#22e6ff]"
                      />
                      <span>I agree to be contacted by Cyber-Augment Labs about my consultation by email, phone or text.</span>
                    </label>
                    {errors.consent && (
                      <p id={`${id("consent")}-error`} className="mt-1 text-xs text-neon-red">
                        {errors.consent}
                      </p>
                    )}
                  </div>

                  {state.status === "error" && (
                    <p role="alert" className="rounded-sm border border-neon-red/40 bg-neon-red/10 px-3 py-2 text-sm text-neon-red sm:col-span-2">
                      {state.message}
                    </p>
                  )}

                  <motion.button
                    type="submit"
                    disabled={state.status === "submitting"}
                    whileTap={{ scale: 0.98 }}
                    className="relative overflow-hidden rounded-sm bg-neon-red py-3.5 text-sm font-bold tracking-[0.25em] text-white shadow-[0_0_30px_rgba(255,42,61,0.45)] transition hover:brightness-110 disabled:cursor-wait disabled:opacity-70 sm:col-span-2"
                  >
                    {state.status === "submitting" ? "TRANSMITTING…" : "LOCK IN CONSULTATION"}
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      <footer className="relative mx-auto mt-24 flex max-w-7xl flex-col gap-2 border-t border-white/10 pt-8 font-mono text-[10px] tracking-[0.25em] text-slate-600 sm:flex-row sm:justify-between">
        <span>© {new Date().getFullYear()} CYBER-AUGMENT LABS</span>
        <span>ENGINEERED · INSTALLED · CALIBRATED IN-HOUSE</span>
      </footer>
    </section>
  );
}
