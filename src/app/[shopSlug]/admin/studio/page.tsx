import { redirect } from "next/navigation";

export default async function TenantAdminStudioPage({
  params,
}: {
  params: Promise<{ shopSlug: string }>;
}) {
  const { shopSlug } = await params;
  redirect(`/${shopSlug || "demo"}/admin`);
}
