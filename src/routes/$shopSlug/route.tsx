import { createContext, useContext, useEffect, useRef, useState } from "react";
import { createFileRoute, Link, Outlet, notFound } from "@tanstack/react-router";
import { AxiomRing, AxiomRingProvider, useAxiomRing } from "@/components/axiom-ring";
import { getPublicShop, getShopAccess } from "@/lib/axiom/server";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import type { AccessMode, ShopPublic } from "@/lib/axiom/types";
import { Button } from "@/components/ui/button";

const LiveShopContext = createContext<ShopPublic | null>(null);

export function useShopPageData() {
  const live = useContext(LiveShopContext);
  const loader = Route.useLoaderData();
  return live ?? loader;
}

function shopSnapshot(data: ShopPublic) {
  return JSON.stringify({
    shop: data.shop,
    services: data.services,
    employees: data.employees,
  });
}

function useLiveShop(initial: ShopPublic) {
  const [data, setData] = useState(initial);
  const slug = initial.shop.slug;
  const initialRef = useRef(initial);
  initialRef.current = initial;

  useEffect(() => {
    setData(initialRef.current);
  }, [slug]);

  useEffect(() => {
    let stop = false;
    const id = window.setInterval(() => {
      void getPublicShop({ data: slug })
        .then((next) => {
          if (!next || stop) return;
          setData((prev) => (shopSnapshot(prev) === shopSnapshot(next) ? prev : next));
        })
        .catch(() => undefined);
    }, 8000);
    return () => {
      stop = true;
      window.clearInterval(id);
    };
  }, [slug]);

  return data;
}

export const Route = createFileRoute("/$shopSlug")({
  loader: async ({ params }) => {
    const data = await getPublicShop({ data: params.shopSlug });
    if (!data) throw notFound();
    return data;
  },
  component: ShopLayout,
  notFoundComponent: () => (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <p className="font-display text-3xl">No shop at this address.</p>
        <Link to="/" className="mt-4 inline-block text-sm text-muted hover:text-fg">
          Back to Axiom
        </Link>
      </div>
    </main>
  ),
});

function ShopLayout() {
  const initial = Route.useLoaderData();
  const data = useLiveShop(initial);
  const { user, isPending } = useCurrentUserState();
  const [mode, setMode] = useState<AccessMode>("customer");

  useEffect(() => {
    if (isPending) return;
    if (!user) {
      setMode("customer");
      return;
    }
    void getShopAccess({ data: data.shop.slug })
      .then((a) => setMode(a.mode === "none" ? "customer" : a.mode))
      .catch(() => setMode("customer"));
  }, [data.shop.slug, isPending, user]);

  return (
    <LiveShopContext.Provider value={data}>
      <AxiomRingProvider
        shopId={data.shop.id}
        slug={data.shop.slug}
        ringColor={data.shop.ringColor}
        mode={mode}
      >
        <AxiomRing />
        <AcceptBar slug={data.shop.slug} mode={mode} />
        <Outlet />
      </AxiomRingProvider>
    </LiveShopContext.Provider>
  );
}

function AcceptBar({ slug, mode }: { slug: string; mode: AccessMode }) {
  const { state, accept, message } = useAxiomRing();
  const staff = mode === "owner" || mode === "employee" || mode === "preview";
  const show =
    staff && (state === "pulse" || state === "awaiting" || message === "New booking request");
  if (!show) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto flex w-full max-w-md items-center justify-between gap-3 rounded-2xl bg-surface p-3 shadow-[0_0_0_1px_rgba(243,241,235,0.12)]">
        <div>
          <p className="text-sm font-medium">Incoming booking</p>
          <p className="text-xs text-muted">Accept to lock the ring and notify the guest.</p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            void accept().catch(() => undefined);
          }}
        >
          Accept
        </Button>
      </div>
    </div>
  );
}
