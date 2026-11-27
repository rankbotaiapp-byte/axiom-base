"use client";

import { useState } from "react";
import {
  ELECTRICIAN_HERO_LOOP_FALLBACK,
  ELECTRICIAN_HERO_POSTER_FALLBACK,
  liveCallHref,
  type ElectricianHeroConfig,
} from "@/lib/axiom/electrician-outreach";
import "./electrician-outreach.css";

type ElectricianHeroProps = ElectricianHeroConfig & {
  onBook?: () => void;
};

export function ElectricianHero(props: ElectricianHeroProps) {
  const [videoSrc, setVideoSrc] = useState(props.videoSrc);
  const [poster, setPoster] = useState(props.poster);
  const [showVideo, setShowVideo] = useState(Boolean(props.videoSrc));
  const tel = liveCallHref(props.phone);
  const bookHref = props.secondaryCta.href || "#book";

  return (
    <section className="eo-hero" id="top" style={{ background: props.bg }}>
      <div className="eo-stage" aria-hidden="true">
        <img
          className="eo-poster"
          src={poster}
          alt=""
          onError={() => {
            if (poster !== ELECTRICIAN_HERO_POSTER_FALLBACK) setPoster(ELECTRICIAN_HERO_POSTER_FALLBACK);
          }}
        />
        {showVideo ? (
          <video
            className="eo-loop"
            src={videoSrc}
            poster={poster}
            muted
            loop
            playsInline
            autoPlay
            onError={() => {
              if (videoSrc !== ELECTRICIAN_HERO_LOOP_FALLBACK) {
                setVideoSrc(ELECTRICIAN_HERO_LOOP_FALLBACK);
                return;
              }
              setShowVideo(false);
            }}
          />
        ) : null}
        <div className="eo-fade" />
        <div className="eo-corners">
          <span className="a" />
          <span className="b" />
          <span className="c" />
          <span className="d" />
        </div>
      </div>
      <div className="eo-hero-copy">
        <p className="eo-pill">
          <i />
          {props.tagline}
        </p>
        <h1 className="eo-big">{props.businessName}</h1>
      </div>
      <div className="eo-cta-row eo-hero-ctas">
        {tel ? (
          <a className="eo-btn eo-btn-call" href={tel}>
            {props.primaryCta.label}
          </a>
        ) : (
          <a className="eo-btn eo-btn-call" href={bookHref} onClick={props.onBook}>
            {props.primaryCta.label}
          </a>
        )}
        {props.onBook ? (
          <button type="button" className="eo-btn eo-btn-book" onClick={props.onBook}>
            {props.secondaryCta.label}
          </button>
        ) : (
          <a className="eo-btn eo-btn-book" href={bookHref}>
            {props.secondaryCta.label}
          </a>
        )}
      </div>
    </section>
  );
}

export default ElectricianHero;
