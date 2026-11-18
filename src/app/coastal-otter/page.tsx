import type { Metadata } from "next";
import { ShowcaseDemoChrome } from "@/components/showcase/ShowcaseDemoChrome";
import { OtterExperience } from "@/components/otter";
import { OTTER_CONFIG } from "@/lib/otter/config";

export const metadata: Metadata = {
  title: `${OTTER_CONFIG.brand.name} — Coastal Otter Adventures`,
  description: OTTER_CONFIG.brand.tagline,
  openGraph: {
    title: "Coastal Otter Adventures",
    description: OTTER_CONFIG.brand.tagline,
    images: [OTTER_CONFIG.media.poster],
  },
};

export default function CoastalOtterPage() {
  return (
    <ShowcaseDemoChrome slug="coastal-otter" contentClassName="!p-0">
      <div className="relative h-[calc(100dvh-3.5rem-6.5rem)] min-h-[28rem]">
        <OtterExperience embedded />
      </div>
    </ShowcaseDemoChrome>
  );
}
