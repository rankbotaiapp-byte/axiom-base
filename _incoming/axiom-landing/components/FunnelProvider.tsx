"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type Plan = "free-setup" | "lifetime" | "monthly" | "cinematic";

type FunnelState = {
  /** Template currently open in the demo modal (null = closed) */
  previewId: string | null;
  /** Last template the visitor looked at — carried into onboarding */
  selectedTemplateId: string | null;
  /** Once a visitor opens any demo, the sticky bar locks on for the rest of the visit */
  stickyLocked: boolean;
  /** Cinematic build open in the showcase modal (null = closed) */
  showcaseId: string | null;
  wizardOpen: boolean;
  wizardPlan: Plan;
  openPreview: (id: string) => void;
  closePreview: () => void;
  openShowcase: (id: string) => void;
  closeShowcase: () => void;
  startOnboarding: (opts?: { plan?: Plan; templateId?: string | null }) => void;
  closeWizard: () => void;
};

const Ctx = createContext<FunnelState | null>(null);

export function FunnelProvider({ children }: { children: ReactNode }) {
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [selectedTemplateId, setSelected] = useState<string | null>(null);
  const [stickyLocked, setStickyLocked] = useState(false);
  const [showcaseId, setShowcaseId] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardPlan, setWizardPlan] = useState<Plan>("free-setup");

  const openPreview = useCallback((id: string) => {
    setPreviewId(id);
    setSelected(id);
    setStickyLocked(true);
  }, []);

  const closePreview = useCallback(() => setPreviewId(null), []);

  const openShowcase = useCallback((id: string) => {
    setShowcaseId(id);
    setSelected(id);
    setStickyLocked(true);
  }, []);

  const closeShowcase = useCallback(() => setShowcaseId(null), []);

  const startOnboarding = useCallback<FunnelState["startOnboarding"]>((opts) => {
    if (opts?.templateId !== undefined) setSelected(opts.templateId);
    setWizardPlan(opts?.plan ?? "free-setup");
    setPreviewId(null);
    setShowcaseId(null);
    setWizardOpen(true);
  }, []);

  const closeWizard = useCallback(() => setWizardOpen(false), []);

  const value = useMemo(
    () => ({
      previewId,
      selectedTemplateId,
      stickyLocked,
      showcaseId,
      wizardOpen,
      wizardPlan,
      openPreview,
      closePreview,
      openShowcase,
      closeShowcase,
      startOnboarding,
      closeWizard,
    }),
    [previewId, selectedTemplateId, stickyLocked, showcaseId, wizardOpen, wizardPlan, openPreview, closePreview, openShowcase, closeShowcase, startOnboarding, closeWizard],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFunnel() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useFunnel must be used inside <FunnelProvider>");
  return ctx;
}
