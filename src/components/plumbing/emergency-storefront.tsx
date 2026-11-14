import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useMotionTemplate, useScroll, useTransform } from "framer-motion";
import {
  BadgeCheck,
  ChevronDown,
  Clock,
  DollarSign,
  Droplets,
  Flame,
  MessageSquareText,
  Phone,
  PhoneMissed,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  Wrench,
  X,
} from "lucide-react";
import { dialNumber, type PlumbingStorefront, type TrustIcon } from "@/lib/axiom/plumbing-storefront";
import { CompetitorLandGrabStack } from "@/components/competitor-land-grab-stack";
import { GeoSocialProofStack } from "@/components/geo-social-proof-stack";
import { FxButton } from "./fx-button";
import { MissedCallSim, type MissedCallSimHandle } from "./missed-call-sim";
import { RoiCalculator } from "./roi-calculator";

const BADGE_ICONS: Record<TrustIcon, ReactNode> = {
  shield: <ShieldCheck size={15} />,
  clock: <Clock size={15} />,
  badge: <BadgeCheck size={15} />,
  dollar: <DollarSign size={15} />,
  star: <Star size={15} />,
  truck: <Truck size={15} />,
};

const SERVICE_ICONS = [<Droplets key="d" size={20} />, <Wrench key="w" size={20} />, <Flame key="f" size={20} />];

/* ------------------------------------------------------------------ hero film */

function useFilmPolicy() {
  // Decided on the client: SSR always renders the poster, the film joins after hydration.
  const [policy, setPolicy] = useState<{ play: boolean; mobile: boolean } | null>(null);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    setPolicy({ play: !reduce && !conn?.saveData, mobile: window.matchMedia("(max-width: 768px)").matches });
  }, []);
  return policy;
}

function HeroFilm({ config }: { config: PlumbingStorefront }) {
  const stage = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const policy = useFilmPolicy();
  const [ready, setReady] = useState(false);
  const [broken, setBroken] = useState(false);
  const { scrollYProgress } = useScroll({ target: stage, offset: ["start start", "end start"] });
  const opacity = useTransform(scrollYProgress, [0, 0.85], [1, 0.12]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const blurPx = useTransform(scrollYProgress, [0.2, 1], [0, 10]);
  const filter = useMotionTemplate`blur(${blurPx}px) saturate(1.08) contrast(1.06)`;

  const src = "/media/axio-plumber-hero.mp4";

  // Stop decoding when the hero is off screen or the tab is hidden; resume on return.
  useEffect(() => {
    const el = video.current;
    const host = stage.current;
    if (!el || !host || !policy?.play) return;
    let visible = true;
    const sync = () => {
      if (visible && document.visibilityState === "visible") void el.play().catch(() => undefined);
      else el.pause();
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && entry.intersectionRatio > 0.04;
      sync();
    }, { threshold: [0, 0.04, 0.2] });
    io.observe(host);
    document.addEventListener("visibilitychange", sync);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [policy?.play, src]);

  const grade = config.hero.grade / 100;

  return (
    <div ref={stage} className="pl-film-stage" aria-hidden>
      <motion.div className="pl-film" style={{ opacity, scale, filter }}>
        <div className="pl-film-poster" style={{ backgroundImage: `url("${config.hero.posterUrl}")` }} />
        {policy?.play && !broken && (
          <video
            ref={video}
            key={src}
            className="pl-film-video h-screen w-full object-cover"
            data-ready={ready || undefined}
            src={src}
            poster={config.hero.posterUrl}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            disablePictureInPicture
            onCanPlay={() => setReady(true)}
            onError={() => setBroken(true)}
          />
        )}
      </motion.div>
      {/* Ambient grade: storm-blue wash, emergency-light bloom, vignette, floor fade into the page. */}
      <div className="pl-grade" style={{ "--grade": grade } as React.CSSProperties} />
      <div className="pl-scanlines" />
    </div>
  );
}

/* ------------------------------------------------------------- social proof */

function ProofFeed({ config }: { config: PlumbingStorefront }) {
  const items = config.proof.items;
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // On phones the hero is all CTA; hold the feed until the visitor scrolls past it.
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!window.matchMedia("(max-width: 767px)").matches) {
      setArmed(true);
      return;
    }
    const check = () => {
      if (window.scrollY > window.innerHeight * 0.6) setArmed(true);
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  }, []);

  useEffect(() => {
    if (!config.proof.enabled || !items.length || dismissed || !armed) return;
    const first = window.setTimeout(() => setOpen(true), 2600);
    const cycle = window.setInterval(() => {
      setOpen(false);
      window.setTimeout(() => {
        setIndex((i) => (i + 1) % items.length);
        setOpen(true);
      }, 600);
    }, 6400);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(cycle);
    };
  }, [config.proof.enabled, items.length, dismissed, armed]);

  if (!config.proof.enabled || !items.length || dismissed) return null;
  const item = items[index % items.length];

  return (
    <div className="pl-proof-dock" aria-live="polite">
      <AnimatePresence>
        {open && item && (
          <motion.div
            key={item.id}
            className="pl-proof"
            initial={{ opacity: 0, y: 24, scale: 0.94, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -12, scale: 0.97, filter: "blur(4px)" }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
          >
            <span className="pl-proof-avatar">{item.name.slice(0, 1)}</span>
            <div className="min-w-0">
              <p className="pl-proof-line">
                <strong>{item.name}</strong>
                {item.place ? ` in ${item.place}` : ""} {item.job}
              </p>
              <p className="pl-proof-meta">
                <span className="pl-live-dot" /> {item.ago}
                {config.proof.sampleLabel ? <span className="pl-proof-sample">{config.proof.sampleLabel}</span> : null}
              </p>
            </div>
            <button type="button" className="pl-proof-close" aria-label="Hide activity" onClick={() => setDismissed(true)}>
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* --------------------------------------------------------------- the page */

const reveal = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
};

export function EmergencyPlumbingStorefront({ config, studio = false }: { config: PlumbingStorefront; studio?: boolean }) {
  const sim = useRef<MissedCallSimHandle>(null);
  const simSection = useRef<HTMLElement>(null);
  const dial = dialNumber(config);
  const tel = dial ? `tel:${dial}` : undefined;

  function testMissedCall() {
    simSection.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => sim.current?.run(), 650);
  }

  return (
    <div className="pl-root">
      {studio && <div className="pl-studio-flag">Studio preview · unsaved edits show here live</div>}

      <header className="pl-nav">
        <a href="#top" className="pl-brand">
          <span className="pl-brand-mark">
            <Wrench size={16} />
          </span>
          <span className="min-w-0">
            <span className="pl-brand-name">{config.company}</span>
            {config.city ? <span className="pl-brand-city">{config.city}</span> : null}
          </span>
        </a>
        <span className="pl-oncall">
          <span className="pl-live-dot is-red" /> Techs on call now
        </span>
        {tel ? (
          <a href={tel} className="pl-nav-phone">
            <Phone size={15} />
            <span>{config.phoneDisplay}</span>
          </a>
        ) : null}
      </header>

      <section id="top" className="pl-hero">
        <HeroFilm config={config} />
        <div className="pl-hero-copy">
          {config.hero.eyebrow ? (
            <motion.p className="pl-eyebrow" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <span className="pl-live-dot is-red" />
              {config.hero.eyebrow}
            </motion.p>
          ) : null}
          <motion.h1
            className="pl-headline"
            initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: 0.25, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            {config.hero.headline}
          </motion.h1>
          {config.hero.subhead ? (
            <motion.p className="pl-subhead" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.7 }}>
              {config.hero.subhead}
            </motion.p>
          ) : null}

          <motion.div className="pl-cta-row" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.7 }}>
            <FxButton variant="primary" href={config.ctas.trialHref} icon={<Sparkles size={16} />} successLabel="Opening your trial">
              {config.ctas.trialLabel}
            </FxButton>
            <FxButton variant="ghost" icon={<PhoneMissed size={16} />} onPress={testMissedCall}>
              {config.ctas.missedCallLabel}
            </FxButton>
            {tel ? (
              <FxButton
                variant="danger"
                glow
                href={tel}
                className="pl-hero-call"
                icon={<Phone size={16} />}
                ariaLabel={`${config.ctas.callLabel} ${config.phoneDisplay}`}
              >
                {config.ctas.callLabel}
              </FxButton>
            ) : null}
          </motion.div>

          {config.badges.length ? (
            <motion.ul className="pl-badges" initial="hide" animate="show" variants={{ show: { transition: { staggerChildren: 0.08, delayChildren: 0.8 } } }}>
              {config.badges.map((b) => (
                <motion.li key={b.id} className="pl-badge" variants={{ hide: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}>
                  {BADGE_ICONS[b.icon]}
                  {b.label}
                </motion.li>
              ))}
            </motion.ul>
          ) : null}
        </div>
        <a href="#services" className="pl-scroll-cue" aria-label="Scroll to services">
          <ChevronDown size={18} />
        </a>
      </section>

      <main className="pl-body">
        {config.services.length ? (
          <section id="services" className="pl-section">
            <motion.div {...reveal} className="pl-section-head">
              <p className="pl-kicker">What we fix tonight</p>
              <h2 className="pl-h2">Emergency work, priced before we start.</h2>
            </motion.div>
            <div className="pl-services">
              {config.services.map((s, i) => (
                <motion.article key={s.id} {...reveal} transition={{ ...reveal.transition, delay: i * 0.08 }} className="pl-service">
                  <span className="pl-service-icon">{SERVICE_ICONS[i % SERVICE_ICONS.length]}</span>
                  <h3>{s.title}</h3>
                  {s.detail ? <p>{s.detail}</p> : null}
                  {s.price ? <span className="pl-service-price">{s.price}</span> : null}
                </motion.article>
              ))}
            </div>
          </section>
        ) : null}

        <section ref={simSection} id="missed-call" className="pl-section pl-sim-section">
          <motion.div {...reveal} className="pl-sim-copy">
            <p className="pl-kicker">
              <MessageSquareText size={14} /> Missed Call Recovery
            </p>
            <h2 className="pl-h2">Every missed call becomes a booked job.</h2>
            <p className="pl-lede">
              When your crew can't pick up, {config.company} texts the caller back in seconds, asks what's wrong, and offers the next open slot.
              The customer books from their phone — before they ever dial the next plumber on the list.
            </p>
            <ul className="pl-sim-points">
              <li>
                <strong>Instant text-back</strong> on every unanswered call, day or night
              </li>
              <li>
                <strong>Triage built in</strong> — urgent leaks get the first slot
              </li>
              <li>
                <strong>Booked, not just logged</strong> — the job lands on your schedule
              </li>
            </ul>
          </motion.div>
          <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.12 }}>
            <MissedCallSim ref={sim} config={config} />
          </motion.div>
        </section>

        <RoiCalculator config={config} />

        <CompetitorLandGrabStack
          config={config.landGrab}
          comparisonClassName="pl-section"
          locale={{
            city: config.city,
            niche: "plumbing",
            trade: "Emergency Plumbing",
            business: config.company,
            greet: true,
          }}
        />

        <GeoSocialProofStack
          config={config.geo}
          proofClassName="pl-section"
          locale={{
            city: config.city,
            niche: "plumbing",
            trade: "Emergency Plumbing",
          }}
        />

        <section className="pl-section">
          <motion.div {...reveal} className="pl-final">
            <h2 className="pl-h2">Water where it shouldn't be?</h2>
            <p className="pl-lede">Call now, or start your trial and watch the system book jobs for you.</p>
            <div className="pl-cta-row is-center">
              {tel ? (
                <FxButton variant="danger" glow href={tel} icon={<Phone size={16} />}>
                  {config.ctas.callLabel} · {config.phoneDisplay}
                </FxButton>
              ) : null}
              <FxButton variant="primary" href={config.ctas.trialHref} icon={<Sparkles size={16} />} successLabel="Opening your trial">
                {config.ctas.trialLabel}
              </FxButton>
            </div>
          </motion.div>
        </section>
      </main>

      <footer className="pl-footer">
        <span>
          © {config.company}
          {config.city ? ` · ${config.city}` : ""}
        </span>
        <span className="pl-footer-axiom">Powered by Axiom</span>
      </footer>

      <ProofFeed config={config} />

      <div className="pl-mobile-bar">
        {tel ? (
          <a href={tel} className="pl-mobile-call">
            <Phone size={16} /> {config.ctas.callLabel}
          </a>
        ) : null}
        <FxButton variant="primary" href={config.ctas.trialHref} className="pl-mobile-trial">
          {config.ctas.trialLabel}
        </FxButton>
      </div>
    </div>
  );
}
