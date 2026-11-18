import { createServerFn } from "@tanstack/react-start";

export function triggerPlumberCampaign(niche: string) {
  return { success: true, niche, timestamp: new Date().toISOString() };
}

export const plumberOutreachAccess = createServerFn({ method: "GET" }).handler(async () => ({
  ok: true,
  role: "operator",
}));

export const getPlumberOutreachPage = createServerFn({ method: "GET" })
  .validator((d: Record<string, unknown> = {}) => d)
  .handler(async () => ({
    headline: "Plumber outreach",
    body: "",
    cta: "Book now",
    prospects: 0,
  }));

export const savePlumberOutreach = createServerFn({ method: "POST" })
  .validator((d: Record<string, unknown>) => d)
  .handler(async ({ data }) => ({ ok: true, ...data }));

export default triggerPlumberCampaign;
