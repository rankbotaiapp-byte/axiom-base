import { useEffect } from "react";

type Body = {
  el: HTMLElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
};

function readNum(root: HTMLElement, name: string, fallback: number) {
  const n = Number.parseFloat(getComputedStyle(root).getPropertyValue(name));
  return Number.isFinite(n) ? n : fallback;
}

function smoothstep(unit: number) {
  const t = Math.min(1, Math.max(0, unit));
  return t * t * (3 - 2 * t);
}

/**
 * One rAF on the storefront stage. The focal point follows the pointer over
 * the hero. When the pointer leaves, the same spring that moves the type
 * eases the picture back onto a slow drift. Nearby nav, the headline, and
 * glass cards spring aside inside a clamped radius. Reduced motion never
 * starts the loop.
 */
export function HeroSpatial({ rootRef }: { rootRef: { readonly current: HTMLElement | null } }) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) return;

    let bodies: Body[] = [];
    let raf = 0;
    let dead = false;
    let last = performance.now();
    let frame = 0;
    let pointer: { x: number; y: number } | null = null;
    let gazeX = 0.5;
    let gazeY = 0.46;
    let gazeVx = 0;
    let gazeVy = 0;

    const onPointer = (event: PointerEvent) => {
      pointer = { x: event.clientX, y: event.clientY };
    };
    const onLeave = () => {
      pointer = null;
    };

    const collect = () => {
      const next = [...root.querySelectorAll<HTMLElement>("[data-spatial]")].slice(0, 8);
      bodies = next.map((el) => bodies.find((body) => body.el === el) ?? { el, x: 0, y: 0, vx: 0, vy: 0 });
    };

    const clearMotion = () => {
      root.style.removeProperty("--focal-x");
      root.style.removeProperty("--focal-y");
      const subject = root.querySelector<HTMLElement>(".hero-subject");
      if (subject) {
        subject.style.transform = "";
        subject.style.removeProperty("--approach");
      }
      for (const body of bodies) body.el.style.transform = "";
    };

    const heroOnScreen = () => {
      const hero = root.querySelector("section");
      const box = (hero ?? root).getBoundingClientRect();
      return box.bottom > -80 && box.top < window.innerHeight + 80;
    };

    const tick = (now: number) => {
      if (dead) return;
      raf = 0;
      if (document.visibilityState !== "visible" || !heroOnScreen()) return;
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      frame += 1;
      if (frame % 45 === 1) collect();

      const t = now * 0.00011;
      const approach = smoothstep(Math.sin(t * 0.62) * 0.5 + 0.5);
      const driftX = 0.5 + Math.sin(t) * 0.14 + Math.sin(t * 0.37) * 0.035;
      const driftY = 0.46 + Math.cos(t * 0.7) * 0.06 - approach * 0.035;
      const hero = root.querySelector("section");
      const box = (hero ?? root).getBoundingClientRect();
      const depth = Math.min(1.5, Math.max(0, readNum(root, "--depth-feather", 0.7)));
      const radius = Math.min(320, Math.max(40, readNum(root, "--prox", 140)));
      const force = Math.min(36, Math.max(0, readNum(root, "--displace", 16)));
      const damp = Math.min(22, Math.max(2, readNum(root, "--spring-damp", 10)));
      const push = 0.35 + 0.65 * depth;
      const omega = 5.5 + force * 0.08;
      const cap = Math.min(22, force);
      let inside = false;
      let goalX = driftX;
      let goalY = driftY;
      if (pointer && box.width > 0 && box.height > 0) {
        inside =
          pointer.x >= box.left && pointer.x <= box.right && pointer.y >= box.top && pointer.y <= box.bottom;
        if (inside) {
          goalX = Math.min(1, Math.max(0, (pointer.x - box.left) / box.width));
          goalY = Math.min(1, Math.max(0, (pointer.y - box.top) / box.height));
        }
      }
      if (inside) {
        gazeX = goalX;
        gazeY = goalY;
        gazeVx = 0;
        gazeVy = 0;
      } else {
        const ax = (goalX - gazeX) * omega * omega - gazeVx * damp * 1.35;
        const ay = (goalY - gazeY) * omega * omega - gazeVy * damp * 1.35;
        gazeVx += ax * dt;
        gazeVy += ay * dt;
        gazeX += gazeVx * dt;
        gazeY += gazeVy * dt;
      }
      const fx = gazeX;
      const fy = gazeY;
      const stage = root.getBoundingClientRect();
      const focalX = box.left + fx * box.width;
      const focalY = box.top + fy * box.height;

      root.style.setProperty("--focal-x", `${focalX - stage.left}px`);
      root.style.setProperty("--focal-y", `${focalY - stage.top}px`);

      const subject = root.querySelector<HTMLElement>(".hero-subject");
      if (subject) {
        const slide = Math.min(22, force);
        const sx = (fx - 0.5) * 2 * slide;
        const sy = (fy - 0.46) * slide;
        const z = approach * slide * 1.6;
        const scale = 1 + approach * 0.03 * push;
        subject.style.setProperty("--approach", approach.toFixed(3));
        subject.style.transform = `translate3d(${sx.toFixed(2)}px, ${sy.toFixed(2)}px, ${z.toFixed(2)}px) scale(${scale.toFixed(4)})`;
      }

      const viewLeft = 8;
      const viewTop = 8;
      const viewRight = window.innerWidth - 8;
      const viewBottom = window.innerHeight - 8;

      for (const body of bodies) {
        const rect = body.el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2 - body.x;
        const cy = rect.top + rect.height / 2 - body.y;
        const dx = cx - focalX;
        const dy = cy - focalY;
        const dist = Math.hypot(dx, dy) || 1;
        const layer = body.el.dataset.spatial;
        const bias = layer === "headline" ? 1 : layer === "nav" ? 0.55 : 0.28;
        let tx = (0.5 - fx) * 10 * bias * push;
        let ty = (0.46 - fy) * 6 * bias * push;
        if (dist < radius) {
          const fall = (1 - dist / radius) * force * (0.28 + depth * 0.45) * bias;
          tx += (dx / dist) * fall;
          ty += (dy / dist) * fall;
        }
        const mag = Math.hypot(tx, ty);
        if (mag > cap && mag > 0) {
          tx *= cap / mag;
          ty *= cap / mag;
        }

        const baseLeft = rect.left - body.x;
        const baseTop = rect.top - body.y;
        const onScreen = rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth;
        if (onScreen) {
          const minTx = viewLeft - baseLeft;
          const maxTx = viewRight - (baseLeft + rect.width);
          const minTy = viewTop - baseTop;
          const maxTy = viewBottom - (baseTop + rect.height);
          if (minTx <= maxTx) tx = Math.min(maxTx, Math.max(minTx, tx));
          if (minTy <= maxTy) ty = Math.min(maxTy, Math.max(minTy, ty));
        }

        const ax = (tx - body.x) * omega * omega - body.vx * damp * 1.35;
        const ay = (ty - body.y) * omega * omega - body.vy * damp * 1.35;
        body.vx += ax * dt;
        body.vy += ay * dt;
        const speed = Math.hypot(body.vx, body.vy);
        if (speed > 160) {
          body.vx *= 160 / speed;
          body.vy *= 160 / speed;
        }
        body.x += body.vx * dt;
        body.y += body.vy * dt;
        body.el.style.transform = `translate3d(${body.x.toFixed(2)}px, ${body.y.toFixed(2)}px, 0)`;
      }

      if (heroOnScreen()) raf = requestAnimationFrame(tick);
    };

    const resume = () => {
      if (dead || reduced.matches || raf) return;
      if (document.visibilityState !== "visible" || !heroOnScreen()) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };

    const onVisibility = () => {
      if (document.visibilityState !== "visible") {
        cancelAnimationFrame(raf);
        raf = 0;
        return;
      }
      resume();
    };

    const onPageHide = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const onReduce = () => {
      if (!reduced.matches) return;
      dead = true;
      cancelAnimationFrame(raf);
      raf = 0;
      clearMotion();
    };

    collect();
    root.addEventListener("pointermove", onPointer);
    root.addEventListener("pointerleave", onLeave);
    root.addEventListener("mouseleave", onLeave);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("pageshow", resume);
    window.addEventListener("scroll", resume, { passive: true });
    reduced.addEventListener("change", onReduce);
    raf = requestAnimationFrame(tick);

    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      root.removeEventListener("pointermove", onPointer);
      root.removeEventListener("pointerleave", onLeave);
      root.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("pageshow", resume);
      window.removeEventListener("scroll", resume);
      reduced.removeEventListener("change", onReduce);
      clearMotion();
    };
  }, [rootRef]);

  return null;
}
