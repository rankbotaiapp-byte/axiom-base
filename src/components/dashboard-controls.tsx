import { useEffect, useRef, useState } from "react";
import {
  DASHBOARD_SECTIONS,
  DASHBOARD_SECTION_LABELS,
  dashboardSummary,
  effectiveDashboard,
  type DashboardConfig,
  type DashboardSection,
} from "@/lib/axiom/dashboard";
import { setEmployeeDashboard, setShopDashboard } from "@/lib/axiom/server";
import type { Employee, Shop } from "@/lib/axiom/types";

export function DashboardSectionToggles({
  value,
  disabled,
  onChange,
}: {
  value: DashboardConfig;
  disabled?: boolean;
  onChange: (next: DashboardConfig) => void;
}) {
  function toggle(section: DashboardSection) {
    const on = value.sections.includes(section);
    const next = on
      ? value.sections.filter((item) => item !== section)
      : DASHBOARD_SECTIONS.filter((item) => value.sections.includes(item) || item === section);
    onChange({ sections: next });
  }

  return (
    <div className="grid gap-2">
      {DASHBOARD_SECTIONS.map((section) => {
        const on = value.sections.includes(section);
        return (
          <button
            key={section}
            type="button"
            role="switch"
            aria-checked={on}
            disabled={disabled}
            onClick={() => toggle(section)}
            className="flex h-11 items-center justify-between rounded-xl px-3 text-sm shadow-[0_0_0_1px_rgba(243,241,235,0.08)] disabled:opacity-50"
          >
            <span>{DASHBOARD_SECTION_LABELS[section]}</span>
            <span className={on ? "text-fg" : "text-faint"}>{on ? "On" : "Off"}</span>
          </button>
        );
      })}
    </div>
  );
}

export function ShopDashboardPanel({
  shop,
  employees,
  disabled,
  onReload,
}: {
  shop: Shop;
  employees: Employee[];
  disabled?: boolean;
  onReload: () => void;
}) {
  const [override, setOverride] = useState(shop.dashboardOverride);
  const [config, setConfig] = useState(shop.dashboardConfig);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const saving = useRef(false);

  useEffect(() => {
    if (saving.current) return;
    setOverride(shop.dashboardOverride);
    setConfig(shop.dashboardConfig);
  }, [shop.dashboardConfig, shop.dashboardOverride]);

  function save(nextOverride: boolean, nextConfig: DashboardConfig) {
    if (disabled || saving.current) return;
    saving.current = true;
    setOverride(nextOverride);
    setConfig(nextConfig);
    setBusy(true);
    setError(null);
    void setShopDashboard({
      data: { slug: shop.slug, override: nextOverride, config: nextConfig },
    })
      .then(() => onReload())
      .catch((err: unknown) => {
        setOverride(shop.dashboardOverride);
        setConfig(shop.dashboardConfig);
        setError(err instanceof Error ? err.message : "Could not save");
      })
      .finally(() => {
        saving.current = false;
        setBusy(false);
      });
  }

  return (
    <section className="max-w-xl rounded-[24px] bg-surface p-5 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]">
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Stations</p>
      <h2 className="mt-1 font-display text-3xl">Dashboards</h2>
      <p className="mt-2 text-sm text-muted">
        {override
          ? "This layout replaces every employee dashboard. Their saved layouts stay put."
          : "Employees keep the layouts they set. Turn override on to replace them."}
      </p>
      <button
        type="button"
        role="switch"
        aria-checked={override}
        aria-label="Override employee dashboards"
        disabled={disabled || busy}
        onClick={() => save(!override, config)}
        className="mt-4 flex h-11 w-full items-center justify-between rounded-xl px-3 text-sm shadow-[0_0_0_1px_rgba(243,241,235,0.08)] disabled:opacity-50"
      >
        <span>Override employee dashboards</span>
        <span className={override ? "text-fg" : "text-faint"}>{override ? "On" : "Off"}</span>
      </button>
      <div className="mt-3">
        <DashboardSectionToggles
          value={config}
          disabled={disabled || busy}
          onChange={(next) => save(override, next)}
        />
      </div>
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      <ul className="mt-5 grid gap-3">
        {employees.map((employee) => {
          const showing = effectiveDashboard(override, config, employee.dashboardConfig);
          return (
            <li key={employee.id} className="text-sm">
              <p className="font-medium">{employee.displayName}</p>
              <p className="text-muted">Saved · {dashboardSummary(employee.dashboardConfig)}</p>
              <p className="text-muted">Showing · {dashboardSummary(showing)}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function EmployeeDashboardEditor({
  shop,
  employee,
  disabled,
  onSaved,
}: {
  shop: Shop;
  employee: Employee;
  disabled?: boolean;
  onSaved: (config: DashboardConfig) => void;
}) {
  const [config, setConfig] = useState(employee.dashboardConfig);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const showing = effectiveDashboard(shop.dashboardOverride, shop.dashboardConfig, config);

  useEffect(() => {
    setConfig(employee.dashboardConfig);
  }, [employee.dashboardConfig, employee.id]);

  return (
    <section className="mt-10 max-w-xl">
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted">My layout</p>
      <h2 className="mt-2 font-display text-3xl">Dashboard</h2>
      <p className="mt-2 text-sm text-muted">
        {shop.dashboardOverride
          ? `Shop override is on. This station is showing ${dashboardSummary(showing)}.`
          : "These sections are yours until the shop override is on."}
      </p>
      <div className="mt-4">
        <DashboardSectionToggles
          value={config}
          disabled={disabled || busy}
          onChange={(next) => {
            setConfig(next);
            setBusy(true);
            setError(null);
            void setEmployeeDashboard({
              data: { slug: shop.slug, employeeId: employee.id, config: next },
            })
              .then((result) => onSaved(result.config))
              .catch((err: unknown) => {
                setConfig(employee.dashboardConfig);
                setError(err instanceof Error ? err.message : "Could not save");
              })
              .finally(() => setBusy(false));
          }}
        />
      </div>
      {shop.dashboardOverride ? (
        <p className="mt-3 text-sm text-muted">Saved · {dashboardSummary(config)}</p>
      ) : null}
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
    </section>
  );
}
