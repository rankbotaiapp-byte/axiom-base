import { useState } from "react";
import { HeroLoopVideo } from "@/components/loop-video";

/** Official HeyGen face-to-camera intro — plays before the niche cinematic loop. */
export const FOUNDER_WELCOME_SRC = "/media/axiom-greeting.mp4";
export const FOUNDER_WELCOME_SRC_FALLBACK = "/media/welcome-to-axiom.mp4";
export const FOUNDER_WELCOME_SRC_FALLBACK_2 = "/media/welcome-to-axiom.mp4.mp4";
export const FOUNDER_WELCOME_POSTER = "/media/axiom-greeting-poster.jpg";
export const FOUNDER_WELCOME_POSTER_FALLBACK = "/media/eric.jpg";

const SRC_CHAIN = [
  FOUNDER_WELCOME_SRC,
  FOUNDER_WELCOME_SRC_FALLBACK,
  FOUNDER_WELCOME_SRC_FALLBACK_2,
] as const;

export function FounderWelcomeStage({
  owner,
  business,
  trade,
  place,
}: {
  owner: string;
  business: string;
  trade: string;
  place: string;
}) {
  const [srcIndex, setSrcIndex] = useState(0);
  const [still, setStill] = useState(false);
  const [poster, setPoster] = useState(FOUNDER_WELCOME_POSTER);
  const target = business.trim() || "your shop";
  const src = SRC_CHAIN[Math.min(srcIndex, SRC_CHAIN.length - 1)]!;

  return (
    <section
      className="founder-stage"
      aria-label={`Founder briefing for ${target}`}
      data-axiom-pre-roll="avatar-greeting"
    >
      <div className="founder-hud">
        <header className="founder-target">
          <p className="founder-target-kicker">Target lock</p>
          <h1 className="founder-target-name text-balance">{target}</h1>
          <p className="founder-target-meta">
            {trade}
            {place ? ` · ${place}` : ""}
          </p>
        </header>
        <div className="founder-viewport">
          <span className="film-glow-ring" aria-hidden />
          <span className="film-bracket film-bracket-nw" aria-hidden />
          <span className="film-bracket film-bracket-ne" aria-hidden />
          <span className="film-bracket film-bracket-sw" aria-hidden />
          <span className="film-bracket film-bracket-se" aria-hidden />
          {still ? (
            <img className="founder-stage-media" src={poster} alt="" />
          ) : (
            <HeroLoopVideo
              className="founder-stage-media"
              src={src}
              poster={poster}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              aria-hidden
              onError={() => {
                if (srcIndex < SRC_CHAIN.length - 1) {
                  setSrcIndex((i) => i + 1);
                  return;
                }
                if (poster !== FOUNDER_WELCOME_POSTER_FALLBACK) {
                  setPoster(FOUNDER_WELCOME_POSTER_FALLBACK);
                }
                setStill(true);
              }}
            />
          )}
        </div>
        <div className="founder-stage-copy">
          <p className="founder-stage-kicker">A note from Eric</p>
          <p className="founder-stage-line">
            {owner}, this briefing is already locked on {target}. Bookings stay on after hours.
          </p>
          <a className="founder-stage-next" href="#trade-stage">
            See your shop
          </a>
        </div>
      </div>
    </section>
  );
}
