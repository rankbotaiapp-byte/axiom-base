"use client";

import { useCallback, useEffect, useState } from "react";
import {
  readAtmosphereEnabled,
  STOREFRONT_ATMOSPHERE_EVENT,
} from "@/lib/axiom/storefront-atmosphere";

export function useStorefrontAtmosphere(shopSlug: string) {
  const [enabled, setEnabled] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const refresh = useCallback(() => {
    setEnabled(readAtmosphereEnabled(shopSlug));
    setHydrated(true);
  }, [shopSlug]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const onCustom = (event: Event) => {
      const detail = (event as CustomEvent<{ shopSlug?: string; enabled?: boolean }>).detail;
      const slug = shopSlug.trim().toLowerCase();
      if (detail?.shopSlug && detail.shopSlug !== slug) return;
      if (typeof detail?.enabled === "boolean") setEnabled(detail.enabled);
      else refresh();
    };
    const onStorage = () => refresh();
    window.addEventListener(STOREFRONT_ATMOSPHERE_EVENT, onCustom);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(STOREFRONT_ATMOSPHERE_EVENT, onCustom);
      window.removeEventListener("storage", onStorage);
    };
  }, [shopSlug, refresh]);

  useEffect(() => {
    if (!hydrated || !shopSlug) return;
    let cancelled = false;
    void fetch(`/api/storefront/atmosphere?shopSlug=${encodeURIComponent(shopSlug)}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((json: { atmosphereEnabled?: boolean } | null) => {
        if (cancelled || !json || typeof json.atmosphereEnabled !== "boolean") return;
        if (json.atmosphereEnabled) setEnabled(true);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [shopSlug, hydrated]);

  return { enabled, hydrated, refresh };
}