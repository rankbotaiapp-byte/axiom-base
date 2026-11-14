"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Volume2, VolumeX } from "lucide-react";
import { INTRO_CAPTION_CUES, captionAtTime } from "@/lib/axiom/intro-captions";
import "./founder-intro-hero.css";

export const FOUNDER_INTRO_VIDEO = "/media/Axiom_24_7 Booking for Contractors_720p_caption.mp4";
/** Root-relative public path — same 24/7 film, no spaces, Vercel-safe. */
export const FOUNDER_INTRO_VIDEO_SAFE = "/media/heroes/intro-welcome.mp4";
export const PLUMBING_DEMO_ANCHOR = "plumbing-demo";

export function explorePlumbingDemo() {
  const el = document.getElementById(PLUMBING_DEMO_ANCHOR);
  if (el) {
    const top = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top, behavior: "smooth" });
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  window.location.assign("/demo/plumbing");
}

/**
 * Full-viewport founder intro. Sound is only the mp4a's native track inside
 * `/media/Axiom_24_7 Booking for Contractors_720p_caption.mp4` — native soundtrack only.
 */
export function FounderIntroHero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [caption, setCaption] = useState(INTRO_CAPTION_CUES[0]?.text ?? "");

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.setAttribute("src", FOUNDER_INTRO_VIDEO_SAFE);
    video.src = FOUNDER_INTRO_VIDEO_SAFE;
    video.load();
    video.muted = true;
    video.volume = 1;
    video.defaultMuted = true;
    void video.play().catch(() => undefined);

    const pushCaption = () => setCaption(captionAtTime(video.currentTime));
    video.addEventListener("timeupdate", pushCaption);
    video.addEventListener("seeked", pushCaption);
    video.addEventListener("play", pushCaption);
    return () => {
      video.removeEventListener("timeupdate", pushCaption);
      video.removeEventListener("seeked", pushCaption);
      video.removeEventListener("play", pushCaption);
    };
  }, []);

  function toggleNativeAudio() {
    const video = videoRef.current;
    if (!video) return;
    if (video.muted) {
      video.muted = false;
      video.volume = 1;
      setMuted(false);
      void video.play().catch(() => {
        video.muted = true;
        setMuted(true);
      });
      return;
    }
    video.muted = true;
    setMuted(true);
  }

  return (
    <section className="founder-intro" aria-label="Welcome from Eric">
      <div className="founder-intro-film">
        <video
          key="/media/heroes/intro-welcome.mp4"
          ref={videoRef}
          autoPlay
          muted={muted}
          loop
          playsInline
          className="founder-intro-video absolute inset-0 w-full h-full object-cover"
          src="/media/heroes/intro-welcome.mp4"
          preload="auto"
        >
          <source src="/media/heroes/intro-welcome.mp4" type="video/mp4" />
          <source src="/media/Axiom_24_7 Booking for Contractors_720p_caption.mp4" type="video/mp4" />
          <track
            kind="captions"
            src="/media/welcome-to-axiom.vtt"
            srcLang="en"
            label="English"
            default
          />
        </video>
        <div className="founder-intro-scrim" aria-hidden="true" />
      </div>

      <button
        type="button"
        className="founder-intro-audio"
        data-on={muted ? undefined : ""}
        aria-pressed={!muted}
        aria-label={muted ? "Click to unmute" : "Mute intro"}
        onClick={toggleNativeAudio}
      >
        {muted ? <VolumeX size={18} strokeWidth={2.4} aria-hidden /> : <Volume2 size={18} strokeWidth={2.4} aria-hidden />}
        <span>{muted ? "Click to unmute" : "Sound on"}</span>
      </button>

      {caption ? (
        <div className="founder-intro-captions" aria-live="polite" aria-atomic="true">
          <p className="founder-intro-caption-text">{caption}</p>
        </div>
      ) : null}

      <div className="founder-intro-copy">
        <p className="founder-intro-kicker">A note from Eric</p>
        <h1 className="founder-intro-title">Welcome to Axiom.</h1>
        <p className="founder-intro-lede">
          I built this so a plumbing shop never loses another after-hours call. Watch the Medford
          demo below — live capture, dispatch, and a $1 trial.
        </p>
        <a className="founder-intro-cta" href={`#${PLUMBING_DEMO_ANCHOR}`} onClick={explorePlumbingDemo}>
          Explore Plumbing Demo
          <ChevronDown size={18} strokeWidth={2.4} aria-hidden />
        </a>
      </div>

      <a
        className="founder-intro-scroll"
        href={`#${PLUMBING_DEMO_ANCHOR}`}
        onClick={explorePlumbingDemo}
        aria-label="Scroll to plumbing demo"
      >
        <ChevronDown size={22} strokeWidth={2.2} aria-hidden />
      </a>
    </section>
  );
}
