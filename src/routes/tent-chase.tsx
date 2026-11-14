import { createFileRoute } from "@tanstack/react-router";
import { TentSurvivalChaseHero } from "@/components/TentSurvivalChaseHero";

export const Route = createFileRoute("/tent-chase")({
  component: TentChasePage,
});

function TentChasePage() {
  return (
    <main className="min-h-dvh bg-bg">
      <TentSurvivalChaseHero />
    </main>
  );
}
