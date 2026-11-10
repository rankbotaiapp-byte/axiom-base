import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowRight, Clapperboard, Sparkles } from "lucide-react";
import { FxButton } from "@/components/plumbing/fx-button";
import {
  CINEMATIC_HERO_VIDEO,
  buildAutonomousContentPlan,
} from "@/lib/axiom/cinematic-content-seo";
import { createFreezePanScene, type FreezePanHandle } from "@/lib/axiom/freeze-pan-scene";
import { HoloGlassLayer } from "./HoloGlassLayer";
import { cn } from "@/lib/utils";

const FREEZE_EVERY_SEC = 9.5;
const FREEZE_AT_SEC = 3.6;

type FreezePanStageProps = {
  onEnter?: () => void | Promise<void>;
  onboardHref?: string;
  className?: string;
  headerSlot?: ReactNode;
  leaving?: boolean;
  niche?: string;
  city?: string;
};

/**
 * Half-viewport cinematic stage: underwater leopard loop + WebGL freeze-pan
 * ice orbit, tactile CTAs into the Axiom funnel, and autonomous content SEO strip.
 */
export function FreezePanStage({
  onEnter,
  onboardHref = "/onboard",
  className,
  headerSlot,
  leaving = false,
  niche = "contractor",
  city = "Southern Oregon",
}: FreezePanStageProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<FreezePanHandle | null>(null);
  const [busy, setBusy] = useState(false);
  const [glReady, setGlReady] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [phase, setPhase] = useState<"loop" | "freeze">("loop");
  const plan = buildAutonomousContentPlan({ niche, city, businessName: "Axiom" });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || leaving) return;

    let cancelled = false;
    let firstFreeze = 0;
    let cycleTimer = 0;
    let resumePhase = 0;

    const fireFreeze = () => {
      const scene = sceneRef.current;
      if (cancelled || reduceMotion || !scene || scene.isFreezing()) return;
      setPhase("freeze");
      scene.triggerFreeze();
      window.clearTimeout(resumePhase);
      resumePhase = window.setTimeout(() => {
        if (!cancelled) setPhase("loop");
      }, 4300);
    };

    const boot = () => {
      if (cancelled) return;
      const scene = createFreezePanScene({
        canvas,
        video,
        reduceMotion,
        orbitSeconds: 4.1,
      });
      sceneRef.current = scene;
      scene.start();
      setGlReady(true);
      firstFreeze = window.setTimeout(fireFreeze, FREEZE_AT_SEC * 1000);
      cycleTimer = window.setInterval(fireFreeze, FREEZE_EVERY_SEC * 1000);
    };

    const onMeta = () => boot();
    if (video.readyState >= 2) boot();
    else video.addEventListener("loadeddata", onMeta, { once: true });

    const onResize = () => sceneRef.current?.resize();
    window.addEventListener("resize", onResize);

    return () => {
      cancelled = true;
      window.clearTimeout(firstFreeze);
      window.clearTimeout(resumePhase);
      window.clearInterval(cycleTimer);
      window.removeEventListener("resize", onResize);
      video.removeEventListener("loadeddata", onMeta);
      sceneRef.current?.dispose();
      sceneRef.current = null;
      setGlReady(false);
    };
  }, [leaving, reduceMotion]);

  useEffect(() => {
    if (!leaving) return;
    sceneRef.current?.stop();
    const video = videoRef.current;
    try {
      video?.pause();
    } catch {
      /* ignore */
    }
  }, [leaving]);

  async function handleEnter() {
    if (busy || leaving) return;
    setBusy(true);
    sceneRef.current?.stop();
    try {
      await onEnter?.();
    } finally {
      setBusy(false);
    }
  }

  function handleStageTap() {
    const scene = sceneRef.current;
    if (!scene || scene.isFreezing() || reduceMotion) return;
    setPhase("freeze");
    scene.triggerFreeze();
    window.setTimeout(() => setPhase("loop"), 4300);
  }

  return (
    <section
      className={cn(
        "freeze-pan relative isolate w-full snap-start overflow-hidden bg-obsidian text-fg",
        "transition-[opacity,filter] duration-700 ease-out",
        leaving && "pointer-events-none opacity-0 blur-sm",
        className,
      )}
      aria-label="Axiom cinematic freeze-pan stage"
    >
      <div className="freeze-pan-header">
        <span className="freeze-pan-mark">AXIOM</span>
        {headerSlot ? <div className="freeze-pan-auth">{headerSlot}</div> : null}
      </div>

      <div className="freeze-pan-layout">
        <div ref={mediaRef} className="freeze-pan-media" data-phase={phase}>
          <video
            ref={videoRef}
            className="freeze-pan-video"
            src={CINEMATIC_HERO_VIDEO}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden
          />
          <canvas
            ref={canvasRef}
            className="freeze-pan-canvas"
            aria-hidden
            data-ready={glReady || undefined}
            data-active={phase === "freeze" || undefined}
          />
          <HoloGlassLayer video={videoRef} host={mediaRef} dimmed={phase === "freeze"} disabled={leaving} />
          <button
            type="button"
            className="freeze-pan-hit"
            aria-label="Trigger 360 degree freeze pan"
            onClick={handleStageTap}
          />
          <div className="freeze-pan-grade" />
          <p className="freeze-pan-badge" aria-live="polite">
            <Clapperboard size={12} aria-hidden />
            {phase === "freeze" ? "360° freeze-pan · ice field" : "Tap for freeze-pan"}
          </p>
        </div>

        <div className="freeze-pan-copy">
          <p className="freeze-pan-kicker">
            <Sparkles size={14} aria-hidden /> Autonomous storefront engine
          </p>
          <h1 className="freeze-pan-title">
            Freeze the moment.
            <span>Deploy the shop.</span>
          </h1>
          <p className="freeze-pan-lede">
            Axiom turns a local trade into a live 24/7 booking + content machine in minutes — instant text-back,
            AI scheduling, and branded clips that climb local search.
          </p>

          <div className="freeze-pan-actions">
            <FxButton
              variant="primary"
              glow
              icon={<Sparkles size={16} />}
              successLabel="Opening your build"
              onPress={() => void handleEnter()}
              className="freeze-pan-cta"
            >
              {busy ? "Launching…" : "$1 Choose Your Price Trial"}
            </FxButton>
            <FxButton
              variant="ghost"
              href={onboardHref}
              icon={<ArrowRight size={16} />}
              className="freeze-pan-cta"
            >
              Spin up my storefront
            </FxButton>
          </div>

          <aside className="freeze-pan-seo" aria-label="Autonomous content and SEO plan">
            <p className="freeze-pan-seo-kicker">Content engine · local SEO</p>
            <p className="freeze-pan-seo-title">{plan.seoTitle}</p>
            <ul className="freeze-pan-seo-channels">
              {plan.posts.slice(0, 4).map((post) => (
                <li key={post.channel}>
                  <strong>{post.channel.replace("_", " ")}</strong>
                  <span>{post.cadence}</span>
                </li>
              ))}
            </ul>
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(plan.localBusinessJsonLd) }}
            />
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(plan.breadcrumbJsonLd) }}
            />
          </aside>
        </div>
      </div>
    </section>
  );
}
