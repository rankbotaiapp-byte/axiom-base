import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createBooking, getTenantBySlug } from "@/lib/tenants/store";

const schema = z.object({
  slug: z.string().min(1).max(80),
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(7).max(30),
  service: z.string().trim().max(80).optional(),
  when: z.string().trim().max(80).optional(),
  message: z.string().trim().max(1000).optional(),
  company: z.string().max(0).optional(), // honeypot — must stay empty
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please check your name and phone number." }, { status: 400 });
  const d = parsed.data;
  const tenant = await getTenantBySlug(d.slug);
  if (!tenant || tenant.status === "paused") return NextResponse.json({ error: "Business not found" }, { status: 404 });

  await createBooking({
    business_id: tenant.slug,
    customer_name: d.name,
    phone: d.phone,
    message: [d.service && `Service: ${d.service}`, d.when && `Preferred: ${d.when}`, d.message].filter(Boolean).join("\n"),
    source: "axiom-web",
    status: "new",
  });
  return NextResponse.json({ ok: true });
}
