import { createFileRoute } from "@tanstack/react-router";

/** Standalone cinematic demo: Wallwatch Pest Control wall-cam HUD. */
export const Route = createFileRoute("/wall-cam-pest")({
  head: () => ({
    meta: [
      { title: "Wallwatch Pest Control — Wall-Cam Hero" },
      {
        name: "description",
        content: "Tap the wall. See what is living behind it. Book the inspection from the live camera HUD.",
      },
    ],
  }),
  component: WallCamPestPage,
});

function WallCamPestPage() {
  return (
    <iframe
      src="/showcase/wall-cam-pest/index.html"
      title="Wallwatch Pest Control wall-cam"
      className="fixed inset-0 h-full w-full border-0 bg-black"
      allow="autoplay; fullscreen"
    />
  );
}
