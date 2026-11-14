import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getPortfolio } from "@/lib/axiom/server";
import { formatOffer, nicheCopy } from "@/lib/axiom/niches";
import { formatPhone, initials } from "@/lib/utils";
import { PoweredBy, ShopNav } from "@/components/shop-chrome";
import { useShopPageData } from "./route";

export const Route = createFileRoute("/$shopSlug/staff/$employeeId")({
  loader: async ({ params }) => {
    const items = await getPortfolio({ data: params.employeeId });
    return { items };
  },
  component: StaffPage,
});

function StaffPage() {
  const { employeeId } = Route.useParams();
  const { items } = Route.useLoaderData();
  const data = useShopPageData();
  const employee = data.employees.find((e) => e.id === employeeId);
  if (!employee) throw notFound();
  const copy = nicheCopy(data.shop.niche);
  const offered = data.services.filter(
    (s) => employee.serviceIds.includes(s.id) || employee.serviceIds.length === 0,
  );

  return (
    <main className="min-h-dvh bg-bg pb-16">
      <ShopNav shop={data.shop} mode="customer" />
      <div className="mx-auto max-w-4xl px-5 sm:px-8">
        <div className="flex flex-col gap-6 sm:flex-row">
          {employee.avatarUrl ? (
            <img
              src={employee.avatarUrl}
              alt=""
              className="h-72 w-full rounded-[28px] object-cover sm:h-80 sm:w-64"
            />
          ) : (
            <div className="grid h-72 w-full place-items-center rounded-[28px] bg-surface font-display text-5xl sm:h-80 sm:w-64">
              {initials(employee.displayName)}
            </div>
          )}
          <div className="flex-1 pt-2">
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted">{employee.title}</p>
            <h1 className="mt-2 font-display text-5xl leading-none">{employee.displayName}</h1>
            {employee.phone ? (
              <a
                href={`tel:${employee.phone}`}
                className="mt-3 inline-block text-sm tabular text-muted hover:text-fg"
              >
                {formatPhone(employee.phone)}
              </a>
            ) : null}
            <p className="mt-4 max-w-md text-muted">{employee.bio}</p>
            <Link
              to="/$shopSlug/book"
              params={{ shopSlug: data.shop.slug }}
              search={{ employee: employee.id }}
              className="mt-6 inline-flex h-12 items-center rounded-xl bg-fg px-5 text-sm font-medium text-bg"
            >
              {copy.bookLabel}
            </Link>
          </div>
        </div>

        <section className="mt-12">
          <h2 className="font-display text-2xl">{copy.menuHeading}</h2>
          <ul className="mt-4 divide-y divide-line">
            {offered.map((s) => (
              <li key={s.id} className="flex justify-between py-3 text-sm">
                <span>{s.name}</span>
                <span className="tabular text-muted">{formatOffer(s)}</span>
              </li>
            ))}
          </ul>
        </section>

        {items.length > 0 ? (
        <section className="mt-12">
          <h2 className="font-display text-2xl">{copy.gallery}</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {items.map((p) => (
              <figure key={p.id} className="overflow-hidden rounded-2xl">
                <img src={p.imageUrl} alt="" className="aspect-[4/3] w-full object-cover" />
                {p.caption ? (
                  <figcaption className="py-2 text-xs text-muted">{p.caption}</figcaption>
                ) : null}
              </figure>
            ))}
          </div>
        </section>
        ) : null}
      </div>
      <PoweredBy />
    </main>
  );
}
