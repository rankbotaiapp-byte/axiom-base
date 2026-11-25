import type { Metadata } from "next";
import { MasterStudioControl } from "@/components/studio/fx/MasterStudioControl";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Axiom Studio Control · Master Admin",
  description: "Global asset library, AI tuning, and tenant studio oversight.",
  robots: { index: false },
};

export default function MasterAdminStudioPage() {
  return <MasterStudioControl />;
}
