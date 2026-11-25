"use client";

import { useEffect, useId, useMemo, useState, type FormEvent } from "react";
import type { IntakeQuestion, TenantStorefrontConfig } from "@/lib/schemas/tenant";

export type LeadIntakePayload = {
  tenantId: string;
  slug: string;
  mode: TenantStorefrontConfig["conversion"]["mode"];
  contact: { name: string; phone: string };
  answers: Record<string, string>;
  sourceRoute: string;
  isSimulated?: boolean;
};

type DrawerStatus = "idle" | "sending" | "sent" | "error";

type ConversionDrawerProps = {
  open: boolean;
  onClose: () => void;
  config: TenantStorefrontConfig;
  serviceId?: string | null;
  urgency?: boolean;
};

const FALLBACK_URGENCY = ["Right now", "Today", "This week"];

function telHref(phone: string): string {
  const compact = phone.replace(/[^\d+]/g, "");
  return `tel:${compact}`;
}

function optionsFor(question: IntakeQuestion): string[] {
  if (question.options && question.options.length > 0) return question.options;
  if (question.kind === "urgency") return FALLBACK_URGENCY;
  return [];
}

function seedAnswers(config: TenantStorefrontConfig, serviceId: string | null, urgency: boolean): Record<string, string> {
  const answers: Record<string, string> = {};
  const service = config.services.find((item) => item.id === serviceId) ?? null;
  for (const question of config.conversion.intakeQuestions) {
    if (question.kind === "select" && service) {
      const match = optionsFor(question).find((option) => option.toLowerCase() === service.title.toLowerCase());
      if (match) answers[question.id] = match;
    }
    if (question.kind === "urgency" && (urgency || service?.isEmergencyEligible)) {
      const choices = optionsFor(question);
      if (choices[0]) answers[question.id] = choices[0];
    }
  }
  if (service) answers.serviceId = service.id;
  return answers;
}

export function ConversionDrawer({ open, onClose, config, serviceId = null, urgency = false }: ConversionDrawerProps) {
  const titleId = useId();
  const { conversion } = config;
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<DrawerStatus>("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setAnswers(seedAnswers(config, serviceId, urgency));
    setStatus("idle");
    setError("");
  }, [open, config, serviceId, urgency]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const modeCopy = useMemo(() => {
    if (conversion.mode === "instant-booking") return "Hold a visit window. We'll confirm by phone.";
    if (conversion.mode === "quote-request") return "Tell us the job. We'll send a written quote.";
    return urgency ? "Emergency desk. A dispatcher calls you back." : "Book a visit, or flag it for dispatch.";
  }, [conversion.mode, urgency]);

  if (!open) return null;

  function setAnswer(id: string, value: string) {
    setAnswers((current) => ({ ...current, [id]: value }));
  }

  function missingRequired(): string | null {
    if (name.trim().length < 2) return "Add your name.";
    if (phone.replace(/\D/g, "").length < 7) return "Add a phone number we can call.";
    for (const question of conversion.intakeQuestions) {
      if (!question.required) continue;
      if (!answers[question.id]?.trim()) return `Answer “${question.label}”.`;
    }
    return null;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const problem = missingRequired();
    if (problem) {
      setStatus("error");
      setError(problem);
      return;
    }
    const payload: LeadIntakePayload = {
      tenantId: config.tenantId,
      slug: config.slug,
      mode: conversion.mode,
      contact: { name: name.trim(), phone: phone.trim() },
      answers,
      sourceRoute: `/t/${config.slug}`,
      isSimulated: false,
    };
    setStatus("sending");
    setError("");
    try {
      const response = await fetch("/api/leads/intake", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json().catch(() => null)) as { error?: string; ok?: boolean } | null;
      if (!response.ok || !body?.ok) {
        setStatus("error");
        setError(body?.error || "The desk didn't take that. Try again.");
        return;
      }
      setStatus("sent");
    } catch {
      setStatus("error");
      setError("The desk didn't take that. Check your connection and try again.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close request"
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 max-h-[92dvh] w-full overflow-y-auto border border-white/10 bg-[#0B0D12] px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 text-[#f4f7fb] shadow-2xl sm:max-w-md sm:rounded-2xl sm:px-5"
        style={{ borderColor: "color-mix(in srgb, var(--primaryAccent) 35%, transparent)" }}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20 sm:hidden" />
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--primaryAccent)]">
              {urgency ? "Emergency" : conversion.mode.replace("-", " ")}
            </p>
            <h2 id={titleId} className="mt-1 text-xl font-semibold tracking-tight">
              {urgency ? conversion.emergencyCtaLabel : conversion.primaryCtaLabel}
            </h2>
            <p className="mt-1 text-sm text-white/70">{modeCopy}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-white/15 px-3 py-1 text-sm">
            Close
          </button>
        </div>

        <a href={telHref(conversion.displayPhone)} className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-[#050507] px-3 py-3">
          <span className="text-xs uppercase tracking-[0.16em] text-white/55">Call the desk</span>
          <span className="font-semibold text-[var(--primaryAccent)]">{conversion.displayPhone}</span>
        </a>
        <p className="mt-2 text-xs text-white/55">{conversion.serviceCities.join(" · ")}</p>

        {status === "sent" ? (
          <div className="mt-5 rounded-xl border border-[var(--primaryAccent)]/40 bg-[#050507] p-4">
            <p className="text-lg font-semibold">Request received.</p>
            <p className="mt-1 text-sm text-white/70">
              {config.businessName} has it. If this is urgent, call {conversion.displayPhone}.
            </p>
            <button type="button" onClick={onClose} className="mt-4 w-full rounded-full bg-[var(--primaryAccent)] px-4 py-3 font-semibold text-[#050507]">
              Done
            </button>
          </div>
        ) : (
          <form className="mt-5 space-y-3" onSubmit={onSubmit}>
            <label className="block text-sm">
              <span className="mb-1 block text-white/70">Name</span>
              <input
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                className="w-full rounded-xl border border-white/10 bg-[#050507] px-3 py-3 outline-none focus:border-[var(--primaryAccent)]"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-white/70">Phone</span>
              <input
                required
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                autoComplete="tel"
                inputMode="tel"
                className="w-full rounded-xl border border-white/10 bg-[#050507] px-3 py-3 outline-none focus:border-[var(--primaryAccent)]"
              />
            </label>
            {conversion.intakeQuestions.map((question) => (
              <QuestionField
                key={question.id}
                question={question}
                value={answers[question.id] ?? ""}
                onChange={(value) => setAnswer(question.id, value)}
              />
            ))}
            {status === "error" ? (
              <p role="alert" className="rounded-xl border border-[var(--secondaryAccent)]/50 bg-[#050507] px-3 py-2 text-sm text-[var(--secondaryAccent)]">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full rounded-full bg-[var(--primaryAccent)] px-4 py-3 font-semibold text-[#050507] disabled:opacity-60"
            >
              {status === "sending" ? "Sending…" : urgency ? conversion.emergencyCtaLabel : conversion.primaryCtaLabel}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}

function QuestionField({
  question,
  value,
  onChange,
}: {
  question: IntakeQuestion;
  value: string;
  onChange: (value: string) => void;
}) {
  const choices = optionsFor(question);
  if (question.kind === "text" || choices.length === 0) {
    return (
      <label className="block text-sm">
        <span className="mb-1 block text-white/70">
          {question.label}
          {question.required ? " *" : ""}
        </span>
        <textarea
          required={question.required}
          value={value}
          rows={3}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-xl border border-white/10 bg-[#050507] px-3 py-3 outline-none focus:border-[var(--primaryAccent)]"
        />
      </label>
    );
  }

  return (
    <fieldset className="text-sm">
      <legend className="mb-1 text-white/70">
        {question.label}
        {question.required ? " *" : ""}
      </legend>
      <div className="grid grid-cols-1 gap-2">
        {choices.map((option) => {
          const selected = value === option;
          return (
            <label
              key={option}
              className="flex cursor-pointer items-center justify-between rounded-xl border px-3 py-3"
              style={{
                borderColor: selected ? "var(--primaryAccent)" : "rgba(255,255,255,0.1)",
                background: selected ? "color-mix(in srgb, var(--primaryAccent) 12%, #050507)" : "#050507",
              }}
            >
              <span>{option}</span>
              <input
                type="radio"
                name={question.id}
                required={question.required}
                checked={selected}
                onChange={() => onChange(option)}
              />
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
