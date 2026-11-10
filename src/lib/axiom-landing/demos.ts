import { getTemplate } from "./templates";
import { getShowcase } from "./showcase";

/** Display name for whatever the visitor last looked at — a niche template or a cinematic build. */
export function demoName(id?: string | null): string | null {
  return getTemplate(id)?.trade ?? getShowcase(id)?.name ?? null;
}
