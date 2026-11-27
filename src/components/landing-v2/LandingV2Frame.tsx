"use client";

import { useSearchParams } from "next/navigation";

/** Full-bleed host for the exact landing-v2 document (carousel, HELP demo, calculator). */
export default function LandingV2Frame() {
  const search = useSearchParams();
  const qs = search.toString();
  const src = qs ? `/landing-v2.html?${qs}` : "/landing-v2.html";
  return (
    <iframe
      title="AXIOM"
      src={src}
      className="fixed inset-0 z-[80] h-[100dvh] w-full border-0 bg-[#050507]"
    />
  );
}
