import { useState } from "react";
import { Input, Label } from "@/components/ui/input";
import {
  RIPPLE_THEMES,
  compileBrandMark,
  rippleTheme,
  themeSurface,
  type RippleThemeId,
} from "@/lib/axiom/brand-studio";

export function BrandStudio({
  header,
  tagline,
  theme,
  disabled,
  onHeader,
  onTagline,
  onTheme,
}: {
  header: string;
  tagline: string;
  theme: RippleThemeId | "";
  disabled?: boolean;
  onHeader: (value: string) => void;
  onTagline: (value: string) => void;
  onTheme: (value: RippleThemeId) => void;
}) {
  const active = rippleTheme(theme) ?? RIPPLE_THEMES[0];
  const mark = compileBrandMark(header || "Axiom", tagline, active.accent);
  const surface = themeSurface(active);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-[16rem_1fr]" style={surface}>
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-muted">Branding studio</p>
        <img src={mark.dataUrl} alt="" className="mt-3 aspect-square w-full rounded-2xl bg-surface object-contain" />
        <p className="mt-2 text-xs text-muted">
          {mark.initials} fused with a {mark.symbol}. The mark rebuilds as the header changes.
        </p>
      </div>
      <div>
        <Label htmlFor="brand-header">Header</Label>
        <Input
          id="brand-header"
          value={header}
          disabled={disabled}
          onChange={(event) => onHeader(event.target.value)}
          placeholder="Shop name"
          className="mt-2"
        />
        <Label htmlFor="brand-tagline" className="mt-3">
          Tagline
        </Label>
        <Input
          id="brand-tagline"
          value={tagline}
          disabled={disabled}
          onChange={(event) => onTagline(event.target.value)}
          placeholder="One line under the name"
          className="mt-2"
        />
        <p className="mt-4 text-xs uppercase tracking-[0.18em] text-muted">Perimeter and touch ripple</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {RIPPLE_THEMES.map((item) => {
            const on = item.id === theme;
            return (
              <button
                key={item.id}
                type="button"
                disabled={disabled}
                aria-pressed={on}
                onClick={() => onTheme(item.id)}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-surface-2 px-3 text-sm text-fg"
                style={{
                  boxShadow: on
                    ? `0 0 0 1px ${item.ring}, 0 0 16px color-mix(in srgb, ${item.accent} 55%, transparent)`
                    : "0 0 0 1px rgba(243,241,235,0.12)",
                }}
              >
                <span className="size-3 rounded-full" style={{ background: item.accent }} />
                {item.label}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          className="ripple-stage mt-4 h-28 w-full"
          style={surface}
          onPointerDown={(event) => {
            const bounds = event.currentTarget.getBoundingClientRect();
            const id = Date.now();
            setRipples((current) => [...current.slice(-4), { id, x: event.clientX - bounds.left, y: event.clientY - bounds.top }]);
          }}
        >
          <span className="pointer-events-none text-sm text-fg">Touch the glass</span>
          {ripples.map((ripple) => (
            <span key={ripple.id} className="touch-ripple" style={{ left: ripple.x, top: ripple.y }} />
          ))}
        </button>
      </div>
    </div>
  );
}

/** Public name for the studio the outreach preview mounts. */
export const AxiomGenerativeBrandingStudio = BrandStudio;
