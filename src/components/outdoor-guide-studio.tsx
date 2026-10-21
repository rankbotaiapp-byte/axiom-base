import { useState, type ReactNode } from "react";
import { motion, useMotionTemplate, useReducedMotion, useTransform } from "framer-motion";
import { useBiokineticEngine } from "@/hooks/use-biokinetic-engine";
import { DEPTH_STEPS, DEFAULT_HUD, type StorefrontHud } from "@/lib/axiom/hud";
import { isOutdoorGuideNiche, NICHE_MEDIA } from "@/lib/axiom/media";

const FILM = NICHE_MEDIA.hunting.heroVideoUrl;

const DEFAULT_OFFERS = [
  { name: "Half day", description: "A morning or an evening on private ground.", price: "$350" },
  { name: "Full day", description: "Dawn to dark. The guide, the ground, and the plan.", price: "$650" },
  { name: "Scouting walk", description: "A look at the ground before the hunt day.", price: "$180" },
] as const;

export type GuideOffer = {
  name: string;
  description: string;
  price: string;
};

/** The Sasquatch studio replaces the cinematic hero for the hunting guide book. */
export function usesOutdoorGuide(niche: string, text = ""): boolean {
  return isOutdoorGuideNiche(niche) || isOutdoorGuideNiche(text);
}

export function OutdoorGuideStudio({
  businessName,
  bookHref,
  services,
  hud = DEFAULT_HUD,
  children,
}: {
  businessName: string;
  bookHref?: string;
  services?: readonly GuideOffer[];
  hud?: StorefrontHud;
  children?: ReactNode;
}) {
  const offers = services && services.length > 0 ? services : DEFAULT_OFFERS;
  const reduce = useReducedMotion();
  const biokinetic = useBiokineticEngine({ cameraGranted: false, reducedMotion: reduce });
  const [index, setIndex] = useState(0);
  const offer = offers[index] ?? offers[0];
  const feather = DEPTH_STEPS[hud.depth] ?? 1.25;
  const canopyBlur = useMotionTemplate`blur(calc(${feather * 10}px + ${biokinetic.backdropBlurAmount}px))`;
  const frameScale = useTransform(biokinetic.cameraDollyScale, [1, 1.16], [1, 1.48]);
  const frameFade = useTransform(biokinetic.cameraDollyScale, [1, 1.16], [1, 0.35]);
  const cardLift = useTransform(biokinetic.cameraDollyScale, [1, 1.16], [18, -28]);

  return (
    <section className="outdoor-stage" aria-label="Outdoor guide studio" data-asset="hunting-guide.mp4">
      <motion.div className="outdoor-rig" style={{ scale: biokinetic.cameraDollyScale }}>
        <motion.div className="outdoor-canopy" style={{ filter: canopyBlur }}>
          <video src={FILM} muted playsInline autoPlay loop className="h-full w-full object-cover" />
        </motion.div>
        <div className="outdoor-subject">
          <video src={FILM} muted playsInline autoPlay loop className="h-full w-full object-cover" />
        </div>
        <motion.div className="outdoor-frame" style={{ scale: frameScale, opacity: frameFade }} aria-hidden />
      </motion.div>
      <div className="relative z-10">{children}</div>
      <motion.div className="outdoor-hud" style={{ y: cardLift }}>
        <p className="text-[11px] uppercase tracking-[0.22em] text-accent">Tactical book</p>
        <div className="outdoor-cards">
          {offers.map((item, itemIndex) => (
            <button
              key={item.name}
              type="button"
              className={itemIndex === index ? "outdoor-card is-on" : "outdoor-card"}
              aria-pressed={itemIndex === index}
              onClick={() => setIndex(itemIndex)}
            >
              <span className="block text-sm font-medium text-fg">{item.name}</span>
              <span className="mt-1 block text-xs text-muted">{item.description}</span>
              <span className="mt-2 block text-sm text-accent">{item.price}</span>
            </button>
          ))}
        </div>
        <a className="outdoor-book" href={bookHref || "#book"}>
          Book {offer?.name ?? businessName}
        </a>
      </motion.div>
    </section>
  );
}
