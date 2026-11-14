import { useState, type ReactNode } from "react";
import { motion, useReducedMotion, useTransform } from "framer-motion";
import { useBiokineticEngine } from "@/hooks/use-biokinetic-engine";
import { DEFAULT_HUD, type StorefrontHud } from "@/lib/axiom/hud";
import { isOutdoorGuideNiche } from "@/lib/axiom/media";
import { SwipeRevealHero } from "@/components/SwipeRevealHero";

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
  hero,
  children,
}: {
  businessName: string;
  bookHref?: string;
  services?: readonly GuideOffer[];
  hud?: StorefrontHud;
  hero?: ReactNode;
  children?: ReactNode;
}) {
  const offers = services && services.length > 0 ? services : DEFAULT_OFFERS;
  const reduce = useReducedMotion();
  const biokinetic = useBiokineticEngine({ cameraGranted: false, reducedMotion: reduce });
  const [index, setIndex] = useState(0);
  const offer = offers[index] ?? offers[0];
  const frameScale = useTransform(biokinetic.cameraDollyScale, [1, 1.16], [1, 1.48]);
  const frameFade = useTransform(biokinetic.cameraDollyScale, [1, 1.16], [1, 0.35]);
  const cardLift = useTransform(biokinetic.cameraDollyScale, [1, 1.16], [18, -28]);

  return (
    <section className="outdoor-stage is-prey" aria-label="Outdoor guide studio" data-asset="owl_midnight_dive.mp4" data-depth={hud.depth}>
      {hero ?? (
        <SwipeRevealHero
          baseVideoSrc="/media/heroes/owl_midnight_dive.mp4"
          coverImageSrc="/media/heroes/pine-brush-cover.png"
          badgeText="ACTIVE INTERACTION: UNVEIL THE WILDLIFE."
          heading="The Silent Apex Predator"
          subheading="Swipe across the canopy brush to uncover the hidden wildlife below."
        />
      )}
      <motion.div className="outdoor-rig pointer-events-none" style={{ scale: biokinetic.cameraDollyScale }}>
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
