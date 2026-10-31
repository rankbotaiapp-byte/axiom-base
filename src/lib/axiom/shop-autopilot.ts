/** Tenant Autopilot: one server flag, not a localStorage switch. */

export function isAutopilotArmed(value: unknown): boolean {
  return value === true || value === 1 || value === "t" || value === "true";
}

export function parseAutopilotActive(row: {
  autopilot_active?: unknown;
  ai_content_autopilot?: unknown;
}): boolean {
  return isAutopilotArmed(row.autopilot_active) || isAutopilotArmed(row.ai_content_autopilot);
}

export type AutopilotTickResult = {
  shopId: string;
  slug: string;
  hero: boolean;
  proof: boolean;
  notice: boolean;
  detail: string;
};
