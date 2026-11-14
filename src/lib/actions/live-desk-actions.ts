import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { liveDeskState, type LiveDeskState } from "@/lib/axiom/live-desk-state";

export type LiveDeskSnapshot = {
  shopSlug: string;
  state: LiveDeskState;
  updatedAt: string;
};

export const readLiveDesk = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((d: { slug: string }) => d)
  .handler(async ({ data }): Promise<LiveDeskSnapshot> => {
    const { readShopLiveDesk } = await import("@/lib/axiom/live-desk.server");
    const shot = await readShopLiveDesk(data.slug);
    if (!shot) {
      return {
        shopSlug: data.slug.trim().toLowerCase(),
        state: liveDeskState(),
        updatedAt: new Date().toISOString(),
      };
    }
    return {
      shopSlug: shot.shopSlug,
      state: shot.state,
      updatedAt: new Date().toISOString(),
    };
  });
