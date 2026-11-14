"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  executiveConfig,
  minimalistConfig,
  operatorConfig,
  readAssistantConfig,
  writeAssistantConfig,
  type AssistantConfig,
  type HumanBase,
} from "@/lib/axiom/assistant-config";

type CardId = "The Executive" | "The Operator" | "The Minimalist";

const CARD_COPY: Record<CardId, { kicker: string; summary: string; tone: string }> = {
  "The Executive": {
    kicker: "Polished",
    summary: "Corporate dress, a professional voice, and a calm close.",
    tone: "archetype-card-gold",
  },
  "The Operator": {
    kicker: "Direct",
    summary: "A clean tactical look, an efficient voice, and an action bias.",
    tone: "archetype-card-blue",
  },
  "The Minimalist": {
    kicker: "Orb",
    summary: "A colored orb, a neutral voice, and a hyper-efficient manner.",
    tone: "archetype-card-cyan",
  },
};

export function OneClickSetup() {
  const [config, setConfig] = useState<AssistantConfig | null>(null);
  const [executiveBase, setExecutiveBase] = useState<HumanBase>("Female Human");
  const [operatorBase, setOperatorBase] = useState<HumanBase>("Male Human");

  useEffect(() => {
    const saved = readAssistantConfig();
    if (!saved) return;
    setConfig(saved);
    if (saved.selectedArchetype === "The Executive" && (saved.baseType === "Male Human" || saved.baseType === "Female Human")) {
      setExecutiveBase(saved.baseType);
    }
    if (saved.selectedArchetype === "The Operator" && (saved.baseType === "Male Human" || saved.baseType === "Female Human")) {
      setOperatorBase(saved.baseType);
    }
  }, []);

  function choose(next: AssistantConfig) {
    setConfig(next);
    try {
      writeAssistantConfig(next);
    } catch {
      /* Private mode can still preview the choice for this visit. */
    }
  }

  const selected = config?.selectedArchetype;
  const ready = selected === "The Executive" || selected === "The Operator" || selected === "The Minimalist" || selected === "Custom";

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-8" aria-label="Select your assistant">
      <header className="max-w-2xl">
        <p className="text-xs uppercase tracking-[0.18em] text-accent">Onboarding</p>
        <h1 className="mt-2 font-display text-4xl text-fg sm:text-5xl">Select your assistant</h1>
        <p className="mt-3 text-base leading-6 text-muted">
          Pick one ready-made presence. Finer choices stay in settings, after the desk is live.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <ArchetypeCard
          id="The Executive"
          selected={selected === "The Executive"}
          onSelect={() => choose(executiveConfig(executiveBase))}
        >
          <HumanToggle
            value={executiveBase}
            onChange={(base) => {
              setExecutiveBase(base);
              choose(executiveConfig(base));
            }}
          />
        </ArchetypeCard>
        <ArchetypeCard
          id="The Operator"
          selected={selected === "The Operator"}
          onSelect={() => choose(operatorConfig(operatorBase))}
        >
          <HumanToggle
            value={operatorBase}
            onChange={(base) => {
              setOperatorBase(base);
              choose(operatorConfig(base));
            }}
          />
        </ArchetypeCard>
        <ArchetypeCard
          id="The Minimalist"
          selected={selected === "The Minimalist"}
          onSelect={() => choose(minimalistConfig())}
        >
          <p className="text-sm text-muted">No person. A single orb holds the desk.</p>
        </ArchetypeCard>
      </div>

      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        {ready ? (
          <a href="/assistant-studio" className="inline-flex h-12 items-center rounded-xl bg-accent px-5 text-sm font-semibold text-bg">
            Launch assistant
          </a>
        ) : (
          <button type="button" disabled className="inline-flex h-12 items-center rounded-xl bg-surface px-5 text-sm font-semibold text-faint">
            Launch assistant
          </button>
        )}
        <p className="text-sm text-muted">{ready ? `${selected} is saved in this browser.` : "Choose a card to continue."}</p>
      </div>
    </section>
  );
}

function ArchetypeCard({
  id,
  selected,
  onSelect,
  children,
}: {
  id: CardId;
  selected: boolean;
  onSelect: () => void;
  children: ReactNode;
}) {
  const copy = CARD_COPY[id];
  return (
    <article className={`archetype-card glass-panel flex flex-col gap-4 rounded-2xl p-5 text-left ${selected ? copy.tone : ""}`}>
      <button type="button" onClick={onSelect} className="flex flex-col items-start gap-2 text-left" aria-pressed={selected}>
        <span className="text-xs uppercase tracking-[0.16em] text-accent">{copy.kicker}</span>
        <span className="font-display text-3xl text-fg">{id}</span>
        <span className="text-sm leading-6 text-muted">{copy.summary}</span>
      </button>
      {children}
    </article>
  );
}

function HumanToggle({ value, onChange }: { value: HumanBase; onChange: (next: HumanBase) => void }) {
  return (
    <div className="mt-auto flex rounded-full border border-line p-1" role="group" aria-label="Human presentation">
      {(["Female Human", "Male Human"] as const).map((base) => (
        <button
          key={base}
          type="button"
          aria-pressed={value === base}
          onClick={() => onChange(base)}
          className={`h-10 flex-1 rounded-full px-3 text-xs font-semibold ${value === base ? "bg-accent text-bg" : "text-muted"}`}
        >
          {base === "Female Human" ? "Female" : "Male"}
        </button>
      ))}
    </div>
  );
}
