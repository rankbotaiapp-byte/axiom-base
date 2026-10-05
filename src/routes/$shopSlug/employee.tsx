import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { effectiveDashboard } from "@/lib/axiom/dashboard";
import { WEEKDAYS } from "@/lib/axiom/niches";
import { addPortfolioItem, acceptBooking, getOperatorData, getPortfolio } from "@/lib/axiom/server";
import type { AccessMode, Appointment, Employee, PortfolioItem, Shop } from "@/lib/axiom/types";
import { EmployeeDashboardEditor } from "@/components/dashboard-controls";
import { Wordmark } from "@/components/shop-chrome";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAxiomRing } from "@/components/axiom-ring";
import { useShopPageData } from "./route";

export const Route = createFileRoute("/$shopSlug/employee")({ component: EmployeePage });

function EmployeePage() {
  const { shopSlug } = Route.useParams();
  const live = useShopPageData();
  const { user, isPending } = useCurrentUserState();
  const ring = useAxiomRing();
  const [error, setError] = useState<string | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [mode, setMode] = useState<AccessMode>("none");
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [gallery, setGallery] = useState<PortfolioItem[]>([]);
  const [localConfig, setLocalConfig] = useState<Employee["dashboardConfig"] | null>(null);

  const userId = user?.id;
  useEffect(() => {
    if (isPending || !userId) return;
    let cancelled = false;
    void getOperatorData({ data: shopSlug })
      .then(async (d) => {
        if (cancelled) return;
        setError(null);
        setShop(d.shop);
        setMode(d.mode);
        setAppointments(d.appointments);
        const emp =
          d.employees.find((e) => e.id === d.employeeId) ??
          d.employees[0] ??
          null;
        setEmployee(emp);
        if (emp) setGallery(await getPortfolio({ data: emp.id }));
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Forbidden");
      });
    return () => {
      cancelled = true;
    };
  }, [isPending, shopSlug, userId]);

  if (isPending || (user && !shop && !error)) {
    return (
      <main className="grid min-h-dvh place-items-center">
        <div className="h-10 w-40 animate-pulse rounded-full bg-fg/8" />
      </main>
    );
  }
  if (!user) return <RedirectToSignIn to="/login" />;
  if (error || !shop) {
    return (
      <main className="grid min-h-dvh place-items-center px-6 text-center">
        <p className="font-display text-3xl">No station on this shop.</p>
      </main>
    );
  }

  const stationShop = live.shop.slug === shop.slug ? live.shop : shop;
  const stationEmployee =
    (employee && live.employees.find((item) => item.id === employee.id)) ?? employee;
  const personalConfig = localConfig ?? stationEmployee?.dashboardConfig ?? null;
  const layout =
    stationEmployee && personalConfig
      ? effectiveDashboard(stationShop.dashboardOverride, stationShop.dashboardConfig, personalConfig)
      : null;
  const editorEmployee =
    stationEmployee && personalConfig
      ? { ...stationEmployee, dashboardConfig: personalConfig }
      : null;

  return (
    <main className="min-h-dvh bg-bg px-5 py-6 sm:px-8">
      <header className="flex items-center justify-between">
        <div>
          <Wordmark />
          <p className="mt-2 text-sm text-muted">
            {employee?.displayName ?? "Station"} · {shop.name}
          </p>
        </div>
        <div className="flex gap-2">
          {mode === "owner" || mode === "preview" ? (
            <Link
              to="/$shopSlug/admin"
              params={{ shopSlug: shop.slug }}
              className="inline-flex h-11 items-center text-sm text-muted hover:text-fg"
            >
              Admin
            </Link>
          ) : null}
          <Link
            to="/$shopSlug"
            params={{ shopSlug: shop.slug }}
            className="inline-flex h-11 items-center text-sm text-muted hover:text-fg"
          >
            Site
          </Link>
        </div>
      </header>

      {editorEmployee ? (
        <EmployeeDashboardEditor
          shop={stationShop}
          employee={editorEmployee}
          disabled={mode !== "preview" && mode !== "owner" && mode !== "employee"}
          onSaved={setLocalConfig}
        />
      ) : null}

      {layout && layout.sections.length === 0 ? (
        <p className="mt-10 text-sm text-faint">This station is clear.</p>
      ) : null}

      {layout?.sections.includes("schedule") ? (
      <section className="mt-10">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted">My book</p>
        <h1 className="mt-2 font-display text-4xl">Schedule</h1>
        <ul className="mt-6 divide-y divide-line">
          {appointments.length === 0 ? (
            <li className="py-6 text-sm text-faint">No appointments yet.</li>
          ) : (
            appointments.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm">{a.serviceName}</p>
                  <p className="text-xs text-muted">
                    {a.customerName} ·{" "}
                    {new Date(a.startsAt).toLocaleString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {a.status === "pending" ? (
                    <Button
                      size="sm"
                      onClick={() => {
                        void (async () => {
                          ring.announce(
                            {
                              id: `acc-${a.id}`,
                              type: "booking_confirmed",
                              appointmentId: a.id,
                              payload: null,
                              createdAt: new Date().toISOString(),
                            },
                            true,
                          );
                          await acceptBooking({
                            data: { slug: shop.slug, appointmentId: a.id },
                          });
                          setAppointments((prev) =>
                            prev.map((x) => (x.id === a.id ? { ...x, status: "confirmed" } : x)),
                          );
                        })();
                      }}
                    >
                      Accept
                    </Button>
                  ) : (
                    <span className="text-xs uppercase tracking-wider text-faint">{a.status}</span>
                  )}
                </div>
              </li>
            ))
          )}
        </ul>
      </section>
      ) : null}

      {layout?.sections.includes("portfolio") && employee ? (
        <PortfolioManager
          slug={shop.slug}
          employeeId={employee.id}
          gallery={gallery}
          onChange={setGallery}
          readonly={mode === "preview"}
        />
      ) : null}

      {layout?.sections.includes("hours") ? <ShopHours hours={stationShop.hours} /> : null}
    </main>
  );
}

function ShopHours({ hours }: { hours: Shop["hours"] }) {
  return (
    <section className="mt-12 max-w-sm pb-16">
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Open</p>
      <h2 className="mt-2 font-display text-3xl">Shop hours</h2>
      <ul className="mt-6 space-y-2 text-sm">
        {WEEKDAYS.map(([key, label]) => (
          <li key={key} className="flex justify-between">
            <span className="text-muted">{label}</span>
            <span className="tabular">{hours[key] ?? "closed"}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function PortfolioManager({
  slug,
  employeeId,
  gallery,
  onChange,
  readonly,
}: {
  slug: string;
  employeeId: string;
  gallery: PortfolioItem[];
  onChange: (items: PortfolioItem[]) => void;
  readonly: boolean;
}) {
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);

  async function onFile(file: File | undefined) {
    if (!file || readonly) return;
    setBusy(true);
    try {
      const imageUrl = await compress(file);
      await addPortfolioItem({ data: { slug, imageUrl, caption } });
      setCaption("");
      onChange(await getPortfolio({ data: employeeId }));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-12 pb-16">
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Proof of work</p>
      <h2 className="mt-2 font-display text-3xl">Portfolio</h2>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {gallery.map((p) => (
          <figure key={p.id} className="overflow-hidden rounded-2xl bg-surface">
            <img src={p.imageUrl} alt="" className="aspect-[4/3] w-full object-cover" />
            {p.caption ? (
              <figcaption className="px-3 py-2 text-xs text-muted">{p.caption}</figcaption>
            ) : null}
          </figure>
        ))}
      </div>
      <form className="mt-6 max-w-sm" onSubmit={(e) => e.preventDefault()}>
        <Label htmlFor="cap">Caption</Label>
        <Input id="cap" value={caption} onChange={(e) => setCaption(e.target.value)} />
        <label className="mt-3 flex h-11 cursor-pointer items-center justify-center rounded-xl bg-fg text-sm font-medium text-bg">
          {busy ? "Uploading…" : "Upload image"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={readonly || busy}
            onChange={(e) => void onFile(e.target.files?.[0])}
          />
        </label>
        {readonly ? (
          <p className="mt-2 text-xs text-faint">Preview only on the demo shop.</p>
        ) : null}
      </form>
    </section>
  );
}

async function compress(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.8);
}
