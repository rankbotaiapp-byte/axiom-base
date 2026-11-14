import { NextResponse, type NextRequest } from "next/server";
import { runContentCycle } from "@/lib/content-engine/run";
import { getTenantBySlug, listTenants } from "@/lib/tenants/store";

export const maxDuration = 300;

/**
 * Daily (vercel.json) — tops up every active tenant's content queue and publishes
 * whatever is due. Also callable from /admin with ?slug= for a single tenant.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  const adminCookie = req.cookies.get("axiom_admin")?.value;
  const okCron = secret && auth === `Bearer ${secret}`;
  const okAdmin = process.env.ADMIN_TOKEN && adminCookie === process.env.ADMIN_TOKEN;
  if (!okCron && !okAdmin && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const slug = req.nextUrl.searchParams.get("slug");
  const tenants = slug ? [await getTenantBySlug(slug)].filter((t) => t !== null) : await listTenants({ status: ["active"] });

  const results = [];
  for (const t of tenants) {
    try {
      results.push(await runContentCycle(t));
    } catch (e) {
      results.push({ tenant: t.slug, error: (e as Error).message });
    }
  }
  return NextResponse.json({ ran: results.length, results });
}
