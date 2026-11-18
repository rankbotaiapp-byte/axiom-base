"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { FounderWelcomeStrip } from "@/components/conversion/FounderWelcomeStrip";
import { shopCity } from "@/lib/axiom/avatar";

function dismissKey(shopSlug: string) {
  return `axiom.founder.welcome.dismissed:${shopSlug.trim().toLowerCase()}`;
}

export function FounderWelcomeModal({
  shopSlug,
  shopName,
  ownerName,
  niche,
  address,
  readonly,
}: {
  shopSlug: string;
  shopName: string;
  ownerName?: string;
  niche: string;
  address: string;
  readonly: boolean;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (readonly) return;
    try {
      if (sessionStorage.getItem(dismissKey(shopSlug)) === "1") return;
    } catch {
      /* ignore */
    }
    const id = window.setTimeout(() => setOpen(true), 600);
    return () => window.clearTimeout(id);
  }, [shopSlug, readonly]);

  if (!open) return null;

  const close = () => {
    try {
      sessionStorage.setItem(dismissKey(shopSlug), "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-[#050507]/80 p-3 backdrop-blur-md sm:items-center sm:p-6"
      role="presentation"
      onClick={close}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Welcome from Eric"
        className="relative w-full max-w-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="absolute right-2 top-2 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-[#050507]/80 text-white/70 hover:text-white"
          onClick={close}
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        <FounderWelcomeStrip
          owner={ownerName || shopName}
          business={shopName}
          trade={niche}
          place={shopCity(address)}
          compact
        />
      </div>
    </div>
  );
}