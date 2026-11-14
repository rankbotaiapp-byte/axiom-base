"use client";

import { use, useEffect, useState } from "react";
import { AxiomRingProvider } from "@/components/axiom-ring";
import { getOperatorData } from "@/lib/axiom/server";
import { AdminShell, type OpData } from "@/routes/$shopSlug/admin";

/**
 * Operator desk for `/{shop-slug}/admin`.
 * Loads live shop/tenant records — no mock book, caps, or appointments.
 */
export default function ShopAdminPage({
  params,
}: {
  params: Promise<{ "shop-slug": string }>;
}) {
  const slug = use(params)["shop-slug"] || "demo";
  const [desk, setDesk] = useState<OpData | null>(null);
  const [readonly, setReadonly] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void getOperatorData({ data: slug })
      .then((next) => {
        if (cancelled) return;
        setDesk(next);
        setReadonly(next.mode !== "owner");
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (!desk) {
    return (
      <main className="grid min-h-dvh place-items-center bg-obsidian">
        <div className="h-10 w-48 animate-pulse rounded-full bg-fg/10" />
      </main>
    );
  }

  return (
    <AxiomRingProvider
      shopId={desk.shop.id}
      slug={desk.shop.slug}
      ringColor={desk.shop.ringColor}
      mode={desk.mode}
    >
      <AdminShell
        data={desk}
        readonly={readonly}
        onReload={() => {
          void getOperatorData({ data: slug })
            .then((next) => {
              setDesk(next);
              setReadonly(next.mode !== "owner");
            })
            .catch(() => undefined);
        }}
      />
    </AxiomRingProvider>
  );
}
