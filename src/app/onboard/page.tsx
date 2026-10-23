import Link from "next/link";
import { resolveDemoNiche } from "@/lib/axiom/preview-link";
import { NICHES } from "@/lib/axiom/niches";
import { flatSearch } from "../search";

export const dynamic = "force-dynamic";

function first(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export default async function OnboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = flatSearch(await searchParams);
  const niche = resolveDemoNiche(first(raw.niche)) ?? "field";
  const label = NICHES[niche].label;
  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-6 text-center text-fg">
      <div className="max-w-md">
        <p className="text-sm uppercase tracking-[0.2em] text-muted">Claim</p>
        <h1 className="mt-3 font-display text-4xl">{label}</h1>
        <p className="mt-4 text-muted">The preview stays open while the shop book is claimed.</p>
        <Link href={`/demo/${niche}?preview=true`} className="mt-6 inline-block text-sm text-fg">
          Back to the preview
        </Link>
      </div>
    </main>
  );
}
