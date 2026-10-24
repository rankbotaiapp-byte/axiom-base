import { createContext, useContext, useEffect, useRef, useState } from "react";
import { createFileRoute, isNotFound, Link, Outlet, notFound } from "@tanstack/react-router";
import { AxiomRing, AxiomRingProvider, useAxiomRing } from "@/components/axiom-ring";
import { rippleTheme } from "@/lib/axiom/brand-studio";
import { getPublicShop, getShopAccess } from "@/lib/axiom/server";
import { isDatabaseUnavailable } from "../../../scripts/db-availability.mjs";
import { isClientAbort } from "@/lib/client-abort";
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
  loader: async ({ params, abortController }) => {
    try {
      const data = await getPublicShop({ data: params.shopSlug });
      if (abortController.signal.aborted || !data) throw notFound();
      return {
        ...data,
        services: data.services ?? [],
        employees: data.employees ?? [],
        shop: {
          ...data.shop,
          hours: data.shop.hours && typeof data.shop.hours === "object" ? data.shop.hours : {},
          heroImageUrl: data.shop.heroImageUrl || "",
          heroBlendPercent: Number.isFinite(data.shop.heroBlendPercent) ? data.shop.heroBlendPercent : 60,
          introSpeed: Number.isFinite(data.shop.introSpeed) ? data.shop.introSpeed : 40,
          introIntensity: Number.isFinite(data.shop.introIntensity) ? data.shop.introIntensity : 45,
        },
      };
    } catch (error) {
      if (isNotFound(error)) throw error;
      if (abortController.signal.aborted || isClientAbort(error)) throw notFound();
      if (isDatabaseUnavailable(error)) {
        console.warn(
          `[shop] hosted database is paused; /${params.shopSlug} stays closed until it accepts connections`,
        );
        throw notFound();
      }
      console.error(`[shop] failed to load /${params.shopSlug}`, error);
      const message = error instanceof Error && error.message ? error.message : "Shop data is temporarily unavailable";
      throw new Error(message);
    }
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
  const [employeeId, setEmployeeId] = useState<string | null>(null);

  useEffect(() => {
    if (isPending) return;
    if (!user) {
      setMode("customer");
      setEmployeeId(null);
      return;
    }
    void getShopAccess({ data: data.shop.slug })
      .then((a) => {
        setMode(a.mode === "none" ? "customer" : a.mode);
        setEmployeeId(a.employeeId);
      })
      .catch(() => {
        setMode("customer");
        setEmployeeId(null);
      });
  }, [data.shop.slug, isPending, user]);

  return (
    <LiveShopContext.Provider value={data}>
      <AxiomRingProvider
        shopId={data.shop.id}
        slug={data.shop.slug}
        ringColor={rippleTheme(data.shop.tradeProfile.studio.theme)?.ring || data.shop.ringColor}
        mode={mode}
        watchEmployeeId={employeeId}
      >
        <AxiomRing />
        <AcceptBar mode={mode} />
        <Outlet />
      </AxiomRingProvider>
    </LiveShopContext.Provider>
  );
}

function AcceptBar({ mode }: { mode: AccessMode }) {
  const { accept, incoming } = useAxiomRing();
  const staff = mode === "owner" || mode === "employee" || mode === "preview";
  if (!staff || !incoming) return null;
  const estimate = incoming === "estimate";
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto flex w-full max-w-md items-center justify-between gap-3 rounded-2xl bg-surface p-3 shadow-[0_0_0_1px_rgba(46,230,214,0.45)]">
        <div>
          <p className="text-sm font-medium">{estimate ? "Incoming estimate" : "Incoming booking"}</p>
          <p className="text-xs text-muted">Confirm to lock the ring and notify the guest.</p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            void accept().catch(() => undefined);
          }}
        >
          Confirm
        </Button>
      </div>
    </div>
  );
}
