import { createServerFn } from "@tanstack/react-start";
import { masterAccessMiddleware } from "./master-access.ts";
import { parseBusinessRef, type BusinessBrandRecord } from "./business-brand.ts";

/** One business for the niche demo. Missing rows come back as null. */
export const getBusinessBrand = createServerFn({ method: "GET" })
  .validator((input: { id?: string; slug?: string } | string) => parseBusinessRef(input))
  .handler(async ({ data }): Promise<BusinessBrandRecord | null> => {
    const { readBusinessBrand } = await import("./business-lookup.server");
    return readBusinessBrand(data);
  });

/** Paged business list. Master desk only — this includes contact lines. */
export const listBusinessBrands = createServerFn({ method: "GET" })
  .middleware([masterAccessMiddleware])
  .validator((input: { limit?: number; cursor?: string; q?: string } | undefined) => ({
    limit: input?.limit,
    cursor: input?.cursor ?? "",
    q: input?.q ?? "",
  }))
  .handler(async ({ data, context }) => {
    const { listBusinessPageForDesk } = await import("./business-lookup.server");
    return listBusinessPageForDesk(context.userId, data);
  });

/** Preview URLs for one page or a batch of at most 100 ids. Does not send anything. */
export const createBusinessPreviewLinks = createServerFn({ method: "POST" })
  .middleware([masterAccessMiddleware])
  .validator((input: {
    limit?: number;
    cursor?: string;
    q?: string;
    ids?: string[];
    slugs?: string[];
  } | undefined) => ({
    limit: input?.limit,
    cursor: input?.cursor ?? "",
    q: input?.q ?? "",
    ids: input?.ids,
    slugs: input?.slugs,
  }))
  .handler(async ({ data, context }) => {
    const { previewLinksForDesk } = await import("./business-lookup.server");
    const { getRequest } = await import("@tanstack/react-start/server");
    const origin = new URL(getRequest().url).origin;
    return previewLinksForDesk(context.userId, origin, data);
  });
