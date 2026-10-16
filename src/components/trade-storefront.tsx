import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, MapPin, Phone } from "lucide-react";
import { HoloCard } from "@/components/holo-card";
import { Magnetic } from "@/components/magnetic";
import { Reveal } from "@/components/reveal";
import { StatusPill, StatusRow, toneAt } from "@/components/status-pill";
import {
  CORD_LABEL,
  checkDropZone,
  cordBaseCents,
  cordQuote,
  layoutFor,
  matchOffering,
  type CordSize,
  type TradeModule,
} from "@/lib/axiom/trade-layout";
import { formatOffer } from "@/lib/axiom/niches";
import { formatMoney, formatPhone } from "@/lib/utils";
import type { Service, Shop } from "@/lib/axiom/types";

export function TradeStorefront({
  shop,
  services,
  phone,
}: {
  shop: Shop;
  services: Service[];
  phone: string;
}) {
  const layout = layoutFor(shop.niche);
  const profile = shop.tradeProfile;
  return (
    <section className="px-5 py-16 sm:px-10">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted">{layout.kicker}</p>
          <h2 className="mt-2 max-w-xl font-display text-3xl sm:text-4xl">{layout.heading}</h2>
          {profile.note ? <p className="mt-3 max-w-lg text-sm text-muted">{profile.note}</p> : null}
          <StatusRow />
        </Reveal>
        <div className="mt-8 grid gap-4">
          {layout.modules.map((module, index) => (
            <Reveal key={module} delay={index * 0.05}>
              <TradeModuleView
                module={module}
                shop={shop}
                services={services}
                phone={phone}
              />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function TradeModuleView({
  module,
  shop,
  services,
  phone,
}: {
  module: TradeModule;
  shop: Shop;
  services: Service[];
  phone: string;
}) {
  const profile = shop.tradeProfile;
  if (module === "workflow" || module === "rounds") {
    return <StepRail steps={services} noun={module === "rounds" ? "Round" : "Step"} />;
  }
  if (module === "bulk") return <CordPicker services={services} cords={profile.cords} />;
  if (module === "species") return <SpeciesCuts species={profile.species} cuts={profile.cuts} />;
  if (module === "dropzone") {
    return (
      <DropZone
        zones={profile.dropZones}
        note={profile.deliveryNote}
        radiusMiles={profile.radiusMiles}
      />
    );
  }
  if (module === "dispatch") {
    return <DispatchStatus on={profile.dispatchOn} minutes={profile.responseMin} />;
  }
  if (module === "callout") {
    return <RapidCallout cents={profile.emergencyCents} minutes={profile.responseMin} phone={phone} />;
  }
  if (module === "kinds") {
    return <KindPicker shopSlug={shop.slug} kinds={profile.kinds} services={services} />;
  }
  if (module === "radius") return <Radius miles={profile.radiusMiles} note={profile.deliveryNote} />;
  if (module === "party") return <Party max={profile.partyMax} />;
  if (module === "session" || module === "chair" || module === "coverage") {
    return <OfferingCards shopSlug={shop.slug} services={services} />;
  }
  return null;
}

function StepRail({ steps, noun }: { steps: Service[]; noun: string }) {
  if (steps.length === 0) return null;
  return (
    <Reveal stagger className="grid gap-3 sm:grid-cols-3">
      {steps.map((step, index) => (
        <div key={step.id} className="min-w-0">
          <HoloCard className="glass-panel lift-card h-full rounded-[24px] p-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
              {noun} {index + 1}
            </p>
            <p className="mt-2 font-display text-2xl leading-tight">{step.name}</p>
            <p className="mt-2 text-sm text-muted">{step.description}</p>
            <p className="mt-4 text-sm tabular text-fg">{formatOffer(step)}</p>
            <StatusPill tone={toneAt(index)} className="mt-4" />
          </HoloCard>
        </div>
      ))}
    </Reveal>
  );
}

function CordPicker({ services, cords }: { services: Service[]; cords: CordSize[] }) {
  const [size, setSize] = useState<CordSize>(cords[0] ?? "full");
  const picked = cords.includes(size) ? size : cords[0] ?? "full";
  const quote = cordQuote(cordBaseCents(services), picked);
  return (
    <HoloCard tilt={false} className="glass-panel lift-card rounded-[24px] p-5">
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted">How much wood</p>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {cords.map((cord) => {
          const on = cord === picked;
          return (
            <button
              key={cord}
              type="button"
              aria-pressed={on}
              onClick={() => setSize(cord)}
              className="h-16 rounded-xl bg-surface-2 text-sm"
              style={on ? { boxShadow: "0 0 0 1px var(--color-fg)" } : undefined}
            >
              {CORD_LABEL[cord]}
            </button>
          );
        })}
      </div>
      <p className="mt-4 font-display text-3xl tabular">{quote > 0 ? formatMoney(quote) : "Ask for the cord"}</p>
      <p className="mt-1 text-sm text-muted">Priced from this shop's cord. Species does not change it.</p>
      <StatusRow tones={["node", "latency"]} />
    </HoloCard>
  );
}

function SpeciesCuts({ species, cuts }: { species: string[]; cuts: string[] }) {
  const [wood, setWood] = useState(species[0] ?? "");
  const [cut, setCut] = useState(cuts[0] ?? "");
  return (
    <HoloCard tilt={false} className="glass-panel lift-card rounded-[24px] p-5">
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Species and cut</p>
      <ChipRow label="Wood" options={species} value={wood} onChange={setWood} />
      <ChipRow label="Length" options={cuts} value={cut} onChange={setCut} />
      {wood && cut ? (
        <p className="mt-4 text-sm text-muted">
          {wood}, cut to {cut}.
        </p>
      ) : null}
      <StatusPill tone="channel" className="mt-4" />
    </HoloCard>
  );
}

function ChipRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  if (options.length === 0) return null;
  return (
    <div className="mt-4">
      <p className="text-sm text-muted">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => {
          const on = option === value;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(option)}
              className="h-11 rounded-full bg-surface-2 px-4 text-sm"
              style={on ? { boxShadow: "0 0 0 1px var(--color-fg)" } : undefined}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DropZone({ zones, note, radiusMiles }: { zones: string[]; note: string; radiusMiles: number }) {
  const [query, setQuery] = useState("");
  const status = checkDropZone(query, zones);
  return (
    <HoloCard tilt={false} className="glass-panel lift-card rounded-[24px] p-5">
      <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted">
        <MapPin className="size-3.5" />
        Drop zone
      </p>
      <p className="mt-2 text-sm text-muted">
        {radiusMiles} miles out. {note}
      </p>
      <label className="mt-4 block text-sm" htmlFor="drop-zone">
        City or neighborhood
        <input
          id="drop-zone"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={zones[0] || "City"}
          className="mt-2 h-12 w-full rounded-xl bg-surface-2 px-3 text-sm text-fg shadow-[0_0_0_1px_rgba(243,241,235,0.08)]"
        />
      </label>
      {status === "in" ? <p className="mt-3 text-sm text-ok">Inside the drop. The cord can land there.</p> : null}
      {status === "out" ? (
        <p className="mt-3 text-sm text-copper">Outside the listed zones. Call before you order a haul.</p>
      ) : null}
      {zones.length ? (
        <p className="mt-3 text-sm text-faint">{zones.join(" · ")}</p>
      ) : (
        <p className="mt-3 text-sm text-faint">No cities listed yet. The radius is the limit.</p>
      )}
      <StatusPill tone="latency" className="mt-4" />
    </HoloCard>
  );
}

function DispatchStatus({ on, minutes }: { on: boolean; minutes: number }) {
  return (
    <HoloCard className="glass-panel lift-card rounded-[24px] p-5">
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Dispatch</p>
      <p className="mt-2 font-display text-4xl">{on ? "Rolling" : "At the desk"}</p>
      <p className="mt-2 text-sm text-muted">
        {on ? `About ${minutes} minutes when the van is out.` : "Emergency dispatch is off. Book a daytime call."}
      </p>
      <StatusRow tones={["node", "channel"]} />
    </HoloCard>
  );
}

function RapidCallout({ cents, minutes, phone }: { cents: number; minutes: number; phone: string }) {
  return (
    <HoloCard className="glass-panel lift-card flex flex-wrap items-end justify-between gap-4 rounded-[24px] p-5">
      <div>
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Rapid response</p>
        <p className="mt-2 font-display text-4xl tabular">{cents > 0 ? formatMoney(cents) : "Ask"}</p>
        <p className="mt-2 text-sm text-muted">After-hours lockout. {minutes} minute target.</p>
        <StatusPill tone="latency" className="mt-3" />
      </div>
      {phone ? (
        <Magnetic className="inline-flex">
          <a href={`tel:${phone}`} className="glass-btn inline-flex h-12 items-center gap-2 rounded-xl px-4 text-sm">
            <Phone className="size-4" />
            {formatPhone(phone)}
          </a>
        </Magnetic>
      ) : null}
    </HoloCard>
  );
}

function KindPicker({
  shopSlug,
  kinds,
  services,
}: {
  shopSlug: string;
  kinds: string[];
  services: Service[];
}) {
  const [kind, setKind] = useState(kinds[0] ?? "");
  const match = matchOffering(kind, services);
  if (kinds.length === 0) return null;
  return (
    <HoloCard tilt={false} className="glass-panel lift-card rounded-[24px] p-5">
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Service</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {kinds.map((item) => {
          const on = item === kind;
          return (
            <button
              key={item}
              type="button"
              aria-pressed={on}
              onClick={() => setKind(item)}
              className="h-14 rounded-xl bg-surface-2 text-sm"
              style={on ? { boxShadow: "0 0 0 1px var(--color-fg)" } : undefined}
            >
              {item}
            </button>
          );
        })}
      </div>
      {match ? (
        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-medium">{match.name}</p>
            <p className="text-sm text-muted">{match.description}</p>
            <p className="mt-1 text-sm tabular">{formatOffer(match)}</p>
          </div>
          <Magnetic className="inline-flex">
            <Link
              to="/$shopSlug/book"
              params={{ shopSlug }}
              className="glass-btn inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm"
            >
              Book this
              <ArrowRight className="size-4" />
            </Link>
          </Magnetic>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted">{kind} is offered. Ask the shop to put a price on the book.</p>
      )}
      <StatusPill tone="channel" className="mt-4" />
    </HoloCard>
  );
}

function Radius({ miles, note }: { miles: number; note: string }) {
  return (
    <HoloCard className="glass-panel lift-card rounded-[24px] p-5">
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Service radius</p>
      <p className="mt-2 font-display text-4xl tabular">{miles} miles</p>
      {note ? <p className="mt-2 max-w-lg text-sm text-muted">{note}</p> : null}
      <StatusPill tone="node" className="mt-4" />
    </HoloCard>
  );
}

function Party({ max }: { max: number }) {
  return (
    <HoloCard className="glass-panel lift-card rounded-[24px] p-5">
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Group size</p>
      <p className="mt-2 font-display text-4xl tabular">Up to {max}</p>
      <StatusPill tone="node" className="mt-4" />
    </HoloCard>
  );
}

function OfferingCards({ shopSlug, services }: { shopSlug: string; services: Service[] }) {
  if (services.length === 0) return null;
  return (
    <Reveal stagger className="grid gap-3 sm:grid-cols-3">
      {services.map((service, index) => (
        <div key={service.id} className="min-w-0">
          <HoloCard className="glass-panel lift-card h-full rounded-[24px] p-5">
            <p className="font-display text-2xl leading-tight">{service.name}</p>
            <p className="mt-2 text-sm text-muted">{service.description}</p>
            <p className="mt-4 text-sm tabular">{formatOffer(service)}</p>
            <StatusPill tone={toneAt(index)} className="mt-3" />
            <Link
              to="/$shopSlug/book"
              params={{ shopSlug }}
              className="mt-4 inline-flex h-11 items-center text-sm text-muted hover:text-fg"
            >
              Book
            </Link>
          </HoloCard>
        </div>
      ))}
    </Reveal>
  );
}
