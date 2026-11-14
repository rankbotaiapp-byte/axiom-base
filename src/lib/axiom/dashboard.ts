export const DASHBOARD_SECTIONS = ["schedule", "portfolio", "hours"] as const;

export type DashboardSection = (typeof DASHBOARD_SECTIONS)[number];

export type DashboardConfig = {
  sections: DashboardSection[];
};

export const DASHBOARD_SECTION_LABELS: Record<DashboardSection, string> = {
  schedule: "Schedule",
  portfolio: "Portfolio",
  hours: "Shop hours",
};

export const DEFAULT_DASHBOARD: DashboardConfig = {
  sections: ["schedule", "portfolio", "hours"],
};

export function parseDashboardConfig(raw: unknown): DashboardConfig {
  let value = raw;
  if (typeof raw === "string") {
    try {
      value = JSON.parse(raw) as unknown;
    } catch {
      return DEFAULT_DASHBOARD;
    }
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return DEFAULT_DASHBOARD;
  const sections = (value as { sections?: unknown }).sections;
  if (!Array.isArray(sections)) return DEFAULT_DASHBOARD;
  const picked: DashboardSection[] = [];
  for (const item of sections) {
    if (
      (DASHBOARD_SECTIONS as readonly string[]).includes(String(item)) &&
      !picked.includes(item as DashboardSection)
    ) {
      picked.push(item as DashboardSection);
    }
  }
  return { sections: picked };
}

/** Shop override wins. The employee's saved layout is left untouched. */
export function effectiveDashboard(
  override: boolean,
  shopConfig: DashboardConfig,
  employeeConfig: DashboardConfig,
): DashboardConfig {
  return override ? shopConfig : employeeConfig;
}

export function dashboardSummary(config: DashboardConfig): string {
  if (config.sections.length === 0) return "Empty";
  return config.sections.map((section) => DASHBOARD_SECTION_LABELS[section]).join(", ");
}
