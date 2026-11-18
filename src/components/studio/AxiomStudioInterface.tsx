"use client";

import { useMemo, useState, type ReactNode } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, Layers, Rocket, Store } from "lucide-react";
import {
  PLUMBING_DIAGNOSTIC_VIDEO,
  PLUMBING_FIELD_OPS_VIDEO,
  PLUMBING_HERO_POSTER,
  PLUMBING_HERO_VIDEO,
} from "@/lib/axiom/plumbing-storefront";
import { DEFAULT_HERO_LOOK, persistHeroToSupabase, writeHeroDraft } from "@/lib/axiom/hero-studio-state";
import { orchestrateFinalWebBuild, revalidateStorefront, updateShopBrand } from "@/lib/axiom/server";
import {
  decomposeStudioLayers,
  STUDIO_MATRIX,
  STUDIO_MATRIX_NICHES,
  studioParticleSeeds,
  type StudioLayerPacket,
  type StudioMatrixNiche,
  type StudioParticleSeed,
  type StudioRenderLayer,
} from "@/lib/axiom/studio-engine";
import { handleGenerationGuardHttpStatus } from "@/lib/axiom/generation-checkout-client";
import { cn } from "@/lib/utils";

const STEPS = [
  { label: "Name", icon: Store },
  { label: "Preview", icon: Layers },
  { label: "Deploy", icon: Rocket },
] as const;

const TRADES = [
  {
    id: "drain",
    label: "Pipes and wrench",
    line: "Night calls, a clogged line, and the truck that rolls.",
    film: PLUMBING_HERO_VIDEO,
  },
  {
    id: "diagnostic",
    label: "Camera in the line",
    line: "The camera finds the clog. The jet clears it.",
    film: PLUMBING_DIAGNOSTIC_VIDEO,
  },
  {
    id: "field",
    label: "Trucks on the job",
    line: "Your vans, your roads, ready after hours.",
    film: PLUMBING_FIELD_OPS_VIDEO,
  },
] as const;

type TradeId = (typeof TRADES)[number]["id"];
type BusyAction = "lock" | "film" | "deploy" | null;

function Frame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("relative border border-neon-red/80 bg-obsidian", className)}>
      <span className="pointer-events-none absolute -left-px -top-px h-3.5 w-3.5 border-l-2 border-t-2 border-neon-red" />
      <span className="pointer-events-none absolute -right-px -top-px h-3.5 w-3.5 border-r-2 border-t-2 border-neon-red" />
      <span className="pointer-events-none absolute -bottom-px -left-px h-3.5 w-3.5 border-b-2 border-l-2 border-neon-red" />
      <span className="pointer-events-none absolute -bottom-px -right-px h-3.5 w-3.5 border-b-2 border-r-2 border-neon-red" />
      {children}
    </div>
  );
}

const FIELD_WASH: Record<StudioMatrixNiche, string> = {
  landscaping: "radial-gradient(circle at 28% 72%, #3d4a36 0%, #050507 64%)",
  plumbing: "radial-gradient(circle at 62% 42%, #6a3b28 0%, #050507 60%)",
  hvac: "radial-gradient(circle at 48% 28%, #1b3344 0%, #050507 62%)",
  electrical: "radial-gradient(circle at 38% 54%, #3c2618 0%, #050507 66%)",
  "pest-control": "radial-gradient(circle at 70% 64%, #1a2822 0%, #050507 64%)",
};

const PARTICLE_COLOR: Record<StudioLayerPacket["layers"][0]["particles"], string> = {
  pollen: "#d7c4a1",
  droplets: "#00f2fe",
  vapor: "#d5e6ee",
  sparks: "#ff2a3d",
  mist: "#b7c2c8",
  none: "#00f2fe",
};

function DepthPlate({
  layer,
  sx,
  sy,
  children,
  className,
}: {
  layer: StudioRenderLayer;
  sx: MotionValue<number>;
  sy: MotionValue<number>;
  children: ReactNode;
  className?: string;
}) {
  const x = useTransform(sx, (value) => value * layer.parallax * 72);
  const y = useTransform(sy, (value) => value * layer.parallax * 48);
  return (
    <motion.div className={className} style={{ x, y, z: layer.z, translateZ: layer.z }}>
      {children}
    </motion.div>
  );
}

function ParticleMote({
  seed,
  color,
  sx,
  sy,
}: {
  seed: StudioParticleSeed;
  color: string;
  sx: MotionValue<number>;
  sy: MotionValue<number>;
}) {
  const x = useTransform(sx, (value) => value * seed.depth * 90);
  const y = useTransform(sy, (value) => value * seed.depth * 64 - seed.drift);
  return (
    <motion.span
      aria-hidden
      className="pointer-events-none absolute rounded-full"
      style={{
        left: `${seed.x}%`,
        top: `${seed.y}%`,
        width: seed.size,
        height: seed.size,
        background: color,
        boxShadow: `0 0 ${seed.size * 4}px ${color}`,
        x,
        y,
      }}
    />
  );
}

function LayeredPreview({ packet, film }: { packet: StudioLayerPacket; film: string }) {
  const reduce = useReducedMotion();
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 140, damping: 18, mass: 0.35 });
  const sy = useSpring(py, { stiffness: 140, damping: 18, mass: 0.35 });
  const rotateX = useTransform(sy, [-0.5, 0.5], [9, -9]);
  const rotateY = useTransform(sx, [-0.5, 0.5], [-12, 12]);
  const seeds = useMemo(() => studioParticleSeeds(packet.niche), [packet.niche]);
  const [bokeh, equipment, nameplate] = packet.layers;
  const particleColor = PARTICLE_COLOR[bokeh.particles];

  function onMove(event: React.PointerEvent<HTMLDivElement>) {
    if (reduce || event.pointerType === "touch") return;
    const rect = event.currentTarget.getBoundingClientRect();
    px.set((event.clientX - rect.left) / rect.width - 0.5);
    py.set((event.clientY - rect.top) / rect.height - 0.5);
  }

  return (
    <div
      className="relative h-80 overflow-hidden sm:h-96"
      style={{ perspective: "1100px", background: "#050507" }}
      onPointerMove={onMove}
      onPointerLeave={() => {
        px.set(0);
        py.set(0);
      }}
    >
      <motion.div
        className="absolute inset-5"
        style={{
          transformStyle: "preserve-3d",
          rotateX: reduce ? 0 : rotateX,
          rotateY: reduce ? 0 : rotateY,
        }}
      >
        <DepthPlate layer={bokeh} sx={sx} sy={sy} className="absolute inset-0 overflow-hidden border border-neon-red/50">
          <div className="absolute inset-0" style={{ background: FIELD_WASH[packet.niche] }} />
          {film ? (
            <video
              key={film}
              src={film}
              poster={PLUMBING_HERO_POSTER}
              muted
              loop
              autoPlay
              playsInline
              className="h-full w-full object-cover opacity-55 mix-blend-lighten"
            />
          ) : null}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#050507_78%)]" />
          {seeds.map((seed) => (
            <ParticleMote key={seed.id} seed={seed} color={particleColor} sx={sx} sy={sy} />
          ))}
        </DepthPlate>

        <DepthPlate
          layer={equipment}
          sx={sx}
          sy={sy}
          className="absolute inset-6 border border-neon-red/80"
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(color-mix(in srgb, #ff2a3d 38%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, #ff2a3d 38%, transparent) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
          <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-neon-red/70" />
          <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-neon-red/70" />
          <div className="absolute inset-x-6 bottom-8 h-10 bg-gradient-to-t from-cyan-300/25 to-transparent blur-md" />
          <p className="absolute left-3 top-3 max-w-[16rem] font-mono text-[10px] uppercase leading-relaxed tracking-[0.16em] text-neon-red">
            {STUDIO_MATRIX[packet.niche].equipment}
          </p>
        </DepthPlate>

        <DepthPlate
          layer={nameplate}
          sx={sx}
          sy={sy}
          className="absolute inset-x-8 bottom-6 border border-neon-red bg-[#050507]/85 px-4 py-3 shadow-[0_0_28px_rgba(255,42,61,0.35)] backdrop-blur-md"
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-neon-red">
            Layer {nameplate.index} · {nameplate.label}
          </p>
          <p className="mt-1 truncate font-display text-xl font-semibold tracking-wide text-fg">{packet.shopName}</p>
          {packet.tagline ? <p className="mt-1 line-clamp-2 text-sm text-muted">{packet.tagline}</p> : null}
        </DepthPlate>
      </motion.div>
    </div>
  );
}

export function AxiomStudioInterface({
  shopSlug,
  shopName,
  serviceLine = "",
  readonly = false,
  liveHref,
}: {
  shopSlug: string;
  shopName: string;
  serviceLine?: string;
  readonly?: boolean;
  liveHref?: string;
}) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState(shopName);
  const [matrixId, setMatrixId] = useState<StudioMatrixNiche>("plumbing");
  const [tradeId, setTradeId] = useState<TradeId>("drain");
  const [line, setLine] = useState(serviceLine);
  const [busy, setBusy] = useState<BusyAction>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState<string | null>(null);

  const trade = TRADES.find((row) => row.id === tradeId) ?? TRADES[0];
  const matrix = STUDIO_MATRIX[matrixId];
  const displayName = name.trim() || shopName.trim() || "Your shop";
  const displayLine = line.trim() || (matrixId === "plumbing" ? trade.line : matrix.motion);
  const packet = useMemo(
    () => decomposeStudioLayers({ niche: matrixId, shopName: displayName, tagline: displayLine }),
    [matrixId, displayName, displayLine],
  );
  const previewFilm = matrixId === "plumbing" ? trade.film : "";
  const pageHref = liveHref || `/${encodeURIComponent(shopSlug)}`;
  const canContinue = step === 0 ? name.trim().length > 1 : true;

  function go(next: number) {
    setError(null);
    setStep(Math.max(0, Math.min(STEPS.length - 1, next)));
  }

  async function run(action: Exclude<BusyAction, null>, work: () => Promise<string>) {
    setBusy(action);
    setError(null);
    setNotice("");
    try {
      setNotice(await work());
    } catch (err) {
      setError(err instanceof Error ? err.message : "That step did not finish.");
    } finally {
      setBusy(null);
    }
  }

  function lockFrame() {
    return run("lock", async () => {
      const draft = writeHeroDraft(shopSlug, {
        hero_video_url: trade.film,
        tagline: displayLine,
        look: { ...DEFAULT_HERO_LOOK, brackets: true, glow: true, overlay: true },
      });
      if (!readonly) {
        await updateShopBrand({
          data: {
            slug: shopSlug,
            name: displayName,
            tagline: draft.tagline,
            heroFilm: draft.hero_video_url,
            glowEnabled: true,
            heroLook: draft.look,
            markHero: true,
          },
        });
        return "Frame saved on the shop.";
      }
      return "Frame saved on this desk. Owner mode writes it to the shop.";
    });
  }

  function pushFilm() {
    return run("film", async () => {
      const draft = writeHeroDraft(shopSlug, {
        hero_video_url: trade.film,
        tagline: displayLine,
        look: { ...DEFAULT_HERO_LOOK, brackets: true, glow: true, overlay: true },
      });
      const saved = await persistHeroToSupabase(shopSlug, draft);
      return saved === "saved"
        ? "Film is in storage and on the shop record."
        : "Film is saved on this desk. Storage is not connected, so it stayed local.";
    });
  }

  function deployPage() {
    return run("deploy", async () => {
      if (readonly) {
        return "Preview desk. Publishing a render stays in owner mode.";
      }
      const response = await fetch("/api/studio/render", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          shopSlug,
          niche: matrixId,
          shopName: displayName,
          tagline: displayLine,
          prompt: packet.prompt,
        }),
      });
      if (await handleGenerationGuardHttpStatus(response.status, shopSlug)) {
        return "Opening checkout…";
      }
      const json = (await response.json().catch(() => ({}))) as { error?: string; videoUrl?: string };
      if (!response.ok || !json.videoUrl) {
        throw new Error(json.error || "The studio render did not finish.");
      }
      await revalidateStorefront({ data: shopSlug });
      await orchestrateFinalWebBuild({
        data: { slug: shopSlug, brandedAssetUrl: json.videoUrl, animate: true },
      });
      return "The hero still, three layers, and the 6-second loop are on the live page.";
    });
  }

  return (
    <Frame className="p-4 sm:p-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-neon-red">Axiom Studio</p>
          <h2 className="mt-1 font-display text-2xl font-semibold text-fg">Build the page in three steps.</h2>
        </div>
        <p className="max-w-sm text-sm text-muted">Name the shop, stack the preview, then publish the live page.</p>
      </div>

      <ol className="mt-5 grid grid-cols-3 gap-2">
        {STEPS.map((item, index) => {
          const Icon = item.icon;
          const active = index === step;
          const done = index < step;
          return (
            <li key={item.label}>
              <button
                type="button"
                className={cn(
                  "flex min-h-11 w-full items-center justify-center gap-2 border px-2 text-sm",
                  active || done
                    ? "border-neon-red bg-neon-red/10 text-neon-red"
                    : "border-line text-muted",
                )}
                aria-current={active ? "step" : undefined}
                disabled={index > step}
                onClick={() => index <= step && go(index)}
              >
                {done ? <Check size={16} aria-hidden /> : <Icon size={16} aria-hidden />}
                <span>{item.label}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="mt-5">
        {step === 0 ? (
          <div className="grid gap-4">
            <label className="grid gap-2" htmlFor="axiom-studio-name">
              <span className="text-sm font-medium text-fg">Business name</span>
              <input
                id="axiom-studio-name"
                value={name}
                maxLength={48}
                autoComplete="organization"
                onChange={(event) => setName(event.target.value)}
                className="min-h-11 border border-line bg-studio px-3 text-fg outline-none focus:border-neon-red"
              />
            </label>
            <fieldset>
              <legend className="text-sm font-medium text-fg">Trade niche</legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {STUDIO_MATRIX_NICHES.map((id) => {
                  const option = STUDIO_MATRIX[id];
                  const selected = id === matrixId;
                  return (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setMatrixId(id)}
                      className={cn(
                        "min-h-11 border px-3 py-2 text-left text-sm",
                        selected ? "border-neon-red text-neon-red" : "border-line text-fg",
                      )}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>
            {matrixId === "plumbing" ? (
              <fieldset>
                <legend className="text-sm font-medium text-fg">Film on the page</legend>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  {TRADES.map((option) => {
                    const selected = option.id === tradeId;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => {
                          setTradeId(option.id);
                          if (!line.trim()) setLine(option.line);
                        }}
                        className={cn(
                          "min-h-11 border px-3 py-2 text-left text-sm",
                          selected ? "border-neon-red text-neon-red" : "border-line text-fg",
                        )}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            ) : null}
            <label className="grid gap-2" htmlFor="axiom-studio-line">
              <span className="text-sm font-medium text-fg">Line under the name</span>
              <input
                id="axiom-studio-line"
                value={line}
                maxLength={140}
                placeholder={trade.line}
                onChange={(event) => setLine(event.target.value)}
                className="min-h-11 border border-line bg-studio px-3 text-fg outline-none focus:border-neon-red"
              />
            </label>
          </div>
        ) : null}

        {step === 1 ? (
          <Frame>
            <LayeredPreview packet={packet} film={previewFilm} />
            <ul className="grid gap-1 px-3 py-2 sm:grid-cols-3">
              {packet.layers.map((layer) => (
                <li key={layer.storageKey} className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                  {layer.storageKey.replace(/_/g, " ")}
                </li>
              ))}
            </ul>
            <p className="px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
              Move across the frame. Bokeh, equipment, and the nameplate track at different depths.
            </p>
          </Frame>
        ) : null}

        {step === 2 ? (
          <div className="grid gap-3">
            <Frame className="px-4 py-3">
              <p className="font-display text-lg text-fg">{displayName}</p>
              <p className="mt-1 text-sm text-muted">{displayLine}</p>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-neon-red">{matrix.label}</p>
            </Frame>
            <div className="grid gap-2 sm:grid-cols-3">
              <button
                type="button"
                className="min-h-11 border border-neon-red px-3 text-sm text-neon-red disabled:opacity-40"
                disabled={busy !== null}
                onClick={() => void lockFrame()}
              >
                {busy === "lock" ? "Saving frame…" : "Save this frame"}
              </button>
              <button
                type="button"
                className="min-h-11 border border-neon-red px-3 text-sm text-neon-red disabled:opacity-40"
                disabled={busy !== null}
                onClick={() => void pushFilm()}
              >
                {busy === "film" ? "Sending film…" : "Send the film"}
              </button>
              <button
                type="button"
                className="min-h-11 bg-neon-red px-3 text-sm font-medium text-obsidian disabled:opacity-40"
                disabled={busy !== null}
                onClick={() => void deployPage()}
              >
                {busy === "deploy" ? "Publishing…" : "Publish the live page"}
              </button>
            </div>
            <a href={pageHref} className="inline-flex min-h-11 items-center text-sm text-hud">
              Open the live page
            </a>
            {readonly ? (
              <p className="text-sm text-muted">Preview desk. Saving the frame stays on this browser until owner mode.</p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          className="inline-flex min-h-11 items-center gap-1 px-2 text-sm text-muted disabled:opacity-40"
          disabled={step === 0 || busy !== null}
          onClick={() => go(step - 1)}
        >
          <ChevronLeft size={16} aria-hidden />
          Back
        </button>
        <p className="sr-only" role="status" aria-live="polite">
          {notice || error || `Step ${step + 1} of ${STEPS.length}`}
        </p>
        {notice ? <p className="text-sm text-ok">{notice}</p> : null}
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            className="inline-flex min-h-11 items-center gap-1 bg-neon-red px-4 text-sm font-medium text-obsidian disabled:opacity-40"
            disabled={!canContinue || busy !== null}
            onClick={() => go(step + 1)}
          >
            Continue
            <ChevronRight size={16} aria-hidden />
          </button>
        ) : (
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">Ready to publish</span>
        )}
      </div>
    </Frame>
  );
}
