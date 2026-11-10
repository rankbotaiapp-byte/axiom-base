import { createFileRoute, Link } from "@tanstack/react-router";
import { StartForm } from "@/components/funnel/StartForm";
import { nicheIds, niches, plans, site, type PlanId } from "@/config/storefront";

function parsePlan(raw: unknown): PlanId {
  return typeof raw === "string" && raw in plans ? (raw as PlanId) : "starter";
}

export const Route = createFileRoute("/start")({
  validateSearch: (search: Record<string, unknown>): { plan: PlanId } => ({
    plan: parsePlan(search.plan),
  }),
  head: () => ({
    meta: [
      { title: `Launch your app · ${site.name}` },
      { name: "robots", content: "noindex,follow" },
    ],
  }),
  component: StartPage,
});

function StartPage() {
  const { plan } = Route.useSearch();
  const p = plans[plan];
  return (
    <main className="ambient min-h-svh px-5 py-8">
      <div className="mx-auto max-w-xl">
        <Link to="/" className="display text-xl text-[var(--color-frost,#e9f7ff)]">
          {site.name}
          <span className="text-[var(--color-ice,#38c8ff)]">.</span>
        </Link>
        <p className="eyebrow mt-10">{p.label}</p>
        <h1 className="display mt-3 text-4xl text-white sm:text-5xl">Let's launch your app.</h1>
        <p className="mt-3 text-white/65">
          {p.price} — {p.fine}. Your booking app is live the moment you finish.
        </p>
        <StartForm plan={plan} niches={nicheIds.map((id) => ({ id, label: niches[id].label }))} />
      </div>
    </main>
  );
}
