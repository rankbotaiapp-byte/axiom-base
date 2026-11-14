import { createFileRoute } from "@tanstack/react-router";
import BrandStudioPage from "@/app/[shopSlug]/admin/brand-studio/page";

export const Route = createFileRoute("/$shopSlug/admin/brand-studio")({
  component: BrandStudioPage,
});
