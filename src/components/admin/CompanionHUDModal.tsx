"use client";

import { useEffect, useId, useState } from "react";
import { X } from "lucide-react";
import {
  allCompanionArchetypes,
  companionArchetype,
  companionTradeTool,
  type CompanionArchetypeId,
  type CompanionEnvironment,
  type CompanionPulse,
} from "@/lib/axiom/companion-archetypes";
import { companionHaptic } from "@/lib/axiom/companion-comms";
import type { CompanionChatLine } from "@/components/admin/useCompanionLiveFeed";
import "../companion-hud.css";

const DIAGNOSTICS = [
  "ZPF LOCK · ZERO ALGORITHMIC INTERFERENCE",
  "LINK STABLE · OBSIDIAN BUS NOMINAL",
  "SCHEMA BROADCAST · LOCAL EMERGENCY INTENT",
  "TWILIO / SUPABASE CHANNEL ARMED",
  "HAPTIC CHANNEL · SPEAKERPHONE READY",
];

export function CompanionHUDModal({
  open,
  onClose,
  archetypeId,
  onArchetype,
  environment,
  shopName,
  shopSlug,
  city,
  niche,
  ping,
  sync,
  lines,
  onPulse,
  onCommand,
}: {
  open: boolean;
  onClose: () => void;
  archetypeId: CompanionArchetypeId;
  onArchetype: (id: CompanionArchetypeId) => void;
  environment: CompanionEnvironment;
  shopName: string;
  shopSlug: string;
  city: string;
  niche?: string | null;
  ping: number;
  sync: number;
  lines: CompanionChatLine[];
  onPulse: (pulse: CompanionPulse) => void;
  onCommand: (text: string) => void;
}) {
  const titleId = useId();
  const asset = companionArchetype(archetypeId);
  const tool = companionTradeTool(niche);
  const [draft, setDraft] = useState("");
  const role = environment === "storefront" ? "CONCIERGE" : environment === "hero-studio" ? "STUDIO" : "OPS";

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  function sendCommand() {
    const text = draft.replace(/\s+/g, " ").trim();
    if (!text) return;
    setDraft("");
    onCommand(text);
  }

  return (
    <div className="companion-hud-modal" role="presentation" onClick={onClose}>
      <div
        className="companion-hud-stage"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="companion-hud-plate">
          <button type="button" className="companion-hud-close" aria-label="Close companion HUD" onClick={onClose}>
            <X className="size-4" />
          </button>

          <div className="companion-hud-layer companion-hud-layer--bg" aria-hidden>
            <div className="companion-hud-terminal">
              {DIAGNOSTICS.map((line) => (
                <p key={line}>{line}</p>
              ))}
              <p>
                STABILITY {sync.toFixed(1)} · PING {ping}MS · {role}
              </p>
              <p>
                TENANT /{shopSlug} · {shopName}
              </p>
            </div>
          </div>

          <div className="companion-hud-layer companion-hud-layer--avatar">
            <video
              key={asset.loop}
              className="companion-hud-avatar"
              src={asset.loop}
              poster={asset.still}
              muted
              playsInline
              loop
              autoPlay
            />
            <div className="companion-hud-veil" />
            <p className="companion-hud-tool">
              {asset.tool} · {tool}
            </p>
          </div>

          <div className="companion-hud-layer companion-hud-layer--ui">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-hud">
                {asset.callsign} · {role} · ZPF
              </p>
              <h2 id={titleId} className="mt-1 font-display text-2xl text-fg">
                {asset.name}
              </h2>
              <p className="mt-1 text-sm text-muted">{asset.title}</p>
              <div className="companion-hud-readout mt-3">
                <span>
                  Link <strong>{ping}ms</strong>
                </span>
                <span>
                  Sync <strong>{sync.toFixed(1)}%</strong>
                </span>
                <span>
                  Field <strong>CLEAR</strong>
                </span>
              </div>
            </div>

            <div className="companion-hud-bubbles" aria-live="polite">
              {lines.map((line) => (
                <p
                  key={line.id}
                  className={
                    line.role === "sys"
                      ? "companion-hud-bubble companion-hud-bubble--sys"
                      : "companion-hud-bubble companion-hud-bubble--ops"
                  }
                >
                  {line.text}
                </p>
              ))}
            </div>

            <div className="companion-hud-commands">
              <div className="flex flex-wrap gap-2" role="group" aria-label="Companion archetype">
                {allCompanionArchetypes().map((row) => (
                  <button
                    key={row.id}
                    type="button"
                    aria-pressed={row.id === archetypeId}
                    className="companion-hud-cmd px-2"
                    onClick={() => {
                      onArchetype(row.id);
                      companionHaptic(18);
                    }}
                  >
                    {row.callsign}
                  </button>
                ))}
              </div>
              <div className="companion-hud-commands__row">
                <button type="button" className="companion-hud-cmd" onClick={() => onPulse("emergency")}>
                  Emergency call
                </button>
                <button type="button" className="companion-hud-cmd" onClick={() => onPulse("trial")}>
                  $1 trial booking
                </button>
                <button type="button" className="companion-hud-cmd" onClick={() => onPulse("autopilot")}>
                  Autopilot update
                </button>
                <a className="companion-hud-cmd grid place-items-center no-underline" href={`/${shopSlug}/book`}>
                  Open book
                </a>
              </div>
              <form
                className="companion-hud-input"
                onSubmit={(event) => {
                  event.preventDefault();
                  sendCommand();
                }}
              >
                <input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Command the companion"
                  aria-label="Companion command"
                  maxLength={180}
                />
                <button type="submit" className="companion-hud-cmd px-4">
                  Send
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { companionAnnouncement } from "@/lib/axiom/companion-archetypes";

export function companionCommandPulse(text: string): CompanionPulse | "chat" {
  const lower = text.toLowerCase();
  if (/emergenc|dispatch|call/.test(lower)) return "emergency";
  if (/trial|dollar|book/.test(lower)) return "trial";
  if (/autopilot|seo|tick/.test(lower)) return "autopilot";
  return "chat";
}
