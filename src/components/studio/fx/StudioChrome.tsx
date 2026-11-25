"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { LayoutDashboard, Library, Settings, SlidersHorizontal, Sparkles, Users } from "lucide-react";
import type { StudioAssetSlot, StudioFxLevels, StudioFxState, StudioFxToggles, StudioTenantRow } from "@/lib/axiom/studio-fx";
import { StudioCompareSlider } from "./StudioCompareSlider";
import { StudioFxOverlay } from "./StudioFxOverlay";
import "./studio-deck.css";

export type StudioNavId = "control" | "library" | "tenants" | "prompts" | "settings";

export function AxiomMark() {
  return (
    <Link href="/admin/studio" className="ax-mark" aria-label="Axiom Studio">
      <svg width="28" height="28" viewBox="0 0 64 64" aria-hidden>
        <polygon points="32,4 56,18 56,46 32,60 8,46 8,18" fill="none" stroke="#00ffcc" strokeWidth="2.4" />
        <path d="M20 44 L32 18 L44 44 M25 34 H39" fill="none" stroke="#e4b57a" strokeWidth="2.6" strokeLinejoin="round" />
      </svg>
      <span>AXIOM</span>
    </Link>
  );
}

export function StudioDeckFrame({ children }: { children: ReactNode }) {
  return (
    <div className="ax-deck">
      <div className="ax-deck__bezel">
        <div className="ax-deck__beam" aria-hidden />
        {children}
      </div>
    </div>
  );
}

const NAV: { id: StudioNavId; label: string; icon: typeof Sparkles }[] = [
  { id: "control", label: "Studio Control", icon: Sparkles },
  { id: "library", label: "Asset Library", icon: Library },
  { id: "tenants", label: "Tenants", icon: Users },
  { id: "prompts", label: "AI Tuning", icon: SlidersHorizontal },
  { id: "settings", label: "Settings", icon: Settings },
];

export function StudioNavRail({
  active,
  onChange,
}: {
  active: StudioNavId;
  onChange: (id: StudioNavId) => void;
}) {
  return (
    <nav className="ax-rail" aria-label="Studio">
      <AxiomMark />
      <Link href="/admin" className="ax-nav-btn" title="Dashboard" aria-label="Dashboard">
        <LayoutDashboard size={18} />
      </Link>
      {NAV.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            className="ax-nav-btn"
            data-on={active === item.id}
            title={item.label}
            aria-label={item.label}
            aria-current={active === item.id ? "page" : undefined}
            onClick={() => onChange(item.id)}
          >
            <Icon size={18} />
          </button>
        );
      })}
    </nav>
  );
}

export function StudioActionStack({
  onGenerate,
  onRender,
  busy,
  disabled,
  jobs,
}: {
  onGenerate: () => void;
  onRender: () => void;
  busy: string | null;
  disabled?: boolean;
  jobs: { id: string; slug: string; label: string; progress: number }[];
}) {
  return (
    <div className="ax-actions">
      <button type="button" className="ax-btn ax-btn--copper" disabled={disabled || !!busy} onClick={onGenerate}>
        {busy === "still" ? "Generating…" : "Generate Branded Asset"}
      </button>
      <button type="button" className="ax-btn ax-btn--cyan" disabled={disabled || !!busy} onClick={onRender}>
        {busy === "video" ? "Rendering…" : "Render Autopilot Video"}
      </button>
      <section className="ax-glass ax-queue">
        <h2>Studio Render Queue</h2>
        <p>Active tenant jobs</p>
        {jobs.length === 0 ? (
          <p>Queue clear</p>
        ) : (
          <ul>
            {jobs.map((job) => (
              <li key={job.id}>
                <div className="ax-queue__meta">
                  <span>
                    {job.slug} · {job.label}
                  </span>
                  <span>{Math.round(job.progress * 100)}%</span>
                </div>
                <div className="ax-bar" aria-hidden>
                  <span style={{ width: `${Math.round(job.progress * 100)}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export function CyanSwitch({
  label,
  on,
  disabled,
  onChange,
}: {
  label: string;
  on: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      className="ax-switch-row"
      aria-pressed={on}
      disabled={disabled}
      onClick={() => onChange(!on)}
    >
      <span>{label}</span>
      <span className="ax-switch" data-on={on}>
        <i />
      </span>
    </button>
  );
}

export function CopperSlider({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  disabled?: boolean;
  onChange: (next: number) => void;
}) {
  const dots = 11;
  return (
    <label className="ax-slider">
      <span className="ax-slider__label">{label}</span>
      <span className="ax-slider__track">
        {Array.from({ length: dots }, (_, i) => {
          const p = i / (dots - 1);
          return <i key={i} data-on={p <= value + 0.04} data-head={Math.abs(p - value) <= 0.06} />;
        })}
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={value}
          disabled={disabled}
          aria-label={label}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </span>
    </label>
  );
}

export function StudioParameterPanel({
  toggles,
  levels,
  disabled,
  onPatch,
}: {
  toggles: StudioFxToggles;
  levels: StudioFxLevels;
  disabled?: boolean;
  onPatch: (recipe: (state: StudioFxState) => StudioFxState) => void;
}) {
  const bind = (level: keyof StudioFxLevels, toggle: keyof StudioFxToggles) => (n: number) => {
    onPatch((state) => ({
      ...state,
      levels: { ...state.levels, [level]: n },
      toggles: { ...state.toggles, [toggle]: n > 0.04 },
    }));
  };

  return (
    <section className="ax-glass ax-params">
      <p className="ax-kicker">Parameter Control Panel</p>
      <div className="ax-params__row">
        <div>
          <p className="ax-kicker" style={{ marginBottom: 8 }}>
            FX
          </p>
          <CyanSwitch
            label="Axiom Badge Overlay"
            on={toggles.axiomBadge}
            disabled={disabled}
            onChange={(axiomBadge) => onPatch((state) => ({ ...state, toggles: { ...state.toggles, axiomBadge } }))}
          />
        </div>
        <CopperSlider label="Copper Wrap Accents" value={levels.copper} disabled={disabled} onChange={bind("copper", "copperWrap")} />
        <CopperSlider label="Cinematic Smoke FX" value={levels.smoke} disabled={disabled} onChange={bind("smoke", "cinematicSmoke")} />
        <CopperSlider label="Mud Splatter Reflections" value={levels.mud} disabled={disabled} onChange={bind("mud", "wetMud")} />
      </div>
      <div className="ax-params__extra">
        <span className="ax-chip">
          <CyanSwitch
            label="Neon Headlight / Clipper Glow"
            on={toggles.neonGlow}
            disabled={disabled}
            onChange={(neonGlow) =>
              onPatch((state) => ({
                ...state,
                toggles: { ...state.toggles, neonGlow },
                levels: { ...state.levels, glow: neonGlow ? Math.max(state.levels.glow, 0.55) : 0 },
              }))
            }
          />
        </span>
        <span className="ax-chip">
          <CyanSwitch
            label="Tactical HUD Frame"
            on={toggles.hudFrame}
            disabled={disabled}
            onChange={(hudFrame) => onPatch((state) => ({ ...state, toggles: { ...state.toggles, hudFrame } }))}
          />
        </span>
        <span className="ax-chip">
          <CyanSwitch
            label="Snow / Ember Particles"
            on={toggles.snowEmber}
            disabled={disabled}
            onChange={(snowEmber) => onPatch((state) => ({ ...state, toggles: { ...state.toggles, snowEmber } }))}
          />
        </span>
        <div style={{ minWidth: 180, flex: 1 }}>
          <CopperSlider
            label="Neon Glow Intensity"
            value={levels.glow}
            disabled={disabled}
            onChange={bind("glow", "neonGlow")}
          />
        </div>
      </div>
    </section>
  );
}

export function StudioSplitMonitor({
  beforeUrl,
  afterUrl,
  toggles,
  levels,
  tag,
}: {
  beforeUrl: string;
  afterUrl: string;
  toggles: StudioFxToggles;
  levels: StudioFxLevels;
  tag?: string;
}) {
  const [scrub, setScrub] = useState(false);
  const distinct = afterUrl && afterUrl !== beforeUrl;
  return (
    <div className="ax-monitor">
      <div className="ax-monitor__bar">
        <span>Raw Snapshot{tag ? ` · ${tag}` : ""}</span>
        <span className="ax-monitor__ba">Before/After</span>
        <span>
          Axiom Studio Output{" "}
          <button type="button" className="ax-mode" data-on={scrub} onClick={() => setScrub((v) => !v)}>
            {scrub ? "Slider" : "Split"}
          </button>
        </span>
      </div>
      {scrub ? (
        <StudioCompareSlider
          beforeUrl={beforeUrl}
          afterUrl={distinct ? afterUrl : beforeUrl}
          afterOverlay={<StudioFxOverlay toggles={toggles} levels={levels} />}
        />
      ) : (
        <div className="ax-monitor__frame">
          <div className="ax-half ax-half--raw">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={beforeUrl} alt="Raw snapshot" draggable={false} />
            <span className="ax-cap">Raw Snapshot</span>
          </div>
          <div className="ax-half ax-half--out">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={distinct ? afterUrl : beforeUrl} alt="Axiom studio output" draggable={false} />
            <StudioFxOverlay toggles={toggles} levels={levels} amount={distinct ? 0.72 : 1} />
            <span className="ax-cap">Axiom Studio Output</span>
          </div>
          <div className="ax-divider" />
        </div>
      )}
    </div>
  );
}

export function AssetPool({
  assets,
  onPick,
}: {
  assets: StudioAssetSlot[];
  onPick?: (asset: StudioAssetSlot) => void;
}) {
  return (
    <section className="ax-glass ax-pool">
      <h2>Global Asset Pool</h2>
      <div className="ax-pool__grid">
        {assets.slice(0, 4).map((asset) => (
          <button key={asset.id} type="button" onClick={() => onPick?.(asset)} title={`Use ${asset.label} as the raw plate`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset.thumbUrl} alt="" />
            <span>{asset.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

export function TenantOversight({ tenants }: { tenants: StudioTenantRow[] }) {
  return (
    <section className="ax-glass ax-oversight">
      <h2>Tenant Oversight Grid</h2>
      <table className="ax-table">
        <thead>
          <tr>
            <th>Tenant</th>
            <th>Studio Usage</th>
            <th>Stripe Connect</th>
          </tr>
        </thead>
        <tbody>
          {tenants.map((tenant) => (
            <tr key={tenant.slug}>
              <td>
                <Link href={`/${tenant.slug}/admin/studio`}>
                  <span className="name">{tenant.name}</span>
                  <span className="sub">
                    {tenant.niche}
                    {tenant.lastRenderAt ? ` · ${new Date(tenant.lastRenderAt).toLocaleDateString()}` : ""}
                  </span>
                </Link>
              </td>
              <td className="ax-usage">{tenant.studioUsage}</td>
              <td>
                <span className={tenant.stripeConnected ? "ax-pill ax-pill--on" : "ax-pill ax-pill--off"}>
                  {tenant.stripeConnected ? "Live" : "Open"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export function MasterAdminSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { slug: string; name: string }[];
  onChange: (slug: string) => void;
}) {
  const seen = new Set(options.map((option) => option.slug));
  const list = seen.has(value) ? options : [{ slug: value, name: value }, ...options];
  return (
    <label className="ax-side__top">
      <span className="sr-only">Active tenant frame</span>
      <select className="ax-select" value={value} aria-label="Master Admin tenant" onChange={(e) => onChange(e.target.value)}>
        {list.map((option) => (
          <option key={option.slug} value={option.slug}>
            {option.slug === "default" ? "Master Admin" : option.name}
          </option>
        ))}
      </select>
    </label>
  );
}

export function PacificStamp() {
  const [label, setLabel] = useState("");
  useEffect(() => {
    const tick = () => {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Los_Angeles",
        month: "short",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).formatToParts(new Date());
      const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
      setLabel(`${get("month")} ${get("day")}, ${get("year")} · ${get("hour")}:${get("minute")} PST`.toUpperCase());
    };
    tick();
    const id = setInterval(tick, 15000);
    return () => clearInterval(id);
  }, []);
  return <p className="ax-stamp">{label}</p>;
}
