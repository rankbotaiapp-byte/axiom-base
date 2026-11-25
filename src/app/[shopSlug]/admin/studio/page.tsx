"use client";

import { use, useEffect, useState } from "react";
import { TenantStudioDesk } from "@/components/studio/fx/TenantStudioDesk";
import { getOperatorData } from "@/lib/axiom/server";
import type { Shop } from "@/lib/axiom/types";

export default function TenantAdminStudioPage({
  params,
}: {
  params: Promise<{ shopSlug: string }>;
}) {
  const shopSlug = use(params).shopSlug || "demo";
  const [shop, setShop] = useState<Shop | null>(null);
  const [readonly, setReadonly] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void getOperatorData({ data: shopSlug })
      .then((next) => {
        if (cancelled) return;
        setShop(next.shop as Shop);
        setReadonly(next.mode === "preview" || Boolean((next.shop as Shop).isShowcase));
      })
      .catch(() => {
        if (cancelled) return;
        setShop({
          id: `shop_${shopSlug}`,
          slug: shopSlug,
          name: shopSlug,
          niche: "contractor",
        } as Shop);
        setReadonly(false);
      });
    return () => {
      cancelled = true;
    };
  }, [shopSlug]);

  if (!shop) {
    return (
      <main className="grid min-h-dvh place-items-center bg-[#050507]">
        <div className="h-10 w-48 animate-pulse rounded-full bg-white/10" />
      </main>
    );
  }

  return (
    <TenantStudioDesk
      shopSlug={shop.slug}
      shopName={shop.name}
      niche={shop.niche || "contractor"}
      readonly={readonly}
    />
  );
}
