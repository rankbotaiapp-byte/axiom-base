import { notFound } from "next/navigation";
import { getSql } from "@/lib/db";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ appointmentId: string }> };

function dollars(cents: number): string {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default async function PaidReceiptPage({ params }: PageProps) {
  const { appointmentId } = await params;
  const sql = await getSql();
  const rows = await sql<{
    id: string;
    payment_cents: number;
    customer_name: string;
    starts_at: string;
    shop_name: string;
    phone: string | null;
    address: string | null;
  }>`
    select a.id, a.payment_cents, a.customer_name, a.starts_at::text as starts_at,
           s.name as shop_name, s.phone, s.address
    from appointments a
    join shops s on s.id = a.shop_id
    where a.id = ${appointmentId} and a.payment_status = 'paid'
    limit 1
  `.catch(() => []);
  const row = rows[0];
  if (!row) notFound();

  return (
    <main className="min-h-dvh bg-[#050507] text-[#f4f7fb]">
      <div className="mx-auto flex max-w-md flex-col gap-5 px-4 py-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#00ffcc]">Paid receipt</p>
        <h1 className="text-2xl font-semibold">{row.shop_name}</h1>
        <section className="rounded-2xl border border-[#00ffcc]/25 bg-white/[0.03] p-5 text-sm">
          <p>Thanks {row.customer_name || "there"} — this job is marked paid.</p>
          <p className="mt-3 font-mono text-[#FFE500]">{dollars(row.payment_cents)}</p>
          {row.phone ? <p className="mt-4 text-white/60">Warranty / shop: {row.phone}</p> : null}
          {row.address ? <p className="text-white/45">{row.address}</p> : null}
        </section>
      </div>
    </main>
  );
}
