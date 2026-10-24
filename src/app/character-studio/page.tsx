import type { Metadata } from "next";
import { OneClickSetup } from "@/components/OneClickSetup";

export const metadata: Metadata = {
  title: "Select your assistant",
  description: "Choose an Executive, Operator, or Minimalist assistant for the desk.",
};

export default function CharacterStudioPage() {
  return (
    <main className="min-h-dvh bg-bg px-4 py-10 sm:px-8">
      <OneClickSetup />
    </main>
  );
}
