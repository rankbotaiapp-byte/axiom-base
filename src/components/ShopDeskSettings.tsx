"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  ASSISTANT_CONFIG_EVENT,
  BASE_TYPES,
  HAIR_COLORS,
  OUTFITS,
  PERSONALITIES,
  VOICES,
  customizeAssistant,
  executiveConfig,
  readAssistantConfig,
  showsHair,
  writeAssistantConfig,
  type AssistantConfig,
  type BaseType,
  type OutfitId,
  type PersonalityId,
  type VoiceId,
} from "@/lib/axiom/assistant-config";

const EMPTY: AssistantConfig = executiveConfig("Female Human");

export function ShopDeskSettings() {
  const [config, setConfig] = useState<AssistantConfig | null>(null);
  const [ready, setReady] = useState(false);
  const shown = config ?? EMPTY;

  useEffect(() => {
    const load = () => setConfig(readAssistantConfig());
    load();
    setReady(true);
    window.addEventListener(ASSISTANT_CONFIG_EVENT, load);
    return () => window.removeEventListener(ASSISTANT_CONFIG_EVENT, load);
  }, []);

  function commit(next: AssistantConfig) {
    setConfig(next);
    try {
      writeAssistantConfig(next);
    } catch {
      /* The panel still shows the edit if storage is blocked. */
    }
  }

  function patch(change: Partial<Pick<AssistantConfig, "baseType" | "hairColor" | "outfit" | "voice" | "personality">>) {
    commit(customizeAssistant(config ?? EMPTY, change));
  }

  return (
    <section className="glass-panel rounded-2xl p-5 sm:p-6" aria-label="Assistant configuration">
      <p className="text-xs uppercase tracking-[0.16em] text-accent">Settings</p>
      <h2 className="mt-1 font-display text-3xl text-fg">Assistant configuration</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
        These choices stay in this browser. Changing any of them marks the assistant as Custom.
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Field label="Base type">
          <select
            value={shown.baseType}
            disabled={!ready}
            onChange={(event) => patch({ baseType: event.target.value as BaseType })}
            className="h-11 w-full rounded-xl border border-line bg-bg px-3 text-sm text-fg"
          >
            {BASE_TYPES.map((base) => (
              <option key={base} value={base}>{base}</option>
            ))}
          </select>
        </Field>

        <Field label="Outfit">
          <select
            value={shown.outfit}
            disabled={!ready}
            onChange={(event) => patch({ outfit: event.target.value as OutfitId })}
            className="h-11 w-full rounded-xl border border-line bg-bg px-3 text-sm text-fg"
          >
            {OUTFITS.map((outfit) => (
              <option key={outfit} value={outfit}>{outfit}</option>
            ))}
          </select>
        </Field>

        <Field label="Voice">
          <select
            value={shown.voice}
            disabled={!ready}
            onChange={(event) => patch({ voice: event.target.value as VoiceId })}
            className="h-11 w-full rounded-xl border border-line bg-bg px-3 text-sm text-fg"
          >
            {VOICES.map((voice) => (
              <option key={voice} value={voice}>{voice}</option>
            ))}
          </select>
        </Field>

        <Field label="Personality">
          <select
            value={shown.personality}
            disabled={!ready}
            onChange={(event) => patch({ personality: event.target.value as PersonalityId })}
            className="h-11 w-full rounded-xl border border-line bg-bg px-3 text-sm text-fg"
          >
            {PERSONALITIES.map((personality) => (
              <option key={personality} value={personality}>{personality}</option>
            ))}
          </select>
        </Field>
      </div>

      {showsHair(shown.baseType) ? (
        <fieldset className="mt-5">
          <legend className="text-sm text-fg">Hair color</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {HAIR_COLORS.map((color) => (
              <button
                key={color.id}
                type="button"
                aria-pressed={shown.hairColor === color.id}
                onClick={() => patch({ hairColor: color.id })}
                className={`inline-flex h-11 items-center gap-2 rounded-full border px-3 text-sm ${shown.hairColor === color.id ? "border-accent text-fg" : "border-line text-muted"}`}
              >
                <span className="h-4 w-4 rounded-full" style={{ background: color.hex }} aria-hidden="true" />
                {color.id}
              </button>
            ))}
          </div>
        </fieldset>
      ) : null}

      <p className="mt-5 text-sm text-muted" aria-live="polite">
        Active selection: {config?.selectedArchetype ?? "None"}
      </p>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-2 text-sm text-fg">
      {label}
      {children}
    </label>
  );
}
