"use client";

import { useState } from "react";
import { CalendarDays, Phone, ShieldCheck } from "lucide-react";
import { HeroLoopVideo } from "@/components/loop-video";
import { CinematicMediaFrame } from "@/components/storefront/CinematicMediaFrame";
import { StorefrontHelpFab } from "@/components/storefront/StorefrontHelpFab";
import { DEFAULT_SHOWCASE_THEME_ID, showcaseTheme, type ShowcaseThemeId } from "@/lib/axiom/outreach-desk";
import "./trade-showcase.css";

export type TradeShowcaseProps = {
  businessName: string;
  niche: string;
  city?: string;
  phone?: string;
  headline?: string;
  subcopy?: string;
  eyebrow?: string;
  iconUrl?: string;
  posterUrl: string;
  videoUrl?: string | null;
  bookHref: string;
  themeId?: ShowcaseThemeId | string;
  cinemaGrade?: boolean;
};

export function TradeShowcase({
  businessName,
  niche,
  city,
  phone,
  headline,
  subcopy,
  eyebrow,
  iconUrl,
  posterUrl,
  videoUrl,
  bookHref,
  themeId = DEFAULT_SHOWCASE_THEME_ID,
  cinemaGrade = true,
}: TradeShowcaseProps) {
  const theme = showcaseTheme(themeId);
  const [muted, setMuted] = useState(true);
  const tel = (phone ?? "").replace(/\D/g, "");
  const callHref = tel.length >= 10 ? `tel:+1${tel.slice(-10)}` : bookHref;
  const trade = (niche || "service").replace(/-/g, " ");
  const bannerCity = (city || "").trim();
  const defaultHeadline = /hvac|heat|cool|air/.test(trade.toLowerCase())
    ? "No heat? No AC? We're on the way."
    : "Need a crew on site? We're on the way.";

  return (
    <div
      className="ts-shell"
      style={{
        ["--ts-ring" as string]: theme.ring,
        ["--ts-ring-hot" as string]: theme.ringHot,
        ["--ts-call" as string]: theme.call,
        ["--ts-book" as string]: theme.book,
        ["--ts-cyan" as string]: theme.cyan,
        ["--ts-obsidian" as string]: theme.obsidian,
      }}
    >
      <div className="ts-frame">
        <div className="ts-inner">
          <header className="ts-header">
            <span className="ts-mark">
              {iconUrl ? <img src={iconUrl} alt="" /> : businessName.slice(0, 1)}
            </span>
            <p className="ts-name">{businessName}</p>
            <a className="ts-phone-icon" href={callHref} aria-label="Call">
              <Phone className="size-4" />
            </a>
          </header>

          <div className="ts-hero">
            <span className="ts-tick ts-tick-tl" aria-hidden />
            <span className="ts-tick ts-tick-tr" aria-hidden />
            <span className="ts-tick ts-tick-bl" aria-hidden />
            <span className="ts-tick ts-tick-br" aria-hidden />
            <CinematicMediaFrame cinemaGrade={cinemaGrade} className="absolute inset-0 h-full w-full">
              {videoUrl ? (
                <HeroLoopVideo
                  src={videoUrl}
                  poster={posterUrl}
                  muted={muted}
                  autoPlay
                  loop
                  playsInline
                  preload="metadata"
                  aria-label={`${businessName} hero loop`}
                />
              ) : (
                <img src={posterUrl} alt="" />
              )}
            </CinematicMediaFrame>
            <span className="ts-badge">24/7</span>
            {videoUrl ? (
              <button type="button" className="ts-mute" onClick={() => setMuted((value) => !value)}>
                {muted ? "SOUND OFF" : "SOUND ON"}
              </button>
            ) : null}
          </div>

          <p className="ts-banner">24/7 Emergency{bannerCity ? ` · ${bannerCity}` : ""}</p>
          <h1 className="ts-title">{businessName}</h1>
          <p className="ts-eyebrow">{eyebrow || `24/7 ${trade}`}</p>
          <p className="ts-headline">{headline || defaultHeadline}</p>
          <p className="ts-sub">
            {subcopy || "Repairs, tune-ups and new systems. Book online in 60 seconds or call for a live dispatcher."}
          </p>

          <a className="ts-cta ts-cta-call" href={callHref}>
            <Phone className="size-4" /> No heat or AC? Call now
          </a>
          <a className="ts-cta ts-cta-book" href={bookHref}>
            <CalendarDays className="size-4" /> Book a tune-up
          </a>

          <div className="ts-trust">
            <article>
              <ShieldCheck className="size-5 text-[#00ffcc]" />
              Licensed & Insured
            </article>
            <article>
              <span className="grid size-8 place-items-center rounded-full border border-[#00ffcc]/40 text-[10px] text-[#00ffcc]">
                24/7
              </span>
              24/7 Live Dispatch
            </article>
          </div>
        </div>
      </div>

      <StorefrontHelpFab shopName={businessName} phone={phone} bookHref={bookHref} className="storefront-help-fab--raised" />
      <nav className="ts-sticky" aria-label="Call or book">
        <a className="ts-sticky-call" href={callHref}>
          <Phone className="size-4" /> Call
        </a>
        <a className="ts-sticky-book" href={bookHref}>
          <CalendarDays className="size-4" /> Book
        </a>
      </nav>
    </div>
  );
}

export default TradeShowcase;
