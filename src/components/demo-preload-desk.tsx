import { Building2, MapPin, Phone, Mail, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

export type DemoPreloadFields = {
  businessName: string;
  phone?: string;
  email?: string;
  city?: string;
  county?: string;
  trade?: string;
  nicheLabel?: string;
};

/** Shows the lead's business data already painted into the demo before they interact. */
export function DemoPreloadDesk({
  fields,
  className,
}: {
  fields: DemoPreloadFields;
  className?: string;
}) {
  const place = [fields.city, fields.county].filter(Boolean).join(" · ");
  const rows = [
    { icon: Building2, label: "Business", value: fields.businessName },
    fields.trade || fields.nicheLabel
      ? { icon: Wrench, label: "Trade", value: fields.trade || fields.nicheLabel || "" }
      : null,
    fields.phone ? { icon: Phone, label: "Phone", value: fields.phone } : null,
    fields.email ? { icon: Mail, label: "Email", value: fields.email } : null,
    place ? { icon: MapPin, label: "Service area", value: place } : null,
  ].filter(Boolean) as Array<{ icon: typeof Building2; label: string; value: string }>;

  return (
    <section
      className={cn(
        "relative z-20 mx-auto w-full max-w-5xl px-5 py-6 sm:px-8",
        className,
      )}
      aria-label="Pre-loaded shop desk"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-accent/85">Your desk is ready</p>
      <h2 className="mt-2 font-display text-2xl text-fg sm:text-3xl">Pre-loaded for {fields.businessName}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
        Business name, contact lines, and local area are already painted into this demo — no blank form to fill before
        you see the storefront work.
      </p>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {rows.map((row) => {
          const Icon = row.icon;
          return (
            <li
              key={`${row.label}-${row.value}`}
              className="flex items-start gap-3 rounded-2xl bg-surface-2/80 px-4 py-3 shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-fg)_10%,transparent)]"
            >
              <Icon className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
              <span>
                <span className="block text-[10px] uppercase tracking-[0.18em] text-muted">{row.label}</span>
                <span className="mt-1 block text-sm text-fg">{row.value}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
