import type { Metadata } from "next";
import { ShowcaseDemoChrome } from "@/components/showcase/ShowcaseDemoChrome";
import { AbyssalSanctuary } from "@/components/abyssal";

export const metadata: Metadata = {
  title: "Abyssal Ocean & Marine — Guided Reef Dives",
  description:
    "Guided reef dives with a live touchable reef feed: ripple the water, lock on to the shark, make the octopus ink.",
  openGraph: {
    title: "Abyssal Ocean & Marine",
    description: "Shark & octopus underwater expeditions with live booking.",
    images: ["/media/hero-poster.jpg"],
  },
};

export default function AbyssalOceanPage() {
  return (
    <ShowcaseDemoChrome slug="abyssal-ocean">
      <AbyssalSanctuary />
    </ShowcaseDemoChrome>
  );
}
