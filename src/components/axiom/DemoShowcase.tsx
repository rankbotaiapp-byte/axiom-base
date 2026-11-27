"use client";

/**
 * DemoShowcase — live, scrollable phone demos for the AXIOM landing page.
 * Place directly BELOW the hero animation.
 *
 * Each phone is a real iframe of a demo app served from /public/demos/<slug>/index.html,
 * so visitors can scroll, tap BOOK, open the form and see every animation.
 * No business names appear anywhere — only the niche + the pitch.
 */

import { useEffect, useRef, useState } from "react";

type Demo = {
  slug: string;              // folder under /public/demos/
  niche: string;             // eyebrow pill
  headline: string;          // first line (white)
  highlight: string;         // second line (accent color)
  body: string;
  points: string[];
  accent: "gold" | "cyan";
};

const DEMOS: Demo[] = [
  {
    slug: "barbershop",
    niche: "Live App Demo · Barbershop",
    headline: "Chairs filled while you cut.",
    highlight: "Bookings land without a phone call.",
    body:
      "A branded app clients save to their home screen: the full service menu with prices, a 60-second chair booking with live time slots, and one-tap call — wrapped in a hero that actually stops the scroll.",
    points: [
      "Book-a-chair flow with real time slots",
      "Service menu with one-tap booking",
      "Tap-to-call and sticky Book button",
      "Live in days — no app store needed",
    ],
    accent: "gold",
  },
  {
    slug: "electrician",
    niche: "Live App Demo · Electrician",
    headline: "Emergency calls answered.",
    highlight: "Jobs booked while you're on the ladder.",
    body:
      "A branded app customers save to their home screen: one-tap emergency call, a 60-second booking form that texts you the job, address and urgency, and a help bot that answers the common questions for you.",
    points: [
      "Tap-to-call 24/7 emergency line",
      "Bookings land in your texts, ready to dispatch",
      "Panel, EV charger & generator leads tagged by job",
      "Live in days — no app store needed",
    ],
    accent: "cyan",
  },
];

const SCREEN_W = 390;
const SCREEN_H = 844;

function Phone({ src, title }: { src: string; title: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setScale(Math.min(1, e.contentRect.width / SCREEN_W)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="ds-phone">
      <div ref={box} className="ds-screen" style={{ height: SCREEN_H * scale }}>
        <div className="ds-island" />
        <iframe
          src={src}
          title={title}
          loading="lazy"
          style={{ width: SCREEN_W, height: SCREEN_H, transform: `scale(${scale})` }}
        />
        <div className="ds-home" />
      </div>
      <div className="ds-cap">Scroll &amp; tap inside the phone</div>
    </div>
  );
}

export default function DemoShowcase() {
  useEffect(() => {
    if (window.location.hash !== "#live-demos") return;
    document.getElementById("live-demos")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <section className="ds" id="live-demos" aria-label="Live app demos">
      <style>{CSS}</style>
      <div className="ds-intro">
        <span className="ds-kicker">See it before you buy it</span>
        <h2>Real apps. Running live. <em>Try them right here.</em></h2>
      </div>

      {DEMOS.map((d, i) => (
        <div key={d.slug} className={`ds-row ${i % 2 ? "ds-flip" : ""} ds-${d.accent}`}>
          <div className="ds-pitch">
            <span className="ds-pill">{d.niche}</span>
            <h3>
              {d.headline}
              <br />
              <span>{d.highlight}</span>
            </h3>
            <p>{d.body}</p>
            <ul>
              {d.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
          <Phone src={`/demos/${d.slug}/index.html`} title={`${d.niche} app`} />
        </div>
      ))}
    </section>
  );
}

const CSS = `
.ds{--obs:#050507;--cyan:#00ffcc;--gold:#FFE500;--txt:#eef3f5;--mut:#98a3ab;
  position:relative;background:var(--obs);color:var(--txt);padding:96px 24px 120px;overflow:hidden;font-family:Inter,system-ui,sans-serif;
  scroll-margin-top:calc(var(--ap-nav-h, 56px) + 12px)}
.ds::before{content:"";position:absolute;inset:0;pointer-events:none;
  background:radial-gradient(50% 40% at 80% 10%,rgba(0,255,204,.08),transparent 70%),radial-gradient(45% 35% at 10% 90%,rgba(255,229,0,.06),transparent 70%)}
.ds-intro{position:relative;text-align:center;max-width:720px;margin:0 auto 72px}
.ds-kicker{font-size:12px;font-weight:800;letter-spacing:.28em;text-transform:uppercase;color:var(--cyan)}
.ds-intro h2{font-size:clamp(30px,4.6vw,50px);font-weight:900;line-height:1.08;margin-top:14px}
.ds-intro h2 em{font-style:normal;color:var(--gold)}
.ds-row{position:relative;max-width:1080px;margin:0 auto 110px;display:flex;align-items:center;justify-content:center;gap:64px;flex-wrap:wrap}
.ds-row:last-child{margin-bottom:0}
.ds-flip{flex-direction:row-reverse}
.ds-pitch{flex:1 1 360px;max-width:440px}
.ds-pill{display:inline-block;font-size:11px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;padding:6px 13px;border-radius:99px;margin-bottom:18px;
  color:var(--ac);border:1.5px solid color-mix(in srgb,var(--ac) 55%,transparent);background:color-mix(in srgb,var(--ac) 7%,transparent)}
.ds-pitch h3{font-size:clamp(28px,3.8vw,42px);font-weight:900;line-height:1.1;margin-bottom:16px}
.ds-pitch h3 span{color:var(--ac);text-shadow:0 0 22px color-mix(in srgb,var(--ac) 35%,transparent)}
.ds-pitch p{font-size:16px;line-height:1.65;color:var(--mut)}
.ds-pitch ul{list-style:none;padding:0;margin:20px 0 0;display:grid;gap:10px;font-size:15px;color:#d5dde1}
.ds-pitch li{display:flex;gap:10px;align-items:flex-start}
.ds-pitch li::before{content:"";flex:none;width:8px;height:8px;margin-top:7px;border-radius:50%;background:var(--ac);box-shadow:0 0 10px var(--ac)}
.ds-gold{--ac:var(--gold)} .ds-cyan{--ac:var(--cyan)}
.ds-phone{flex:0 0 auto;width:min(410px,92vw);text-align:center}
.ds-phone .ds-screen{position:relative;width:100%;max-width:${SCREEN_W}px;margin:0 auto;border-radius:50px;overflow:hidden;background:#000;
  box-shadow:0 0 0 10px #0b0c10,0 0 0 12px #2a2e36,0 40px 90px rgba(0,0,0,.7),0 0 90px color-mix(in srgb,var(--ac) 22%,transparent)}
.ds-phone iframe{position:absolute;top:0;left:0;border:0;display:block;transform-origin:0 0;background:#000}
.ds-island{position:absolute;top:11px;left:50%;transform:translateX(-50%);width:31%;height:33px;border-radius:20px;background:#000;z-index:5;pointer-events:none}
.ds-home{position:absolute;bottom:8px;left:50%;transform:translateX(-50%);width:34%;height:5px;border-radius:3px;background:rgba(255,255,255,.5);z-index:5;pointer-events:none}
.ds-cap{margin-top:26px;font-size:11px;font-weight:700;letter-spacing:.26em;text-transform:uppercase;color:var(--ac)}
@media (max-width:880px){
  .ds{padding:72px 16px 90px}
  .ds-row,.ds-flip{flex-direction:column;gap:36px;margin-bottom:90px}
  .ds-pitch{text-align:center}
  .ds-pitch ul{justify-items:center}
}
`;
