"use client";

import { useEffect, useMemo, useRef, type CSSProperties } from "react";
import "./HeroLoop.css";

export type HeroLoopConfig = {
  videoSrc: string;
  poster: string;
  businessName: string;
  phone: string;
  tagline?: string;
  headline?: string;
  subhead?: string;
  primaryCta?: { label: string; href?: string };
  secondaryCta?: { label: string; href: string };
  logoSrc?: string;
  bg?: string;
  zoom?: number;
  focusX?: number;
  cropBottom?: number;
  reflectRows?: number;
  topOffset?: number;
  /** Billboard copy over the shop sign. Empty / false hides the overlay. */
  billboardText?: string | false;
  showBillboard?: boolean;
  /** Van-side callout. Empty / false hides it. Defaults to formatted phone. */
  vanCallout?: string | false;
  vanPhone?: string | false;
  showVanCallout?: boolean;
};

export const plumbingHeroDefaults: Omit<HeroLoopConfig, "businessName" | "phone"> = {
  videoSrc: "/media/hero-loop.mp4",
  poster: "/media/hero-poster.jpg",
  tagline: "24/7 Plumbing & Heating",
  headline: "Leak? No hot water? We're on the way.",
  subhead: "Repairs, drains and water heaters. Book online in 60 seconds or call for a live dispatcher.",
  primaryCta: { label: "Emergency? Call now" },
  secondaryCta: { label: "Book a service", href: "#book" },
  bg: "#050507",
  zoom: 1.14,
  focusX: 0.4,
  cropBottom: 0.95,
  reflectRows: 0.12,
  topOffset: 40,
  showBillboard: true,
  showVanCallout: true,
};

export function mergePlumbingHero(
  tenant: { name?: string; business?: string; phone?: string; hero?: Partial<HeroLoopConfig> | null },
  extras?: Partial<HeroLoopConfig>,
): HeroLoopConfig {
  const businessName = (extras?.businessName || tenant.name || tenant.business || "Your Plumbing Co.").trim();
  const phone = (extras?.phone || tenant.phone || "").trim();
  return {
    ...plumbingHeroDefaults,
    ...extras,
    ...tenant.hero,
    businessName: tenant.hero?.businessName || extras?.businessName || businessName,
    phone: tenant.hero?.phone || extras?.phone || phone,
  };
}

function overlayOn(value: string | false | undefined, enabled: boolean | undefined): boolean {
  if (enabled === false) return false;
  if (value === false) return false;
  return true;
}

function overlayCopy(value: string | false | undefined, fallback: string): string {
  if (value === false) return "";
  const text = (value ?? fallback).trim();
  return text;
}

function looksLikePhone(value: string): boolean {
  return value.replace(/[^\d]/g, "").length >= 10;
}

function billboardSize(name: string): string {
  const n = name.length;
  if (n > 28) return "clamp(9px, 1.6vw, 13px)";
  if (n > 18) return "clamp(11px, 2vw, 16px)";
  return "clamp(13px, 2.6vw, 22px)";
}

export default function HeroLoop(props: HeroLoopConfig) {
  const c = { ...plumbingHeroDefaults, ...props };
  const bg = c.bg!;
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rootRef = useRef<HTMLElement>(null);
  const tel = `tel:${c.phone.replace(/[^\d+]/g, "")}`;

  const billboard = overlayCopy(c.billboardText, c.businessName);
  const showBillboard = overlayOn(c.billboardText, c.showBillboard) && billboard.length > 0;
  const vanText = overlayCopy(c.vanCallout ?? c.vanPhone, c.phone);
  const showVan = overlayOn(c.vanCallout ?? c.vanPhone, c.showVanCallout) && vanText.length > 0;
  const vanHref = looksLikePhone(vanText) ? `tel:${vanText.replace(/[^\d+]/g, "")}` : undefined;

  const zoom = c.zoom!;
  const focusX = c.focusX!;
  const cropBottom = c.cropBottom!;
  const reflectRows = c.reflectRows!;
  const topOffset = c.topOffset!;

  useEffect(() => {
    const v = videoRef.current;
    const cv = canvasRef.current;
    const root = rootRef.current;
    if (!v || !cv || !root) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let ratio = 1;
    let alive = true;

    const size = () => {
      ratio = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(cv.clientWidth * ratio);
      cv.height = Math.round(cv.clientHeight * ratio);
    };
    const ro = new ResizeObserver(size);
    ro.observe(cv);

    const draw = () => {
      const vw = v.videoWidth;
      const vh = v.videoHeight;
      const W = cv.width;
      const H = cv.height;
      if (!vw || !W || !H) return;
      const dw = W * zoom;
      const dx = -(dw - W) * focusX;
      const cropB = vh * cropBottom;
      const bh = cropB * (dw / vw);
      const Y0 = topOffset * ratio;
      const seam = Y0 + bh;
      const G = H - seam;

      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
      ctx.drawImage(v, 0, 0, vw, cropB, dx, Y0, dw, bh);
      if (G <= 0) return;

      const S = vh * reflectRows;
      const N = Math.ceil(G / (4 * ratio));
      const f = (t: number) => S * (1 - Math.pow(1 - t, 1.7));
      ctx.save();
      ctx.scale(1, -1);
      for (let i = 0; i < N; i++) {
        const t0 = i / N;
        const t1 = (i + 1) / N;
        const y0 = seam + G * t0;
        const y1 = seam + G * t1 + 1;
        const sA = cropB - f(t0);
        const sB = cropB - f(t1);
        ctx.drawImage(v, 0, sB, vw, Math.max(sA - sB, 0.5), dx, -y1, dw, y1 - y0);
      }
      ctx.restore();

      const g = ctx.createLinearGradient(0, seam - 6 * ratio, 0, H);
      g.addColorStop(0, "rgba(5,5,7,0)");
      g.addColorStop(0.04, "rgba(5,5,7,.18)");
      g.addColorStop(1, "rgba(5,5,7,.6)");
      ctx.fillStyle = g;
      ctx.fillRect(0, seam - 6 * ratio, W, H);
    };

    const loop = () => {
      if (!alive) return;
      if (cv.offsetParent !== null) draw();
      raf = requestAnimationFrame(loop);
    };

    if (reduce) {
      v.pause();
      v.addEventListener("loadeddata", draw, { once: true });
    } else {
      void v.play().catch(() => undefined);
      raf = requestAnimationFrame(loop);
    }

    const io = new IntersectionObserver(([entry]) => {
      if (reduce) return;
      if (entry?.isIntersecting) {
        void v.play().catch(() => undefined);
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(loop);
      } else {
        v.pause();
        cancelAnimationFrame(raf);
      }
    });
    io.observe(root);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [bg, zoom, focusX, cropBottom, reflectRows, topOffset]);

  const billboardStyle = useMemo(
    () => ({ fontSize: billboardSize(billboard) }) as CSSProperties,
    [billboard],
  );

  return (
    <section ref={rootRef} className="hl" style={{ ["--hl-bg"]: bg } as CSSProperties}>
      <canvas ref={canvasRef} className="hl-cv" aria-hidden="true" />
      <div className="hl-media" aria-hidden="true">
        <video
          ref={videoRef}
          src={c.videoSrc}
          poster={c.poster}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          disablePictureInPicture
        />
      </div>
      <div className="hl-shade" />

      {showBillboard ? (
        <div className="hl-billboard" aria-hidden="true" style={billboardStyle}>
          <span>{billboard}</span>
        </div>
      ) : null}

      {showVan ? (
        vanHref ? (
          <a className="hl-van" href={vanHref} aria-label={`Call ${c.businessName} at ${vanText}`}>
            {vanText}
          </a>
        ) : (
          <div className="hl-van" aria-hidden="true">
            {vanText}
          </div>
        )
      ) : null}

      <header className="hl-hdr">
        {c.logoSrc ? <img className="hl-logo" src={c.logoSrc} alt="" /> : null}
        <span className="hl-brand">{c.businessName}</span>
        {c.phone ? (
          <a className="hl-ph" href={tel} aria-label={`Call ${c.businessName}`}>
            <PhoneIcon />
          </a>
        ) : null}
      </header>

      <div className="hl-copy">
        {c.tagline ? <div className="hl-tag">{c.tagline}</div> : null}
        <h1 className="hl-h1">{c.headline}</h1>
        {c.subhead ? <p className="hl-sub">{c.subhead}</p> : null}
        <div className="hl-ctas">
          <a className="hl-cta hl-cta--primary" href={c.primaryCta?.href ?? tel}>
            <PhoneIcon /> {c.primaryCta?.label}
          </a>
          {c.secondaryCta ? (
            <a className="hl-cta hl-cta--secondary" href={c.secondaryCta.href}>
              <CalIcon /> {c.secondaryCta.label}
            </a>
          ) : null}
        </div>
      </div>

      <nav className="hl-dock">
        <a className="hl-dock-a" href={tel}>
          Call
        </a>
        <a className="hl-dock-b" href={c.secondaryCta?.href ?? "#book"}>
          Book
        </a>
      </nav>
    </section>
  );
}

const PhoneIcon = () => (
  <svg className="hl-i" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />
  </svg>
);
const CalIcon = () => (
  <svg className="hl-i" viewBox="0 0 24 24" aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18M9 16l2 2 4-4" />
  </svg>
);
