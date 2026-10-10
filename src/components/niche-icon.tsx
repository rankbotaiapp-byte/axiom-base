import {
  AppWindow,
  Briefcase,
  Brush,
  CalendarRange,
  Camera,
  Compass,
  Dumbbell,
  Flower2,
  GraduationCap,
  HardHat,
  HeartPulse,
  Mic,
  PawPrint,
  Scissors,
  Shield,
  ShoppingBag,
  Sparkles,
  SprayCan,
  Store,
  Truck,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { ShopNiche } from "@/lib/axiom/types";

const ICONS: Record<ShopNiche, LucideIcon> = {
  guide: Compass,
  fitness: Dumbbell,
  wellness: Flower2,
  lessons: GraduationCap,
  salon: Scissors,
  beauty: Sparkles,
  tattoo: Brush,
  photo: Camera,
  pets: PawPrint,
  music: Mic,
  events: CalendarRange,
  contractor: HardHat,
  clean: SprayCan,
  field: Truck,
  security: Shield,
  practice: HeartPulse,
  counsel: Briefcase,
  location: Store,
  studio: AppWindow,
  retail: ShoppingBag,
  trade: Wrench,
};

export function nicheIcon(key: ShopNiche): LucideIcon {
  return ICONS[key];
}
