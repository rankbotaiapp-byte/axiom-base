import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  type MutableRefObject,
  type Ref,
  type SyntheticEvent,
  type VideoHTMLAttributes,
} from "react";
import { applyLoopTailTrim } from "@/lib/axiom/loop-trim";

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
    loop = true,
    trimTail = true,
    releaseOnUnmount = true,
    preload = "metadata",
    playsInline = true,
    muted = true,
    ...props
  },
  ref,
) {
  const localRef = useRef<HTMLVideoElement | null>(null);

  const setRefs = useCallback(
    (node: HTMLVideoElement | null) => {
      localRef.current = node;
      assignRef(ref, node);
    },
    [ref],
  );

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

  return (
    <video
      ref={setRefs}
      loop={loop}
      muted={muted}
      playsInline={playsInline}
      preload={preload}
      onTimeUpdate={handleTimeUpdate}
      onEnded={onEnded}
      {...props}
    />
  );
});
