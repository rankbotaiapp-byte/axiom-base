import { createFileRoute } from "@tanstack/react-router";
import HeroLibraryPage from "@/app/[shopSlug]/admin/branding/hero-library/page";

export const Route = createFileRoute("/$shopSlug/admin/branding/hero-library")({
  component: HeroLibraryPage,
});
