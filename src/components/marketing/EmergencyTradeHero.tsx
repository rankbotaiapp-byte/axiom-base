import { cn } from "@/lib/utils";
import { HeroLoopVideo } from "@/components/loop-video";

/** Emergency / mobile trade cinematic — vehicles & urgent response under rain. */
export const EMERGENCY_TRADE_VIDEO = "/media/auto-hero-animation.mp4" as const;
export const EMERGENCY_TRADE_POSTER = "/media/heroes/auto-repair.png" as const;

type EmergencyTradeHeroProps = {
  reduceMotion?: boolean;
  leaving?: boolean;
  onEnter?: () => void | Promise<void>;
  className?: string;
};

/**
 * Second scroll stage after the otter water hero:
 * full-bleed emergency trade / vehicle loop with rain atmosphere + shared CTA.
 */
export function EmergencyTradeHero({
  reduceMotion = false,
  leaving = false,
  onEnter,
  className,
}: EmergencyTradeHeroProps) {
  return (
    <section
      id="emergency-trades"
      className={cn(
        "emergency-trade-hero relative isolate flex min-h-[100svh] w-full snap-start snap-always overflow-hidden bg-obsidian",
        "transition-[opacity,filter] duration-700 ease-out",
        leaving && "pointer-events-none opacity-0 blur-sm",
        className,
      )}
      aria-label="Emergency trades cinematic"
    >
      {!reduceMotion ? (
        <HeroLoopVideo
          className="absolute inset-0 h-full w-full object-cover"
          src={EMERGENCY_TRADE_VIDEO}
          poster={EMERGENCY_TRADE_POSTER}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          trimTail={false}
        />
      ) : (
        <img
          src={EMERGENCY_TRADE_POSTER}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      {/* Rain atmosphere — keeps the otter water world reading into urgent trades */}
      <div
        className="emergency-rain-layer pointer-events-none absolute inset-0 z-[1] opacity-50 mix-blend-screen"
        style={{
          backgroundImage:
            "repeating-linear-gradient(185deg, transparent 0 14px, color-mix(in srgb, var(--color-accent) 18%, transparent) 14px 15px)",
          backgroundSize: "12px 48px",
          animation: reduceMotion ? undefined : "axiom-rain-fall 0.55s linear infinite",
        }}
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-obsidian via-obsidian/55 to-obsidian/25" />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,transparent_30%,color-mix(in_srgb,var(--color-obsidian)_70%,transparent)_100%)]" />

      <div className="emergency-trade-hero__copy relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-end px-6 pt-24 sm:px-10 sm:pt-28">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-accent/85">Urgent response</p>
        <h2 className="mt-3 max-w-2xl font-display text-[clamp(1.75rem,4.5vw,3.25rem)] leading-[1.1] tracking-[-0.02em] text-fg">
          Emergency trades. Rolling in the rain.
        </h2>
        <p className="mt-4 max-w-lg text-base leading-relaxed text-muted sm:text-lg">
          Plumbing, electrical, HVAC, locksmith, and mobile crews — booked from the same otter-water Axiom bay.
        </p>
        <div className="emergency-trade-hero__cta mt-8 flex flex-col items-start gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:items-center sm:gap-5">
          <button
            type="button"
            onClick={() => void onEnter?.()}
            disabled={leaving}
            className={cn(
              "inline-flex min-h-12 shrink-0 items-center gap-3 rounded-full bg-accent px-7 py-3.5",
              "text-sm font-bold text-obsidian shadow-[0_0_36px_color-mix(in_srgb,var(--color-accent)_40%,transparent)]",
              "transition hover:scale-[1.03] hover:bg-accent/90 focus:outline-none focus-visible:ring-4 focus-visible:ring-accent/50",
              "active:scale-[0.98] disabled:opacity-70 sm:text-base",
            )}
          >
            <span className="rounded-full bg-obsidian px-2.5 py-0.5 text-sm text-accent">$1</span>
            Choose Your Price Trial
          </button>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint">Scroll · then enter the desk</p>
        </div>
      </div>
    </section>
  );
}
