import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";

export type TenantLead = {
  id: string;
  consumerName: string;
  consumerContact: string;
  note: string;
  scannedOn: string;
  status: "new" | "contacted";
};

function shopSlug(slug: string) {
  const value = String(slug ?? "").trim();
  if (!value) throw new Error("Shop not found");
  return value;
}

/** The shop's saved queue. Does not pull a new batch. */
export const listTenantLeads = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(shopSlug)
  .handler(async ({ data: slug, context }) => {
    const { listTenantLeadsForShop } = await import("./tenant-leads.server");
    return listTenantLeadsForShop(slug, context.userId);
  });

/**
 * Pull today's prospects for this shop's niche and city into tenant_leads.
 * A prospect already on the queue is left as-is. The batch is the rows dated today.
 */
export const scanTenantProspects = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(shopSlug)
  .handler(async ({ data: slug, context }) => {
    const { scanTenantProspectsForShop } = await import("./tenant-leads.server");
    return scanTenantProspectsForShop(slug, context.userId);
  });

/**
 * Send today's campaign to every new lead on this shop's queue.
 * Simulation logs the send and marks them contacted. Live calls the provider,
 * and a lead that does not go out stays new so the next click can try again.
 */
export const sendTenantOutreach = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(shopSlug)
  .handler(async ({ data: slug, context }) => {
    const { sendTenantOutreachForShop } = await import("./tenant-leads.server");
    return sendTenantOutreachForShop(slug, context.userId);
  });
