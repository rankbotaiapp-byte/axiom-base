"use client";

import { use, useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AxiomRingProvider } from "@/components/axiom-ring";
import { getOperatorData } from "@/lib/axiom/server";
import { AdminShell, type OpData } from "@/routes/$shopSlug/admin";

export default function TenantAdminPage({
  params,
}: {
  params: Promise<{ shopSlug: string }>;
}) {
  const slug = use(params).shopSlug || "demo";
  const reduce = useReducedMotion();
  const [desk, setDesk] = useState<OpData | null>(null);
  const [readonly, setReadonly] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void getOperatorData({ data: slug })
      .then((next) => {
        if (cancelled) return;
        setDesk(next);
        setReadonly(next.mode === "preview");
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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reduce ? 0 : 0.4 }}
      >
        <AdminShell
          data={desk}
          readonly={readonly}
          onReload={() => {
            void getOperatorData({ data: slug })
              .then((next) => {
                setDesk(next);
                setReadonly(next.mode === "preview");
              })
              .catch(() => undefined);
          }}
        />
      </motion.div>
    </AxiomRingProvider>
  );
}
