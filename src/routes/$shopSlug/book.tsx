import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { GearGuardianCheckout } from "@/components/gear-guardian-checkout";
import { ShopNav } from "@/components/shop-chrome";
import { useAxiomRing } from "@/components/axiom-ring";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { createBooking, getShopAccess, listBookedStarts } from "@/lib/axiom/server";
import { buildSlots } from "@/lib/axiom/slots";
import type { AccessMode, Employee } from "@/lib/axiom/types";
import { formatMoney, initials } from "@/lib/utils";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Route as ShopLayoutRoute } from "./route";

export const Route = createFileRoute("/$shopSlug/book")({
  validateSearch: (s: Record<string, unknown>): { employee?: string; service?: string } => {
    const out: { employee?: string; service?: string } = {};
    if (typeof s.employee === "string") out.employee = s.employee;
    if (typeof s.service === "string") out.service = s.service;
    return out;
  },
  component: BookPage,
});

function BookPage() {
  const data = ShopLayoutRoute.useLoaderData();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { setPendingId, announce } = useAxiomRing();
  const { user, isPending } = useCurrentUserState();
  const [mode, setMode] = useState<AccessMode>("customer");
  const [serviceId, setServiceId] = useState(
    search.service ?? data.shop.primaryServiceId ?? data.services[0]?.id ?? "",
  );
  const [employeeId, setEmployeeId] = useState(search.employee ?? "");
  const [slot, setSlot] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pay, setPay] = useState(false);
  const [booked, setBooked] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const service = data.services.find((s) => s.id === serviceId) ?? data.services[0];
  const eligible = data.employees.filter(
    (e) => !service || e.serviceIds.includes(service.id) || e.serviceIds.length === 0,
  );
  const employee =
    eligible.find((e) => e.id === employeeId) ?? eligible[0] ?? data.employees[0];

  useEffect(() => {
    if (employee && employee.id !== employeeId) setEmployeeId(employee.id);
  }, [employee, employeeId]);

  useEffect(() => {
    if (isPending || !user) return;
    void getShopAccess({ data: data.shop.slug })
      .then((a) => setMode(a.mode === "none" ? "customer" : a.mode))
      .catch(() => setMode("customer"));
  }, [data.shop.slug, isPending, user]);

  useEffect(() => {
    if (!employee) return;
    void listBookedStarts({ data: { slug: data.shop.slug, employeeId: employee.id } }).then(
      setBooked,
    );
  }, [data.shop.slug, employee]);

  const groups = useMemo(() => {
    if (!service) return [];
    return buildSlots({
      hours: data.shop.hours,
      durationMin: service.durationMin,
      bookedIsos: booked,
    });
  }, [booked, data.shop.hours, service]);

  async function onPaid(paymentRef: string) {
    if (!service || !employee || !slot) return;
    const result = await createBooking({
      data: {
        slug: data.shop.slug,
        employeeId: employee.id,
        serviceId: service.id,
        customerName: name,
        customerPhone: phone,
        startsAt: slot,
        paymentRef,
        paymentCents: service.priceCents,
      },
    });
    setPendingId(result.id);
    announce(
      {
        id: `local-${result.id}`,
        type: "booking_request",
        appointmentId: result.id,
        createdAt: new Date().toISOString(),
      },
      true,
    );
    await navigate({ to: "/$shopSlug", params: { shopSlug: data.shop.slug } });
  }

  return (
    <main className="min-h-dvh bg-bg pb-16">
      <ShopNav shop={data.shop} mode={mode} />
      <div className="mx-auto grid max-w-5xl gap-8 px-5 pt-4 sm:px-10 lg:grid-cols-[1fr_22rem]">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Book</p>
          <h1 className="mt-2 font-display text-4xl">{data.shop.name}</h1>

          <Section title="Service">
            <div className="grid gap-2">
              {data.services.map((s) => (
                <Choice
                  key={s.id}
                  active={s.id === service?.id}
                  onClick={() => {
                    setServiceId(s.id);
                    setSlot(null);
                    setPay(false);
                  }}
                  title={s.name}
                  meta={`${formatMoney(s.priceCents)} · ${s.durationMin}m`}
                />
              ))}
            </div>
          </Section>

          <Section title="Specialist">
            <div className="grid gap-2 sm:grid-cols-2">
              {eligible.map((e) => (
                <StaffChoice
                  key={e.id}
                  employee={e}
                  active={e.id === employee?.id}
                  onClick={() => {
                    setEmployeeId(e.id);
                    setSlot(null);
                    setPay(false);
                  }}
                />
              ))}
            </div>
          </Section>

          <Section title="Time">
            <div className="grid gap-5">
              {groups.map((g) => (
                <div key={g.dateKey}>
                  <p className="mb-2 text-xs text-muted">{g.dayLabel}</p>
                  {g.slots.length === 0 ? (
                    <p className="text-sm text-faint">No openings</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {g.slots.map((sl) => (
                        <button
                          key={sl.iso}
                          type="button"
                          onClick={() => {
                            setSlot(sl.iso);
                            setPay(false);
                          }}
                          className="h-10 rounded-lg px-3 text-sm shadow-[0_0_0_1px_rgba(243,241,235,0.1)]"
                          style={
                            slot === sl.iso
                              ? { background: "var(--color-fg)", color: "var(--color-bg)" }
                              : undefined
                          }
                        >
                          {sl.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>
        </div>

        <aside className="lg:pt-16">
          <div className="rounded-[24px] bg-surface p-5 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]">
            <p className="text-sm text-muted">
              {service?.name} with {employee?.displayName}
            </p>
            <p className="mt-1 font-display text-3xl">
              {service ? formatMoney(service.priceCents) : "—"}
            </p>
            {slot ? (
              <p className="mt-2 text-sm text-muted">
                {new Date(slot).toLocaleString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            ) : (
              <p className="mt-2 text-sm text-faint">Pick a time</p>
            )}

            {!pay ? (
              <form
                className="mt-5 grid gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!slot || !name.trim()) {
                    setError("Name and a time are required");
                    return;
                  }
                  setError(null);
                  setPay(true);
                }}
              >
                <div>
                  <Label htmlFor="cn">Your name</Label>
                  <Input id="cn" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="cp">Phone</Label>
                  <Input
                    id="cp"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Optional"
                  />
                </div>
                {error ? <p className="text-sm text-danger">{error}</p> : null}
                <Button type="submit" size="lg" disabled={!slot}>
                  Continue to Gear Guardian
                </Button>
              </form>
            ) : service ? (
              <div className="mt-5">
                <GearGuardianCheckout
                  amountCents={service.priceCents}
                  shopName={data.shop.name}
                  onPaid={onPaid}
                  onCancel={() => setPay(false)}
                />
              </div>
            ) : null}
          </div>
          <Link
            to="/$shopSlug"
            params={{ shopSlug: data.shop.slug }}
            className="mt-4 inline-block text-sm text-muted hover:text-fg"
          >
            Back to shop
          </Link>
        </aside>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-sm font-medium text-muted">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Choice({
  active,
  onClick,
  title,
  meta,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  meta: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-between rounded-xl bg-surface px-4 py-3 text-left shadow-[0_0_0_1px_rgba(243,241,235,0.08)]"
      style={active ? { boxShadow: "0 0 0 1px var(--ring-color, #2ee6d6)" } : undefined}
    >
      <span className="text-sm font-medium">{title}</span>
      <span className="text-sm text-muted">{meta}</span>
    </button>
  );
}

function StaffChoice({
  employee,
  active,
  onClick,
}: {
  employee: Employee;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl bg-surface p-2.5 text-left shadow-[0_0_0_1px_rgba(243,241,235,0.08)]"
      style={active ? { boxShadow: "0 0 0 1px var(--ring-color, #2ee6d6)" } : undefined}
    >
      {employee.avatarUrl ? (
        <img src={employee.avatarUrl} alt="" className="size-12 rounded-lg object-cover" />
      ) : (
        <span className="grid size-12 place-items-center rounded-lg bg-surface-2 text-sm">
          {initials(employee.displayName)}
        </span>
      )}
      <span>
        <span className="block text-sm font-medium">{employee.displayName}</span>
        <span className="block text-xs text-muted">{employee.title}</span>
      </span>
    </button>
  );
}

