import { createFileRoute } from "@tanstack/react-router";
import HeroStudioPage from "@/app/[shopSlug]/admin/hero-studio/page";

export const Route = createFileRoute("/$shopSlug/admin/hero-studio")({
  component: HeroStudioPage,
});
