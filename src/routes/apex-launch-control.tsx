import { createFileRoute } from "@tanstack/react-router";
import { ApexLaunchHero } from "@/components/apex-launch-hero";

export const Route = createFileRoute("/apex-launch-control")({
  component: ApexLaunchControlPage,
  head: () => ({
    meta: [
      { title: "Apex Launch Control" },
      {
        name: "description",
        content: "The 911 GT3. Unleashed. Automotive performance launch desk.",
      },
    ],
  }),
});

function ApexLaunchControlPage() {
  return <ApexLaunchHero />;
}
