"use client";

import { useRouter } from "next/navigation";
import { TenantPreview, type TenantPreviewSearch } from "@/components/tenant-preview";
import type { ShopNiche } from "@/lib/axiom/types";

export function PreviewFrame({ niche, search }: { niche: ShopNiche; search: TenantPreviewSearch }) {
  const router = useRouter();
  const query = new URLSearchParams();
  if (search.preview) query.set("preview", "true");
  if (search.business) query.set("business", search.business);
  if (search.biz && !search.business) query.set("business", search.biz);
  if (search.city) query.set("city", search.city);
  const suffix = query.toString();
  return (
    <TenantPreview
      niche={niche}
      search={search}
      onNiche={(next) => {
        router.push(suffix ? `/demo/${next}?${suffix}` : `/demo/${next}`);
      }}
      claim={
        <a
          href={`/onboard?niche=${niche}`}
          className="inline-flex h-12 w-full shrink-0 items-center justify-center rounded-xl bg-fg px-5 text-sm font-medium text-bg sm:w-auto"
        >
          Claim This Storefront for Your Business
        </a>
      }
    />
  );
}
