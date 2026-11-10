import { ImageResponse } from "next/og";
import { getTenantBySlug } from "@/lib/tenants/store";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = await getTenantBySlug(slug);
  const initials = (t?.name ?? "A").split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#03060b", backgroundImage: "radial-gradient(circle at 30% 20%, #134563, #03060b 70%)", color: "#e9f7ff", fontSize: 230, fontWeight: 800, letterSpacing: -8 }}>
        {initials}
      </div>
    ),
    { width: 512, height: 512 },
  );
}
