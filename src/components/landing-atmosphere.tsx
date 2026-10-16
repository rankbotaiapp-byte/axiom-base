import { useEffect, useRef } from "react";

/** Structural grid and glow orbs under the landing sections. Scroll-linked, pointer-inert. */
export function LandingAtmosphere() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0;
    let listening = false;

    const clear = () => {
      el.style.removeProperty("--parallax-y");
      el.style.removeProperty("--orb-y");
      el.style.removeProperty("--orb-y-2");
    };

    const tick = () => {
      raf = 0;
      const parent = el.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const view = window.innerHeight || 1;
      const progress = (view - rect.top) / (view + rect.height);
      const y = (progress - 0.5) * 36;
      el.style.setProperty("--parallax-y", `${y.toFixed(2)}px`);
      el.style.setProperty("--orb-y", `${(y * 1.45).toFixed(2)}px`);
      el.style.setProperty("--orb-y-2", `${(y * -1.15).toFixed(2)}px`);
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(tick);
    };

    const stopListen = () => {
      if (!listening) return;
      listening = false;
      cancelAnimationFrame(raf);
      raf = 0;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      clear();
    };

    const startListen = () => {
      if (listening) return;
      listening = true;
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll, { passive: true });
      onScroll();
    };

    const sync = () => {
      if (reduce.matches) stopListen();
      else startListen();
    };

    sync();
    reduce.addEventListener("change", sync);
    return () => {
      stopListen();
      reduce.removeEventListener("change", sync);
    };
  }, []);

  return (
    <div ref={ref} className="landing-veil" aria-hidden>
      <div className="landing-grid" />
      <div className="landing-orb is-accent" />
      <div className="landing-orb is-copper" />
      <div className="landing-orb is-emerald" />
    </div>
  );
}
