import type { Metadata } from "next";
import { Suspense } from "react";
import LandingV2Frame from "@/components/landing-v2/LandingV2Frame";

export const metadata: Metadata = {
  title: "AXIOM — 24/7 booking storefronts for local trades",
  description:
    "Axiom turns your business into a 24/7 customer-booking machine: a live storefront, AI receptionist and autopilot social posts, live in minutes.",
};

/** Production landing: 7-phone carousel, HELP SMS demo, lost-job calculator. */
export default function Home() {
  return (
    <Suspense fallback={null}>
      <LandingV2Frame />
    </Suspense>
  );
}
