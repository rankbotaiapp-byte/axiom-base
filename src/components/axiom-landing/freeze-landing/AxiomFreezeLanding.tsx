"use client";

import { useEffect, useRef } from "react";
import { ProofOfWorkShowcase } from "@/components/axiom-landing/ProofOfWorkShowcase";
import { LandingConversionPipeline } from "./LandingConversionPipeline";
import { LandingFounderTrust } from "./LandingFounderTrust";
import { STUDIO_HREF } from "./config";
import { mountAxiomFreezeLanding } from "./engine";
import "./axiom-freeze-landing.css";

type Props = {
  /** Destination for Launch / Enter Axiom Studio CTAs. */
  studioHref?: string;
};

/**
 * Black particle-freeze hero + character reveal + Heart Machine + Master Dashboard CMS.
 * Canvas / localStorage / rAF run client-only via mountAxiomFreezeLanding.
 */
export function AxiomFreezeLanding({ studioHref = STUDIO_HREF }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    return mountAxiomFreezeLanding(root, { studioHref });
  }, [studioHref]);

  return (
    <div ref={rootRef} className="ax-freeze" data-axiom-freeze-landing="">
      <div className="fx-vignette" />
      <div className="fx-scanlines" />

      <nav className="nav">
        <div className="nav-brand" data-cfg="content.navBrand">
          AX<i>I</i>OM
        </div>
        <div className="nav-links">
          <a href="#architecture" data-cfg="content.navLink1">
            What you get
          </a>
          <a href="#proof" data-cfg="content.navLink2">
            Live demos
          </a>
          <a href="#pipeline" data-cfg="content.navLink3">
            Pipeline
          </a>
          <a href="#founder" data-cfg="content.navLink4">
            Founder
          </a>
        </div>
        <div className="nav-status">
          <span className="dot" />
          <span data-cfg="meta.status">ONLINE</span>
        </div>
        <a className="btn btn-primary btn-sm" id="btn-navCta" href={studioHref}>
          Launch Axiom Studio
        </a>
      </nav>

      <div className="hero-track" id="heroTrack">
        <div className="hero-stage">
          <canvas id="particles" />
          <div className="hud-coord c1">
            LAT 42.4323 N
            <br />
            LON 123.1715 W
          </div>
          <div className="hud-coord c2">
            SIM // PARTICLE_FIELD
            <br />
            STATE: <span id="hudState">FLUID</span>
          </div>
          <div className="hud-coord c3" id="hudCount">
            N = 0000
          </div>
          <div className="hud-coord c4">
            FREEZE_PROGRESS
            <br />
            <span id="hudProg">0.00</span>
          </div>
          <div className="hero-fg" id="heroFg">
            <div className="hero-badge" data-cfg="content.heroBadge">
              LOCAL TRADES // BACK OFFICE ONLINE
            </div>
            <h1 className="hero-title" data-cfg="content.heroTitle">
              Stop losing after-hours jobs.
            </h1>
            <p className="hero-sub" data-cfg="content.heroSub">
              $1 trial puts 24/7 AI booking, instant quote, and SMS follow-up on your shop page. Autopilot
              works the pipeline — then $150/mo.
            </p>
            <div className="hero-ctas">
              <a className="btn btn-primary glow" id="btn-heroPrimary" href={studioHref}>
                Start $1 trial
              </a>
              <a className="btn btn-ghost" id="btn-heroSecondary" href="#proof">
                See live demos
              </a>
            </div>
          </div>
          <div className="hero-hint" id="heroHint" data-cfg="content.heroHint">
            SCROLL — SEE HOW IT BOOKS
          </div>
        </div>
      </div>

      <div className="reveal-track" id="architecture">
        <div className="reveal-stage">
          <div className="reveal-header">
            <div className="kicker" data-cfg="content.charKicker">
              PROOF GRID // FOUR PILLARS
            </div>
            <h2 className="h2" data-cfg="content.charTitle">
              What trades get on day one
            </h2>
          </div>
          <div className="char-grid">
            <div className="char-col-l">
              <div className="callout reticle" data-reveal="l1">
                <span className="rt tl">+</span>
                <span className="rt br">+</span>
                <h4>
                  <span data-cfg="content.co1Tag">01</span>
                  <em style={{ fontStyle: "normal" }} data-cfg="content.co1Title">
                    24/7 intake
                  </em>
                </h4>
                <p data-cfg="content.co1Body">
                  Calls, forms, and chat turn into booked jobs while your crew is on a roof or under a sink.
                </p>
              </div>
              <div className="callout reticle" data-reveal="l2">
                <span className="rt tl">+</span>
                <span className="rt br">+</span>
                <h4>
                  <span data-cfg="content.co2Tag">02</span>
                  <em style={{ fontStyle: "normal" }} data-cfg="content.co2Title">
                    Instant quote
                  </em>
                </h4>
                <p data-cfg="content.co2Body">
                  Homeowners pick service + urgency, see a real range, and book video or dispatch without calling the office.
                </p>
              </div>
            </div>
            <div className="char-frame reticle" id="charFrame">
              <span className="rt tl">+</span>
              <span className="rt tr">+</span>
              <span className="rt bl">+</span>
              <span className="rt br">+</span>
              <div className="char-media-wrap" id="charMediaWrap">
                <video
                  id="charVideo"
                  muted
                  loop
                  playsInline
                  autoPlay
                  poster="/media/hero-poster.jpg"
                />
                <div className="char-telemetry">
                  <div className="t-top">
                    <span data-cfg="content.charTeleL">AXIOM-01 // SYNC: ACTIVE</span>
                    <span className="dot" style={{ width: 6, height: 6 }} />
                  </div>
                  <div className="scanring" />
                  <div className="t-bot">
                    <span data-cfg="content.charTeleBL">CORE TEMP: NOMINAL</span>
                    <span data-cfg="content.charTeleBR">v4.0.2</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="char-col-r">
              <div className="callout reticle" data-reveal="r1">
                <span className="rt tr">+</span>
                <span className="rt bl">+</span>
                <h4>
                  <span data-cfg="content.co3Tag">03</span>
                  <em style={{ fontStyle: "normal" }} data-cfg="content.co3Title">
                    Owner Studio
                  </em>
                </h4>
                <p data-cfg="content.co3Body">
                  Change prices, photos, and service areas from your phone. No dev ticket, no agency markup.
                </p>
              </div>
              <div className="callout reticle" data-reveal="r2">
                <span className="rt tr">+</span>
                <span className="rt bl">+</span>
                <h4>
                  <span data-cfg="content.co4Tag">04</span>
                  <em style={{ fontStyle: "normal" }} data-cfg="content.co4Title">
                    Autopilot SMS
                  </em>
                </h4>
                <p data-cfg="content.co4Body">
                  Missed estimates and old leads get texted automatically until they book or opt out.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ProofOfWorkShowcase />

      <LandingConversionPipeline />

      <LandingFounderTrust studioHref={studioHref} />

      <section className="section ax-freeze-legacy" id="heart" aria-hidden>
        <div className="wrap">
          <div className="heart-head">
            <div className="kicker" data-cfg="content.heartKicker">
              CORE SYSTEM // THE HEART MACHINE
            </div>
            <h2 className="h2" data-cfg="content.heartTitle">
              Inside the Heart Machine
            </h2>
            <p className="lede" data-cfg="content.heartSub">
              The engine at the center of Axiom — watch the core cycle that powers every booking,
              dispatch, and dollar.
            </p>
          </div>
          <div className="cinema reticle" id="cinema">
            <span className="rt tl" style={{ color: "var(--accent)" }}>
              +
            </span>
            <span className="rt tr" style={{ color: "var(--accent)" }}>
              +
            </span>
            <span className="rt bl" style={{ color: "var(--accent)" }}>
              +
            </span>
            <span className="rt br" style={{ color: "var(--accent)" }}>
              +
            </span>
            <video
              id="heartVideo"
              playsInline
              preload="metadata"
              poster="/media/hero-poster.jpg"
            />
            <div className="glass" />
            <div className="scan" />
            <div className="vctl">
              <button id="vPlay" type="button" aria-label="Play">
                ▶
              </button>
              <div className="scrub" id="vScrub">
                <div className="bar">
                  <div className="fill" id="vFill" />
                  <div className="knob" id="vKnob" />
                </div>
              </div>
              <div className="vtime" id="vTime">
                00:00 / 00:00
              </div>
              <button id="vMute" type="button" aria-label="Mute">
                🔇
              </button>
              <button id="vTheater" type="button" aria-label="Theater mode">
                ⛶
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="section ax-freeze-legacy" id="studio" aria-hidden>
        <div className="wrap">
          <div className="kicker" data-cfg="content.studioKicker">
            AXIOM STUDIO // OPEN GATEWAY
          </div>
          <h2 className="h2" data-cfg="content.studioTitle">
            Try Axiom Studio. Right now.
          </h2>
          <p className="lede" data-cfg="content.studioSub">
            No signup wall. No demo call. Open the Studio, type what you want, and watch your
            business app assemble itself.
          </p>
          <div className="studio-grid">
            <div className="studio-frame reticle">
              <span className="rt tl">+</span>
              <span className="rt tr">+</span>
              <span className="rt bl">+</span>
              <span className="rt br">+</span>
              <div className="sf-bar">
                <div className="wdots">
                  <span />
                  <span />
                  <span />
                </div>
                <span style={{ marginLeft: "auto" }} data-cfg="content.studioBar">
                  AXIOM_STUDIO // WORKSPACE_PREVIEW
                </span>
              </div>
              <video
                id="studioVideo"
                muted
                loop
                playsInline
                autoPlay
                poster="/media/hero-poster.jpg"
              />
              <div className="playground">
                <div className="prow">
                  <input
                    type="text"
                    id="pgPrompt"
                    placeholder="> describe your business app…"
                    spellCheck={false}
                  />
                  <button className="btn btn-primary btn-sm" id="pgRun" type="button">
                    RUN
                  </button>
                </div>
                <div className="params">
                  <label>
                    INTENSITY
                    <input type="range" id="pgA" min={0} max={100} defaultValue={62} />
                  </label>
                  <label>
                    AUTONOMY
                    <input type="range" id="pgB" min={0} max={100} defaultValue={88} />
                  </label>
                  <label>
                    SPEED
                    <input type="range" id="pgC" min={0} max={100} defaultValue={97} />
                  </label>
                </div>
              </div>
            </div>
            <div className="studio-cta-box">
              <div className="note" style={{ fontSize: 10 }} data-cfg="content.studioNote">
                ZERO FRICTION // NO CARD REQUIRED // LIVE IN MINUTES
              </div>
              <a className="btn btn-primary glow btn-mega" id="btn-studioCta" href={studioHref}>
                Launch Axiom Studio →
              </a>
              <p
                style={{
                  fontWeight: 300,
                  color: "rgba(255,255,255,.5)",
                  fontSize: 14,
                  lineHeight: 1.7,
                }}
                data-cfg="content.studioAside"
              >
                Every app ships with the Owner Studio built in — your pricing, your photos, your
                words, changeable from your phone, forever.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap foot-grid">
          <div>
            <div className="foot-brand" data-cfg="content.navBrand2">
              AXIOM
            </div>
            <p className="foot-tag" data-cfg="content.footTag">
              A New Era Apps system. Built in the Rogue Valley. Deployed everywhere.
            </p>
          </div>
          <div className="foot-links">
            <a href="#architecture" data-cfg="content.footL1">
              What you get
            </a>
            <a href="#proof" data-cfg="content.footL2">
              Live demos
            </a>
            <a href="#founder" data-cfg="content.footL3">
              Founder
            </a>
            <a href="/terms" data-cfg="content.footL4">
              Legal
            </a>
          </div>
          <div className="foot-telemetry">
            <span>
              SYSTEM STATUS:{" "}
              <span className="ok" data-cfg="meta.status2">
                ALL SYSTEMS NOMINAL
              </span>
            </span>
            <span data-cfg="meta.build">BUILD AXM-2026.11</span>
            <span data-cfg="meta.version">v1.0.0</span>
          </div>
        </div>
      </footer>

      <button
        className="gear"
        id="gearBtn"
        type="button"
        title="Master Dashboard (Ctrl/Cmd+Shift+E)"
      >
        ⚙
      </button>

      <aside className="dash" id="dash">
        <div className="dash-head">
          <h3>
            MASTER <span>DASHBOARD</span>
          </h3>
          <span className="kbd">⌘⇧E</span>
          <button className="dash-close" id="dashClose" type="button">
            ×
          </button>
        </div>
        <div className="dash-tabs" id="dashTabs">
          <button type="button" data-tab="content" className="on">
            CONTENT
          </button>
          <button type="button" data-tab="media">
            MEDIA
          </button>
          <button type="button" data-tab="buttons">
            BUTTONS
          </button>
          <button type="button" data-tab="theme">
            THEME
          </button>
          <button type="button" data-tab="motion">
            MOTION
          </button>
        </div>
        <div className="dash-body" id="dashBody" />
        <div className="dash-foot">
          <button className="btn btn-ghost btn-sm" id="cfgExport" type="button">
            EXPORT JSON
          </button>
          <button className="btn btn-ghost btn-sm" id="cfgImport" type="button">
            IMPORT
          </button>
          <button
            className="btn btn-ghost btn-sm"
            id="cfgReset"
            type="button"
            style={{ color: "#ff7b7b" }}
          >
            RESET
          </button>
        </div>
      </aside>

      <div className="json-modal" id="jsonModal">
        <div className="json-box reticle">
          <span className="rt tl">+</span>
          <span className="rt br">+</span>
          <h4 id="jsonTitle">CONFIG EXPORT</h4>
          <textarea id="jsonArea" spellCheck={false} />
          <input
            type="file"
            id="jsonFile"
            accept=".json,application/json"
            style={{ display: "none" }}
          />
          <div className="jrow">
            <button className="btn btn-ghost btn-sm" id="jsonLoadFile" type="button">
              LOAD .JSON FILE
            </button>
            <button className="btn btn-ghost btn-sm" id="jsonApply" type="button">
              APPLY
            </button>
            <button className="btn btn-primary btn-sm" id="jsonCopy" type="button">
              COPY
            </button>
            <button className="btn btn-ghost btn-sm" id="jsonClose" type="button">
              CLOSE
            </button>
          </div>
        </div>
      </div>

      <div className="toast" id="toast" />
    </div>
  );
}

export default AxiomFreezeLanding;
