"use client";

import { useReducedMotion } from "framer-motion";
import { useMemo, useState, type ReactNode } from "react";
import { demoHeroFilm } from "@/lib/axiom/demo-hero";
import { funnelShards } from "@/lib/axiom/funnel-glass";

export function GlassShardMatrix({
  businessName,
  city = "",
  county = "",
  niche,
  filmUrl = "",
  hint = "",
  armed = false,
  children,
}: {
  businessName: string;
  city?: string;
  county?: string;
  niche: string;
  filmUrl?: string;
  hint?: string;
  armed?: boolean;
  children?: ReactNode;
}) {
  const film = filmUrl || demoHeroFilm(niche, hint);
  const shards = useMemo(
    () => funnelShards({ businessName, city, county, niche }),
    [businessName, city, county, niche],
  );
  const reduce = useReducedMotion();
  const [broke, setBroke] = useState<Record<string, boolean>>({});
  const open = shards.filter((shard) => broke[shard.id]).length;
  const cleared = shards.length > 0 && open >= Math.min(shards.length, 5);

  if (!armed || !businessName.trim() || shards.length === 0) return <>{children}</>;

  return (
    <div className={cleared ? "glass-shard-frame is-clear" : "glass-shard-frame"}>
      {children}
      <div className="glass-shard-matrix" data-clear={cleared ? "on" : "off"} aria-hidden={cleared}>
        <video
          className="glass-shard-film"
          src={film}
          autoPlay={!reduce}
          muted
          loop
          playsInline
          aria-hidden
        />
        <p className="glass-shard-hint font-display">
          {cleared ? businessName : `Break the pane for ${businessName || "this shop"}.`}
        </p>
        <div className="glass-shard-grid">
          {shards.map((shard, index) => (
            <button
              key={shard.id}
              type="button"
              className={broke[shard.id] ? "glass-shard is-broke" : "glass-shard"}
              style={{ ["--shard-tilt" as string]: `${(index % 5) * 2.4 - 4.8}deg` }}
              onPointerEnter={() => {
                if (reduce) return;
                setBroke((current) => ({ ...current, [shard.id]: true }));
              }}
              onClick={() => setBroke((current) => ({ ...current, [shard.id]: true }))}
            >
              <strong>{shard.title}</strong>
              <span>{shard.line}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
