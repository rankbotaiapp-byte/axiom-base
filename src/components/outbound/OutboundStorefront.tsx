"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { ShieldCheck, Upload, Zap } from "lucide-react";
import {
  composeNeuralPrompt,
  decomposeStudioLayers,
  STUDIO_MATRIX,
  STUDIO_MATRIX_NICHES,
  type StudioMatrixNiche,
} from "@/lib/axiom/studio-engine";
import type { OutboundProfile } from "@/lib/axiom/outbound-preview";
import type { PreviewStock } from "@/lib/axiom/preview-stock";
import { STUDIO_TRIAL_PROMPT } from "@/lib/axiom/studio-credits";
import { TrialCheckoutDisclosure } from "@/components/legal-notice";
import { EmergencyDispatchBar } from "@/components/conversion/EmergencyDispatchBar";
import { InstantQuoteBookWidget } from "@/components/conversion/InstantQuoteBookWidget";
import { StorefrontBookingHost } from "@/components/conversion/StorefrontBookingHost";
import { FounderWelcomeStrip } from "@/components/conversion/FounderWelcomeStrip";
import { cn } from "@/lib/utils";

const PROOF_SLOTS = [
  { id: "latest", title: "Latest job", scene: "Finished job on site. Tools at rest. No people. Tenant mark on a real surface." },
  { id: "detail", title: "Material detail", scene: "Close detail of the trade material, wet reflections, and the finished edge." },
  { id: "truck", title: "The truck", scene: "Service truck at the curb. Wordmark on the door. Night street, volumetric smoke." },
] as const;

type ProofSlot = (typeof PROOF_SLOTS)[number]["id"];

function CornerFrame({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("relative border border-frame/80 bg-carbon", className)}>
      <span className="pointer-events-none absolute -left-px -top-px h-3.5 w-3.5 border-l-2 border-t-2 border-frame" />
      <span className="pointer-events-none absolute -right-px -top-px h-3.5 w-3.5 border-r-2 border-t-2 border-frame" />
      <span className="pointer-events-none absolute -bottom-px -left-px h-3.5 w-3.5 border-b-2 border-l-2 border-frame" />
      <span className="pointer-events-none absolute -bottom-px -right-px h-3.5 w-3.5 border-b-2 border-r-2 border-frame" />
      {children}
    </div>
  );
}

export function OutboundStorefront({
  profile,
  stock,
  studioUnlocked = false,
}: {
  profile: OutboundProfile;
  stock: PreviewStock;
  studioUnlocked?: boolean;
}) {
  const [name, setName] = useState(profile.businessName);
  const [niche, setNiche] = useState<StudioMatrixNiche>(profile.niche);
  const [step, setStep] = useState(0);
  const [photoName, setPhotoName] = useState("");
  const [heroStill, setHeroStill] = useState("");
  const [proof, setProof] = useState<Record<string, string>>({});
  const [slot, setSlot] = useState<ProofSlot | null>(null);
  const [busy, setBusy] = useState<"hero" | "slot" | "contact" | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactNote, setContactNote] = useState("");
  const [filed, setFiled] = useState(false);

  const displayName = name.trim() || profile.businessName;
  const entry = STUDIO_MATRIX[niche];
  const packet = useMemo(
    () => decomposeStudioLayers({ niche, shopName: displayName, tagline: profile.tagline }),
    [niche, displayName, profile.tagline],
  );
  const place = [profile.city, profile.county].filter(Boolean).join(", ");

  const trialHref = `/start?plan=starter&slug=${encodeURIComponent(profile.slug)}`;

  async function generateStill(scene: string, target: "hero" | ProofSlot) {
    setError("");
    setNotice("");
    if (!studioUnlocked) {
      setError(STUDIO_TRIAL_PROMPT);
      return;
    }
    setBusy(target === "hero" ? "hero" : "slot");
    const prompt = composeNeuralPrompt({
      niche,
      shopName: displayName,
      tagline: profile.tagline,
      sceneHint: photoName ? `${scene} Reference photo: ${photoName}.` : scene,
      medium: "image",
    });
    try {
      const response = await fetch("/api/studio/still", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          shopSlug: profile.slug,
          niche,
          shopName: displayName,
          tagline: profile.tagline,
          prompt,
        }),
      });
      const { handleGenerationGuardHttpStatus } = await import("@/lib/axiom/generation-checkout-client");
      if (await handleGenerationGuardHttpStatus(response.status, profile.slug)) return;
      const json = (await response.json().catch(() => ({}))) as { imageUrl?: string; error?: string };
      if (!response.ok || !json.imageUrl) throw new Error(json.error || "The still did not finish.");
      if (target === "hero") setHeroStill(json.imageUrl);
      else setProof((current) => ({ ...current, [target]: json.imageUrl! }));
      setNotice("The plate is live on this preview.");
      setSlot(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The still did not finish.");
    } finally {
      setBusy(null);
    }
  }

  function onPhoto(file: File | undefined, target: ProofSlot | "hero") {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Drop a JPEG, PNG, or WebP.");
      return;
    }
    setPhotoName(file.name.slice(0, 80));
    const url = URL.createObjectURL(file);
    if (target === "hero") setHeroStill(url);
    else setProof((current) => ({ ...current, [target]: url }));
    setError("");
  }

  async function onContact(event: FormEvent) {
    event.preventDefault();
    setBusy("contact");
    setError("");
    try {
      const response = await fetch("/api/preview/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: contactName,
          phone: contactPhone,
          message: contactNote,
          niche,
          city: profile.city,
          county: profile.county,
          slug: profile.slug,
        }),
      });
      const json = (await response.json().catch(() => ({}))) as { error?: string; stored?: boolean };
      if (!response.ok || !json.stored) throw new Error(json.error || "That request could not be filed.");
      setFiled(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "That request could not be filed.");
    } finally {
      setBusy(null);
    }
  }

  const bookPath = profile.phone ? `tel:${profile.phone.replace(/[^\d+]/g, "")}` : `#contact`;

  return (
    <StorefrontBookingHost
      shopSlug={profile.slug}
      shopName={displayName}
      bookPath={bookPath}
      themeId="sparta_gold"
    >
      <main className="min-h-dvh bg-[#050507] pb-[calc(5.5rem+env(safe-area-inset-bottom))] text-fg">
        <EmergencyDispatchBar city={place || profile.city} placement="bottom" />
        <FounderWelcomeStrip
          className="mx-4 mt-4"
          owner={profile.businessName}
          business={displayName}
          trade={entry.label}
          place={place || profile.city}
        />
        <HeroPlate
        name={displayName}
        place={place}
        nicheLabel={entry.label}
        line={profile.tagline}
        still={heroStill}
        stock={stock}
        environment={packet.layers[0].label}
        equipment={entry.equipment}
        phone={profile.phone}
      />

      <div className="relative z-20 mx-auto -mt-16 w-full max-w-xl px-4 sm:-mt-24">
        <CornerFrame className="bg-field/90 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.45)] backdrop-blur-md sm:p-5">
          <p className="font-display text-lg leading-snug text-fg">
            Want to customize this for your exact shop? Type your name, pick your trade, or drop a reference photo.
          </p>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            Step {step + 1} of 3
          </p>
          {step === 0 ? (
            <label className="mt-4 grid gap-2" htmlFor="outbound-shop-name">
              <span className="text-sm text-fg">Business name</span>
              <input
                id="outbound-shop-name"
                value={name}
                maxLength={48}
                onChange={(event) => setName(event.target.value)}
                className="min-h-11 border border-line bg-carbon px-3 text-fg outline-none focus:border-frame"
              />
              <button
                type="button"
                className="min-h-11 bg-frame px-4 text-sm font-medium text-field disabled:opacity-40"
                disabled={name.trim().length < 2}
                onClick={() => setStep(1)}
              >
                Use this name
              </button>
            </label>
          ) : null}
          {step === 1 ? (
            <fieldset className="mt-4">
              <legend className="text-sm text-fg">Trade</legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {STUDIO_MATRIX_NICHES.map((id) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={id === niche}
                    className={cn(
                      "min-h-11 border px-3 text-left text-sm",
                      id === niche ? "border-frame text-frame" : "border-line text-fg",
                    )}
                    onClick={() => {
                      setNiche(id);
                      setStep(2);
                    }}
                  >
                    {STUDIO_MATRIX[id].label}
                  </button>
                ))}
              </div>
            </fieldset>
          ) : null}
          {step === 2 ? (
            <div className="mt-4 grid gap-3">
              <label className="grid gap-2 text-sm text-fg" htmlFor="outbound-photo">
                Reference photo
                <input
                  id="outbound-photo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="min-h-11 text-sm text-muted file:mr-3 file:min-h-11 file:border-0 file:bg-frame file:px-3 file:text-field"
                  onChange={(event) => onPhoto(event.target.files?.[0], "hero")}
                />
              </label>
              {studioUnlocked ? null : <TrialCheckoutDisclosure />}
              <button
                type="button"
                className="min-h-11 bg-frame px-4 text-sm font-medium text-field disabled:opacity-40"
                disabled={busy !== null}
                onClick={() => void generateStill(entry.equipment, "hero")}
              >
                {busy === "hero" ? "Generating the plate…" : studioUnlocked ? "Generate the live plate" : "Start the $1 trial"}
              </button>
              {studioUnlocked ? null : (
                <a href={trialHref} className="inline-flex min-h-11 items-center text-sm text-frame">
                  $1 for 14 days, then $150 a month
                </a>
              )}
            </div>
          ) : null}
          {notice ? <p className="mt-3 text-sm text-ok">{notice}</p> : null}
          {error && !slot ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
        </CornerFrame>
      </div>

      <section className="mx-auto mt-10 max-w-5xl px-4">
        <InstantQuoteBookWidget shopName={displayName} niche={niche} />
      </section>

      <section className="mx-auto mt-10 max-w-5xl px-4" aria-labelledby="emergency-heading">
        <CornerFrame className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-frame">Emergency booking</p>
            <h2 id="emergency-heading" className="mt-2 font-display text-2xl text-fg">
              After-hours calls for {place}.
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
              The book stays open when the shop is dark. Name the job. The crew confirms the window.
            </p>
          </div>
          <a
            href={profile.phone ? `tel:${profile.phone.replace(/[^\d+]/g, "")}` : "#contact"}
            className="inline-flex min-h-11 items-center justify-center bg-frame px-5 text-sm font-medium text-field"
          >
            {profile.phone ? `Call ${profile.phone}` : "Request a visit"}
          </a>
        </CornerFrame>
      </section>

      <section className="mx-auto mt-8 grid max-w-5xl gap-3 px-4 sm:grid-cols-3" aria-label="Trust">
        {["Licensed", "Insured", "Local crew"].map((badge) => (
          <CornerFrame key={badge} className="flex items-center gap-3 px-4 py-4">
            <ShieldCheck className="text-hud" size={18} aria-hidden />
            <p className="font-display text-lg text-fg">{badge}</p>
          </CornerFrame>
        ))}
      </section>

      <section className="mx-auto mt-12 max-w-5xl px-4" aria-labelledby="proof-heading">
        <h2 id="proof-heading" className="font-display text-2xl text-fg">
          Proof of work
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Job photos sit here once the shop has them. Empty plates stay in the HUD until a still is generated or uploaded.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {PROOF_SLOTS.map((item) => {
            const image = proof[item.id];
            if (image) {
              return (
                <figure key={item.id} className="overflow-hidden border border-frame/70 bg-carbon">
                  <img src={image} alt={`${displayName} ${item.title}`} className="aspect-[4/5] w-full object-cover" />
                  <figcaption className="px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                    {item.title}
                  </figcaption>
                </figure>
              );
            }
            return (
              <button
                key={item.id}
                type="button"
                className="flex aspect-[4/5] flex-col items-start justify-between border border-dashed border-frame/80 bg-carbon px-4 py-4 text-left"
                onClick={() => {
                  setSlot(item.id);
                  setError("");
                }}
              >
                <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-frame">
                  <Zap size={14} aria-hidden />[{entry.label} proof of work]
                </span>
                <span className="text-sm leading-relaxed text-fg">
                  Showcase your latest project to boost local trust by 300%. Click to generate AI asset or upload photo.
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mx-auto mt-12 max-w-5xl px-4" aria-labelledby="reviews-heading">
        <h2 id="reviews-heading" className="font-display text-2xl text-fg">
          Customer reviews
        </h2>
        {profile.reviewScore && profile.reviewCount ? (
          <CornerFrame className="mt-5 px-5 py-5">
            <p className="font-display text-4xl text-fg">{profile.reviewScore.toFixed(1)}</p>
            <p className="mt-2 text-sm text-muted">
              {profile.reviewCount} public reviews on file for {displayName}.
            </p>
          </CornerFrame>
        ) : (
          <CornerFrame className="mt-5 px-5 py-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-frame">Reviews</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Reviews publish here after the first booked visits. Nothing is invented to fill the plate.
            </p>
          </CornerFrame>
        )}
      </section>

      <section id="contact" className="mx-auto mt-12 max-w-xl px-4 pb-20" aria-labelledby="contact-heading">
        <h2 id="contact-heading" className="font-display text-2xl text-fg">
          Contact {displayName}
        </h2>
        {filed ? (
          <p className="mt-4 text-sm text-ok">Request filed. The shop confirms the window.</p>
        ) : (
          <form className="mt-4 grid gap-3" onSubmit={(event) => void onContact(event)}>
            <label className="grid gap-2 text-sm text-fg" htmlFor="visitor-name">
              Your name
              <input
                id="visitor-name"
                value={contactName}
                required
                maxLength={80}
                onChange={(event) => setContactName(event.target.value)}
                className="min-h-11 border border-line bg-carbon px-3 outline-none focus:border-frame"
              />
            </label>
            <label className="grid gap-2 text-sm text-fg" htmlFor="visitor-phone">
              Phone
              <input
                id="visitor-phone"
                value={contactPhone}
                required
                inputMode="tel"
                autoComplete="tel"
                maxLength={24}
                onChange={(event) => setContactPhone(event.target.value)}
                className="min-h-11 border border-line bg-carbon px-3 outline-none focus:border-frame"
              />
            </label>
            <label className="grid gap-2 text-sm text-fg" htmlFor="visitor-note">
              What needs doing
              <textarea
                id="visitor-note"
                value={contactNote}
                maxLength={500}
                rows={4}
                onChange={(event) => setContactNote(event.target.value)}
                className="border border-line bg-carbon px-3 py-2 outline-none focus:border-frame"
              />
            </label>
            <button
              type="submit"
              className="min-h-11 bg-frame px-4 text-sm font-medium text-field disabled:opacity-40"
              disabled={busy !== null}
            >
              {busy === "contact" ? "Sending…" : "Send the request"}
            </button>
            {error && !slot ? <p className="text-sm text-danger">{error}</p> : null}
          </form>
        )}
      </section>

      {slot ? (
        <StudioSlotModal
          nicheLabel={entry.label}
          title={PROOF_SLOTS.find((item) => item.id === slot)?.title || "Proof"}
          busy={busy === "slot"}
          error={error}
          onClose={() => setSlot(null)}
          onUpload={(file) => {
            onPhoto(file, slot);
            setSlot(null);
          }}
          onGenerate={() => {
            const scene = PROOF_SLOTS.find((item) => item.id === slot)?.scene || entry.equipment;
            void generateStill(scene, slot);
          }}
        />
      ) : null}
      </main>
    </StorefrontBookingHost>
  );
}

function HeroPlate({
  name,
  place,
  nicheLabel,
  line,
  still,
  stock,
  environment,
  equipment,
  phone,
}: {
  name: string;
  place: string;
  nicheLabel: string;
  line: string;
  still: string;
  stock: PreviewStock;
  environment: string;
  equipment: string;
  phone: string;
}) {
  const reduce = useReducedMotion();
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 120, damping: 18 });
  const sy = useSpring(py, { stiffness: 120, damping: 18 });
  const rotateX = useTransform(sy, [-0.5, 0.5], [7, -7]);
  const rotateY = useTransform(sx, [-0.5, 0.5], [-9, 9]);
  const farX = useTransform(sx, (value) => value * 18);
  const farY = useTransform(sy, (value) => value * 12);
  const midX = useTransform(sx, (value) => value * 42);
  const midY = useTransform(sy, (value) => value * 28);
  const nearX = useTransform(sx, (value) => value * 70);
  const nearY = useTransform(sy, (value) => value * 40);

  return (
    <section
      className="relative min-h-[78vh] overflow-hidden bg-field"
      style={{ perspective: "1100px" }}
      onPointerMove={(event) => {
        if (reduce || event.pointerType === "touch") return;
        const rect = event.currentTarget.getBoundingClientRect();
        px.set((event.clientX - rect.left) / rect.width - 0.5);
        py.set((event.clientY - rect.top) / rect.height - 0.5);
      }}
      onPointerLeave={() => {
        px.set(0);
        py.set(0);
      }}
    >
      <motion.div className="absolute inset-0" style={{ rotateX: reduce ? 0 : rotateX, rotateY: reduce ? 0 : rotateY, transformStyle: "preserve-3d" }}>
        <motion.div className="absolute inset-0 bg-field" style={{ x: farX, y: farY, z: -40 }}>
          {still ? (
            <img src={still} alt="" className="h-full w-full object-cover opacity-70" />
          ) : (
            <video
              src={stock.loop}
              poster={stock.still}
              muted
              loop
              autoPlay
              playsInline
              className="h-full w-full object-cover opacity-80"
            />
          )}
          <div className="absolute inset-0 bg-field/45" />
        </motion.div>
        <motion.div
          className="absolute inset-8 border border-frame/70 bg-carbon/40"
          style={{ x: midX, y: midY, z: 12 }}
        >
          <p className="max-w-sm p-4 font-mono text-[10px] uppercase leading-relaxed tracking-[0.16em] text-frame">
            {environment}. {equipment}
          </p>
        </motion.div>
        <motion.div className="absolute inset-x-6 top-16 sm:inset-x-10 sm:top-20" style={{ x: nearX, y: nearY, z: 48 }}>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-frame">
            {nicheLabel} · {place}
          </p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold leading-tight text-fg sm:text-6xl">{name}</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted sm:text-base">{line}</p>
          <a
            href={phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : "#contact"}
            className="mt-6 inline-flex min-h-11 items-center bg-frame px-5 text-sm font-medium text-field"
          >
            Book an emergency visit
          </a>
        </motion.div>
      </motion.div>
    </section>
  );
}

function StudioSlotModal({
  nicheLabel,
  title,
  busy,
  error,
  onClose,
  onUpload,
  onGenerate,
}: {
  nicheLabel: string;
  title: string;
  busy: boolean;
  error: string;
  onClose: () => void;
  onUpload: (file: File) => void;
  onGenerate: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-field/80 p-4 sm:items-center" role="presentation" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="studio-slot-title"
        className="w-full max-w-md border border-frame bg-carbon p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-frame">{nicheLabel} studio</p>
        <h3 id="studio-slot-title" className="mt-2 font-display text-2xl text-fg">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Generate a still for this slot, or upload the job photo you already have.
        </p>
        <div className="mt-4 grid gap-2">
          <button
            type="button"
            className="min-h-11 bg-frame px-4 text-sm font-medium text-field disabled:opacity-40"
            disabled={busy}
            onClick={onGenerate}
          >
            {busy ? "Generating…" : "Generate this asset"}
          </button>
          <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 border border-frame px-4 text-sm text-frame">
            <Upload size={16} aria-hidden />
            Upload a photo
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onUpload(file);
              }}
            />
          </label>
        </div>
        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
        <button type="button" className="mt-4 min-h-11 text-sm text-muted" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
