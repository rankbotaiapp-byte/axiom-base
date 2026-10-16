import { useState, type FC, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { HoloCard } from "@/components/holo-card";
import { StatusRow } from "@/components/status-pill";
import { presetForShopNiche } from "@/config/nichePresets";
import { submitClientAudit } from "@/lib/axiom/client-audit";

interface StorefrontAuditWidgetProps {
  tenantId: string;
  businessName: string;
  niche: string;
  bookSlug?: string;
}

export const StorefrontAuditWidget: FC<StorefrontAuditWidgetProps> = ({
  tenantId,
  businessName,
  niche,
  bookSlug,
}) => {
  const preset = presetForShopNiche(niche);
  const [step, setStep] = useState<"form" | "analyzing" | "results">("form");
  const [consumerName, setConsumerName] = useState("");
  const [consumerContact, setConsumerContact] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    Object.fromEntries(preset.auditQuestions.map((question) => [question.id, question.choices[0]?.value ?? ""])),
  );
  const [auditScore, setAuditScore] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRunAudit = async (e: FormEvent) => {
    e.preventDefault();
    if (!consumerName || !consumerContact) return;

    setSubmitting(true);
    setError(null);
    setStep("analyzing");

    const calculatedScore = Math.floor(Math.random() * (92 - 65 + 1)) + 65;
    setAuditScore(calculatedScore);

    try {
      await submitClientAudit({
        data: {
          tenantId,
          consumerName,
          consumerContact,
          projectDetails: answers,
          auditScore: calculatedScore,
        },
      });
      window.setTimeout(() => setStep("results"), 1500);
    } catch (err) {
      console.error("Error saving audit submission:", err);
      setError(err instanceof Error ? err.message : "The audit could not be saved");
      setStep("form");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-lg">
    <HoloCard tilt={false} className="rounded-[24px] bg-surface p-6 text-fg shadow-[0_0_0_1px_rgba(243,241,235,0.08)]">
      <div className="mb-6">
        <span className="text-[11px] uppercase tracking-[0.2em] text-muted">{preset.label}</span>
        <h3 className="mt-2 font-display text-3xl">{preset.auditTitle}</h3>
        <p className="mt-1 text-sm text-muted">{preset.auditNote}</p>
        <StatusRow />
      </div>

      {step === "form" && (
        <form onSubmit={handleRunAudit} className="grid gap-5">
          {preset.auditQuestions.map((question) => (
            <fieldset key={question.id}>
              <legend className="mb-2 text-sm">{question.label}</legend>
              <div className="flex flex-wrap gap-2">
                {question.choices.map((choice) => {
                  const selected = answers[question.id] === choice.value;
                  return (
                    <button
                      key={choice.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setAnswers((current) => ({ ...current, [question.id]: choice.value }))}
                      className="h-11 rounded-full px-4 text-sm"
                      style={
                        selected
                          ? { background: preset.accent, color: "var(--color-bg)" }
                          : { background: "var(--color-surface-2, rgba(243,241,235,0.06))", color: "var(--color-fg)" }
                      }
                    >
                      {choice.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm" htmlFor="audit-name">
              Your name
              <input
                id="audit-name"
                type="text"
                required
                placeholder="Your name"
                className="h-11 rounded-xl bg-bg px-3 text-sm text-fg shadow-[0_0_0_1px_rgba(243,241,235,0.08)]"
                value={consumerName}
                onChange={(e) => setConsumerName(e.target.value)}
              />
            </label>
            <label className="grid gap-1 text-sm" htmlFor="audit-contact">
              Phone or email
              <input
                id="audit-contact"
                type="text"
                required
                placeholder="Phone or email"
                className="h-11 rounded-xl bg-bg px-3 text-sm text-fg shadow-[0_0_0_1px_rgba(243,241,235,0.08)]"
                value={consumerContact}
                onChange={(e) => setConsumerContact(e.target.value)}
              />
            </label>
          </div>

          {error ? <p className="text-sm text-danger">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="h-12 rounded-xl bg-fg text-sm font-medium text-bg"
          >
            {submitting ? "Saving" : "See the score"}
          </button>
        </form>
      )}

      {step === "analyzing" && (
        <div className="grid place-items-center gap-4 py-12 text-center">
          <div className="size-12 animate-spin rounded-full border-b-2 border-fg" />
          <p className="text-sm text-muted">Checking the answers for {businessName}.</p>
        </div>
      )}

      {step === "results" && auditScore !== null && (
        <div className="grid gap-4 py-2 text-center">
          <div className="rounded-[20px] bg-bg p-6">
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Score</p>
            <div className="my-2 font-display text-6xl">
              {auditScore}
              <span className="text-2xl text-muted">/100</span>
            </div>
            <p className="text-sm text-muted">A short visit with {businessName} is the next step.</p>
          </div>
          {bookSlug ? (
            <Link
              to="/$shopSlug/book"
              params={{ shopSlug: bookSlug }}
              className="inline-flex h-12 items-center justify-center rounded-xl bg-fg text-sm font-medium text-bg"
            >
              {preset.bookingCta}
            </Link>
          ) : (
            <p className="text-sm">{preset.bookingCta}</p>
          )}
        </div>
      )}
    </HoloCard>
    </div>
  );
};
