import { useEffect, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "framer-motion";
import { CorePresenceBar } from "@/components/core-presence-bar";
import { CoreSphere } from "@/components/CoreSphere";
import type { CoreStateId } from "@/lib/axiom/core-presence";

const ORB_FILM = "/media/axiom-orb-response.mp4";
const ORB_POSTER = "/media/goopy-orb-base.jpg";

export function storefrontFilm(
  video: string | readonly string[] | null | undefined,
  fallback?: string | null,
) {
  if (typeof video === "string" && video.trim()) return video;
  if (video && typeof video !== "string") {
    const first = video.find((item) => item.trim());
    if (first) return first;
  }
  if (fallback?.trim()) return fallback;
  return ORB_FILM;
}

export function StorefrontPresence({
  name,
  kicker = "",
  tagline = "",
  videoUrl,
  imageUrl,
  bookHref,
  bookLabel,
  children,
}: {
  name: string;
  kicker?: string;
  tagline?: string;
  videoUrl?: string | readonly string[] | null;
  imageUrl?: string | null;
  bookHref?: string;
  bookLabel?: string;
  children?: ReactNode;
}) {
  const hostRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const reduce = useReducedMotion();
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(true);
  const [state, setState] = useState<CoreStateId>("water");
  const [portal, setPortal] = useState<"orbit" | "inside">("orbit");
  const [mark, setMark] = useState(name);
  const film = storefrontFilm(videoUrl);
  const poster = imageUrl?.trim() || ORB_POSTER;

  useEffect(() => {
    setMark(name);
  }, [name]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const watch = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setVisible(true);
      },
      { rootMargin: "240px" },
    );
    watch.observe(host);
    return () => watch.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const video = videoRef.current;
    if (!video) return;
    void video.play?.().catch(() => {});
  }, [visible, film]);

  return (
    <section
      ref={hostRef}
      className="tactical-hero is-stage storefront-orb-hero"
      aria-label={`${name} hero`}
      data-storefront-hero="orb"
    >
      <div className="tactical-plate">
        <video
          ref={videoRef}
          className="tactical-media"
          src={film}
          poster={poster}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden
        />
        <div className="storefront-orb-scrim" aria-hidden />
        <div className="tactical-rim" aria-hidden />
        <span className="tactical-corner is-nw" aria-hidden />
        <span className="tactical-corner is-ne" aria-hidden />
        <span className="tactical-corner is-sw" aria-hidden />
        <span className="tactical-corner is-se" aria-hidden />
        <div className="storefront-orb-nav">{children}</div>
        <div className="storefront-orb-copy">
          {kicker ? <p className="text-[11px] uppercase tracking-[0.22em] text-muted">{kicker}</p> : null}
          <h1 className="mt-2 font-display text-4xl text-fg sm:text-5xl">{name}</h1>
          {tagline ? <p className="mt-2 max-w-md text-sm text-muted">{tagline}</p> : null}
          {bookHref && bookLabel ? (
            <a className="storefront-orb-book" href={bookHref}>
              {bookLabel}
            </a>
          ) : null}
        </div>
        <div className="storefront-orb pointer-events-auto">
          <div className="storefront-orb-view">
            {visible && ready ? (
              <CoreSphere
                framed
                text={mark}
                videoRef={videoRef}
                reduced={Boolean(reduce)}
                state={state}
                portal={portal}
                room={portal === "inside"}
                label={`${name} presence`}
                onTap={() => {}}
                onUnavailable={() => setReady(false)}
              />
            ) : (
              <div className="core-stage-hold" />
            )}
          </div>
          <CorePresenceBar
            state={state}
            portal={portal}
            onState={setState}
            onPortal={setPortal}
            onFresh={() => {
              setMark("");
              window.setTimeout(() => setMark(name), 40);
            }}
          />
        </div>
      </div>
    </section>
  );
}
