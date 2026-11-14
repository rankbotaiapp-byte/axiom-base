import { createFileRoute } from "@tanstack/react-router";
import AutopilotSettingsPage from "@/app/[shopSlug]/admin/autopilot/page";

export const Route = createFileRoute("/$shopSlug/admin/autopilot")({
  component: AutopilotSettingsPage,
});
