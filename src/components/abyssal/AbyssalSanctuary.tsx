// @ts-nocheck
import { useEffect, useRef } from "react";
import { mountAbyssal } from "./abyssalScene";
import "./abyssal.css";

export function AbyssalSanctuary() {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    return mountAbyssal(root);
  }, []);

  return (
    <div ref={rootRef} className="abyssal-sanctuary">
      <div className="ocean" id="ocean" aria-hidden="true">
        <video
          id="feed"
          src="/media/abyssal-sanctuary-loop.mp4"
          muted
          loop
          playsInline
          autoPlay
          preload="auto"
          disablePictureInPicture
        />
        <canvas id="ocean-gl" />
        <canvas id="ocean-hud" />
        <div className="hud-frame">
          <i className="hf hf-tl" />
          <i className="hf hf-tr" />
          <i className="hf hf-bl" />
          <i className="hf hf-br" />
          <div className="hud-bearing" id="hud-bearing" />
          <div className="hud-cross" />
          <div className="hud-scan" />
        </div>
      </div>

      <header className="nav panel" id="nav" data-ui>
        <a className="brand" href="#top" aria-label="Abyssal Sanctuary home">
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <path
              d="M16 2 30 16 16 30 2 16Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
            />
            <path
              d="M8 14.5c2.7-2.2 5.3-2.2 8 0s5.3 2.2 8 0M8 18.5c2.7-2.2 5.3-2.2 8 0s5.3 2.2 8 0"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="square"
            />
          </svg>
          <span>
            Abyssal<b>Sanctuary</b>
          </span>
        </a>
        <div className="feed-status" aria-hidden="true">
          <i className="rec" />
          <span>CAM-03 LIVE</span>
          <span id="feed-tc">
            00:00:00
          </span>
        </div>
        <nav className="nav-links" id="nav-links" aria-label="Primary">
          <a href="#encounters">Encounters</a>
          <a href="#dive-day">Dive day</a>
          <a href="#book">Book</a>
        </nav>
        <a className="btn btn-primary nav-cta" href="#book">
          Book a dive
        </a>
        <button
          className="nav-toggle"
          id="nav-toggle"
          type="button"
          aria-expanded="false"
          aria-controls="nav-links"
        >
          Menu
        </button>
      </header>

      <main id="top">
        <section className="hero" id="hero">
          <div className="hero-card panel" id="hero-card" data-ui>
            <p className="eyebrow">
              <span className="tag">Reef ops</span> Guided dives · 6–42 m
            </p>
            <h1>
              The reef <em>notices</em> you.
            </h1>
            <p className="lede">
              Touch the water and it moves. Lock on to the shark. Tap the octopus and it inks.
            </p>
            <div className="cta-row">
              <a className="btn btn-primary" href="#book">
                Book a dive
              </a>
              <a className="btn btn-ghost" href="#encounters">
                See encounters
              </a>
            </div>
          </div>
        </section>

        <section className="band" id="encounters" aria-labelledby="enc-h">
          <div className="band-head panel" data-ui>
            <p className="eyebrow">
              <span className="tag">01</span> Encounters
            </p>
            <h2 id="enc-h">Three dives. Three temperaments.</h2>
          </div>
          <div className="cards">
            <article className="card panel" data-ui>
              <p className="card-id">
                ENC-01 · <span>Carcharodon carcharias</span>
              </p>
              <h3>Great white cruise</h3>
              <dl className="specs">
                <div>
                  <dt>Depth</dt>
                  <dd>18–24 m</dd>
                </div>
                <div>
                  <dt>Time</dt>
                  <dd>45 min</dd>
                </div>
                <div>
                  <dt>Cert</dt>
                  <dd>AOW</dd>
                </div>
              </dl>
              <p>
                Hang off the reef wall while a resident white patrols the drop-off. Guides keep the
                group tight and the shark keeps its distance.
              </p>
              <p className="price">
                $189 <span>per diver</span>
              </p>
            </article>
            <article className="card panel" data-ui>
              <p className="card-id">
                ENC-02 · <span>Octopus vulgaris</span>
              </p>
              <h3>Octopus garden</h3>
              <dl className="specs">
                <div>
                  <dt>Depth</dt>
                  <dd>8–14 m</dd>
                </div>
                <div>
                  <dt>Time</dt>
                  <dd>60 min</dd>
                </div>
                <div>
                  <dt>Cert</dt>
                  <dd>OW</dd>
                </div>
              </dl>
              <p>
                A slow crawl over the boulder field where three day octopus hunt. Bring patience; they
                change color when they decide you&apos;re boring.
              </p>
              <p className="price">
                $129 <span>per diver</span>
              </p>
            </article>
            <article className="card panel" data-ui>
              <p className="card-id">
                ENC-03 · <span>Bioluminescence</span>
              </p>
              <h3>Glow dive</h3>
              <dl className="specs">
                <div>
                  <dt>Depth</dt>
                  <dd>6–12 m</dd>
                </div>
                <div>
                  <dt>Time</dt>
                  <dd>50 min</dd>
                </div>
                <div>
                  <dt>Cert</dt>
                  <dd>Night</dd>
                </div>
              </dl>
              <p>
                Lights off at the safety stop. Wave a hand and the plankton lights up around it. The
                most requested dive we run.
              </p>
              <p className="price">
                $149 <span>per diver</span>
              </p>
            </article>
          </div>
        </section>

        <section className="band" id="dive-day" aria-labelledby="day-h">
          <div className="band-head panel" data-ui>
            <p className="eyebrow">
              <span className="tag">02</span> Dive day
            </p>
            <h2 id="day-h">From the dock to the drop-off.</h2>
          </div>
          <ol className="steps panel" data-ui>
            <li>
              <span className="step-time">07:30</span>
              <h3>Briefing</h3>
              <p>Site map, currents, hand signals, and who you&apos;re buddied with.</p>
            </li>
            <li>
              <span className="step-time">08:15</span>
              <h3>Gear check</h3>
              <p>Weights, air, computer. We fit rental gear on the boat.</p>
            </li>
            <li>
              <span className="step-time">09:00</span>
              <h3>Descent</h3>
              <p>Down the mooring line to the reef. First dive runs about 45 minutes.</p>
            </li>
            <li>
              <span className="step-time">10:10</span>
              <h3>Surface interval</h3>
              <p>Hot drinks, logbooks, and a second site if the swell allows.</p>
            </li>
          </ol>
        </section>

        <section className="band" id="book" aria-labelledby="book-h">
          <form className="book panel" id="book-form" data-ui noValidate>
            <div>
              <p className="eyebrow">
                <span className="tag">03</span> Reserve
              </p>
              <h2 id="book-h">Pick a dive and a day.</h2>
            </div>
            <div className="fields">
              <label htmlFor="f-dive">
                Dive
                <select id="f-dive" name="dive" defaultValue="Octopus garden">
                  <option>Great white cruise</option>
                  <option>Octopus garden</option>
                  <option>Glow dive</option>
                </select>
              </label>
              <label htmlFor="f-date">
                Date
                <input id="f-date" name="date" type="date" />
              </label>
              <label htmlFor="f-divers">
                Divers
                <select id="f-divers" name="divers" defaultValue="2">
                  <option>1</option>
                  <option>2</option>
                  <option>3</option>
                  <option>4</option>
                  <option>5</option>
                  <option>6</option>
                </select>
              </label>
            </div>
            <div className="book-row">
              <button className="btn btn-primary" type="submit">
                Check availability
              </button>
              <p className="book-out" id="book-out" aria-live="polite" />
            </div>
          </form>
        </section>

        <footer className="foot panel" data-ui>
          <span>Abyssal Sanctuary is a demo brand.</span>
          <span>Interactive build by New Era Apps</span>
        </footer>
      </main>

      <aside className="contacts panel" id="contacts" data-ui aria-label="Tracked contacts">
        <p className="contacts-h">
          <span>Contacts</span>
          <span id="contacts-n">4 tracked</span>
        </p>
        <ul id="contact-list" />
      </aside>

      <div className="dock panel" id="dock" data-ui>
        <div className="gauge" title="Your depth as you scroll">
          <span className="gauge-k">Depth</span>
          <span id="g-depth">06 m</span>
          <span className="gauge-sep">/</span>
          <span id="g-temp">14 °C</span>
        </div>
        <button
          className="chip"
          id="t-sound"
          type="button"
          aria-pressed="false"
          title="Play the feed's sound"
        >
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M2 6h3l4-3v10L5 10H2z" fill="currentColor" />
            <path
              d="M11.5 5.5a3.5 3.5 0 0 1 0 5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
            />
          </svg>
          <span>Sound</span>
        </button>
        <button
          className="chip"
          id="t-trail"
          type="button"
          aria-pressed="true"
          title="Bioluminescent trail"
        >
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <rect x="2.5" y="10" width="3" height="3" fill="currentColor" />
            <rect x="7" y="6.5" width="2.4" height="2.4" fill="currentColor" opacity=".8" />
            <rect x="11.2" y="3.2" width="1.8" height="1.8" fill="currentColor" opacity=".6" />
          </svg>
          <span>Glow</span>
        </button>
        <button className="chip" id="t-quality" type="button" title="Render quality">
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path
              d="M2 12a6 6 0 1 1 12 0"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
            />
            <path d="M8 12l3-4" stroke="currentColor" strokeWidth="1.6" />
          </svg>
          <span id="t-quality-l">Auto</span>
        </button>
      </div>
    </div>
  );
}
