import {
  DEFAULT_CONFIG,
  STORE_KEY,
  cloneConfig,
  deepMerge,
  getPath,
  setPath,
  type LandingConfig,
} from "./config";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  tx: number;
  ty: number;
  kind: string;
  sz: number;
  seed: number;
  tone: "cyan" | "chrome" | "obsidian";
};

type Target = { x: number; y: number; kind: string };

const CONTENT_LABELS: Record<string, string> = {
  navBrand: "Nav Wordmark",
  navLink1: "Nav Link 1",
  navLink2: "Nav Link 2",
  navLink3: "Nav Link 3",
  navLink4: "Nav Link 4",
  heroBadge: "Hero Badge",
  heroTitle: "Hero Headline",
  heroSub: "Hero Subheadline",
  heroHint: "Scroll Hint",
  charKicker: "Character Kicker",
  charTitle: "Character Section Title",
  charTeleL: "Telemetry Top",
  charTeleBL: "Telemetry Bottom-Left",
  charTeleBR: "Telemetry Bottom-Right",
  co1Tag: "Callout 1 Tag",
  co1Title: "Callout 1 Title",
  co1Body: "Callout 1 Body",
  co2Tag: "Callout 2 Tag",
  co2Title: "Callout 2 Title",
  co2Body: "Callout 2 Body",
  co3Tag: "Callout 3 Tag",
  co3Title: "Callout 3 Title",
  co3Body: "Callout 3 Body",
  co4Tag: "Callout 4 Tag",
  co4Title: "Callout 4 Title",
  co4Body: "Callout 4 Body",
  heartKicker: "Heart Kicker",
  heartTitle: "Heart Title",
  heartSub: "Heart Subheadline",
  studioKicker: "Studio Kicker",
  studioTitle: "Studio Title",
  studioSub: "Studio Subheadline",
  studioBar: "Studio Window Label",
  studioNote: "Studio Note Line",
  studioAside: "Studio Aside Copy",
  navBrand2: "Footer Wordmark",
  footTag: "Footer Tagline",
  footL1: "Footer Link 1",
  footL2: "Footer Link 2",
  footL3: "Footer Link 3",
  footL4: "Footer Link 4",
};

function hexToRgb(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function esc(s: unknown): string {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
}

const ease = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x));
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const fmt = (s: number) => {
  const n = Math.max(0, s | 0);
  return String((n / 60) | 0).padStart(2, "0") + ":" + String(n % 60).padStart(2, "0");
};

export type MountOptions = {
  studioHref?: string;
};

/**
 * Imperative freeze-landing runtime. Call only in the browser (useEffect).
 * Returns a cleanup that tears down rAF, observers, and listeners.
 */
export function mountAxiomFreezeLanding(root: HTMLElement, options: MountOptions = {}): () => void {
  const studioHref = options.studioHref || DEFAULT_CONFIG.buttons.navCta.url;
  let CFG = cloneConfig(DEFAULT_CONFIG);
  CFG.buttons.navCta.url = studioHref;
  CFG.buttons.heroPrimary.url = studioHref;
  CFG.buttons.studioCta.url = studioHref;

  try {
    const saved = localStorage.getItem(STORE_KEY);
    if (saved) CFG = deepMerge(DEFAULT_CONFIG, JSON.parse(saved));
  } catch {
    /* ignore corrupt storage */
  }
  for (const k of ["characterSrc", "heartSrc", "studioSrc"] as const) {
    if ((CFG.media[k] || "").startsWith("blob:")) CFG.media[k] = DEFAULT_CONFIG.media[k];
  }
  // Prefer public absolute paths if a relative media/ path was saved from the static HTML
  for (const k of ["characterSrc", "heartSrc", "studioSrc"] as const) {
    const v = CFG.media[k] || "";
    if (v.startsWith("media/")) CFG.media[k] = `/${v}`;
  }
  if (!CFG.buttons.navCta.url || CFG.buttons.navCta.url === "#studio") CFG.buttons.navCta.url = studioHref;
  if (!CFG.buttons.heroPrimary.url || CFG.buttons.heroPrimary.url === "#studio")
    CFG.buttons.heroPrimary.url = studioHref;
  if (!CFG.buttons.studioCta.url || CFG.buttons.studioCta.url === "#studio")
    CFG.buttons.studioCta.url = studioHref;

  const $ = <T extends HTMLElement = HTMLElement>(id: string) =>
    root.querySelector<T>(`#${CSS.escape(id)}`);
  const $$ = <T extends Element = Element>(sel: string) =>
    Array.from(root.querySelectorAll<T>(sel));

  const cleanups: Array<() => void> = [];
  const on = <K extends keyof WindowEventMap>(
    target: Window | Document | HTMLElement,
    type: K | string,
    handler: EventListenerOrEventListenerObject,
    opts?: AddEventListenerOptions,
  ) => {
    target.addEventListener(type, handler, opts);
    cleanups.push(() => target.removeEventListener(type, handler, opts));
  };

  function saveCfg() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(CFG));
    } catch {
      /* quota */
    }
  }

  function applyTheme() {
    const r = root.style;
    const t = CFG.theme;
    r.setProperty("--bg", t.bg);
    r.setProperty("--accent", t.accent);
    r.setProperty("--panel", `rgba(15,17,23,${t.panelAlpha})`);
    r.setProperty("--border", `rgba(255,255,255,${t.borderAlpha})`);
    r.setProperty("--glow", String(t.glow));
  }

  function applyContent() {
    $$<HTMLElement>("[data-cfg]").forEach((el) => {
      const path = el.dataset.cfg;
      if (!path) return;
      const v = getPath(CFG, path);
      if (v !== undefined && el.textContent !== String(v)) el.textContent = String(v);
    });
  }

  function applyButtons() {
    for (const key of Object.keys(CFG.buttons) as Array<keyof LandingConfig["buttons"]>) {
      const el = $(`btn-${key}`);
      if (!el) continue;
      const b = CFG.buttons[key];
      if (el.textContent !== b.label) el.textContent = b.label;
      el.setAttribute("href", b.url || "#");
      el.classList.toggle("glow", !!b.glow);
      el.classList.toggle("hidden-btn", !b.visible);
    }
  }

  function applyMedia() {
    const cv = $<HTMLVideoElement>("charVideo");
    const hv = $<HTMLVideoElement>("heartVideo");
    const sv = $<HTMLVideoElement>("studioVideo");
    const set = (vid: HTMLVideoElement | null, src: string, poster?: string) => {
      if (!vid) return;
      if (poster && vid.getAttribute("poster") !== poster) vid.setAttribute("poster", poster);
      if (vid.dataset.src !== src) {
        vid.dataset.src = src;
        vid.src = src;
        vid.load();
      }
    };
    set(cv, CFG.media.characterSrc, CFG.media.characterPoster);
    set(hv, CFG.media.heartSrc, CFG.media.heartPoster);
    set(sv, CFG.media.studioSrc, CFG.media.studioPoster);
    if (hv) hv.loop = !!CFG.media.heartLoop;
    cv?.play().catch(() => undefined);
    sv?.play().catch(() => undefined);
  }

  function applyAll() {
    applyTheme();
    applyContent();
    applyButtons();
    applyMedia();
  }
  applyAll();

  /* ---------- particles ---------- */
  const canvasEl = $<HTMLCanvasElement>("particles");
  const ctxEl = canvasEl?.getContext("2d") ?? null;
  if (!canvasEl || !ctxEl) return () => undefined;
  const canvas: HTMLCanvasElement = canvasEl;
  const ctx: CanvasRenderingContext2D = ctxEl;

  let W = 0;
  let H = 0;
  let DPR = 1;
  let particles: Particle[] = [];
  let targets: Target[] = [];
  let heroP = 0;
  let frame = 0;
  let raf = 0;
  let tiltX = 0;
  let tiltY = 0;
  let curTab = "content";
  let confirmReset = false;
  let scrubbing = false;
  let theater = false;

  const heroTrack = $("heroTrack");
  const heroFg = $("heroFg");
  const heroHint = $("heroHint");
  const hudState = $("hudState");
  const hudProg = $("hudProg");
  const revealTrack = $("architecture");
  const charFrame = $("charFrame");
  const callouts = $$<HTMLElement>(".callout[data-reveal]");
  const hv = $<HTMLVideoElement>("heartVideo");
  const cinema = $("cinema");
  const dash = $("dash");
  const dashBody = $("dashBody");
  const dashTabs = $("dashTabs");
  const toastEl = $("toast");
  const jsonModal = $("jsonModal");
  const jsonArea = $<HTMLTextAreaElement>("jsonArea");
  const jsonTitle = $("jsonTitle");
  const jsonFile = $<HTMLInputElement>("jsonFile");

  function buildTargets(n: number) {
    targets = [];
    const cx = W / 2;
    const cy = H * 0.46;
    const mw = Math.min(W * 0.17, 240);
    const mh = Math.min(H * 0.58, 560);
    const edgeN = Math.floor(n * 0.45);
    const fillN = Math.floor(n * 0.33);
    const ringN = n - edgeN - fillN;
    for (let i = 0; i < edgeN; i++) {
      const side = Math.floor(rand(0, 4));
      let x: number;
      let y: number;
      if (side === 0) {
        x = cx - mw / 2;
        y = rand(cy - mh / 2, cy + mh / 2);
      } else if (side === 1) {
        x = cx + mw / 2;
        y = rand(cy - mh / 2, cy + mh / 2);
      } else if (side === 2) {
        x = rand(cx - mw / 2, cx + mw / 2);
        y = cy - mh / 2;
      } else {
        x = rand(cx - mw / 2, cx + mw / 2);
        y = cy + mh / 2;
      }
      targets.push({ x: x + rand(-1.5, 1.5), y: y + rand(-1.5, 1.5), kind: "edge" });
    }
    for (let i = 0; i < fillN; i++) {
      targets.push({
        x: rand(cx - mw / 2, cx + mw / 2),
        y: rand(cy - mh / 2, cy + mh / 2),
        kind: "fill",
      });
    }
    for (let i = 0; i < ringN; i++) {
      const a = rand(0, Math.PI * 2);
      const rr = rand(mw * 1.3, mw * 3.3);
      targets.push({
        x: cx + Math.cos(a) * rr,
        y: cy + Math.sin(a) * rr * 0.42 + rand(-14, 14),
        kind: "shard",
      });
    }
  }

  function initParticles() {
    const n = CFG.motion.reduceMotion
      ? Math.min(600, CFG.motion.particles)
      : CFG.motion.particles;
    buildTargets(n);
    particles = [];
    for (let i = 0; i < n; i++) {
      const t = targets[i % targets.length];
      const sz =
        t.kind === "shard" ? rand(0.8, 2.6) : t.kind === "edge" ? rand(0.7, 1.8) : rand(0.6, 1.4);
      particles.push({
        x: rand(0, W),
        y: rand(0, H),
        vx: rand(-0.4, 0.4),
        vy: rand(-0.4, 0.4),
        tx: t.x,
        ty: t.y,
        kind: t.kind,
        sz,
        seed: rand(0, 1000),
        tone: Math.random() < 0.055 ? "cyan" : Math.random() < 0.4 ? "chrome" : "obsidian",
      });
    }
    const hc = $("hudCount");
    if (hc) hc.textContent = "N = " + String(n).padStart(4, "0");
  }

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    initParticles();
  }

  function revealScrub() {
    if (!revealTrack || !charFrame) return;
    const r = revealTrack.getBoundingClientRect();
    const span = r.height - window.innerHeight;
    const p = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
    const inP = ease(Math.min(1, p / 0.5));
    const headEl = revealTrack.querySelector<HTMLElement>(".reveal-header");
    if (headEl) {
      headEl.style.opacity = String(inP);
      headEl.style.transform = `translateY(${(1 - inP) * 30}px)`;
    }
    const s = 0.86 + inP * 0.14;
    charFrame.style.opacity = String(inP);
    charFrame.style.transform = `perspective(1100px) scale(${s}) rotateX(${(1 - inP) * 14 + tiltY}deg) rotateY(${tiltX}deg)`;
    callouts.forEach((c, i) => {
      const cp = ease(Math.min(1, Math.max(0, (p - 0.3 - i * 0.08) / 0.3)));
      const dir = (c.dataset.reveal || "").startsWith("l") ? -1 : 1;
      c.style.opacity = String(cp);
      c.style.transform = `translateX(${(1 - cp) * 46 * dir}px)`;
    });
  }

  function tick() {
    frame++;
    if (heroTrack) {
      const rect = heroTrack.getBoundingClientRect();
      const span = rect.height - window.innerHeight;
      heroP = span > 0 ? Math.min(1, Math.max(0, -rect.top / span)) : 0;

      const sharp = CFG.motion.freezeSharpness;
      const coalesce = ease(Math.min(1, (heroP / 0.55) * sharp));
      const frozen = ease(Math.max(0, (heroP - 0.62) / 0.18));
      const dissolve = ease(Math.max(0, (heroP - 0.86) / 0.14));

      if (hudProg) hudProg.textContent = heroP.toFixed(2);
      if (hudState) {
        hudState.textContent =
          dissolve > 0.1
            ? "REFRACT"
            : frozen > 0.6
              ? "FROZEN"
              : coalesce > 0.4
                ? "COALESCING"
                : "FLUID";
      }

      if (heroFg) {
        const fgO = 1 - dissolve;
        heroFg.style.opacity = String(fgO);
        heroFg.style.transform = `translateY(${dissolve * -40}px) scale(${1 - dissolve * 0.04})`;
      }
      if (heroHint) heroHint.style.opacity = String(Math.max(0, 1 - heroP * 4));

      const onScreen = rect.bottom > 0 && rect.top < window.innerHeight;
      if (onScreen && !CFG.motion.reduceMotion) {
        ctx.clearRect(0, 0, W, H);
        if (coalesce > 0.1) {
          const g = ctx.createRadialGradient(W / 2, H * 0.46, 0, W / 2, H * 0.46, Math.min(W, H) * 0.5);
          const [ar, ag, ab] = hexToRgb(CFG.theme.accent);
          g.addColorStop(0, `rgba(${ar},${ag},${ab},${0.05 * coalesce * (1 - dissolve)})`);
          g.addColorStop(1, "transparent");
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, W, H);
        }
        const t = frame * 0.004;
        const [ar, ag, ab] = hexToRgb(CFG.theme.accent);
        for (const p of particles) {
          if (frozen < 1) {
            const ang = Math.sin(p.x * 0.0021 + t + p.seed) * 2.2 + Math.cos(p.y * 0.0017 - t) * 2.2;
            const drift = (1 - coalesce) * (1 - frozen);
            p.vx += Math.cos(ang) * 0.05 * drift;
            p.vy += Math.sin(ang) * 0.05 * drift;
            const pull = 0.0009 + coalesce * 0.065;
            p.vx += (p.tx - p.x) * pull * coalesce;
            p.vy += (p.ty - p.y) * pull * coalesce;
            const damp = 0.96 - coalesce * 0.07 - frozen * 0.5;
            p.vx *= Math.max(0.3, damp);
            p.vy *= Math.max(0.3, damp);
            p.x += p.vx;
            p.y += p.vy;
            if (!coalesce) {
              if (p.x < -20) p.x = W + 20;
              if (p.x > W + 20) p.x = -20;
              if (p.y < -20) p.y = H + 20;
              if (p.y > H + 20) p.y = -20;
            }
          } else {
            p.x += (p.tx - p.x) * 0.3;
            p.y += (p.ty - p.y) * 0.3;
          }
          let dx = 0;
          let dy = 0;
          let o = 1;
          if (dissolve > 0) {
            const a2 = Math.atan2(p.y - H * 0.46, p.x - W / 2);
            dx = Math.cos(a2) * dissolve * 120 * (0.4 + ((p.seed % 10) / 10));
            dy = Math.sin(a2) * dissolve * 120 * (0.4 + ((p.seed % 10) / 10));
            o = 1 - dissolve;
          }
          const lock = frozen;
          let alpha: number;
          let fill: string;
          if (p.tone === "cyan") {
            alpha = (0.5 + 0.5 * Math.sin(t * 3 + p.seed)) * 0.9 * o;
            fill = `rgba(${ar},${ag},${ab},${alpha})`;
          } else if (p.tone === "chrome") {
            const lum = 150 + 90 * lock;
            alpha = (0.35 + 0.45 * coalesce) * o;
            fill = `rgba(${lum},${lum + 6},${lum + 14},${alpha})`;
          } else {
            const lum = 28 + 26 * lock;
            alpha = (0.5 + 0.4 * coalesce) * o;
            fill = `rgba(${lum},${lum},${lum + 6},${alpha})`;
          }
          ctx.fillStyle = fill;
          const s = p.sz * (1 + lock * 0.35);
          ctx.fillRect(p.x + dx - s / 2, p.y + dy - s / 2, s, s);
          if (p.kind === "edge" && lock > 0.5 && p.seed % 7 < 1) {
            ctx.fillStyle = `rgba(255,255,255,${0.5 * lock * o})`;
            ctx.fillRect(p.x + dx - s / 2, p.y + dy - s / 2, s * 1.6, 0.6);
          }
        }
      }
    }

    revealScrub();
    raf = requestAnimationFrame(tick);
  }

  on(window, "resize", resize);
  on(document, "mousemove", ((e: MouseEvent) => {
    if (CFG.motion.reduceMotion) {
      tiltX = 0;
      tiltY = 0;
      return;
    }
    const k = CFG.motion.tilt;
    tiltX = (e.clientX / window.innerWidth - 0.5) * 10 * k;
    tiltY = (e.clientY / window.innerHeight - 0.5) * -8 * k;
  }) as EventListener);

  /* ---------- heart player ---------- */
  const vPlay = $("vPlay");
  const vMute = $("vMute");
  const vTheater = $("vTheater");
  const vFill = $("vFill");
  const vKnob = $("vKnob");
  const vTime = $("vTime");
  const vScrub = $("vScrub");

  if (hv) {
    hv.muted = true;
    const syncUI = () => {
      if (vPlay) vPlay.textContent = hv.paused ? "▶" : "❚❚";
      if (vMute) vMute.textContent = hv.muted ? "🔇" : "🔊";
      const p = hv.duration ? (hv.currentTime / hv.duration) * 100 : 0;
      if (vFill) vFill.style.width = p + "%";
      if (vKnob) vKnob.style.left = p + "%";
      if (vTime) vTime.textContent = fmt(hv.currentTime) + " / " + fmt(hv.duration || 0);
    };
    on(hv, "timeupdate", syncUI);
    on(hv, "loadedmetadata", syncUI);
    on(hv, "play", syncUI);
    on(hv, "pause", syncUI);
    const onPlayClick = () => {
      if (hv.paused) hv.play().catch(() => undefined);
      else hv.pause();
    };
    const onMuteClick = () => {
      hv.muted = !hv.muted;
      syncUI();
    };
    vPlay?.addEventListener("click", onPlayClick);
    vMute?.addEventListener("click", onMuteClick);
    cleanups.push(() => {
      vPlay?.removeEventListener("click", onPlayClick);
      vMute?.removeEventListener("click", onMuteClick);
    });
    const seekAt = (e: PointerEvent | TouchEvent | MouseEvent) => {
      if (!vScrub || !hv.duration) return;
      const r = vScrub.getBoundingClientRect();
      const clientX = "touches" in e && e.touches[0] ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const x = clientX - r.left;
      hv.currentTime = Math.min(1, Math.max(0, x / r.width)) * hv.duration;
    };
    if (vScrub) {
      on(vScrub, "pointerdown", ((e: PointerEvent) => {
        scrubbing = true;
        seekAt(e);
        vScrub.setPointerCapture(e.pointerId);
      }) as EventListener);
      on(vScrub, "pointermove", ((e: PointerEvent) => {
        if (scrubbing) seekAt(e);
      }) as EventListener);
      on(vScrub, "pointerup", () => {
        scrubbing = false;
      });
    }
    vTheater?.addEventListener("click", () => {
      if (!cinema) return;
      if (!theater) {
        const req = cinema.requestFullscreen?.();
        if (req && typeof (req as Promise<void>).catch === "function") {
          (req as Promise<void>).catch(() => cinema.classList.add("theater"));
        } else if (!document.fullscreenEnabled) {
          cinema.classList.add("theater");
        }
        theater = true;
      } else {
        if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
        cinema.classList.remove("theater");
        theater = false;
      }
    });
    on(document, "fullscreenchange", () => {
      if (!document.fullscreenElement && cinema) {
        theater = false;
        cinema.classList.remove("theater");
      }
    });
    on(document, "keydown", ((e: KeyboardEvent) => {
      if (e.key === "Escape" && theater && cinema) {
        cinema.classList.remove("theater");
        theater = false;
      }
    }) as EventListener);

    if (cinema) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => {
            if (en.isIntersecting && CFG.media.heartAutoplay) hv.play().catch(() => undefined);
            else if (!en.isIntersecting && !theater) hv.pause();
          });
        },
        { threshold: 0.35 },
      );
      io.observe(cinema);
      cleanups.push(() => io.disconnect());
    }
  }

  /* ---------- studio playground ---------- */
  const pgRun = $("pgRun");
  const pgPrompt = $<HTMLInputElement>("pgPrompt");
  pgRun?.addEventListener("click", () => {
    const sv = $<HTMLVideoElement>("studioVideo");
    if (sv) sv.style.filter = "brightness(1.6) saturate(1.5)";
    if (pgRun) pgRun.textContent = "⟳";
    window.setTimeout(() => {
      if (sv) sv.style.filter = "";
      if (pgRun) pgRun.textContent = "RUN";
      const val = pgPrompt?.value.trim() || "";
      toast(
        val
          ? `STUDIO READY — LAUNCH TO BUILD: “${val.slice(0, 32)}…”`
          : "STUDIO READY — DESCRIBE YOUR APP",
      );
    }, 900);
  });
  pgPrompt?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") pgRun?.click();
  });

  on(root, "click", ((e: MouseEvent) => {
    const a = (e.target as Element | null)?.closest?.("a[href^='#']") as HTMLAnchorElement | null;
    if (!a) return;
    const id = a.getAttribute("href")?.slice(1);
    const el = id ? document.getElementById(id) : null;
    if (el) {
      e.preventDefault();
      el.scrollIntoView({ behavior: CFG.motion.reduceMotion ? "auto" : "smooth" });
    }
  }) as EventListener);

  /* ---------- master dashboard ---------- */
  function toast(msg: string) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    const prev = (toastEl as HTMLElement & { _h?: number })._h;
    if (prev) window.clearTimeout(prev);
    (toastEl as HTMLElement & { _h?: number })._h = window.setTimeout(
      () => toastEl.classList.remove("show"),
      2600,
    );
  }

  function fieldText(path: string, label: string, val: unknown) {
    return `<div class="fgroup"><label>${label}</label><input type="text" data-path="${path}" value="${esc(val)}"></div>`;
  }
  function fieldArea(path: string, label: string, val: unknown) {
    return `<div class="fgroup"><label>${label}</label><textarea data-path="${path}">${esc(val)}</textarea></div>`;
  }
  function fieldColor(path: string, label: string, val: unknown) {
    return `<div class="fgroup"><label>${label}</label><div class="frow"><input type="color" data-path="${path}" value="${esc(val)}"><input class="hex" type="text" data-path="${path}" value="${esc(val)}"></div></div>`;
  }
  function fieldRange(path: string, label: string, val: number, min: number, max: number, step: number) {
    return `<div class="fgroup"><label>${label}<span class="rangeval">${val}</span></label><input type="range" data-path="${path}" min="${min}" max="${max}" step="${step}" value="${val}"></div>`;
  }
  function toggleRow(path: string, label: string, val: boolean) {
    return `<div class="toggle-row"><span>${label}</span><span class="tswitch"><input type="checkbox" data-path="${path}" ${val ? "checked" : ""}><span class="tr"></span></span></div>`;
  }
  function dropzone(mediaKey: string, label: string) {
    return `<div class="dropzone" data-media="${mediaKey}">${label}<br>or click to browse</div>`;
  }

  function wireInputs() {
    if (!dashBody) return;
    dashBody.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("[data-path]").forEach((inp) => {
      const h = () => {
        let v: unknown;
        if (inp instanceof HTMLInputElement && inp.type === "checkbox") v = inp.checked;
        else if (inp instanceof HTMLInputElement && inp.type === "range") {
          v = parseFloat(inp.value);
          const rv = inp.closest(".fgroup")?.querySelector(".rangeval");
          if (rv) rv.textContent = String(v);
        } else v = inp.value;
        setPath(CFG as unknown as Record<string, unknown>, inp.dataset.path || "", v);
        saveCfg();
        const path = inp.dataset.path || "";
        if (path.startsWith("theme")) applyTheme();
        else if (path.startsWith("media")) applyMedia();
        else if (path.startsWith("buttons")) applyButtons();
        else applyContent();
        if (path === "motion.particles" || path === "motion.reduceMotion") initParticles();
        if (
          (inp instanceof HTMLInputElement && inp.type === "color") ||
          inp.classList.contains("hex")
        ) {
          inp.closest(".frow")?.querySelectorAll("input").forEach((x) => {
            if (x !== inp) x.value = String(v);
          });
        }
      };
      inp.addEventListener("input", h);
      inp.addEventListener("change", h);
    });
    dashBody.querySelectorAll<HTMLElement>(".dropzone").forEach((dz) => {
      const key = dz.dataset.media as "characterSrc" | "heartSrc" | "studioSrc" | undefined;
      if (!key) return;
      const accept = (file: File) => {
        const url = URL.createObjectURL(file);
        CFG.media[key] = url;
        applyMedia();
        saveCfg();
        dz.textContent = "LOADED: " + file.name + " (session only)";
        toast("MEDIA LOADED // " + file.name.toUpperCase());
        renderTab("media");
      };
      dz.addEventListener("dragover", (e) => {
        e.preventDefault();
        dz.classList.add("over");
      });
      dz.addEventListener("dragleave", () => dz.classList.remove("over"));
      dz.addEventListener("drop", (e) => {
        e.preventDefault();
        dz.classList.remove("over");
        const f = e.dataTransfer?.files?.[0];
        if (f) accept(f);
      });
      dz.addEventListener("click", () => {
        const fi = document.createElement("input");
        fi.type = "file";
        fi.accept = "video/*,image/*";
        fi.onchange = () => {
          if (fi.files?.[0]) accept(fi.files[0]);
        };
        fi.click();
      });
    });
  }

  function renderTab(tab: string) {
    if (!dashBody) return;
    let html = "";
    if (tab === "content") {
      html += `<div class="dash-section-title">META / STATUS</div>`;
      for (const [p, l] of [
        ["meta.status", "Nav Status Text"],
        ["meta.status2", "Footer Status"],
        ["meta.build", "Footer Build Tag"],
        ["meta.version", "Footer Version"],
      ] as const) {
        html += fieldText(p, l, getPath(CFG, p));
      }
      html += `<div class="dash-section-title">PAGE COPY</div>`;
      for (const k of Object.keys(CONTENT_LABELS)) {
        const p = "content." + k;
        const v = CFG.content[k];
        html +=
          String(v).length > 60
            ? fieldArea(p, CONTENT_LABELS[k], v)
            : fieldText(p, CONTENT_LABELS[k], v);
      }
    }
    if (tab === "media") {
      html +=
        `<div class="dash-section-title">AXIOM CHARACTER</div>` +
        fieldText(
          "media.characterSrc",
          "Character Media URL (mp4 / webm / png)",
          CFG.media.characterSrc,
        ) +
        dropzone("characterSrc", "DROP CHARACTER FILE HERE") +
        `<div class="dash-section-title">HEART MACHINE VIDEO</div>` +
        fieldText("media.heartSrc", "Heart Machine MP4 URL", CFG.media.heartSrc) +
        dropzone("heartSrc", "DROP HEART MACHINE .MP4 HERE") +
        toggleRow("media.heartAutoplay", "Autoplay on scroll", CFG.media.heartAutoplay) +
        toggleRow("media.heartLoop", "Loop", CFG.media.heartLoop) +
        `<div class="dash-section-title">STUDIO PREVIEW</div>` +
        fieldText("media.studioSrc", "Studio Preview URL", CFG.media.studioSrc) +
        dropzone("studioSrc", "DROP STUDIO PREVIEW FILE HERE") +
        `<p class="note">Dropped files preview instantly but live for this browser session only — host the file and paste its URL to make it permanent, then EXPORT JSON to lock in your config.</p>`;
    }
    if (tab === "buttons") {
      const names: Record<string, string> = {
        navCta: "NAVBAR CTA",
        heroPrimary: "HERO PRIMARY",
        heroSecondary: "HERO SECONDARY",
        studioCta: "STUDIO MEGA CTA",
      };
      for (const key of Object.keys(CFG.buttons) as Array<keyof LandingConfig["buttons"]>) {
        const b = CFG.buttons[key];
        html +=
          `<div class="dash-section-title">${names[key] || key}</div>` +
          fieldText(`buttons.${key}.label`, "Label", b.label) +
          fieldText(
            `buttons.${key}.url`,
            "Destination URL (use /axiom-studio or #architecture)",
            b.url,
          ) +
          toggleRow(`buttons.${key}.glow`, "Glow effect", b.glow) +
          toggleRow(`buttons.${key}.visible`, "Visible", b.visible);
      }
    }
    if (tab === "theme") {
      html +=
        `<div class="dash-section-title">COLOR TOKENS</div>` +
        fieldColor("theme.bg", "Background — Pitch Void", CFG.theme.bg) +
        fieldColor("theme.accent", "Primary Accent — Plasma", CFG.theme.accent) +
        fieldRange("theme.panelAlpha", "Panel Glass Opacity", CFG.theme.panelAlpha, 0, 1, 0.01) +
        fieldRange("theme.borderAlpha", "Border Intensity", CFG.theme.borderAlpha, 0, 0.4, 0.01) +
        fieldRange("theme.glow", "Global Glow Strength", CFG.theme.glow, 0, 2.5, 0.05);
    }
    if (tab === "motion") {
      html +=
        `<div class="dash-section-title">PARTICLE ENGINE</div>` +
        fieldRange("motion.particles", "Particle Count", CFG.motion.particles, 400, 6000, 100) +
        fieldRange(
          "motion.freezeSharpness",
          "Freeze Sharpness",
          CFG.motion.freezeSharpness,
          0.5,
          2,
          0.05,
        ) +
        `<div class="dash-section-title">INTERACTION</div>` +
        fieldRange("motion.tilt", "Parallax Tilt Strength", CFG.motion.tilt, 0, 2, 0.05) +
        toggleRow(
          "motion.reduceMotion",
          "Reduce motion (accessibility)",
          CFG.motion.reduceMotion,
        );
    }
    dashBody.innerHTML = html;
    wireInputs();
  }

  $("gearBtn")?.addEventListener("click", () => {
    dash?.classList.add("open");
    renderTab(curTab);
  });
  $("dashClose")?.addEventListener("click", () => dash?.classList.remove("open"));
  on(document, "keydown", ((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === "e" || e.key === "E")) {
      e.preventDefault();
      dash?.classList.toggle("open");
      if (dash?.classList.contains("open")) renderTab(curTab);
    }
  }) as EventListener);
  dashTabs?.addEventListener("click", (e) => {
    const b = (e.target as Element | null)?.closest?.("button[data-tab]") as HTMLButtonElement | null;
    if (!b) return;
    curTab = b.dataset.tab || "content";
    dashTabs.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b));
    renderTab(curTab);
  });

  $("cfgExport")?.addEventListener("click", () => {
    if (jsonTitle) jsonTitle.textContent = "CONFIG EXPORT — copy & save as axiom-config.json";
    if (jsonArea) jsonArea.value = JSON.stringify(CFG, null, 2);
    jsonModal?.classList.add("open");
  });
  $("cfgImport")?.addEventListener("click", () => {
    if (jsonTitle) jsonTitle.textContent = "CONFIG IMPORT — paste JSON or load a file, then APPLY";
    if (jsonArea) jsonArea.value = "";
    jsonModal?.classList.add("open");
  });
  $("jsonClose")?.addEventListener("click", () => jsonModal?.classList.remove("open"));
  $("jsonCopy")?.addEventListener("click", () => {
    if (!jsonArea) return;
    navigator.clipboard
      .writeText(jsonArea.value)
      .then(() => toast("CONFIG COPIED TO CLIPBOARD"))
      .catch(() => {
        jsonArea.select();
        toast("SELECT-ALL + COPY MANUALLY");
      });
  });
  $("jsonLoadFile")?.addEventListener("click", () => jsonFile?.click());
  jsonFile?.addEventListener("change", () => {
    const f = jsonFile.files?.[0];
    if (!f || !jsonArea) return;
    const r = new FileReader();
    r.onload = () => {
      jsonArea.value = String(r.result || "");
    };
    r.readAsText(f);
  });
  $("jsonApply")?.addEventListener("click", () => {
    try {
      if (!jsonArea) return;
      const obj = JSON.parse(jsonArea.value);
      CFG = deepMerge(DEFAULT_CONFIG, obj);
      saveCfg();
      applyAll();
      initParticles();
      renderTab(curTab);
      jsonModal?.classList.remove("open");
      toast("CONFIG APPLIED // SYSTEM UPDATED");
    } catch {
      toast("INVALID JSON — CHECK SYNTAX");
    }
  });
  $("cfgReset")?.addEventListener("click", () => {
    if (!confirmReset) {
      confirmReset = true;
      toast("PRESS RESET AGAIN TO CONFIRM FACTORY RESET");
      window.setTimeout(() => {
        confirmReset = false;
      }, 3000);
      return;
    }
    try {
      localStorage.removeItem(STORE_KEY);
    } catch {
      /* ignore */
    }
    CFG = cloneConfig(DEFAULT_CONFIG);
    CFG.buttons.navCta.url = studioHref;
    CFG.buttons.heroPrimary.url = studioHref;
    CFG.buttons.studioCta.url = studioHref;
    applyAll();
    initParticles();
    renderTab(curTab);
    toast("FACTORY RESET COMPLETE");
  });

  resize();
  raf = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(raf);
    for (const fn of cleanups) {
      try {
        fn();
      } catch {
        /* ignore */
      }
    }
  };
}
