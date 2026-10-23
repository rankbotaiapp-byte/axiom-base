import Link from "next/link";
import { notFound } from "next/navigation";
import { NICHES, PUBLIC_NICHE_ORDER } from "@/lib/axiom/niches";
import { parseFunnelSearch } from "@/lib/axiom/funnel";
import { resolveDemoNiche } from "@/lib/axiom/preview-link";
import { flatSearch } from "./search";
import { PreviewFrame } from "./preview-frame";

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function IndexPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const search = parseFunnelSearch(flatSearch(raw));
  if (search.preview || search.business) {
    const niche = resolveDemoNiche(first(raw.niche) || "auto-repair");
    if (!niche) notFound();
    return <PreviewFrame niche={niche} search={search} />;
  }

  return (
    <main className="min-h-dvh bg-bg px-6 py-16 text-fg">
      <p className="text-sm uppercase tracking-[0.2em] text-muted">Axiom</p>
      <h1 className="mt-3 max-w-3xl font-display text-5xl leading-tight">Storefront previews</h1>
      <p className="mt-4 max-w-xl text-muted">
        Open a trade with its film, mark, and glass. Auto repair is on the field template.
      </p>
      <ul className="mt-10 grid max-w-5xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <li>
          <Link
            href="/demo/auto-repair?preview=true&business=Auto%20Repair"
            className="block rounded-2xl bg-surface px-4 py-4 text-fg"
          >
            Auto repair
          </Link>
        </li>
        {PUBLIC_NICHE_ORDER.map((niche) => (
          <li key={niche}>
            <Link
              href={`/demo/${niche}?preview=true&business=${encodeURIComponent(NICHES[niche].defaultName)}`}
              className="block rounded-2xl bg-surface px-4 py-4 text-fg"
            >
              {NICHES[niche].label}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
