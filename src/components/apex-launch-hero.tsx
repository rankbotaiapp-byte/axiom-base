import { useState } from "react";
import { HeroLoopVideo } from "@/components/loop-video";

export const APEX_LAUNCH_FILM = "/media/apex-launch-hero-animation.mp4";

const ACTIONS = [
  { id: "launch", label: "Activate launch" },
  { id: "specs", label: "View specs" },
  { id: "configure", label: "Configure" },
] as const;

type ActionId = (typeof ACTIONS)[number]["id"];

export function ApexLaunchHero() {
  const [active, setActive] = useState<ActionId | null>(null);

  return (
    <section className="apex-launch" aria-label="Apex Launch Control">
      <header className="apex-launch-copy">
        <p className="apex-launch-kicker">Apex Launch Control</p>
        <h1 className="apex-launch-title">The 911 GT3. Unleashed.</h1>
        <p className="apex-launch-line">Automotive performance. Rear engine. Quad exhaust. The book opens on the bay.</p>
      </header>

      <div className="apex-launch-stage">
        <HeroLoopVideo
          className="apex-launch-film"
          src={APEX_LAUNCH_FILM}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-label="Porsche 911 GT3 studio loop"
        />
      </div>

      <nav className="apex-launch-bar" aria-label="Launch controls">
        <ApexMark />
        <div className="apex-launch-actions">
          {ACTIONS.map((action) => (
            <button
              key={action.id}
              type="button"
              className={active === action.id ? "apex-launch-btn is-on" : "apex-launch-btn"}
              aria-pressed={active === action.id}
              onClick={() => setActive((current) => (current === action.id ? null : action.id))}
            >
              {action.label}
            </button>
          ))}
        </div>
      </nav>

      {active === "launch" ? (
        <aside className="apex-launch-panel" aria-live="polite">
          <h2>Launch armed</h2>
          <p>Launch control is set. Hold, then the exhaust stack lights the floor.</p>
        </aside>
      ) : null}
      {active === "specs" ? (
        <aside className="apex-launch-panel" aria-live="polite">
          <h2>911 GT3</h2>
          <ul>
            <li>4.0-liter naturally aspirated flat-six</li>
            <li>Rear-engine, rear-drive</li>
            <li>Quad exhaust, studio-lit plume</li>
            <li>Track-first chassis, street-legal book</li>
          </ul>
        </aside>
      ) : null}
      {active === "configure" ? (
        <aside className="apex-launch-panel" aria-live="polite">
          <h2>Configure</h2>
          <p>Paint, wheels, and the bay slot. This desk pins the GT3 loop on an Auto shop.</p>
        </aside>
      ) : null}
    </section>
  );
}

function ApexMark() {
  return (
    <svg className="apex-launch-mark" viewBox="0 0 32 32" aria-hidden>
      <path
        d="M16 3.5 28.5 26.5H3.5L16 3.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M16 11 22.4 23.2H9.6L16 11Z" fill="currentColor" opacity="0.45" />
    </svg>
  );
}
