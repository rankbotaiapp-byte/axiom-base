import { NextResponse } from "next/server";
import { buildAxiomVcard } from "@/lib/axiom/axiom-business-number";
import { readAxiomBusinessNumber } from "@/lib/axiom/axiom-business-number.server";
import { cleanShopSlug } from "@/lib/axiom/hydrate-storefront";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const slug = cleanShopSlug((await context.params).slug || "");
  if (!slug) return NextResponse.json({ error: "Unknown shop" }, { status: 400 });
  const record = await readAxiomBusinessNumber(slug);
  if (!record?.e164) {
    return NextResponse.json({ error: "Axiom Business Number is not assigned yet." }, { status: 404 });
  }
  const body = buildAxiomVcard({ businessName: record.businessName, e164: record.e164 });
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="axiom-${slug}-dispatch.vcf"`,
      "Cache-Control": "no-store",
    },
  });
}
