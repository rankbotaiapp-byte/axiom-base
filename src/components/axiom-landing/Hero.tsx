"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { RippleButton } from "./RippleButton";
import { useFunnel } from "./FunnelProvider";

const HERO_SRC = "/media/axioms-heart.mp4";
const HERO_POSTER = "/media/axioms-heart-poster.jpg";

export default function Hero() {
  const { startOnboarding } = useFunnel();
  const main = useRef<HTMLVideoElement>(null);
  const fill = useRef<HTMLVideoElement>(null);
  const [dualDecode, setDualDecode] = useState(false);

  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const saveData = Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);
    setDualDecode(!coarse && !saveData && window.innerWidth >= 768);
  }, []);

  // Keep the blurred fill loosely in sync with the main video.
  useEffect(() => {
    if (!dualDecode) return;
    const m = main.current;
    const f = fill.current;
    if (!m || !f) return;
    const sync = () => {
      if (Math.abs(f.currentTime - m.currentTime) > 0.25) f.currentTime = m.currentTime;
    };
    m.addEventListener("seeked", sync);
    m.addEventListener("playing", sync);
    const id = window.setInterval(sync, 2000);
    return () => {
      m.removeEventListener("seeked", sync);
      m.removeEventListener("playing", sync);
      window.clearInterval(id);
    };
  }, [dualDecode]);

  return (
    <section id="top" className="relative isolate min-h-[100svh] overflow-hidden bg-ink">
      {/* ---------- Video layer: strictly non-interactive ---------- */}
      <div className="pointer-events-none absolute inset-0 -z-10 select-none" aria-hidden>
        {/* Blurred fill behind — fills the screen edges on any aspect ratio */}
        <img
          src={HERO_POSTER}
          alt=""
          className="absolute inset-0 h-full w-full scale-110 object-cover opacity-55 blur-2xl"
        />
        {dualDecode ? (
        <video
          ref={fill}
          className="absolute inset-0 h-full w-full scale-110 object-cover opacity-55 blur-2xl"
          src={HERO_SRC}
          poster={HERO_POSTER}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          disablePictureInPicture
          tabIndex={-1}
          data-sample
          data-sample-fit="cover"
        />
        ) : null}
        {/* The centerpiece — object-contain: never cropped, never stretched */}
        <video
          ref={main}
          className="absolute inset-x-0 top-16 h-[56.25vw] w-full object-contain md:inset-0 md:top-0 md:h-full"
          src={HERO_SRC}
          poster={HERO_POSTER}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          disablePictureInPicture
          tabIndex={-1}
          data-sample
        />
        {/* Readability scrims (overlays only — the video itself is untouched) */}
        <div className="absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-ink via-ink/75 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-ink/80 to-transparent" />
        <div className="absolute inset-y-0 left-0 hidden w-[60%] bg-gradient-to-r from-ink/75 via-ink/35 to-transparent lg:block" />
      </div>

      {/* ---------- Content layer ---------- */}
      <div className="mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-end px-5 pb-14 pt-[calc(64px+56.25vw+20px)] sm:px-8 md:pb-20 md:pt-28">
        <div className="max-w-3xl">
          <p className="rise mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-3.5 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-mist backdrop-blur">
            <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-volt" /> Axiom · Back office on autopilot
          </p>

          <h1
            className="rise font-display text-[2.15rem] font-bold leading-[1.04] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-[4.1rem]"
            style={{ animationDelay: "80ms", textShadow: "0 2px 30px rgb(0 0 0 / 0.6)" }}
          >
            The Fully Automated Back Office for Contractors{" "}
            <span className="bg-gradient-to-r from-ember via-copper to-volt bg-clip-text text-transparent">
              — Booking, Routing, &amp; Dispatch on Autopilot.
            </span>
          </h1>

          <p className="rise mt-5 max-w-xl text-base text-mist sm:text-lg" style={{ animationDelay: "160ms" }}>
            Pick your trade&apos;s ready-made template, tweak it from your phone in minutes, and let Axiom answer, book,
            route, and dispatch every job — while you&apos;re on the job.
          </p>

          <div className="rise mt-8 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: "240ms" }}>
            <RippleButton variant="primary" className="text-base" onClick={() => startOnboarding({ plan: "free-setup" })}>
              Start Your Free Setup <ArrowRight className="ml-1 inline-block h-4 w-4" aria-hidden />
            </RippleButton>
            <RippleButton
              variant="ghost"
              className="text-base"
              onClick={() => document.getElementById("proof")?.scrollIntoView({ behavior: "smooth" })}
            >
              View Sample Templates
            </RippleButton>
          </div>

          <ul className="rise mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-mist" style={{ animationDelay: "320ms" }}>
            <li className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-copper" aria-hidden /> No credit card to start</li>
            <li className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-copper" aria-hidden /> Live in minutes, not weeks</li>
            <li className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-copper" aria-hidden /> Pay once — no monthly fees</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
