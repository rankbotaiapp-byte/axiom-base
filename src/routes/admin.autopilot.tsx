import { createFileRoute } from "@tanstack/react-router";
import MasterAutopilotPage from "@/app/admin/autopilot/page";

export const Route = createFileRoute("/admin/autopilot")({
  component: MasterAutopilotPage,
});
