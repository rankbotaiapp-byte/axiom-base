"use client";

import { useEffect, useState } from "react";
import { CompanionHUDModal, companionCommandPulse } from "@/components/admin/CompanionHUDModal";
import { useCompanionArchetype } from "@/components/admin/useCompanionArchetype";
import { useCompanionLiveFeed } from "@/components/admin/useCompanionLiveFeed";
import {
  companionAnnouncement,
  companionArchetype,
  companionTradeTool,
  type CompanionEnvironment,
  type CompanionPulse,
} from "@/lib/axiom/companion-archetypes";
import { companionHaptic } from "@/lib/axiom/companion-comms";
import { cn } from "@/lib/utils";
import "./companion-hud.css";

export type { CompanionEnvironment, CompanionPersona } from "@/lib/axiom/companion-archetypes";

export function CyberCompanionHud({
  environment,
  shopName,
  shopSlug,
  niche,
  city,
  bookHref: _bookHref,
  onBook: _onBook,
  onFocusArchive: _onFocusArchive,
  className,
}: {
  environment: CompanionEnvironment;
  shopName: string;
  shopSlug: string;
  niche?: string | null;
  city?: string;
  bookHref?: string;
  onBook?: () => void;
  onFocusArchive?: () => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [ping, setPing] = useState(12);
  const [sync, setSync] = useState(98.4);
  const place = city?.trim() || "your city";
  const { archetypeId, choose } = useCompanionArchetype(shopSlug, niche);
  const asset = companionArchetype(archetypeId);
  const { lines, push } = useCompanionLiveFeed({
    enabled: true,
    environment,
    shopSlug,
    shopName,
    city: place,
    niche,
    voice: environment !== "storefront",
  });

  useEffect(() => {
    if (!open) return;
    const tool = companionTradeTool(niche);
    const greeting = `${asset.name} online. ${asset.title} paired to ${shopName}. Holding ${tool}. Zero-point field clear.`;
    push("sys", greeting);
    const tick = () => {
      setPing(Math.round(8 + Math.random() * 16));
      setSync((value) => Math.min(99.97, Math.max(96.8, value + (Math.random() - 0.5) * 0.5)));
    };
    tick();
    const id = window.setInterval(tick, 1400);
    return () => window.clearInterval(id);
  }, [open, asset.name, asset.title, shopName, niche, push]);

  function pulse(kind: CompanionPulse) {
    push("sys", companionAnnouncement(kind, { shopName, city: place, niche }), kind);
  }

  function onCommand(text: string) {
    const kind = companionCommandPulse(text);
    push("ops", text);
    if (kind === "chat") {
      push("sys", `${asset.callsign} copies. ${text.slice(0, 120)}`);
      return;
    }
    pulse(kind);
  }

  return (
    <div
      className={cn(
        "pointer-events-none fixed bottom-4 left-4 z-40 flex max-w-[min(22rem,calc(100vw-2rem))] flex-col items-start gap-3 sm:bottom-6 sm:left-6",
        className,
      )}
    >
      <CompanionHUDModal
        open={open}
        onClose={() => setOpen(false)}
        archetypeId={archetypeId}
        onArchetype={choose}
        environment={environment}
        shopName={shopName}
        shopSlug={shopSlug}
        city={place}
        niche={niche}
        ping={ping}
        sync={sync}
        lines={lines}
        onPulse={pulse}
        onCommand={onCommand}
      />
      <button
        type="button"
        aria-expanded={open}
        onClick={() => {
          companionHaptic(22);
          setOpen((value) => !value);
        }}
        className="companion-orb pointer-events-auto"
      >
        <span className="companion-orb__ring" aria-hidden />
        <span className="companion-orb__ring companion-orb__ring--alt" aria-hidden />
        <span className="companion-orb__face">
          {open ? (
            <video src={asset.loop} poster={asset.still} muted playsInline loop autoPlay aria-hidden />
          ) : (
            <img src={asset.still} alt="" />
          )}
        </span>
        <span className="companion-orb__live" aria-hidden />
        <span className="sr-only">
          {open ? "Close" : "Open"} companion {asset.name}
        </span>
      </button>
    </div>
  );
}
