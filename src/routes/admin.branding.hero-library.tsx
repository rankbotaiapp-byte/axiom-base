import { createFileRoute } from "@tanstack/react-router";
import MasterHeroLibraryPage from "@/app/admin/branding/hero-library/page";

export const Route = createFileRoute("/admin/branding/hero-library")({
  component: MasterHeroLibraryPage,
});
