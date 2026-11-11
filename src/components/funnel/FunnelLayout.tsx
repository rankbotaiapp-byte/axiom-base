import type { ReactNode } from "react";
import { CalendarCheck, MapPin, Phone } from "lucide-react";
import { ObsidianHudChrome } from "@/components/ObsidianHudChrome";
import { cn } from "@/lib/utils";
import "./funnel-layout.css";

export function FunnelLayout({
  name,
  city,
  logoUrl,
  bookPath,
  callHref,
  mapsUrl,
  onBook,
  children,
}: {
  name: string;
  city: string;
  logoUrl?: string;
  bookPath: string;
  callHref?: string;
  mapsUrl?: string;
  onBook?: () => void;
  children: ReactNode;
}) {
  return (
    <div className="funnel-shell relative min-h-dvh bg-obsidian text-fg">
      <ObsidianHudChrome />
      <header className="immutable-sticky">
        <div className="immutable-sticky-inner">
          <div className="min-w-0">
            {logoUrl ? (
              <img src={logoUrl} alt="" className="h-9 w-auto max-w-[10rem] object-contain" />
            ) : (
              <p className="truncate font-display text-lg tracking-tight">{name}</p>
            )}
            <p className="mt-0.5 truncate font-mono text-[11px] uppercase tracking-[0.18em] text-muted">{city}</p>
          </div>
          <nav className="immutable-cta-row" aria-label="Persistent funnel actions">
            {onBook ? (
              <button type="button" className="immutable-cta immutable-cta-primary" onClick={onBook}>
                <CalendarCheck className="size-4" aria-hidden />
                Book Now
              </button>
            ) : (
              <a className="immutable-cta immutable-cta-primary" href={bookPath}>
                <CalendarCheck className="size-4" aria-hidden />
                Book Now
              </a>
            )}
            {callHref ? (
              <a className="immutable-cta" href={callHref}>
                <Phone className="size-4" aria-hidden />
                Call Now
              </a>
            ) : (
              <span className={cn("immutable-cta", "is-off")}>
                <Phone className="size-4" aria-hidden />
                Call Now
              </span>
            )}
            {mapsUrl ? (
              <a className="immutable-cta" href={mapsUrl} target="_blank" rel="noreferrer">
                <MapPin className="size-4" aria-hidden />
                Get Directions
              </a>
            ) : (
              <span className={cn("immutable-cta", "is-off")}>
                <MapPin className="size-4" aria-hidden />
                Get Directions
              </span>
            )}
          </nav>
        </div>
      </header>
      <div className="funnel-grid">{children}</div>
    </div>
  );
}
