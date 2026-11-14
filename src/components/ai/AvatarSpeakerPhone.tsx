"use client";

import { useEffect, useState } from "react";
import { useCompanionArchetype } from "@/components/admin/useCompanionArchetype";
import { useCompanionLiveFeed } from "@/components/admin/useCompanionLiveFeed";
import {
  companionAnnouncement,
  companionArchetype,
  type CompanionPulse,
} from "@/lib/axiom/companion-archetypes";
import { companionHaptic } from "@/lib/axiom/companion-comms";
import { shopCity } from "@/lib/axiom/avatar";
import "./avatar-speaker-phone.css";

export function AvatarSpeakerPhone({
  shopName,
  shopSlug,
  niche,
  city,
}: {
  shopName: string;
  shopSlug: string;
  niche?: string | null;
  city?: string;
}) {
  const place = city?.trim() || shopCity("") || "your city";
  const { archetypeId } = useCompanionArchetype(shopSlug, niche);
  const asset = companionArchetype(archetypeId);
  const [open, setOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const { lines } = useCompanionLiveFeed({
    enabled: !muted,
    environment: "storefront",
    shopSlug,
    shopName,
    city: place,
    niche,
    poll: true,
    voice: !muted,
  });
  const latest = lines[lines.length - 1]?.text ?? "";

  useEffect(() => {
    const onPulse = (event: Event) => {
      const detail = (event as CustomEvent<{ pulse?: CompanionPulse; text?: string }>).detail;
      if (!detail?.pulse && !detail?.text) return;
      setOpen(true);
      companionHaptic([18, 30, 18]);
    };
    window.addEventListener("axiom-companion-event", onPulse);
    return () => window.removeEventListener("axiom-companion-event", onPulse);
  }, []);

  useEffect(() => {
    if (lines.length === 0) return;
    setOpen(true);
  }, [lines.length]);

  function greet() {
    setOpen(true);
    if (muted) return;
    window.dispatchEvent(
      new CustomEvent("axiom-companion-event", {
        detail: {
          id: `greet-${Date.now()}`,
          pulse: "autopilot" satisfies CompanionPulse,
          text: companionAnnouncement("autopilot", { shopName, city: place, niche }),
        },
      }),
    );
  }

  return (
    <aside className={`speaker-phone${open ? " is-open" : ""}`} aria-label={`${asset.name} speaker-phone`}>
      <button type="button" className="speaker-phone__orb" onClick={() => (open ? setOpen(false) : greet())}>
        <img src={asset.still} alt="" />
        <span className="speaker-phone__live" aria-hidden />
        <span className="sr-only">{open ? "Close" : "Open"} live avatar</span>
      </button>
      {open ? (
        <div className="speaker-phone__box">
          <span className="speaker-phone__bracket speaker-phone__bracket--tl" />
          <span className="speaker-phone__bracket speaker-phone__bracket--tr" />
          <span className="speaker-phone__bracket speaker-phone__bracket--bl" />
          <span className="speaker-phone__bracket speaker-phone__bracket--br" />
          <div className="speaker-phone__face">
            <video src={asset.loop} poster={asset.still} muted playsInline loop autoPlay />
          </div>
          <div className="speaker-phone__copy">
            <p className="speaker-phone__name">{asset.name}</p>
            <p className="speaker-phone__role">{asset.callsign} · speaker-phone</p>
            <p className="speaker-phone__line">{latest || `${asset.name} standing by for Autopilot updates.`}</p>
          </div>
          <button type="button" className="speaker-phone__mute" onClick={() => setMuted((value) => !value)}>
            {muted ? "Muted" : "Live voice"}
          </button>
        </div>
      ) : null}
    </aside>
  );
}
