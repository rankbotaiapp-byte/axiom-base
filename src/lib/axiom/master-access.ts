import { createMiddleware } from "@tanstack/react-start";
import { MASTER_OWNER_ID } from "./master-owner.ts";

/**
 * Master desk gate. A valid owner cookie opens the desk with no user session.
 * Otherwise this is the normal signed-in check.
 */
export const masterAccessMiddleware = createMiddleware({ type: "function" })
  .client(async ({ next }) => {
    const { getBearerToken } = await import("@/lib/auth/client");
    return next({ sendContext: { bearerToken: getBearerToken() ?? undefined } });
  })
  .server(async ({ next, context }) => {
    const { assertSameSiteRequest } = await import("@/lib/auth/isolation.server");
    assertSameSiteRequest();
    const bypass = await import("./master-bypass.server");
    if (bypass.hasValidMasterCookie()) {
      bypass.refreshMasterCookie();
      return next({ context: { userId: MASTER_OWNER_ID } });
    }
    const { requireUserId } = await import("@/lib/auth/verify.server");
    const userId = await requireUserId(context.bearerToken);
    return next({ context: { userId } });
  });
