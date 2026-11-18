"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import {
  CINEMATIC_HERO_FALLBACKS,
  CINEMATIC_HERO_POSTER,
  CINEMATIC_HERO_VIDEO,
} from "@/lib/axiom/cinematic-content-seo";
import { RippleButton } from "./RippleButton";
import { HeroStudioLivePreview } from "./HeroStudioLivePreview";
import { useFunnel } from "./FunnelProvider";

export default function Hero() {
  const { startOnboarding } = useFunnel();
  const video = useRef<HTMLVideoElement>(null);
  const [srcIndex, setSrcIndex] = useState(0);
  const src = CINEMATIC_HERO_FALLBACKS[srcIndex] ?? CINEMATIC_HERO_VIDEO;

  useEffect(() => {
    const node = video.current;
    if (!node) return;
    const play = () => {
      void node.play().catch(() => undefined);
    };
    play();
    node.addEventListener("loadeddata", play);
    return () => node.removeEventListener("loadeddata", play);
  }, [src]);

  return (
    <section id="top" data-tactile-film="" className="relative isolate min-h-[100svh] overflow-hidden bg-ink">
      <div className="pointer-events-none absolute inset-0 -z-10 select-none" aria-hidden>
        <img
          src={CINEMATIC_HERO_POSTER}
          alt=""
          className="absolute inset-0 h-full w-full scale-105 object-cover opacity-70"
        />
        <video
          ref={video}
          key={src}
          className="absolute inset-0 h-full w-full object-cover"
          src={src}
          poster={CINEMATIC_HERO_POSTER}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          disablePictureInPicture
          tabIndex={-1}
          data-sample
          data-sample-fit="cover"
          onError={() => {
            setSrcIndex((i) => Math.min(i + 1, CINEMATIC_HERO_FALLBACKS.length - 1));
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/25" />
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-ink/80 to-transparent" />
        <div className="absolute inset-y-0 left-0 w-[55%] bg-gradient-to-r from-ink/70 via-ink/30 to-transparent" />
      </div>

      <div className="mx-auto grid min-h-[100svh] max-w-7xl items-end gap-10 px-5 pb-16 pt-28 sm:px-8 md:pb-20 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="max-w-3xl">
          <p className="rise mb-5 inline-flex items-center gap-2 border border-white/15 bg-black/40 px-3.5 py-1.5 font-mono text-xs font-medium uppercase tracking-[0.18em] text-mist backdrop-blur">
            <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-volt" /> 3-minute niche setup
          </p>

          <h1
            className="rise font-display text-[2.15rem] font-bold leading-[1.04] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-[4rem]"
            style={{ animationDelay: "80ms", textShadow: "0 2px 30px rgb(0 0 0 / 0.6)" }}
          >
            A live trade desk in three minutes for{" "}
            <span className="bg-gradient-to-r from-[var(--color-hud)] via-volt to-copper bg-clip-text text-transparent">
              plumbers, HVAC, electricians &amp; outfitters.
            </span>
          </h1>

          <p className="rise mt-5 max-w-xl text-base text-mist sm:text-lg" style={{ animationDelay: "160ms" }}>
            Preloaded regional leads and a cinematic 3D hero preview stand the storefront up before you leave the driveway.
            Axiom is built for contractors who still collect cash and checks on the job — not only shops that live on card checkout.
          </p>

          <div className="rise mt-8 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: "240ms" }}>
            <RippleButton variant="primary" className="text-base" onClick={() => startOnboarding({ plan: "trial" })}>
              Start the $1 · 14-day trial <ArrowRight className="ml-1 inline-block h-4 w-4" aria-hidden />
            </RippleButton>
            <RippleButton
              variant="ghost"
              className="text-base"
              onClick={() => document.getElementById("proof")?.scrollIntoView({ behavior: "smooth" })}
            >
              Preview niche templates
            </RippleButton>
          </div>

          <ul className="rise mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-mist" style={{ animationDelay: "320ms" }}>
            <li className="inline-flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-copper" aria-hidden /> $1 for 14 days, then $150/mo
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-copper" aria-hidden /> Cancel in one click from Admin Billing
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-copper" aria-hidden /> 1.5% on card bookings · 0% on cash and checks
            </li>
          </ul>
        </div>
        <HeroStudioLivePreview />
      </div>
    </section>
  );
}
