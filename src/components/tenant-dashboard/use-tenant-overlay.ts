import { useCallback, useEffect, useState } from "react";
import {
  publishTenantOverlay,
  readTenantOverlay,
  subscribeTenantOverlay,
  type TenantOverlay,
} from "@/lib/axiom/tenant-overlay";

export function useTenantOverlay(slug: string, seed?: Partial<TenantOverlay>) {
  const [overlay, setOverlay] = useState<TenantOverlay>(() => readTenantOverlay(slug, seed));

  useEffect(() => {
    setOverlay(readTenantOverlay(slug, seed));
    return subscribeTenantOverlay(slug, setOverlay);
  }, [slug, seed?.company, seed?.phone, seed?.county, seed?.city]);

  const patch = useCallback(
    (partial: Partial<TenantOverlay>) => {
      setOverlay((current) => {
        const next = { ...current, ...partial, slug };
        return publishTenantOverlay(next);
      });
    },
    [slug],
  );

  return { overlay, patch };
}
