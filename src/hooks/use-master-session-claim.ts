"use client";

import { useEffect, useRef } from "react";
import {
  beginMasterSessionClaimOnce,
  captureMasterUrlKeyOnce,
} from "@/lib/axiom/master-session-url";

/**
 * Copy `?key=` into a ref on the first client render, strip it from the
 * address bar before paint/POST, then claim at most once (Strict Mode safe).
 */
export function useMasterSessionClaim(loadDesk: (key?: string) => Promise<void>): void {
  const capturedKeyRef = useRef<string | null>(null);
  const postedRef = useRef(false);

  if (typeof window !== "undefined" && capturedKeyRef.current === null) {
    capturedKeyRef.current = captureMasterUrlKeyOnce();
  }

  useEffect(() => {
    if (postedRef.current) return;
    if (!beginMasterSessionClaimOnce()) return;
    postedRef.current = true;
    const key = (capturedKeyRef.current ?? "").trim();
    void loadDesk(key.length >= 16 ? key : undefined);
  }, [loadDesk]);
}
