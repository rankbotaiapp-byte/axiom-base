import type { Metadata } from "next";
import { ShowcaseDemoChrome } from "@/components/showcase/ShowcaseDemoChrome";
import { CyberAugmentExperience, cyberAugmentAssets } from "@/components/cyber-augment";

export const metadata: Metadata = {
  title: "Private Personal Protection — Cyber-Augment Labs",
  description:
    "Precision-fitted cyberware, ballistic integration, and confidential 24/7 executive protection consultations.",
  openGraph: {
    title: "Private Personal Protection",
    description: "Tactical protection packages with cyber-girl hero and live booking.",
    images: [cyberAugmentAssets.heroPoster],
  },
};

export default function PrivateProtectionPage() {
  return (
    <ShowcaseDemoChrome slug="private-protection">
      <CyberAugmentExperience />
    </ShowcaseDemoChrome>
  );
}
