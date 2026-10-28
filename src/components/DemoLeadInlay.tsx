"use client";

import { useEffect, useState } from "react";
import { GlassShardMatrix } from "@/components/GlassShardMatrix";
import { PreviewFrame } from "@/app/preview-frame";
import type { BusinessBrandRecord } from "@/lib/axiom/business-brand";
import type { FunnelSearch } from "@/lib/axiom/funnel";
import { leadGlassCopy } from "@/lib/axiom/funnel-glass";
import type { ShopNiche } from "@/lib/axiom/types";

async function loadLead(leadId: string, slug: string): Promise<BusinessBrandRecord | null> {
  const query = leadId
    ? `lead=${encodeURIComponent(leadId)}`
    : `slug=${encodeURIComponent(slug)}`;
  const res = await fetch(`/api/business/brand?${query}`);
  if (!res.ok) return null;
  return (await res.json()) as BusinessBrandRecord;
}

/** Next demo shell. Looks up `?lead=` and paints the glass; missing rows keep the niche template. */
export function DemoLeadInlay({ niche, search }: { niche: ShopNiche; search: FunnelSearch }) {
  const leadId = search.lead || "";
  const slug = search.b || search.lead_slug || "";
  const [loaded, setLoaded] = useState<BusinessBrandRecord | null>(null);

  useEffect(() => {
    if (!leadId && !slug) {
      setLoaded(null);
      return;
    }
    setLoaded(null);
    let cancelled = false;
    void loadLead(leadId, slug)
      .then((row) => {
        if (!cancelled) setLoaded(row);
      })
      .catch(() => {
        if (!cancelled) setLoaded(null);
      });
    return () => {
      cancelled = true;
    };
  }, [leadId, slug]);

  const glass = leadGlassCopy(loaded);
  const triedLead = Boolean(leadId || slug);

  return (
    <GlassShardMatrix
      armed={glass.armed}
      businessName={glass.businessName}
      city={glass.city}
      county={glass.county}
      niche={glass.armed ? loaded?.nicheSlug || niche : niche}
      hint={glass.hint}
    >
      <PreviewFrame
        niche={niche}
        search={
          glass.armed
            ? { ...search, preview: true, business: glass.businessName, city: glass.city || undefined }
            : triedLead
              ? { ...search, preview: true, business: undefined, biz: undefined, city: undefined }
              : { ...search, preview: true }
        }
        loaded={glass.armed ? loaded : null}
        lead={glass.armed ? leadId : ""}
      />
    </GlassShardMatrix>
  );
}
