export const PORTFOLIO_STATUSES = ["pending", "approved", "rejected"] as const;
export type PortfolioStatus = (typeof PORTFOLIO_STATUSES)[number];

export type PortfolioActor = {
  userId: string;
  role: "customer" | "employee" | "owner";
  employeeId?: string | null;
};

export function parsePortfolioStatus(value: unknown): PortfolioStatus {
  const raw = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (raw === "pending" || raw === "rejected" || raw === "approved") return raw;
  return "pending";
}

/** Public storefronts only show owner-approved stills. Unknown rows stay locked. */
export function isPublicPortfolioStatus(value: unknown): boolean {
  return parsePortfolioStatus(value) === "approved";
}

export function parsePortfolioTags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .flatMap((item) => item.split(","))
      .map((item) => item.trim().toLowerCase().replace(/[^a-z0-9-]+/g, ""))
      .filter(Boolean)
      .slice(0, 8);
  }
  if (typeof value !== "string") return [];
  return value
    .split(",")
    .map((item) => item.trim().toLowerCase().replace(/[^a-z0-9-]+/g, ""))
    .filter(Boolean)
    .slice(0, 8);
}

export function serializePortfolioTags(tags: readonly string[]): string {
  return parsePortfolioTags([...tags]).join(",");
}

export function canStaffWritePortfolio(actor: PortfolioActor, employeeId: string): boolean {
  if (actor.role === "owner") return true;
  if (actor.role !== "employee") return false;
  return Boolean(actor.employeeId && actor.employeeId === employeeId);
}

export function canModeratePortfolio(actor: PortfolioActor): boolean {
  return actor.role === "owner";
}

export function publicCanViewPortfolio(status: PortfolioStatus, actor: PortfolioActor, employeeId: string): boolean {
  if (status === "approved") return true;
  if (actor.role === "owner") return true;
  if (actor.role === "employee" && actor.employeeId === employeeId) return true;
  return false;
}

export function defaultUploadStatus(actor: PortfolioActor): PortfolioStatus {
  return actor.role === "owner" ? "approved" : "pending";
}
