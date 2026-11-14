import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
  type Ref,
  type SyntheticEvent,
  type VideoHTMLAttributes,
} from "react";
import { applyLoopTailTrim } from "@/lib/axiom/loop-trim";
import {
  FALLBACK_HERO_POSTER,
  resolveFallbackHeroLoop,
  resolvePublicMediaUrl,
  resolvePublicPosterUrl,
} from "@/lib/axiom/public-media";

type HeroLoopVideoProps = VideoHTMLAttributes<HTMLVideoElement> & {
  /** Skip the last 1.75s of the file. Default on. */
  trimTail?: boolean;
  /**
   * Release the media element on unmount (pause + clear src).
   * Keep on for full-bleed background loops so navigations do not keep decoding.
   */
  releaseOnUnmount?: boolean;
};

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (!ref) return;
  if (typeof ref === "function") {
    ref(value);
    return;
  }
  (ref as MutableRefObject<T | null>).current = value;
}

/** Drop-in video that loops (or ends) before a CapCut watermark. */
export const HeroLoopVideo = forwardRef<HTMLVideoElement, HeroLoopVideoProps>(function HeroLoopVideo(
  {
    onTimeUpdate,
    onEnded,
    onError,
    loop = true,
    trimTail = true,
    releaseOnUnmount = true,
    preload = "metadata",
    playsInline = true,
    muted = true,
    src,
    poster,
    className,
    ...props
  },
  ref,
) {
  const localRef = useRef<HTMLVideoElement | null>(null);
  const [origin, setOrigin] = useState("");
  const [lane, setLane] = useState<"primary" | "fallback" | "poster">("primary");

  const film = resolvePublicMediaUrl(typeof src === "string" ? src : "", origin);
  const plate = resolvePublicPosterUrl(typeof poster === "string" ? poster : FALLBACK_HERO_POSTER, origin);
  const rescue = resolveFallbackHeroLoop(origin);
  const activeSrc = lane === "fallback" ? rescue : film;

  const setRefs = useCallback(
    (node: HTMLVideoElement | null) => {
      localRef.current = node;
      assignRef(ref, node);
    },
    [ref],
  );

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    setLane(film ? "primary" : "poster");
  }, [film]);

  useEffect(() => {
    if (!releaseOnUnmount) return;
    return () => {
      const el = localRef.current;
      if (!el) return;
      try {
        el.pause();
        el.removeAttribute("src");
        while (el.firstChild) el.removeChild(el.firstChild);
        el.load();
      } catch {
        // Ignore release races during fast route changes.
      }
    };
  }, [releaseOnUnmount]);

  const handleTimeUpdate = useCallback(
    (event: SyntheticEvent<HTMLVideoElement, Event>) => {
      if (trimTail) {
        applyLoopTailTrim(event.currentTarget, {
          loop: loop !== false,
          onAdvance: loop === false && onEnded ? () => onEnded(event) : undefined,
        });
      }
      onTimeUpdate?.(event);
    },
    [loop, onEnded, onTimeUpdate, trimTail],
  );

  const handleError = useCallback(
    (event: SyntheticEvent<HTMLVideoElement, Event>) => {
      if (lane === "primary" && rescue && rescue !== film) {
        setLane("fallback");
        return;
      }
      setLane("poster");
      onError?.(event);
    },
    [film, lane, onError, rescue],
  );

  if (lane === "poster" || !activeSrc) {
    return (
      <img
        src={plate}
        alt=""
        className={className}
        style={{ objectFit: "cover", background: "#030712" }}
      />
    );
  }

  return (
    <video
      {...props}
      ref={setRefs}
      className={className}
      data-tactile-film=""
      src={activeSrc}
      poster={plate}
      loop={loop}
      muted={muted}
      playsInline={playsInline}
      preload={preload}
      onTimeUpdate={handleTimeUpdate}
      onEnded={onEnded}
      onError={handleError}
    />
  );
});
