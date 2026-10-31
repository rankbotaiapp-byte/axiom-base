import { useState } from "react";

export const FOUNDER_WELCOME_SRC = "/media/welcome-to-axiom.mp4";
export const FOUNDER_WELCOME_SRC_FALLBACK = "/media/welcome-to-axiom.mp4.mp4";
export const FOUNDER_WELCOME_POSTER = "/media/eric.jpg";

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
  const [src, setSrc] = useState(FOUNDER_WELCOME_SRC);
  const [still, setStill] = useState(false);
  const target = business.trim() || "your shop";

  return (
    <section className="founder-stage" aria-label={`Founder briefing for ${target}`}>
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
            <img className="founder-stage-media" src={FOUNDER_WELCOME_POSTER} alt="" />
          ) : (
            <video
              className="founder-stage-media"
              src={src}
              poster={FOUNDER_WELCOME_POSTER}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              aria-hidden
              onError={() => {
                if (src !== FOUNDER_WELCOME_SRC_FALLBACK) {
                  setSrc(FOUNDER_WELCOME_SRC_FALLBACK);
                  return;
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
