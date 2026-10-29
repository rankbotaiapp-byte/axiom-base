import {
  Axe,
  Car,
  CircuitBoard,
  Cog,
  Droplets,
  Factory,
  Fence,
  Flame,
  Hammer,
  HardHat,
  Mountain,
  PawPrint,
  Scissors,
  Shield,
  Snowflake,
  Target,
  Trees,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { ShopNiche } from "@/lib/axiom/types";

const ICONS: Record<ShopNiche, LucideIcon> = {
  auto: Car,
  barber: Scissors,
  "bow-tech": Target,
  canine: PawPrint,
  contractor: HardHat,
  electrical: Zap,
  fabrication: Factory,
  forestry: Trees,
  glasswork: Snowflake,
  hvac: Flame,
  landscaping: Fence,
  machining: Cog,
  plumbing: Droplets,
  "power-sports": Mountain,
  roofing: HardHat,
  security: Shield,
  "stone-masonry": Axe,
  taxidermy: PawPrint,
  "tool-repair": Wrench,
  "water-systems": Droplets,
  woodworking: Hammer,
};

export function nicheIcon(key: ShopNiche): LucideIcon {
  return ICONS[key] ?? CircuitBoard;
}
