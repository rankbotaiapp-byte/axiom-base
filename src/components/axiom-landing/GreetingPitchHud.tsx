"use client";

import { useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

import { FOUNDER_GREETING_POSTER, FOUNDER_GREETING_SRC } from "@/lib/axiom-landing/storefront-films";

const GREETING_SRC = FOUNDER_GREETING_SRC;
const GREETING_POSTER = FOUNDER_GREETING_POSTER;

export function GreetingPitchHud({
  kicker = "Face to face · Eric",
  caption = "The pitch, in his own words — tap for sound.",
}: {
  kicker?: string;
  caption?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [sound, setSound] = useState(false);

  async function toggleSound() {
    const node = videoRef.current;
    if (!node) {
      setSound((v) => !v);
      return;
    }
    if (sound) {
      node.muted = true;
      setSound(false);
      return;
    }
    node.muted = false;
    node.currentTime = 0;
    try {
      await node.play();
      setSound(true);
    } catch {
      node.muted = true;
      setSound(false);
    }
  }

  return (
    <figure className="greeting-pitch-hud" data-axiom-pre-roll="avatar-greeting">
      <p className="greeting-pitch-kicker">{kicker}</p>
      <div className="greeting-pitch-frame">
        <span className="film-glow-ring" aria-hidden />
        <span className="film-bracket film-bracket-nw" aria-hidden />
        <span className="film-bracket film-bracket-ne" aria-hidden />
        <span className="film-bracket film-bracket-sw" aria-hidden />
        <span className="film-bracket film-bracket-se" aria-hidden />
        <video
          ref={videoRef}
          className="greeting-pitch-media"
          src={GREETING_SRC}
          poster={GREETING_POSTER}
          autoPlay
          muted={!sound}
          loop
          playsInline
          preload="auto"
        />
        <button
          type="button"
          className="greeting-pitch-hit"
          aria-pressed={sound}
          aria-label={sound ? "Mute introduction" : "Play introduction with sound"}
          onClick={() => void toggleSound()}
        >
          <span className="greeting-pitch-sound">
            {sound ? <Volume2 size={16} aria-hidden /> : <VolumeX size={16} aria-hidden />}
            {sound ? "Sound on" : "Tap for sound"}
          </span>
        </button>
      </div>
      <figcaption className="greeting-pitch-caption">{caption}</figcaption>
    </figure>
  );
}
