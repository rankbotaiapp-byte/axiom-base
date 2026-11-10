import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TenantFrame from "@/components/TenantFrame";
import { getShowcase, showcaseSrc } from "@/lib/showcase";
import { getTenantBySlug } from "@/lib/tenants/store";

export const dynamic = "force-dynamic"; // branding edits in Supabase show on the next load

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTenantBySlug((await params).slug);
  if (!t) return { title: "Not found" };
  return {
    title: t.business_name,
    icons: t.logo_url ? [{ url: t.logo_url }] : undefined,
    robots: t.status === "active" ? undefined : { index: false },
  };
}

export default async function TenantSite({ params }: Props) {
  const tenant = await getTenantBySlug((await params).slug);
  const build = tenant ? getShowcase(tenant.build_id) : null;
  if (!tenant || !build || tenant.status === "suspended") notFound();

  if (tenant.status !== "active") {
    return (
      <main className="grid min-h-svh place-items-center bg-ink px-6 text-center">
        <div>
          {tenant.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tenant.logo_url} alt="" className="mx-auto mb-6 h-16 w-auto object-contain" />
          )}
          <h1 className="font-display text-3xl font-bold text-white">{tenant.business_name}</h1>
          <p className="mt-3 text-mist">
            {tenant.status === "pending_payment" ? "Finishing checkout — this page goes live as soon as payment clears." : "This site is being set up and will be live shortly."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <TenantFrame
      src={showcaseSrc(build, build.entry)}
      spec={build.brand}
      tenant={{ business_name: tenant.business_name, phone: tenant.phone, logo_url: tenant.logo_url }}
    />
  );
}
