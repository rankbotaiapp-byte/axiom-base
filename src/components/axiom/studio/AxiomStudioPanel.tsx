"use client";

/**
 * AxiomStudioPanel — drop into the Master Admin Dashboard or use via /axiom/studio.
 * Every edit broadcasts instantly to open Axiom pages (live preview), then autosaves
 * to Supabase `app_settings` through /api/axiom/config (admin-key protected).
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  AXIOM_EXPRESSIONS,
  DEFAULT_AXIOM_CONFIG,
  normalizeConfig,
  type AxiomConfig,
  type CroLayer,
  type PricingPlan,
} from "@/lib/axiom/landing/config";
import { broadcastAxiomDraft, saveAxiomConfig, useAxiomConfig } from "@/lib/axiom/landing/useAxiomConfig";

type Path = (string | number)[];
type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

function setIn<T>(obj: T, path: Path, value: unknown): T {
  if (!path.length) return value as T;
  const [k, ...rest] = path;
  const src = obj as unknown as Record<string | number, unknown>;
  const copy: Record<string | number, unknown> = Array.isArray(obj) ? [...(obj as unknown[])] as never : { ...src };
  copy[k] = setIn(src[k], rest, value);
  return copy as T;
}

const TABS = ["Copy", "Layers", "Pricing", "Axiom", "Boosters", "Particles", "Theme", "JSON"] as const;
type Tab = (typeof TABS)[number];

export default function AxiomStudioPanel({ slug: initialSlug = "default", previewPath = "/axiom" }: { slug?: string; previewPath?: string }) {
  const [slug, setSlug] = useState(initialSlug);
  const { config: remote, loaded } = useAxiomConfig(slug);
  const [cfg, setCfg] = useState<AxiomConfig>(remote);
  const [tab, setTab] = useState<Tab>("Copy");
  const [adminKey, setAdminKey] = useState("");
  const [autosave, setAutosave] = useState(true);
  const [status, setStatus] = useState<SaveState>("idle");
  const [err, setErr] = useState("");
  const [preview, setPreview] = useState(previewPath);
  const dirty = useRef(false);

  useEffect(() => setAdminKey(sessionStorage.getItem("axiom-admin-key") || ""), []);
  useEffect(() => {
    if (!dirty.current) setCfg(remote);
  }, [remote]);

  const save = useCallback(
    async (next: AxiomConfig) => {
      if (!adminKey) {
        setStatus("error");
        setErr("Enter the admin key to save");
        return;
      }
      setStatus("saving");
      try {
        await saveAxiomConfig(slug, next, adminKey);
        sessionStorage.setItem("axiom-admin-key", adminKey);
        dirty.current = false;
        setStatus("saved");
        setErr("");
      } catch (e) {
        setStatus("error");
        setErr((e as Error).message);
      }
    },
    [adminKey, slug]
  );

  // autosave (debounced) — preview already updated instantly via broadcast
  useEffect(() => {
    if (!autosave || status !== "dirty") return;
    const id = setTimeout(() => save(cfg), 700);
    return () => clearTimeout(id);
  }, [cfg, autosave, status, save]);

  const update = (path: Path, value: unknown) => {
    setCfg((prev) => {
      const next = setIn(prev, path, value);
      broadcastAxiomDraft(slug, next);
      return next;
    });
    dirty.current = true;
    setStatus("dirty");
  };

  const P = { cfg, update };

  return (
    <div className="flex h-full min-h-[100svh] flex-col bg-[#050507] text-zinc-100 lg:flex-row">
      {/* editor */}
      <div className="flex w-full flex-col border-white/10 lg:w-[440px] lg:border-r">
        <header className="sticky top-0 z-10 space-y-3 border-b border-white/10 bg-[#050507]/95 p-4 backdrop-blur">
          <div className="flex items-center justify-between">
            <h1 className="font-mono text-sm font-semibold tracking-[0.3em] text-cyan-400">AXIOM STUDIO</h1>
            <StatusPill status={status} loaded={loaded} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input className={inputCls} value={slug} onChange={(e) => setSlug(e.target.value.replace(/[^a-z0-9-_]/gi, ""))} placeholder="slug" title="Config slug" />
            <input className={inputCls} type="password" value={adminKey} onChange={(e) => setAdminKey(e.target.value)} placeholder="admin key" />
          </div>
          <div className="flex items-center gap-2 text-xs">
            <label className="flex items-center gap-1.5 text-zinc-400">
              <input type="checkbox" checked={autosave} onChange={(e) => setAutosave(e.target.checked)} /> Autosave
            </label>
            <button onClick={() => save(cfg)} className="ml-auto rounded-md bg-cyan-500 px-3 py-1.5 font-semibold text-black">
              Save now
            </button>
            <button
              onClick={() => confirm("Reset everything to Axiom defaults?") && (update([], DEFAULT_AXIOM_CONFIG), undefined)}
              className="rounded-md border border-white/15 px-3 py-1.5 text-zinc-300"
            >
              Reset
            </button>
          </div>
          {err && <p className="text-xs text-red-400">{err}</p>}
          <nav className="-mx-1 flex flex-wrap gap-1">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-md px-2.5 py-1 text-xs ${tab === t ? "bg-cyan-500/15 text-cyan-300" : "text-zinc-400 hover:text-zinc-200"}`}
              >
                {t}
              </button>
            ))}
          </nav>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto p-4 pb-24">
          {tab === "Copy" && <CopyTab {...P} />}
          {tab === "Layers" && <LayersTab {...P} />}
          {tab === "Pricing" && <PricingTab {...P} />}
          {tab === "Axiom" && <AxiomTab {...P} />}
          {tab === "Boosters" && <BoostersTab {...P} />}
          {tab === "Particles" && <ParticlesTab {...P} />}
          {tab === "Theme" && <ThemeTab {...P} />}
          {tab === "JSON" && <JsonTab {...P} />}
        </div>
      </div>

      {/* live preview */}
      <div className="hidden flex-1 flex-col lg:flex">
        <div className="flex items-center gap-2 border-b border-white/10 p-2 text-xs">
          <span className="text-zinc-500">Preview</span>
          {["/axiom", "/axiom/companion", "/axiom/studio"].map((p) => (
            <button key={p} onClick={() => setPreview(p)} className={`rounded px-2 py-1 ${preview === p ? "bg-white/10" : "text-zinc-400"}`}>
              {p}
            </button>
          ))}
          <a href={`${preview}?slug=${slug}`} target="_blank" className="ml-auto text-cyan-400">
            Open ↗
          </a>
        </div>
        <iframe key={preview + slug} src={`${preview}?slug=${slug}`} className="w-full flex-1 bg-black" />
      </div>
    </div>
  );
}

/* ------------------------------ tabs ------------------------------ */

type TabProps = { cfg: AxiomConfig; update: (p: Path, v: unknown) => void };

function CopyTab({ cfg, update }: TabProps) {
  const h = cfg.hero;
  return (
    <>
      <Group title="Hero">
        <Text label="Eyebrow" value={h.eyebrow} onChange={(v) => update(["hero", "eyebrow"], v)} />
        <Text label="Headline" value={h.headline} onChange={(v) => update(["hero", "headline"], v)} />
        <Text label="Highlight (gradient)" value={h.highlight} onChange={(v) => update(["hero", "highlight"], v)} />
        <Area label="Subhead" value={h.subhead} onChange={(v) => update(["hero", "subhead"], v)} />
        <Cta label="Primary CTA" value={h.primaryCta} onChange={(v) => update(["hero", "primaryCta"], v)} />
        <Cta label="Secondary CTA" value={h.secondaryCta} onChange={(v) => update(["hero", "secondaryCta"], v)} />
        <List label="Status chips" value={h.statusChips} onChange={(v) => update(["hero", "statusChips"], v)} />
      </Group>
      <Group title="Landing chrome">
        <Text label="Brand name (HUD + intro backdrop)" value={cfg.cro.brandName} onChange={(v) => update(["cro", "brandName"], v)} />
        <List label="Live dispatch ticker" value={cfg.cro.hudTicker} onChange={(v) => update(["cro", "hudTicker"], v)} />
        <Toggle label="Scroll snap" value={cfg.cro.scrollSnap} onChange={(v) => update(["cro", "scrollSnap"], v)} />
        <Slider label="Scroll per layer (vh)" min={60} max={200} step={10} value={cfg.cro.layerScrollVh} onChange={(v) => update(["cro", "layerScrollVh"], v)} />
      </Group>
    </>
  );
}

const newLayer = (): CroLayer => ({
  id: `layer-${Date.now().toString(36)}`,
  enabled: true,
  from: "left",
  align: "left",
  accent: "cyan",
  kicker: "NEW LAYER",
  headline: "Headline that sells the outcome",
  body: "One or two sentences that make the pain and the fix obvious.",
  bullets: [],
  backdropWord: "",
  axiomExpression: "neutral",
});

function LayersTab({ cfg, update }: TabProps) {
  const layers = cfg.cro.layers;
  const set = (next: CroLayer[]) => update(["cro", "layers"], next);
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= layers.length) return;
    const n = [...layers];
    [n[i], n[j]] = [n[j], n[i]];
    set(n);
  };
  return (
    <>
      {layers.map((l, i) => {
        const at = (k: keyof CroLayer) => ["cro", "layers", i, k] as Path;
        return (
          <Group
            key={l.id}
            title={`${String(i + 1).padStart(2, "0")} · ${l.kicker || "Layer"}`}
            actions={
              <>
                <IconBtn onClick={() => move(i, -1)}>↑</IconBtn>
                <IconBtn onClick={() => move(i, 1)}>↓</IconBtn>
                <IconBtn onClick={() => set(layers.filter((_, j) => j !== i))}>✕</IconBtn>
              </>
            }
          >
            <Toggle label="Enabled" value={l.enabled} onChange={(v) => update(at("enabled"), v)} />
            <Text label="Kicker" value={l.kicker} onChange={(v) => update(at("kicker"), v)} />
            <Area label="Headline" value={l.headline} onChange={(v) => update(at("headline"), v)} />
            <Area label="Body" value={l.body} onChange={(v) => update(at("body"), v)} />
            <List label="Bullets" value={l.bullets} onChange={(v) => update(at("bullets"), v)} />
            <Text label="Backdrop word (behind Axiom)" value={l.backdropWord} onChange={(v) => update(at("backdropWord"), v)} />
            <div className="grid grid-cols-2 gap-2">
              <Select label="Slides from" value={l.from} options={["top", "left", "right", "bottom"]} onChange={(v) => update(at("from"), v)} />
              <Select label="Column" value={l.align} options={["left", "right"]} onChange={(v) => update(at("align"), v)} />
              <Select label="Accent" value={l.accent} options={["cyan", "crimson", "amber"]} onChange={(v) => update(at("accent"), v)} />
              <Select label="Axiom face" value={l.axiomExpression} options={AXIOM_EXPRESSIONS} onChange={(v) => update(at("axiomExpression"), v)} />
            </div>
            <Toggle label="Layer CTA" value={Boolean(l.cta)} onChange={(v) => update(at("cta"), v ? { label: "Start for $1", href: "/checkout?plan=trial" } : undefined)} />
            {l.cta && <Cta label="CTA" value={l.cta} onChange={(v) => update(at("cta"), v)} />}
          </Group>
        );
      })}
      <button onClick={() => set([...layers, newLayer()])} className="w-full rounded-lg border border-dashed border-cyan-500/40 py-3 text-sm text-cyan-300">
        + Add ad-copy layer
      </button>
    </>
  );
}

function PricingTab({ cfg, update }: TabProps) {
  const plans = cfg.cro.plans;
  return (
    <>
      <Group title="Pricing section">
        <Text label="Headline" value={cfg.cro.pricingHeadline} onChange={(v) => update(["cro", "pricingHeadline"], v)} />
        <Area label="Subhead" value={cfg.cro.pricingSubhead} onChange={(v) => update(["cro", "pricingSubhead"], v)} />
        <Area label="Fine print" value={cfg.cro.finePrint} onChange={(v) => update(["cro", "finePrint"], v)} />
      </Group>
      {plans.map((p, i) => {
        const at = (k: keyof PricingPlan) => ["cro", "plans", i, k] as Path;
        return (
          <Group key={p.id} title={p.name} actions={<IconBtn onClick={() => update(["cro", "plans"], plans.filter((_, j) => j !== i))}>✕</IconBtn>}>
            <div className="grid grid-cols-2 gap-2">
              <Toggle label="Enabled" value={p.enabled} onChange={(v) => update(at("enabled"), v)} />
              <Toggle label="Highlight" value={p.highlight} onChange={(v) => update(at("highlight"), v)} />
            </div>
            <Text label="Name" value={p.name} onChange={(v) => update(at("name"), v)} />
            <div className="grid grid-cols-2 gap-2">
              <Text label="Price" value={p.price} onChange={(v) => update(at("price"), v)} />
              <Text label="Cadence" value={p.cadence} onChange={(v) => update(at("cadence"), v)} />
            </div>
            <Area label="Blurb" value={p.blurb} onChange={(v) => update(at("blurb"), v)} />
            <List label="Features" value={p.features} onChange={(v) => update(at("features"), v)} />
            <Cta label="Button" value={p.cta} onChange={(v) => update(at("cta"), v)} />
            <Select label="Accent" value={p.accent} options={["cyan", "crimson", "amber"]} onChange={(v) => update(at("accent"), v)} />
          </Group>
        );
      })}
      <button
        onClick={() =>
          update(["cro", "plans"], [
            ...plans,
            { id: `plan-${Date.now().toString(36)}`, enabled: true, name: "New plan", price: "$0", cadence: "/mo", blurb: "", features: [], cta: { label: "Choose", href: "/checkout" }, highlight: false, accent: "cyan" },
          ])
        }
        className="w-full rounded-lg border border-dashed border-cyan-500/40 py-3 text-sm text-cyan-300"
      >
        + Add plan
      </button>
    </>
  );
}

function AxiomTab({ cfg, update }: TabProps) {
  const c = cfg.companion;
  const at = (k: keyof AxiomConfig["companion"]) => ["companion", k] as Path;
  return (
    <>
      <Group title="Character">
        <p className="text-xs text-zinc-400">
          Assistant look is limited to male human, female human, animal, or a colored orb. Body-shape sliders are off for launch.
        </p>
        <Text label="Image URL (JPG, or transparent PNG with feather 0)" value={c.imageUrl} onChange={(v) => update(at("imageUrl"), v)} />
        <Slider label="Edge feather" min={0} max={0.8} step={0.02} value={c.edgeFeather} onChange={(v) => update(at("edgeFeather"), v)} />
      </Group>
      <Group title="Cursor tracking">
        <Slider label="Tilt strength" min={0} max={0.8} step={0.01} value={c.tiltStrength} onChange={(v) => update(at("tiltStrength"), v)} />
        <Slider label="Spring stiffness" min={10} max={300} step={5} value={c.springStiffness} onChange={(v) => update(at("springStiffness"), v)} />
        <Slider label="Spring damping" min={2} max={40} step={1} value={c.springDamping} onChange={(v) => update(at("springDamping"), v)} />
        <Slider label="Hover float" min={0} max={0.3} step={0.01} value={c.floatAmplitude} onChange={(v) => update(at("floatAmplitude"), v)} />
        <Slider label="Float speed" min={0.2} max={3} step={0.1} value={c.floatSpeed} onChange={(v) => update(at("floatSpeed"), v)} />
        <Toggle label="Eyes follow cursor" value={c.eyeTracking} onChange={(v) => update(at("eyeTracking"), v)} />
      </Group>
      <Group title="Face">
        <Color label="LED eye color" value={c.eyeColor} onChange={(v) => update(at("eyeColor"), v)} />
        <div className="grid grid-cols-3 gap-2">
          <Select label="Idle" value={c.idleExpression} options={AXIOM_EXPRESSIONS} onChange={(v) => update(at("idleExpression"), v)} />
          <Select label="Hover" value={c.hoverExpression} options={AXIOM_EXPRESSIONS} onChange={(v) => update(at("hoverExpression"), v)} />
          <Select label="Click" value={c.clickExpression} options={AXIOM_EXPRESSIONS} onChange={(v) => update(at("clickExpression"), v)} />
        </div>
        <Field label="Mood cycle (click to add, ✕ to remove)">
          <div className="flex flex-wrap gap-1">
            {c.moodCycle.map((m, i) => (
              <button key={i} onClick={() => update(at("moodCycle"), c.moodCycle.filter((_, j) => j !== i))} className="rounded bg-cyan-500/15 px-2 py-0.5 text-xs text-cyan-300">
                {m} ✕
              </button>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {AXIOM_EXPRESSIONS.map((m) => (
              <button key={m} onClick={() => update(at("moodCycle"), [...c.moodCycle, m])} className="rounded border border-white/10 px-2 py-0.5 text-xs text-zinc-400">
                + {m}
              </button>
            ))}
          </div>
        </Field>
        <Slider label="Mood change every (ms)" min={1500} max={20000} step={500} value={c.moodCycleMs} onChange={(v) => update(at("moodCycleMs"), v)} />
        <Slider label="Blink min (ms)" min={600} max={8000} step={100} value={c.blinkMinMs} onChange={(v) => update(at("blinkMinMs"), v)} />
        <Slider label="Blink max (ms)" min={800} max={12000} step={100} value={c.blinkMaxMs} onChange={(v) => update(at("blinkMaxMs"), v)} />
        <Slider label="Wink chance" min={0} max={1} step={0.01} value={c.winkChance} onChange={(v) => update(at("winkChance"), v)} />
      </Group>
      <Group title="Armor shader">
        <Slider label="Color shift" min={0} max={1.5} step={0.05} value={c.armorShift} onChange={(v) => update(at("armorShift"), v)} />
        <Slider label="Shift speed" min={0} max={3} step={0.05} value={c.armorShiftSpeed} onChange={(v) => update(at("armorShiftSpeed"), v)} />
        <Color label="Sheen color" value={c.armorSheenColor} onChange={(v) => update(at("armorSheenColor"), v)} />
      </Group>
    </>
  );
}

function BoostersTab({ cfg, update }: TabProps) {
  const b = cfg.boosters;
  const at = (k: keyof AxiomConfig["boosters"]) => ["boosters", k] as Path;
  return (
    <Group title="Plasma boosters">
      <Toggle label="Enabled" value={b.enabled} onChange={(v) => update(at("enabled"), v)} />
      <Slider label="Intensity" min={0} max={2.5} step={0.05} value={b.intensity} onChange={(v) => update(at("intensity"), v)} />
      <Slider label="Pulse speed (Hz)" min={0.1} max={5} step={0.1} value={b.pulseSpeed} onChange={(v) => update(at("pulseSpeed"), v)} />
      <Slider label="Plume length" min={0.3} max={2} step={0.05} value={b.plumeLength} onChange={(v) => update(at("plumeLength"), v)} />
      <Color label="White-hot core" value={b.coreColor} onChange={(v) => update(at("coreColor"), v)} />
      <Color label="Neon glow" value={b.glowColor} onChange={(v) => update(at("glowColor"), v)} />
      <Color label="Plume tail" value={b.flareColor} onChange={(v) => update(at("flareColor"), v)} />
    </Group>
  );
}

function ParticlesTab({ cfg, update }: TabProps) {
  const p = cfg.particles;
  const at = (k: keyof AxiomConfig["particles"]) => ["particles", k] as Path;
  return (
    <Group title="Particle stream">
      <Toggle label="Enabled" value={p.enabled} onChange={(v) => update(at("enabled"), v)} />
      <Slider label="Density (count)" min={200} max={8000} step={100} value={p.count} onChange={(v) => update(at("count"), v)} />
      <Slider label="Rise speed" min={0} max={2} step={0.05} value={p.speed} onChange={(v) => update(at("speed"), v)} />
      <Slider label="Turbulence" min={0} max={2} step={0.05} value={p.turbulence} onChange={(v) => update(at("turbulence"), v)} />
      <Slider label="Size" min={0.3} max={3} step={0.05} value={p.size} onChange={(v) => update(at("size"), v)} />
      <Slider label="Opacity" min={0} max={1} step={0.05} value={p.opacity} onChange={(v) => update(at("opacity"), v)} />
      <Slider label="Cursor radius" min={0} max={0.6} step={0.01} value={p.mouseRadius} onChange={(v) => update(at("mouseRadius"), v)} />
      <Slider label="Cursor force" min={0} max={3} step={0.05} value={p.mouseForce} onChange={(v) => update(at("mouseForce"), v)} />
      <Slider label="Scroll intensify" min={0} max={4} step={0.1} value={p.scrollBoost} onChange={(v) => update(at("scrollBoost"), v)} />
      {p.colors.map((c, i) => (
        <Color key={i} label={`Color ${i + 1}`} value={c} onChange={(v) => update(["particles", "colors", i], v)} />
      ))}
    </Group>
  );
}

function ThemeTab({ cfg, update }: TabProps) {
  return (
    <Group title="Theme">
      {(Object.keys(cfg.theme) as (keyof AxiomConfig["theme"])[]).map((k) => (
        <Color key={k} label={k} value={cfg.theme[k]} onChange={(v) => update(["theme", k], v)} />
      ))}
    </Group>
  );
}

function JsonTab({ cfg, update }: TabProps) {
  const [text, setText] = useState(() => JSON.stringify(cfg, null, 2));
  const [bad, setBad] = useState(false);
  return (
    <Group title="Import / export">
      <textarea className={`${inputCls} h-[60vh] font-mono text-[11px]`} value={text} onChange={(e) => setText(e.target.value)} />
      <div className="flex gap-2">
        <button
          className="rounded-md bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-black"
          onClick={() => {
            try {
              update([], normalizeConfig(JSON.parse(text)));
              setBad(false);
            } catch {
              setBad(true);
            }
          }}
        >
          Apply JSON
        </button>
        <button className="rounded-md border border-white/15 px-3 py-1.5 text-xs" onClick={() => navigator.clipboard.writeText(JSON.stringify(cfg, null, 2))}>
          Copy
        </button>
        {bad && <span className="text-xs text-red-400">Invalid JSON</span>}
      </div>
    </Group>
  );
}

/* ------------------------------ controls ------------------------------ */

const inputCls = "w-full rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-sm outline-none focus:border-cyan-500/60";

function StatusPill({ status, loaded }: { status: SaveState; loaded: boolean }) {
  const map: Record<SaveState, [string, string]> = {
    idle: [loaded ? "Synced" : "Loading…", "text-zinc-400"],
    dirty: ["Unsaved · live preview", "text-amber-400"],
    saving: ["Saving…", "text-cyan-300"],
    saved: ["Saved", "text-emerald-400"],
    error: ["Not saved", "text-red-400"],
  };
  const [label, cls] = map[status];
  return <span className={`font-mono text-[11px] ${cls}`}>● {label}</span>;
}

function Group({ title, children, actions }: { title: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex items-center gap-1">
        <h2 className="flex-1 truncate text-xs font-semibold uppercase tracking-[0.18em] text-zinc-300">{title}</h2>
        {actions}
      </div>
      {children}
    </section>
  );
}

const IconBtn = ({ children, onClick }: { children: ReactNode; onClick: () => void }) => (
  <button onClick={onClick} className="h-6 w-6 rounded text-xs text-zinc-400 hover:bg-white/10 hover:text-white">
    {children}
  </button>
);

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] text-zinc-400">{label}</span>
      {children}
    </label>
  );
}

const Text = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <Field label={label}>
    <input className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} />
  </Field>
);

const Area = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <Field label={label}>
    <textarea rows={3} className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} />
  </Field>
);

const List = ({ label, value, onChange }: { label: string; value: string[]; onChange: (v: string[]) => void }) => (
  <Field label={`${label} (one per line)`}>
    <textarea rows={Math.max(2, value.length + 1)} className={inputCls} value={value.join("\n")} onChange={(e) => onChange(e.target.value.split("\n"))} onBlur={(e) => onChange(e.target.value.split("\n").map((s) => s.trim()).filter(Boolean))} />
  </Field>
);

const Cta = ({ label, value, onChange }: { label: string; value: { label: string; href: string }; onChange: (v: { label: string; href: string }) => void }) => (
  <Field label={label}>
    <div className="grid grid-cols-2 gap-2">
      <input className={inputCls} value={value.label} placeholder="Label" onChange={(e) => onChange({ ...value, label: e.target.value })} />
      <input className={inputCls} value={value.href} placeholder="/link" onChange={(e) => onChange({ ...value, href: e.target.value })} />
    </div>
  </Field>
);

const Slider = ({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) => (
  <Field label={label}>
    <div className="flex items-center gap-3">
      <input type="range" className="flex-1 accent-cyan-400" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <input type="number" className={`${inputCls} w-20 text-right`} min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  </Field>
);

const Color = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <Field label={label}>
    <div className="flex items-center gap-2">
      <input type="color" className="h-8 w-10 cursor-pointer rounded border border-white/10 bg-transparent" value={value} onChange={(e) => onChange(e.target.value)} />
      <input className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  </Field>
);

const Toggle = ({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) => (
  <label className="flex cursor-pointer items-center justify-between gap-3 text-sm">
    <span className="text-[11px] text-zinc-400">{label}</span>
    <button type="button" onClick={() => onChange(!value)} className={`relative h-5 w-9 rounded-full transition-colors ${value ? "bg-cyan-500" : "bg-white/15"}`}>
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${value ? "left-[18px]" : "left-0.5"}`} />
    </button>
  </label>
);

function Select<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: readonly T[]; onChange: (v: T) => void }) {
  return (
    <Field label={label}>
      <select className={inputCls} value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => (
          <option key={o} value={o} className="bg-zinc-900">
            {o}
          </option>
        ))}
      </select>
    </Field>
  );
}
