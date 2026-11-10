import Link from "next/link";
import { RunCycleButton } from "@/components/funnel/RunCycleButton";
import { countBookings, isDemoMode, listPosts, listTenants } from "@/lib/tenants/store";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin", robots: { index: false } };

/** Content-engine control room. Mount alongside the existing AXIOM admin routes. */
export default async function Admin() {
  const tenants = await listTenants();
  const rows = await Promise.all(
    tenants.map(async (t) => {
      const [posts, bookings] = await Promise.all([listPosts(t.id, { limit: 30 }), countBookings(t.slug)]);
      return { t, posts, bookings };
    }),
  );
  return (
    <main className="ambient min-h-svh px-5 py-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="display text-3xl">Tenants & content engine</h1>
        {isDemoMode ? <p className="mt-2 text-sm text-[#ffb36b]">Demo mode — in-memory data. Set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY to persist.</p> : null}
        <div className="mt-8 space-y-4">
          {rows.map(({ t, posts, bookings }) => {
            const scheduled = posts.filter((p) => p.status === "scheduled");
            const failed = posts.filter((p) => p.status === "failed");
            return (
              <section key={t.id} className="glass p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <Link href={`/b/${t.slug}`} className="text-lg font-semibold hover:underline">{t.name}</Link>
                    <p className="text-sm text-white/55">{t.city}, {t.region} · {t.plan} · <span className={t.status === "active" ? "text-[#7fe3a8]" : "text-[#ffb36b]"}>{t.status}</span></p>
                  </div>
                  <RunCycleButton slug={t.slug} />
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  <div><dt className="text-white/45">Bookings</dt><dd className="text-xl">{bookings}</dd></div>
                  <div><dt className="text-white/45">Published</dt><dd className="text-xl">{posts.filter((p) => p.status === "published").length}</dd></div>
                  <div><dt className="text-white/45">Queued</dt><dd className="text-xl">{scheduled.length}</dd></div>
                  <div><dt className="text-white/45">Failed</dt><dd className="text-xl">{failed.length}</dd></div>
                </dl>
                {scheduled.length ? (
                  <ul className="mt-4 space-y-1 text-sm text-white/65">
                    {scheduled.filter((p) => p.kind === "article").slice(0, 5).map((p) => (
                      <li key={p.id}>{new Date(p.scheduledFor).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })} — {p.title}</li>
                    ))}
                  </ul>
                ) : null}
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
