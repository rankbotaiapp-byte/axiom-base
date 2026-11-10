// @ts-nocheck
import { useEffect, useRef } from "react";
import { AETHER_ASSETS } from "./assets";
import { createAetherScene } from "./aetherScene";
import "./aether.css";

/**
 * Aether Dynamics propulsion experience.
 * Markup is inline JSX (no ./markup module). Scene boots via createAetherScene + canvas/video refs.
 */
export function AetherPropulsion() {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!root || !canvas || !video) return;

    const teardown = createAetherScene({ root, canvas, video });
    return () => {
      teardown?.();
    };
  }, []);

  const year = new Date().getFullYear();

  return (
    <div ref={rootRef} className="aether-root is-booting">
      <video
        ref={videoRef}
        id="engineVideo"
        className="engine-video"
        src={AETHER_ASSETS.video}
        poster={AETHER_ASSETS.poster}
        muted
        loop
        playsInline
        autoPlay
        preload="auto"
        crossOrigin="anonymous"
        aria-hidden="true"
      />

      <div className="fallback-dust" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <canvas ref={canvasRef} id="stage" aria-hidden="true" />

      <div className="frame" aria-hidden="true">
        <span className="corner tl" />
        <span className="corner tr" />
        <span className="corner bl" />
        <span className="corner br" />
        <span className="scan" />
        <div className="frame-readout mono">
          <span>
            CAM <b id="roCam">+0.00 / +0.00</b>
          </span>
          <span>
            Z <b id="roZoom">10.0</b>
          </span>
          <span>
            DEPTH <b id="roScroll">000%</b>
          </span>
        </div>
      </div>

      <header className="topbar glass" id="topbar">
        <a className="brand" href="#overview" aria-label="Aether Dynamics home">
          <span className="brand-kicker mono">AXIOM // AXIOM // AXIOM</span>
          <span className="brand-name">AETHER DYNAMICS</span>
        </a>
        <nav className="nav" aria-label="Primary">
          <a href="#overview" data-nav="overview" className="is-active">
            Overview
          </a>
          <a href="#specs" data-nav="specs">
            Propulsion Specs
          </a>
          <a href="#log" data-nav="log">
            Mission Log
          </a>
          <a href="#portal" data-nav="portal">
            Client Portal
          </a>
        </nav>
        <div className="topbar-tools">
          <span className="status mono">
            <i className="status-dot" />
            <span className="status-text">Live system status</span>
          </span>
          <button
            className="audio-toggle mono"
            id="audioToggle"
            type="button"
            aria-pressed="false"
            aria-label="Toggle engine audio"
          >
            <span className="eq" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </span>
            <span className="audio-label">AUDIO OFF</span>
          </button>
        </div>
      </header>

      <main id="content">
        <section className="hero" id="overview" data-section="overview">
          <div className="hero-copy">
            <p className="eyebrow mono">
              <i className="eyebrow-dot" />
              AXIOM-7 ION DRIVE · SERIES 04 · FLIGHT QUALIFIED
            </p>
            <h1 className="hero-title">
              <span className="line">
                <span className="line-inner">Precision</span>
              </span>
              <span className="line">
                <span className="line-inner">Propulsion //</span>
              </span>
              <span className="line">
                <span className="line-inner">Deep Space</span>
              </span>
              <span className="line">
                <span className="line-inner">Systems</span>
              </span>
            </h1>
            <p className="lede">
              Four-nozzle gridded ion thrusters built for long-duration transit. Xenon-fed, vector-locked,
              and tuned to hold thrust within a hundredth of a degree for years at a time.
            </p>
            <div className="cta-row">
              <a className="btn btn-primary" href="#portal" id="ctaPrimary">
                <span>Book an engineering briefing</span>
                <i aria-hidden="true">→</i>
              </a>
              <a className="btn btn-ghost" href="#specs">
                <span>View propulsion specs</span>
              </a>
            </div>
          </div>

          <aside className="hud glass" aria-label="Live telemetry">
            <header className="hud-head mono">
              <span>LIVE TELEMETRY</span>
              <span className="hud-tier" id="hudTier">
                TIER —
              </span>
            </header>

            <div className="hud-grid">
              <div className="widget widget-ring">
                <svg viewBox="0 0 64 64" className="ring" aria-hidden="true">
                  <circle cx="32" cy="32" r="26" className="ring-track" />
                  <circle cx="32" cy="32" r="26" className="ring-fill" id="thrustRing" />
                </svg>
                <div>
                  <p className="w-label mono">Thrust Vectoring</p>
                  <p className="w-value mono">
                    <span id="thrustVal">98.4</span>
                    <small>%</small>
                  </p>
                  <p className="w-sub mono">
                    VEC <span id="vectorVal">LOCKED −0.01°</span>
                  </p>
                </div>
              </div>

              <div className="widget">
                <p className="w-label mono">Ion Core Temp</p>
                <p className="w-value mono">
                  <span className="chip chip-ok" id="coreState">
                    ACTIVE
                  </span>
                </p>
                <p className="w-sub mono">
                  <span id="coreTemp">452</span> K · stable
                </p>
              </div>

              <div className="widget widget-wide">
                <div className="w-row">
                  <p className="w-label mono">Plasma Pressure</p>
                  <p className="w-sub mono">
                    <span id="plasmaVal">312</span> kPa
                  </p>
                </div>
                <div className="segments" id="plasmaSegs" aria-hidden="true" />
              </div>

              <div className="widget">
                <p className="w-label mono">Xenon Flow</p>
                <p className="w-value mono">
                  <span id="xenonVal">4.82</span>
                  <small>mg/s</small>
                </p>
                <p className="w-sub mono">RESERVE 92%</p>
              </div>

              <div className="widget">
                <p className="w-label mono">Ion Audio Bus</p>
                <div className="meter" id="audioMeter" aria-hidden="true" />
                <p className="w-sub mono">
                  <span id="audioState">IDLE</span>
                </p>
              </div>

              <div className="widget widget-wide w-row">
                <p className="w-sub mono">
                  RENDER <b id="fpsVal">--</b> FPS
                </p>
                <p className="w-sub mono">
                  LATENCY <b id="latVal">18</b> ms
                </p>
              </div>
            </div>
          </aside>

          <p className="hero-hint mono" aria-hidden="true">
            <span className="hint-desktop">Move cursor to inspect · scroll to throttle up</span>
            <span className="hint-touch">Drag to inspect · pinch to zoom</span>
          </p>
        </section>

        <section className="section" id="specs" data-section="specs">
          <header className="section-head reveal">
            <p className="eyebrow mono">
              <i className="eyebrow-dot" />
              02 — PROPULSION SPECS
            </p>
            <h2>Built for the long burn.</h2>
            <p className="section-lede">
              Every AXIOM-7 unit ships with a full qualification record. These are the numbers we stand
              behind.
            </p>
          </header>
          <div className="spec-grid">
            <article className="spec glass reveal" style={{ ["--v"]: ".86" }}>
              <p className="spec-code mono">SPEC-01 · SPECIFIC IMPULSE</p>
              <p className="spec-value">
                4,190<small>s</small>
              </p>
              <div className="spec-meter">
                <i />
              </div>
              <p className="spec-note">
                Gridded electrostatic acceleration across four independently throttled heads.
              </p>
            </article>
            <article className="spec glass reveal" style={{ ["--v"]: ".72" }}>
              <p className="spec-code mono">SPEC-02 · CONTINUOUS THRUST</p>
              <p className="spec-value">
                236<small>mN</small>
              </p>
              <div className="spec-meter">
                <i />
              </div>
              <p className="spec-note">
                Sustained output at 7.4 kW input with sub-1% drift over a 10,000-hour run.
              </p>
            </article>
            <article className="spec glass reveal" style={{ ["--v"]: ".98" }}>
              <p className="spec-code mono">SPEC-03 · VECTOR ACCURACY</p>
              <p className="spec-value">
                ±0.01<small>°</small>
              </p>
              <div className="spec-meter">
                <i />
              </div>
              <p className="spec-note">Closed-loop gimbal lock with dual-redundant star-tracker reference.</p>
            </article>
            <article className="spec glass reveal" style={{ ["--v"]: ".64" }}>
              <p className="spec-code mono">SPEC-04 · DESIGN LIFE</p>
              <p className="spec-value">
                55,000<small>hr</small>
              </p>
              <div className="spec-meter">
                <i />
              </div>
              <p className="spec-note">
                Carbon-carbon grids and a hollow cathode rated past six years of cumulative burn.
              </p>
            </article>
          </div>
        </section>

        <section className="section" id="log" data-section="log">
          <header className="section-head reveal">
            <p className="eyebrow mono">
              <i className="eyebrow-dot" />
              03 — MISSION LOG
            </p>
            <h2>Flight heritage.</h2>
          </header>
          <ol className="log">
            <li className="log-item glass reveal">
              <time className="mono">T+0412 D</time>
              <div>
                <h3>Cislunar tug · AX-7 quad</h3>
                <p>Orbit raise from GTO to NRHO completed 11 days ahead of plan.</p>
              </div>
              <span className="chip chip-ok mono">NOMINAL</span>
            </li>
            <li className="log-item glass reveal">
              <time className="mono">T+0287 D</time>
              <div>
                <h3>Asteroid survey · AX-7 dual</h3>
                <p>Rendezvous with target body; 3,400 hours of cumulative burn logged.</p>
              </div>
              <span className="chip chip-ok mono">NOMINAL</span>
            </li>
            <li className="log-item glass reveal">
              <time className="mono">T+0119 D</time>
              <div>
                <h3>Station keeping · AX-5</h3>
                <p>Grid erosion measured at 38% of model prediction after first year.</p>
              </div>
              <span className="chip chip-info mono">MONITOR</span>
            </li>
            <li className="log-item glass reveal">
              <time className="mono">T+0000 D</time>
              <div>
                <h3>Qualification · vacuum chamber 3</h3>
                <p>10,000-hour endurance test passed with all four heads firing.</p>
              </div>
              <span className="chip chip-ok mono">PASSED</span>
            </li>
          </ol>
        </section>

        <section className="section" id="portal" data-section="portal">
          <header className="section-head reveal">
            <p className="eyebrow mono">
              <i className="eyebrow-dot" />
              04 — CLIENT PORTAL
            </p>
            <h2>Talk to the people who build it.</h2>
          </header>
          <div className="portal">
            <article className="engineer glass reveal">
              <div className="avatar" aria-hidden="true">
                <svg viewBox="0 0 120 120">
                  <defs>
                    <linearGradient id="wire" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="#00f3ff" />
                      <stop offset="1" stopColor="#8b3dff" />
                    </linearGradient>
                  </defs>
                  <g fill="none" stroke="url(#wire)" strokeWidth="1.2">
                    <ellipse cx="60" cy="46" rx="20" ry="25" />
                    <path
                      d="M40 46h40M42 36h36M42 56h36M60 21v50M50 23c-4 14-4 33 0 46M70 23c4 14 4 33 0 46"
                      opacity=".55"
                    />
                    <path d="M22 112c2-20 18-32 38-32s36 12 38 32" />
                    <path d="M30 102c8-6 18-9 30-9s22 3 30 9M60 80v32" opacity=".55" />
                  </g>
                </svg>
              </div>
              <p className="w-label mono">ON CALL NOW</p>
              <h3>Speak with the Chief Propulsion Engineer</h3>
              <p className="engineer-note">
                30-minute technical briefing: mission profile, delta-v budget, power envelope, integration
                timeline.
              </p>
              <div className="pulse-ring" aria-hidden="true">
                <i />
              </div>
            </article>

            <form className="brief-form glass reveal" id="briefForm" noValidate>
              <p className="w-label mono">REQUEST BRIEFING · CHANNEL SECURE</p>
              <label className="field">
                <span className="mono">Name</span>
                <input name="name" type="text" autoComplete="name" required placeholder="Your name" />
              </label>
              <label className="field">
                <span className="mono">Organization</span>
                <input
                  name="org"
                  type="text"
                  autoComplete="organization"
                  required
                  placeholder="Agency or company"
                />
              </label>
              <label className="field">
                <span className="mono">Email</span>
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@mission.space"
                />
              </label>
              <label className="field">
                <span className="mono">Mission profile</span>
                <select name="profile" required defaultValue="">
                  <option value="">Select a profile</option>
                  <option>Orbit raising / tug</option>
                  <option>Station keeping</option>
                  <option>Deep space transit</option>
                  <option>Rendezvous & proximity ops</option>
                </select>
              </label>
              <button className="btn btn-primary btn-block" type="submit">
                <span>Transmit request</span>
                <i aria-hidden="true">→</i>
              </button>
              <p className="form-status mono" id="formStatus" role="status" aria-live="polite" />
            </form>
          </div>
        </section>

        <footer className="footer mono">
          <span>
            © <span id="year">{year}</span> AETHER DYNAMICS
          </span>
          <span>AXIOM-7 · ALL SYSTEMS NOMINAL</span>
        </footer>
      </main>

      <div className="boot" id="boot" aria-hidden="true">
        <p className="mono boot-text">INITIALIZING ION CORE</p>
        <div className="boot-bar">
          <i id="bootBar" />
        </div>
      </div>

      <button className="ignite mono" id="ignite" type="button" hidden>
        TAP TO IGNITE
      </button>
    </div>
  );
}

export default AetherPropulsion;
