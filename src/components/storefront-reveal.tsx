import { usesOutdoorGuide } from "@/components/outdoor-guide-studio";
import { SwipeRevealHero } from "@/components/SwipeRevealHero";
import { WaterRippleHero } from "@/components/WaterRippleHero";
import { usesCeramicReveal } from "@/lib/axiom/ceramic-reveal";
import { usesRiverReveal } from "@/lib/axiom/river-reveal";

/** The interactive hero for a storefront, when this niche has one. */
export function storefrontRevealHero(niche: string, text = "") {
  if (usesCeramicReveal(niche, text)) {
    return (
      <SwipeRevealHero
        baseVideoSrc="/media/heroes/car-pristine-base.mp4"
        coverImageSrc="/media/heroes/car-mud-cover.png"
        poster="/media/heroes/car-pristine-base.jpg"
        badgeText="ACTIVE INTERACTION: UNVEIL THE MIRROR FINISH."
        heading="Absolute Ceramic Armor"
        subheading="Swipe across the mud and grime layer to reveal the pristine, mirror-finish ceramic coat underneath."
        scratchLabel="Swipe the mud and grime to reveal the mirror finish"
      />
    );
  }
  if (usesRiverReveal(niche, text)) {
    return (
      <WaterRippleHero
        baseVideoSrc="/media/heroes/river-hawk-base.mp4"
        poster="/media/heroes/river-hawk-base.jpg"
        coverImageSrc="/media/heroes/river-hawk-cover.jpg"
        badgeText="ACTIVE INTERACTION: RIVER RIPPLE."
        heading="River Hawk Guides"
        subheading="Drag across the water. Ripples spread through the current."
      />
    );
  }
  if (usesOutdoorGuide(niche, text)) {
    return (
      <SwipeRevealHero
        baseVideoSrc="/media/heroes/owl_midnight_dive.mp4"
        coverImageSrc="/media/heroes/pine-brush-cover.png"
        badgeText="ACTIVE INTERACTION: UNVEIL THE WILDLIFE."
        heading="The Silent Apex Predator"
        subheading="Swipe across the canopy brush to uncover the hidden wildlife below."
        scratchLabel="Swipe the pine brush to reveal the owl and the prey"
      />
    );
  }
  return undefined;
}
