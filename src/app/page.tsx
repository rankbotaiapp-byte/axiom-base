import type { Metadata } from "next";
import { AxiomFreezeLanding } from "@/components/axiom-landing/freeze-landing/AxiomFreezeLanding";

export const metadata: Metadata = {
  title: "AXIOM — 24/7 booking for local trades",
  description:
    "Stop losing after-hours jobs. $1 trial: instant quote, AI booking, Autopilot SMS, Cha-Ching pipeline — then $150/mo.",
  openGraph: {
    title: "AXIOM — Stop losing after-hours jobs",
    description:
      "$1 trial for plumbers, roofers, HVAC, and electrical. Live demos, instant quote, and founder-backed support.",
    images: [{ url: "/media/hero-poster.jpg" }],
  },
};

/** Primary landing: freeze-particle hero, character reveal, Heart Machine, Master Dashboard CMS. */
export default function RootPage() {
  return <AxiomFreezeLanding studioHref="/axiom-studio" />;
}
