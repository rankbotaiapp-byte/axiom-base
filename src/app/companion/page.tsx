import type { Metadata } from "next";
import { OneClickSetup } from "@/components/OneClickSetup";
import { CompanionHero } from "@/components/CompanionHero";

export const metadata: Metadata = {
  title: "Select your assistant",
  description: "Choose an Executive, Operator, or Minimalist assistant for the desk.",
};

export default function CompanionPage() {
  return (
    <main className="min-h-dvh bg-bg px-4 py-10 sm:px-8">
      <CompanionHero />
      <div className="mt-10">
        <OneClickSetup />
      </div>
    </main>
  );
}
