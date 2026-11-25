import { shopCity } from "@/lib/axiom/avatar";
import { parseShowcaseThemeId } from "@/lib/axiom/outreach-desk";
import { previewStockForBusiness } from "@/lib/axiom/preview-stock";
import { TradeShowcase } from "./trade-showcase";

export type TradeShowcasePageShop = {
  slug: string;
  name: string;
  niche: string;
  tagline?: string;
  description?: string;
  address?: string;
  accent?: string;
  ringColor?: string;
  neonAccent?: string;
  heroImageUrl?: string;
  heroVideoUrl?: string | null;
  phone?: string;
  showcaseThemeId?: string;
};

export function TradeShowcasePage({ shop }: { shop: TradeShowcasePageShop }) {
  const city = shopCity(shop.address || "");
  const stock = previewStockForBusiness({
    niche: shop.niche,
    businessName: shop.name,
    city,
    accent: shop.neonAccent || shop.accent || shop.ringColor,
    heroImageUrl: shop.heroImageUrl,
  });
  const themeId = parseShowcaseThemeId(
    shop.showcaseThemeId ||
      (shop.ringColor === "#00ffcc" ? "pure_cyan" : shop.ringColor === "#FF9900" ? "emergency_amber" : shop.ringColor === "#3d7eff" ? "cobalt_ice" : "solar_gold"),
  );
  return (
    <TradeShowcase
      businessName={shop.name}
      niche={shop.niche}
      city={city}
      phone={shop.phone}
      headline={shop.tagline || undefined}
      subcopy={shop.description || undefined}
      posterUrl={shop.heroImageUrl || stock.still}
      videoUrl={shop.heroVideoUrl || stock.loop}
      bookHref={`/${shop.slug}/book`}
      iconUrl={shop.heroImageUrl || stock.still}
      themeId={themeId}
    />
  );
}

export default TradeShowcasePage;
