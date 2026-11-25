"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

type Slide = {
  id: string;
  tab: string;
  kicker: string;
  title: string;
  pitch: string;
  features: string[];
  accent: string;
  host: string;
  cta: string;
  href: string;
};

const SLIDES: Slide[] = [
  {
    id: "sandbox",
    tab: "Try the Studio",
    kicker: "Live grade",
    title: "Touch the studio.",
    pitch: "Drop a job photo. Grade it in the browser. Nothing uploads until you say so.",
    features: ["Stays on this device", "Five color grades", "Strength you can feel"],
    accent: "#06b6d4",
    host: "studio.axiom.app/sandbox",
    cta: "Build mine",
    href: "/axiom/studio",
  },
  {
    id: "rogue-river",
    tab: "Rogue River",
    kicker: "Guides",
    title: "The boat is already held.",
    pitch: "Trip picker, dawn slots, and a text to the guide before the truck is loaded.",
    features: ["Dawn and dusk windows", "Boat hold", "Guide SMS"],
    accent: "#34d399",
    host: "rogueriverguides.axiom.app",
    cta: "Get this for my business",
    href: "/demo/water-systems",
  },
  {
    id: "ocean-shark",
    tab: "Ocean & Shark",
    kicker: "Depth",
    title: "One tap, and the reef answers.",
    pitch: "Cursor-reactive water, a depth dial, and a reservation that does not wait on a voicemail.",
    features: ["Depth dial", "Live plate", "One-tap reserve"],
    accent: "#38bdf8",
    host: "oceanandshark.axiom.app",
    cta: "Get this for my business",
    href: "/demo/water-systems",
  },
  {
    id: "leopard",
    tab: "Leopard",
    kicker: "Expedition",
    title: "Build the hunt before you fly.",
    pitch: "Tier, add-ons, and an expedition ID. The film keeps rolling while the quote locks.",
    features: ["Tier configurator", "Add-ons", "Expedition ID"],
    accent: "#D4AF37",
    host: "leopardadventures.axiom.app",
    cta: "Get this for my business",
    href: "/demo/bow-tech",
  },
  {
    id: "cyber-tactical",
    tab: "Cyber Tactical",
    kicker: "Range",
    title: "Book the fitting. Skip the counter.",
    pitch: "Gear grid, a range slot, and a plate that shifts cyan to magenta as you spec the kit.",
    features: ["Gear grid", "Range fitting", "Live color grade"],
    accent: "#ff2bd6",
    host: "cybertactical.axiom.app",
    cta: "Book a range fitting",
    href: "/demo/security",
  },
];

const GRADES = [
  { id: "raw", label: "Raw", filter: "none" },
  { id: "cyan", label: "Cyan", filter: "saturate(1.25) contrast(1.08) hue-rotate(12deg)" },
  { id: "copper", label: "Copper", filter: "sepia(0.55) saturate(1.35) contrast(1.06)" },
  { id: "night", label: "Night", filter: "brightness(0.7) contrast(1.22) saturate(0.75)" },
  { id: "foil", label: "Foil", filter: "saturate(1.55) contrast(1.12) hue-rotate(-16deg)" },
] as const;

const PRESETS = [
  { src: "/media/heroes/contractor.jpg", label: "Contractor" },
  { src: "/media/heroes/roofing.jpg", label: "Roofing" },
  { src: "/media/axio-plumber-hero.jpg", label: "River trip" },
];

export function ProofOfWorkStage() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [motionReady, setMotionReady] = useState(false);
  const [dragX, setDragX] = useState<number | null>(null);
  const slide = SLIDES[index] ?? SLIDES[0];

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "start 0.28"],
  });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["14%", "0%"]);
  const opacity = useTransform(scrollYProgress, [0, 1], [0.15, 1]);

  useEffect(() => {
    setMotionReady(true);
  }, []);

  const go = (next: number) => {
    const count = SLIDES.length;
    setIndex(((next % count) + count) % count);
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    setDragX(event.clientX);
  };
  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragX == null) return;
    const delta = event.clientX - dragX;
    if (delta <= -60) go(index + 1);
    else if (delta >= 60) go(index - 1);
    setDragX(null);
  };

  return (
    <section
      ref={sectionRef}
      id="proof"
      aria-roledescription="carousel"
      aria-label="Axiom studio and live niche proof of work"
      className="relative z-30 overflow-hidden px-4 py-20 sm:px-8 sm:py-28"
      style={{ background: "#050507", color: "#f4f4f5" }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-24"
        style={{ background: "linear-gradient(to bottom, #050507, transparent)" }}
        aria-hidden
      />
      <motion.div style={motionReady ? { y, opacity } : undefined} className="relative mx-auto max-w-6xl">
        <p className="font-mono text-[11px] tracking-[0.32em] text-[#00f2fe]">TRY IT LIVE · PROOF OF WORK</p>
        <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">Touch the studio. Then see what it built.</h2>

        <div
          className="mt-8 flex gap-2 overflow-x-auto pb-1"
          role="tablist"
          aria-label="Proof slides"
          onKeyDown={(event) => {
            if (event.key === "ArrowRight") {
              event.preventDefault();
              go(index + 1);
            } else if (event.key === "ArrowLeft") {
              event.preventDefault();
              go(index - 1);
            }
          }}
        >
          {SLIDES.map((item, i) => {
            const active = i === index;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                tabIndex={active ? 0 : -1}
                onClick={() => go(i)}
                className="shrink-0 cursor-pointer rounded-full px-3.5 py-2 font-mono text-[11px] tracking-[0.14em]"
                style={{
                  color: active ? "#041016" : item.accent,
                  background: active ? item.accent : "transparent",
                  boxShadow: active ? `0 0 24px ${item.accent}55` : undefined,
                }}
              >
                {item.tab}
              </button>
            );
          })}
        </div>

        <div
          className="mt-6 grid items-stretch gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => setDragX(null)}
        >
          <div className="relative min-h-[420px] overflow-hidden rounded-[1.6rem]" style={{ background: "#07080c" }}>
            <div
              className="pointer-events-none absolute inset-0"
              style={{ background: `radial-gradient(60% 50% at 50% 40%, ${slide.accent}22, transparent 70%)` }}
              aria-hidden
            />
            <div className="relative h-full p-4 sm:p-6">
              {slide.id === "sandbox" && <SandboxStage accent={slide.accent} />}
              {slide.id === "rogue-river" && <RiverStage accent={slide.accent} />}
              {slide.id === "ocean-shark" && <OceanStage accent={slide.accent} />}
              {slide.id === "leopard" && <LeopardStage accent={slide.accent} />}
              {slide.id === "cyber-tactical" && <TacticalStage accent={slide.accent} />}
            </div>
          </div>

          <div className="flex flex-col justify-between gap-6 py-2">
            <div>
              <p className="font-mono text-[11px] tracking-[0.28em]" style={{ color: slide.accent }}>
                {slide.kicker}
              </p>
              <h3 className="mt-3 text-3xl font-semibold tracking-tight">{slide.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400 sm:text-base">{slide.pitch}</p>
              <ul className="mt-5 space-y-2 text-sm">
                {slide.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: slide.accent, boxShadow: `0 0 10px ${slide.accent}` }} />
                    {feature}
                  </li>
                ))}
              </ul>
              <p className="mt-5 font-mono text-[11px] text-zinc-500">{slide.host}</p>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex gap-2">
                <button type="button" onClick={() => go(index - 1)} className="cursor-pointer rounded-full px-3 py-2 text-sm text-zinc-300" aria-label="Previous slide">
                  ←
                </button>
                <button type="button" onClick={() => go(index + 1)} className="cursor-pointer rounded-full px-3 py-2 text-sm text-zinc-300" aria-label="Next slide">
                  →
                </button>
              </div>
              <a
                href={slide.href}
                className="rounded-xl px-4 py-3 text-sm font-semibold text-black"
                style={{ background: slide.accent, boxShadow: `0 12px 40px -16px ${slide.accent}` }}
              >
                {slide.cta}
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function SandboxStage({ accent }: { accent: string }) {
  const [src, setSrc] = useState(PRESETS[0].src);
  const [grade, setGrade] = useState<(typeof GRADES)[number]["id"]>("cyan");
  const [strength, setStrength] = useState(0.72);
  const active = GRADES.find((item) => item.id === grade) ?? GRADES[0];
  const filter = active.filter === "none" ? `contrast(${1 + strength * 0.08})` : `${active.filter} contrast(${0.9 + strength * 0.2})`;

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="relative min-h-[240px] flex-1 overflow-hidden rounded-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ filter }} />
        <p className="absolute bottom-3 left-3 font-mono text-[11px] tracking-[0.16em] text-white">Booked while you work.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => setSrc(preset.src)}
            className="cursor-pointer rounded-full px-3 py-1.5 font-mono text-[10px] tracking-[0.14em]"
            style={{ color: src === preset.src ? "#041016" : accent, background: src === preset.src ? accent : "transparent" }}
          >
            {preset.label}
          </button>
        ))}
        <label className="cursor-pointer rounded-full px-3 py-1.5 font-mono text-[10px] tracking-[0.14em]" style={{ color: accent }}>
          Upload
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              setSrc(URL.createObjectURL(file));
            }}
          />
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        {GRADES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setGrade(item.id)}
            className="cursor-pointer rounded-full px-2.5 py-1 font-mono text-[10px]"
            style={{ color: grade === item.id ? "#041016" : "#d4d4d8", background: grade === item.id ? accent : "#ffffff10" }}
          >
            {item.label}
          </button>
        ))}
      </div>
      <label className="font-mono text-[10px] tracking-[0.16em] text-zinc-400">
        STRENGTH
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={strength}
          onChange={(event) => setStrength(Number(event.target.value))}
          className="mt-2 block w-full accent-[#00f2fe]"
        />
      </label>
    </div>
  );
}

function RiverStage({ accent }: { accent: string }) {
  const trips = ["Dawn drift · 5:30", "Hopper run · 9:00", "Last light · 6:15"];
  const [trip, setTrip] = useState(trips[0]);
  const [held, setHeld] = useState(false);
  return (
    <div className="flex h-full flex-col gap-4">
      <div className="relative min-h-[220px] flex-1 overflow-hidden rounded-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/media/axio-plumber-hero.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
      </div>
      <div className="grid gap-2">
        {trips.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              setTrip(item);
              setHeld(false);
            }}
            className="cursor-pointer rounded-xl px-3 py-2 text-left text-sm"
            style={{
              color: trip === item ? "#041016" : "#e4e4e7",
              background: trip === item ? accent : "#ffffff0d",
            }}
          >
            {item}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setHeld(true)}
        className="cursor-pointer rounded-xl px-4 py-3 text-sm font-semibold"
        style={{ background: held ? "#ffffff14" : accent, color: held ? accent : "#041016" }}
      >
        {held ? `Guide texted · ${trip}` : "Hold the boat"}
      </button>
    </div>
  );
}

function OceanStage({ accent }: { accent: string }) {
  const [depth, setDepth] = useState(36);
  const [reserved, setReserved] = useState(false);
  return (
    <div className="flex h-full flex-col gap-4">
      <div className="relative min-h-[240px] flex-1 overflow-hidden rounded-2xl bg-black">
        <video
          src="/media/axio-plumber-hero.mp4"
          poster="/media/hero-poster.jpg"
          muted
          loop
          playsInline
          autoPlay
          className="absolute inset-0 h-full w-full object-cover"
          style={{ transform: `scale(${1.05 + depth / 400}) translateY(${depth / 18}px)`, filter: `saturate(${0.7 + depth / 180})` }}
        />
        <p className="absolute left-3 top-3 font-mono text-[11px] tracking-[0.18em]" style={{ color: accent }}>
          DEPTH {depth}m
        </p>
      </div>
      <label className="font-mono text-[10px] tracking-[0.16em] text-zinc-400">
        DEPTH
        <input
          type="range"
          min={8}
          max={90}
          value={depth}
          onChange={(event) => setDepth(Number(event.target.value))}
          className="mt-2 block w-full"
          style={{ accentColor: accent }}
        />
      </label>
      <button
        type="button"
        onClick={() => setReserved(true)}
        className="cursor-pointer rounded-xl px-4 py-3 text-sm font-semibold"
        style={{ background: reserved ? "#ffffff14" : accent, color: reserved ? accent : "#041016" }}
      >
        {reserved ? "Reservation held" : "Reserve this depth"}
      </button>
    </div>
  );
}

function LeopardStage({ accent }: { accent: string }) {
  const tiers = ["Ridge", "Basin", "Full traverse"];
  const addons = ["Spotter", "Camp", "Transfer"];
  const [tier, setTier] = useState(tiers[1]);
  const [picked, setPicked] = useState<string[]>(["Spotter"]);
  const code = `LX-${tier.slice(0, 3).toUpperCase()}-${picked.length + 4}7`;
  return (
    <div className="flex h-full flex-col gap-4">
      <video
        src="/media/infrastructure-hero-animation.mp4"
        poster="/media/heroes/contractor.jpg"
        muted
        loop
        playsInline
        autoPlay
        className="h-48 w-full rounded-2xl object-cover"
      />
      <div className="flex flex-wrap gap-2">
        {tiers.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTier(item)}
            className="cursor-pointer rounded-full px-3 py-1.5 text-xs"
            style={{ background: tier === item ? accent : "#ffffff10", color: tier === item ? "#1a1404" : "#e4e4e7" }}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {addons.map((item) => {
          const on = picked.includes(item);
          return (
            <button
              key={item}
              type="button"
              onClick={() => setPicked((current) => (on ? current.filter((entry) => entry !== item) : [...current, item]))}
              className="cursor-pointer rounded-full px-3 py-1.5 text-xs"
              style={{ color: on ? accent : "#a1a1aa", boxShadow: on ? `inset 0 0 0 1px ${accent}` : "inset 0 0 0 1px #ffffff22" }}
            >
              {item}
            </button>
          );
        })}
      </div>
      <p className="font-mono text-[11px] tracking-[0.2em]" style={{ color: accent }}>
        {code}
      </p>
    </div>
  );
}

function TacticalStage({ accent }: { accent: string }) {
  const gear = ["Plate", "Comms", "Optic", "Light"];
  const [kit, setKit] = useState<string[]>(["Plate", "Comms"]);
  const [booked, setBooked] = useState(false);
  const hue = 18 + kit.length * 22;
  return (
    <div className="flex h-full flex-col gap-4">
      <div className="relative min-h-[220px] flex-1 overflow-hidden rounded-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/media/hero-poster.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{ filter: `saturate(1.3) contrast(1.08) hue-rotate(${hue}deg)` }}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {gear.map((item) => {
          const on = kit.includes(item);
          return (
            <button
              key={item}
              type="button"
              onClick={() => setKit((current) => (on ? current.filter((entry) => entry !== item) : [...current, item]))}
              className="cursor-pointer rounded-xl px-3 py-3 text-sm"
              style={{ color: on ? "#1a0410" : "#f4f4f5", background: on ? accent : "#ffffff0d" }}
            >
              {item}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => setBooked(true)}
        className="cursor-pointer rounded-xl px-4 py-3 text-sm font-semibold"
        style={{ background: booked ? "#ffffff14" : accent, color: booked ? accent : "#1a0410" }}
      >
        {booked ? "Fitting booked ✓" : "Book a range fitting"}
      </button>
    </div>
  );
}
