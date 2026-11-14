import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles, Wand2 } from "lucide-react";
import { HUD_CARD, NeonBadge } from "@/components/admin/admin-hud";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { generateBrandedAsset, lockTenantBrand, orchestrateFinalWebBuild } from "@/lib/axiom/server";
import type { Shop } from "@/lib/axiom/types";
import { cn } from "@/lib/utils";

const SLIDES = [
  { id: "identity", kicker: "01", title: "Brand Identity" },
  { id: "spark", kicker: "02", title: "AI Asset & Hero" },
  { id: "launch", kicker: "03", title: "Live Launch" },
] as const;

const NEON = ["#2EE6D6", "#67E8F9", "#22D3EE", "#F59E0B", "#34D399", "#FB7185"] as const;

const ASSISTANT_STILL = "/media/ai-female.png";

type Busy = "lock" | "generate" | "build" | null;

function useDesktop() {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const apply = () => setDesktop(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return desktop;
}

export function BrandWebStudio({ shop, readonly }: { shop: Shop; readonly: boolean }) {
  const desktop = useDesktop();
  const reduce = useReducedMotion();
  const locked = shop.frontendTemplate;
  const [slide, setSlide] = useState(0);
  const [name, setName] = useState(locked?.brandName || shop.name);
  const [primary, setPrimary] = useState(locked?.primary || shop.ringColor || "#2EE6D6");
  const [logoDataUrl, setLogoDataUrl] = useState(locked?.logoUrl || "");
  const [prompt, setPrompt] = useState("");
  const [assetUrl, setAssetUrl] = useState(locked?.heroAssetUrl || shop.heroImageUrl || "");
  const [animate, setAnimate] = useState(locked?.animate ?? true);
  const [busy, setBusy] = useState<Busy>(null);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [assistOpen, setAssistOpen] = useState(false);
  const shopKey = { slug: shop.slug, shopId: shop.id };

  function fail(err: unknown) {
    setError(err instanceof Error ? err.message : "Could not complete that step");
  }

  const assistStatus =
    busy === "generate" ? "Composing the still" : busy === "build" ? "Publishing the page" : busy === "lock" ? "Locking identity" : "Standing by";

  const panels = [
    <IdentitySlide
      key="identity"
      name={name}
      primary={primary}
      logoDataUrl={logoDataUrl}
      readonly={readonly}
      busy={busy}
      onName={setName}
      onPrimary={setPrimary}
      onLogo={setLogoDataUrl}
      onLock={() => {
        setBusy("lock");
        setError(null);
        void lockTenantBrand({
          data: {
            ...shopKey,
            name,
            logoDataUrl: logoDataUrl.startsWith("data:image/") ? logoDataUrl : undefined,
            logoUrl: logoDataUrl.startsWith("https://") ? logoDataUrl : undefined,
            primary,
            font: "display",
            tagline: shop.tagline,
          },
        })
          .then(() => {
            setNote("Identity locked.");
            setSlide(1);
          })
          .catch(fail)
          .finally(() => setBusy(null));
      }}
    />,
    <SparkSlide
      key="spark"
      prompt={prompt}
      assetUrl={assetUrl}
      readonly={readonly}
      busy={busy}
      onPrompt={setPrompt}
      onSpark={() => {
        setBusy("generate");
        setError(null);
        void generateBrandedAsset({ data: { ...shopKey, prompt } })
          .then((result) => {
            setAssetUrl(result.assetUrl);
            setNote("Hero still ready.");
            setSlide(2);
          })
          .catch(fail)
          .finally(() => setBusy(null));
      }}
    />,
    <LaunchSlide
      key="launch"
      name={name}
      primary={primary}
      assetUrl={assetUrl}
      animate={animate}
      builtAt={locked?.builtAt}
      readonly={readonly}
      busy={busy}
      onAnimate={setAnimate}
      onBuild={() => {
        setBusy("build");
        setError(null);
        void orchestrateFinalWebBuild({
          data: { ...shopKey, brandedAssetUrl: assetUrl, animate },
        })
          .then((result) => {
            window.location.assign(result.storefrontPath);
          })
          .catch(fail)
          .finally(() => setBusy(null));
      }}
    />,
  ];

  return (
    <main className="brand-web-studio neon-shell admin-hud min-h-dvh bg-slate-950 text-slate-100">
      <header className={`${HUD_CARD} relative mx-3 mt-3 flex items-center justify-between gap-3 px-4 py-3 sm:mx-6`}>
        <div className="min-w-0">
          <Link
            href={`/${shop.slug}/admin`}
            className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-400/80"
          >
            Back to desk
          </Link>
          <h1 className="mt-1 truncate font-display text-2xl">Brand & Web Page Studio</h1>
        </div>
        <button
          type="button"
          className="brand-assist"
          aria-label="AI Assistant"
          onClick={() => setAssistOpen(true)}
        >
          <span className="brand-assist-pulse" aria-hidden />
          <img src={ASSISTANT_STILL} alt="" className="h-11 w-11 rounded-full object-cover" />
        </button>
      </header>

      <ol className="mx-auto mt-4 flex max-w-5xl justify-center gap-2 px-4">
        {SLIDES.map((item, index) => (
          <li key={item.id}>
            <button
              type="button"
              className={cn(
                "h-11 rounded-full px-3 font-mono text-[10px] uppercase tracking-[0.16em]",
                index === slide ? "bg-cyan-400 text-slate-950" : "text-slate-400",
              )}
              onClick={() => setSlide(index)}
            >
              {item.kicker} {item.title}
            </button>
          </li>
        ))}
      </ol>

      {error ? (
        <p className="mx-auto mt-4 max-w-5xl rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 font-mono text-xs text-rose-300">
          {error}
        </p>
      ) : null}
      {note ? <p className="mx-auto mt-3 max-w-5xl px-4 font-mono text-xs text-cyan-300">{note}</p> : null}

      {desktop ? (
        <div className="mx-auto grid max-w-6xl gap-4 px-4 py-6 lg:grid-cols-3">{panels}</div>
      ) : (
        <div className="relative overflow-hidden">
          <motion.div
            className="flex"
            animate={{ x: `${-slide * 100}%` }}
            transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 280, damping: 32 }}
          >
            {panels.map((panel) => (
              <div key={panel.key} className="w-full shrink-0 px-4 py-6">
                {panel}
              </div>
            ))}
          </motion.div>
          <div className="flex justify-between px-4 pb-8">
            <Button type="button" variant="secondary" disabled={slide === 0} onClick={() => setSlide((n) => Math.max(0, n - 1))}>
              <ChevronLeft className="size-4" /> Back
            </Button>
            <Button type="button" disabled={slide === SLIDES.length - 1} onClick={() => setSlide((n) => Math.min(SLIDES.length - 1, n + 1))}>
              Next <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {assistOpen ? (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setAssistOpen(false)}
          >
            <motion.div
              className={`${HUD_CARD} w-full max-w-sm p-5`}
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 16, opacity: 0 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <img src={ASSISTANT_STILL} alt="" className="h-14 w-14 rounded-full object-cover" />
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-400/80">AI Assistant</p>
                  <p className="mt-1 text-lg">{assistStatus}</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-400">
                I lock the mark, spark the still, then publish the same page skeleton every tenant uses. Outreach stays in
                simulation.
              </p>
              <Button className="mt-5 w-full" type="button" onClick={() => setAssistOpen(false)}>
                Close
              </Button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}

function IdentitySlide({
  name,
  primary,
  logoDataUrl,
  readonly,
  busy,
  onName,
  onPrimary,
  onLogo,
  onLock,
}: {
  name: string;
  primary: string;
  logoDataUrl: string;
  readonly: boolean;
  busy: Busy;
  onName: (value: string) => void;
  onPrimary: (value: string) => void;
  onLogo: (value: string) => void;
  onLock: () => void;
}) {
  return (
    <section className={`${HUD_CARD} flex h-full flex-col p-5`}>
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-400/80">Slide 1</p>
      <h2 className="mt-1 font-display text-2xl">Brand Identity</h2>
      <div className="mt-5">
        <Label htmlFor="bws-logo">Logo</Label>
        <input
          id="bws-logo"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          disabled={readonly || Boolean(busy)}
          className="admin-file mt-2 block w-full text-sm text-slate-400"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => onLogo(String(reader.result ?? ""));
            reader.readAsDataURL(file);
          }}
        />
        {logoDataUrl ? <img src={logoDataUrl} alt="" className="mt-3 h-16 w-auto max-w-[8rem] object-contain" /> : null}
      </div>
      <div className="mt-4">
        <Label htmlFor="bws-name">Shop name</Label>
        <Input id="bws-name" value={name} disabled={readonly} onChange={(e) => onName(e.target.value)} />
      </div>
      <div className="mt-4">
        <Label htmlFor="bws-neon">Neon color</Label>
        <div className="mt-3 flex items-center gap-4">
          <label className="brand-wheel">
            <input
              id="bws-neon"
              type="color"
              value={primary}
              disabled={readonly}
              onChange={(e) => onPrimary(e.target.value.toUpperCase())}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {NEON.map((hex) => (
              <button
                key={hex}
                type="button"
                aria-label={hex}
                className={cn("h-11 w-11 rounded-full border", hex === primary ? "border-cyan-200" : "border-cyan-500/20")}
                style={{ background: hex }}
                onClick={() => onPrimary(hex)}
              />
            ))}
          </div>
        </div>
        <p className="mt-2 font-mono text-xs text-slate-500">{primary}</p>
      </div>
      <div className="mt-auto pt-6">
        <Button className="w-full" disabled={readonly || busy !== null || name.trim().length < 2} onClick={onLock}>
          {busy === "lock" ? "Locking…" : "Lock identity"}
        </Button>
      </div>
    </section>
  );
}

function SparkSlide({
  prompt,
  assetUrl,
  readonly,
  busy,
  onPrompt,
  onSpark,
}: {
  prompt: string;
  assetUrl: string;
  readonly: boolean;
  busy: Busy;
  onPrompt: (value: string) => void;
  onSpark: () => void;
}) {
  return (
    <section className={`${HUD_CARD} flex h-full flex-col p-5`}>
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-400/80">Slide 2</p>
      <h2 className="mt-1 font-display text-2xl">AI Asset & Hero Gen</h2>
      <p className="mt-2 text-sm text-slate-400">Describe the job-site still. The locked name, color, and logo ride along in the prompt.</p>
      <div className="mt-5">
        <Label htmlFor="bws-prompt">Scene</Label>
        <textarea
          id="bws-prompt"
          value={prompt}
          disabled={readonly}
          rows={4}
          className="mt-2 w-full rounded-xl border border-cyan-500/30 bg-slate-950/80 p-3 text-sm text-slate-100 outline-none"
          placeholder="Service van at dusk, shop mark on the door"
          onChange={(e) => onPrompt(e.target.value)}
        />
      </div>
      {assetUrl ? (
        <img src={assetUrl} alt="" className="mt-4 h-40 w-full rounded-xl object-cover" />
      ) : (
        <div className="mt-4 grid h-40 place-items-center rounded-xl border border-dashed border-cyan-500/25 text-sm text-slate-500">
          No still yet
        </div>
      )}
      <div className="mt-auto pt-6">
      <Button className="w-full" disabled={readonly || busy !== null} onClick={onSpark}>
        <Sparkles className="size-4" />
        {busy === "generate" ? "Sparking…" : "Spark Magic"}
      </Button>
      </div>
    </section>
  );
}

function LaunchSlide({
  name,
  primary,
  assetUrl,
  animate,
  builtAt,
  readonly,
  busy,
  onAnimate,
  onBuild,
}: {
  name: string;
  primary: string;
  assetUrl: string;
  animate: boolean;
  builtAt?: string;
  readonly: boolean;
  busy: Busy;
  onAnimate: (value: boolean) => void;
  onBuild: () => void;
}) {
  return (
    <section className={`${HUD_CARD} flex h-full flex-col p-5`}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-400/80">Slide 3</p>
          <h2 className="mt-1 font-display text-2xl">Live Launch</h2>
        </div>
        {builtAt ? <NeonBadge tone="emerald">Live</NeonBadge> : <NeonBadge tone="amber">Draft</NeonBadge>}
      </div>
      <p className="mt-3 text-sm text-slate-400">
        Publishes the immutable page: sticky header, Book / Call / Maps, approved proof, and the service list. Layout
        cannot be edited by the tenant.
      </p>
      <div className="mt-5 rounded-xl border border-cyan-500/20 bg-slate-950/70 p-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Locked snapshot</p>
        <p className="mt-2 text-lg">{name}</p>
        <p className="mt-1 font-mono text-xs" style={{ color: primary }}>
          {primary}
        </p>
      </div>
      <label className="mt-4 flex min-h-11 items-center gap-2 font-mono text-xs text-slate-300">
        <input type="checkbox" checked={animate} disabled={readonly} onChange={(e) => onAnimate(e.target.checked)} />
        Map still onto the catalog loop
      </label>
      <div className="mt-auto pt-6">
      <Button className="h-14 w-full text-base" disabled={readonly || busy !== null || !assetUrl} onClick={onBuild}>
        <Wand2 className="size-5" />
        {busy === "build" ? "Building…" : "Build This Web Page"}
      </Button>
      </div>
    </section>
  );
}
