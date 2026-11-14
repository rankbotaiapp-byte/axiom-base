import { memo, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from "react";
import {
  Activity,
  BadgeCheck,
  CalendarCheck,
  Check,
  ChevronDown,
  Clock,
  Droplets,
  Flame,
  Pause,
  Phone,
  Play,
  Quote,
  Siren,
  Waves,
  Wrench,
  Zap,
} from "lucide-react";
import { LEAD_STORAGE_KEY } from "@/lib/axiom/funnel";
import { ensureFunnelSession, recordFunnelHit } from "@/lib/axiom/master";
import {
  callTarget,
  fillTemplate,
  outreachVars,
  type OutreachTenant,
  type PlumberOutreachConfig,
} from "@/lib/axiom/plumber-outreach";
import { KineticButton } from "./kinetic-button";
import { OutreachCheckoutModal, outreachSessionKey } from "./outreach-checkout-modal";
import "./plumber-outreach.css";

/* ------------------------------------------------------------------ hero film */

/**
 * The hero loop. Deliberately dumb: a plain <video> with fixed attributes and no
 * state, refs, effects or event handlers around it. It is memoised on its three
 * URLs, so opening the checkout modal, typing in the booking widget or any other
 * page state can never re-render, restart or reload it.
 *
 * The poster is painted twice — as the stage background and as the video's own
 * `poster` — so the first frame is on screen before a single video byte arrives
 * and the box never changes size (zero layout shift, no reload flicker).
 */
const HeroLoop = memo(function HeroLoop({ src, mobileSrc, poster }: { src: string; mobileSrc: string; poster: string }) {
  // Default: one file for every screen, set straight on <video src>. A separate phone
  // file is used only if the owner enters one in the studio.
  const split = Boolean(mobileSrc) && mobileSrc !== src;
  return (
    <div className="po-film" aria-hidden="true" style={{ backgroundImage: `url("${poster}")` }}>
      <video
        key={`${src}|${mobileSrc}`}
        className="po-film-video"
        src={split ? undefined : src}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster={poster}
        disablePictureInPicture
        disableRemotePlayback
        tabIndex={-1}
      >
        {split ? (
          <>
            <source src={mobileSrc} type="video/mp4" media="(max-width: 768px)" />
            <source src={src} type="video/mp4" />
          </>
        ) : null}
      </video>
    </div>
  );
});

/* ------------------------------------------------------------------ helpers */

const SERVICE_ICONS = [Droplets, Wrench, Flame, Waves];

/** Counts up once when the number scrolls into view; reduced-motion users get the final value. */
function CountUp({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(to);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(to);
      return;
    }
    let frame = 0;
    let started = false;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || started) return;
      started = true;
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / 1100);
        setValue(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) frame = requestAnimationFrame(tick);
      };
      setValue(0);
      frame = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [to]);
  return (
    <span ref={ref} className="po-count">
      {value.toLocaleString("en-US")}
    </span>
  );
}

/** Fades sections up as they enter. CSS does the motion; this only flips a data attribute. */
function useReveal(dep: unknown) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const host = root.current;
    if (!host) return;
    const items = Array.from(host.querySelectorAll<HTMLElement>('[data-reveal]:not([data-reveal="in"])'));
    if (!("IntersectionObserver" in window)) {
      items.forEach((el) => el.setAttribute("data-reveal", "in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-reveal", "in");
          io.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [dep]);
  return root;
}

/** Below-the-fold loop: downloads and plays only while it is on screen. */
function LazyLoop({ src, poster }: { src: string; poster: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) void el.play().catch(() => undefined);
      else el.pause();
    }, { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, [src]);
  return (
    <video
      ref={ref}
      className="po-telemetry-video"
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      preload="none"
      disablePictureInPicture
      tabIndex={-1}
      aria-hidden="true"
    />
  );
}

/**
 * The pipe-rafting film card. Separate from the hero loop on purpose: it loads
 * nothing until it nears the screen, plays only while visible, and the viewer
 * can pause it. The 16:9 box and poster are fixed, so it never shifts the page.
 */
function FeatureFilm({ src, poster, caption }: { src: string; poster: string; caption: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const held = useRef(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    held.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !held.current) void el.play().catch(() => undefined);
        else el.pause();
      },
      { threshold: 0.25, rootMargin: "200px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [src]);

  function toggle() {
    const el = ref.current;
    if (!el) return;
    if (el.paused) {
      held.current = false;
      void el.play().catch(() => undefined);
    } else {
      held.current = true;
      el.pause();
    }
  }

  return (
    <div className="po-feature-card po-glass" style={{ backgroundImage: `url("${poster}")` }}>
      <video
        ref={ref}
        key={src}
        className="po-feature-video"
        src={src}
        poster={poster}
        muted
        loop
        playsInline
        preload="none"
        disablePictureInPicture
        tabIndex={-1}
        aria-hidden="true"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      <span className="po-feature-glow" aria-hidden="true" />
      {caption ? (
        <span className="po-telemetry-tag">
          <span className="po-dot" /> {caption}
        </span>
      ) : null}
      <button type="button" className="po-feature-toggle" onClick={toggle} aria-label={playing ? "Pause the film" : "Play the film"}>
        {playing ? <Pause size={18} /> : <Play size={18} />}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------ booking widget */

function BookingWidget({ config, vars }: { config: PlumberOutreachConfig; vars: Record<string, string> }) {
  const services = config.services.items;
  const [service, setService] = useState(services[0]?.id ?? "");
  const [slot, setSlot] = useState(config.booking.slots[0] ?? "");
  const [done, setDone] = useState(false);
  const picked = services.find((s) => s.id === service) ?? services[0];

  useEffect(() => {
    if (!services.some((s) => s.id === service)) setService(services[0]?.id ?? "");
    if (!config.booking.slots.includes(slot)) setSlot(config.booking.slots[0] ?? "");
  }, [services, service, config.booking.slots, slot]);

  function submit(event: FormEvent) {
    event.preventDefault();
    setDone(true);
  }

  if (done) {
    return (
      <div className="po-book po-glass" role="status">
        <span className="po-book-ok">
          <Check size={22} strokeWidth={3} />
        </span>
        <h3>{config.booking.confirmTitle}</h3>
        <p>{fillTemplate(config.booking.confirmBody, { ...vars, service: picked?.title ?? "Emergency call", slot })}</p>
        {config.booking.previewLabel ? <p className="po-sample">{config.booking.previewLabel}</p> : null}
        <button type="button" className="po-link" onClick={() => setDone(false)}>
          Try another request
        </button>
      </div>
    );
  }

  return (
    <form className="po-book po-glass" onSubmit={submit}>
      <fieldset>
        <legend>1 · What's wrong?</legend>
        <div className="po-chips">
          {services.map((s) => (
            <button key={s.id} type="button" className="po-chip" aria-pressed={service === s.id} onClick={() => setService(s.id)}>
              {s.title}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend>2 · When?</legend>
        <div className="po-chips">
          {config.booking.slots.map((s) => (
            <button key={s} type="button" className="po-chip" aria-pressed={slot === s} onClick={() => setSlot(s)}>
              {s}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="po-book-foot">
        <p>
          {picked?.title}
          {picked?.price ? <span> · {picked.price}</span> : null}
        </p>
        <KineticButton type="submit" variant="glass" size="md" icon={<CalendarCheck size={17} />}>
          {config.booking.submitLabel}
        </KineticButton>
      </div>
    </form>
  );
}

/* --------------------------------------------------------------- the page */

export function PlumberOutreachLanding({
  config,
  tenant,
  studio = false,
  tracking,
}: {
  config: PlumberOutreachConfig;
  tenant: OutreachTenant;
  /** Admin live-preview frame: checkout is simulated and visits are not recorded. */
  studio?: boolean;
  tracking?: { utmSource?: string; county?: string; stopToken?: string };
}) {
  const vars = useMemo(() => outreachVars(tenant), [tenant]);
  const call = callTarget(tenant, config);
  const tel = call ? `tel:${call.dial}` : undefined;
  const root = useReveal(config);

  const [checkout, setCheckout] = useState(false);
  const [resume, setResume] = useState<string | null>(null);
  const openCheckout = useCallback(() => setCheckout(true), []);
  const closeCheckout = useCallback(() => {
    setCheckout(false);
    setResume(null);
  }, []);

  // Paid but reloaded before locking a number? Reopen at the mobile lock.
  useEffect(() => {
    if (studio) return;
    try {
      const saved = sessionStorage.getItem(outreachSessionKey(tenant.slug));
      if (saved && /^cs_[A-Za-z0-9_]+$/.test(saved)) {
        setResume(saved);
        setCheckout(true);
      }
    } catch {
      /* storage can be unavailable in private modes */
    }
  }, [studio, tenant.slug]);

  // Same visit ledger the other outreach pages write, once per tab.
  useEffect(() => {
    if (studio || !tenant.slug) return;
    const utmSource = tracking?.utmSource || "regional";
    const county = tracking?.county || tenant.county || "";
    const stopToken = tracking?.stopToken || "";
    const seen = `axiom.outreach:${tenant.slug}|${utmSource}|${county}|${stopToken}`;
    try {
      if (sessionStorage.getItem(seen) === "1") return;
      sessionStorage.setItem(seen, "1");
      sessionStorage.setItem(
        LEAD_STORAGE_KEY,
        JSON.stringify({ leadSlug: tenant.slug, tradeType: "plumbing", county, utmSource }),
      );
    } catch {
      /* private mode: still record the visit */
    }
    void ensureFunnelSession()
      .then(() => recordFunnelHit({ data: { leadSlug: tenant.slug, utmSource, county, stopToken, path: `/t/${tenant.slug}` } }))
      .catch(() => undefined);
  }, [studio, tenant.slug, tenant.county, tracking?.utmSource, tracking?.county, tracking?.stopToken]);

  const trialButton = (
    <KineticButton
      variant="primary"
      icon={<Zap size={19} />}
      sub={tenant.live ? "This territory is already live" : undefined}
      onPress={openCheckout}
    >
      {config.ctas.trialLabel}
    </KineticButton>
  );

  const callButton = tel ? (
    <KineticButton
      variant="dispatch"
      pulse
      href={tel}
      icon={<Phone size={19} />}
      sub={call?.display}
      ariaLabel={`${config.ctas.callLabel} ${config.ctas.dispatchLabel} ${call?.display ?? ""}`}
    >
      {config.ctas.callLabel} <span className="po-btn-slash">/</span> {config.ctas.dispatchLabel}
    </KineticButton>
  ) : (
    <KineticButton variant="dispatch" pulse href={config.booking.enabled ? "#book" : "#services"} icon={<Siren size={19} />}>
      {config.ctas.dispatchLabel}
    </KineticButton>
  );

  return (
    <div ref={root} className="po-root" style={{ "--po-scrim": config.hero.scrim / 100 } as CSSProperties}>
      {studio ? <div className="po-studio-flag">Studio preview · unsaved edits show here live</div> : null}

      {/* ------------------------------------------------------------ hero */}
      <section id="top" className="po-hero">
        <HeroLoop src={config.hero.videoUrl} mobileSrc={config.hero.mobileVideoUrl} poster={config.hero.posterUrl} />
        <div className="po-scrim" aria-hidden="true" />

        <header className="po-nav">
          <a href="#top" className="po-brand">
            <span className="po-brand-mark">
              <Wrench size={15} />
            </span>
            <span className="po-brand-name">{vars.business}</span>
          </a>
          <span className="po-oncall">
            <span className="po-dot" /> 24/7 capture
          </span>
        </header>

        <div className="po-hero-copy">
          {config.hero.eyebrow ? (
            <p className="po-eyebrow">
              <span className="po-dot is-amber" />
              {fillTemplate(config.hero.eyebrow, vars)}
            </p>
          ) : null}
          <h1 className="po-headline">{fillTemplate(config.hero.headline, vars)}</h1>
          {config.hero.subhead ? <p className="po-subhead">{fillTemplate(config.hero.subhead, vars)}</p> : null}

          {config.metric.enabled ? (
            <div className="po-metric po-glass">
              <div className="po-metric-main">
                <CountUp to={config.metric.count} />
                <p>
                  {fillTemplate(config.metric.line, { ...vars, count: String(config.metric.count) })}
                  {config.metric.sampleLabel ? <span className="po-sample">{config.metric.sampleLabel}</span> : null}
                </p>
              </div>
              {config.metric.stats.length ? (
                <dl className="po-metric-stats">
                  {config.metric.stats.map((s) => (
                    <div key={s.id}>
                      <dt>{s.label}</dt>
                      <dd>{s.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </div>
          ) : null}

          <div className="po-cta-row">
            {trialButton}
            {callButton}
          </div>
          {config.ctas.trialNote ? <p className="po-cta-note">{config.ctas.trialNote}</p> : null}

          {config.badges.length ? (
            <ul className="po-badges">
              {config.badges.map((b) => (
                <li key={b.id}>
                  <BadgeCheck size={14} aria-hidden /> {b.label}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <a href={config.feature.enabled ? "#inside-your-lines" : "#services"} className="po-scroll-cue" aria-label="Scroll down">
          <ChevronDown size={18} />
        </a>
      </section>

      {/* ------------------------------------------------------------ body */}
      <main className="po-body">
        {config.feature.enabled ? (
          <section id="inside-your-lines" className="po-section po-feature">
            <div className="po-feature-head" data-reveal>
              {config.feature.kicker ? <p className="po-kicker">{config.feature.kicker}</p> : null}
              <h2 className="po-h2">{fillTemplate(config.feature.title, vars)}</h2>
            </div>
            <div className="po-feature-grid">
              <div data-reveal>
                <FeatureFilm src={config.feature.videoUrl} poster={config.feature.posterUrl} caption={config.feature.caption} />
              </div>
              <div className="po-feature-copy" data-reveal>
                {config.feature.blurb ? <p className="po-lede">{fillTemplate(config.feature.blurb, vars)}</p> : null}
                {config.feature.points.length ? (
                  <ul className="po-feature-points">
                    {config.feature.points.map((f, i) => (
                      <li key={f.id} className="po-glass">
                        <span className="po-feature-num">{String(i + 1).padStart(2, "0")}</span>
                        <div>
                          <h3>{f.title}</h3>
                          {f.detail ? <p>{fillTemplate(f.detail, vars)}</p> : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {config.feature.ctaLabel ? (
                  <KineticButton variant="glass" size="md" icon={<Zap size={17} />} onPress={openCheckout}>
                    {config.feature.ctaLabel}
                  </KineticButton>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        {config.services.items.length ? (
          <section id="services" className="po-section">
            <div className="po-section-head" data-reveal>
              {config.services.kicker ? <p className="po-kicker">{config.services.kicker}</p> : null}
              <h2 className="po-h2">{fillTemplate(config.services.headline, vars)}</h2>
            </div>
            <ul className="po-services">
              {config.services.items.map((s, i) => {
                const Icon = SERVICE_ICONS[i % SERVICE_ICONS.length];
                return (
                  <li key={s.id} className="po-service po-glass" data-reveal style={{ "--i": i } as CSSProperties}>
                    <span className="po-service-icon">
                      <Icon size={20} />
                    </span>
                    <div className="po-service-copy">
                      <h3>{s.title}</h3>
                      {s.detail ? <p>{s.detail}</p> : null}
                    </div>
                    <div className="po-service-meta">
                      {s.price ? <span className="po-price">{s.price}</span> : null}
                      {s.eta ? (
                        <span className="po-eta">
                          <Clock size={12} aria-hidden /> {s.eta}
                        </span>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        {config.booking.enabled && config.services.items.length ? (
          <section id="book" className="po-section po-split">
            <div data-reveal>
              {config.booking.kicker ? <p className="po-kicker">{config.booking.kicker}</p> : null}
              <h2 className="po-h2">{fillTemplate(config.booking.headline, vars)}</h2>
              {config.booking.blurb ? <p className="po-lede">{fillTemplate(config.booking.blurb, vars)}</p> : null}
            </div>
            <div data-reveal>
              <BookingWidget config={config} vars={vars} />
            </div>
          </section>
        ) : null}

        {config.telemetry.enabled ? (
          <section id="proof" className="po-section po-split is-flip">
            <div className="po-telemetry po-glass" data-reveal>
              <LazyLoop src={config.telemetry.videoUrl} poster={config.telemetry.posterUrl} />
              <span className="po-telemetry-tag">
                <Activity size={13} aria-hidden /> Dispatch telemetry
              </span>
            </div>
            <div data-reveal>
              {config.telemetry.kicker ? <p className="po-kicker">{config.telemetry.kicker}</p> : null}
              <h2 className="po-h2">{fillTemplate(config.telemetry.headline, vars)}</h2>
              {config.telemetry.blurb ? <p className="po-lede">{fillTemplate(config.telemetry.blurb, vars)}</p> : null}
              {config.telemetry.points.length ? (
                <ul className="po-points">
                  {config.telemetry.points.map((point) => (
                    <li key={point}>
                      <Check size={15} strokeWidth={3} aria-hidden /> {point}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </section>
        ) : null}

        {config.proof.enabled && config.proof.items.length ? (
          <section id="reviews" className="po-section">
            <div className="po-section-head" data-reveal>
              {config.proof.kicker ? <p className="po-kicker">{config.proof.kicker}</p> : null}
              <h2 className="po-h2">{fillTemplate(config.proof.headline, vars)}</h2>
            </div>
            <ul className="po-quotes">
              {config.proof.items.map((q, i) => (
                <li key={q.id} className="po-quote po-glass" data-reveal style={{ "--i": i } as CSSProperties}>
                  <Quote size={18} aria-hidden />
                  <blockquote>{q.quote}</blockquote>
                  <footer>
                    <span>
                      {q.name}
                      {q.role ? <em> · {q.role}</em> : null}
                    </span>
                    {config.proof.sampleLabel ? <span className="po-sample">{config.proof.sampleLabel}</span> : null}
                  </footer>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="po-section">
          <div className="po-final po-glass" data-reveal>
            <h2 className="po-h2">{fillTemplate(config.closing.headline, vars)}</h2>
            {config.closing.blurb ? <p className="po-lede">{fillTemplate(config.closing.blurb, vars)}</p> : null}
            <div className="po-cta-row is-center">
              {trialButton}
              {callButton}
            </div>
            {config.ctas.trialNote ? <p className="po-cta-note">{config.ctas.trialNote}</p> : null}
          </div>
        </section>
      </main>

      <footer className="po-footer">
        <span>
          {vars.business}
          {tenant.city ? ` · ${tenant.city}` : ""}
        </span>
        <span>Powered by Axiom · Gear Guardian LLC</span>
      </footer>

      {/* Thumb-reach bar on phones. */}
      <div className="po-dock">
        {tel ? (
          <a href={tel} className="po-dock-call" aria-label={`${config.ctas.callLabel} ${call?.display ?? ""}`}>
            <Phone size={18} />
          </a>
        ) : null}
        <KineticButton variant="primary" size="md" block icon={<Zap size={17} />} onPress={openCheckout}>
          {config.ctas.trialLabel}
        </KineticButton>
      </div>

      <OutreachCheckoutModal
        open={checkout}
        onClose={closeCheckout}
        tenant={tenant}
        config={config}
        vars={vars}
        resumeSessionId={resume}
        preview={studio}
      />
    </div>
  );
}
