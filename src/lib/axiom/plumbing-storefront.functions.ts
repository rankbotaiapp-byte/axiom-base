import { createMiddleware, createServerFn } from "@tanstack/react-start";

/** Forwards the sign-in bearer token when there is one. Never throws: the handler decides access. */
const optionalBearer = createMiddleware({ type: "function" })
  .client(async ({ next }) => {
    const { getBearerToken } = await import("@/lib/auth/client");
    return next({ sendContext: { bearerToken: getBearerToken() ?? undefined } });
  })
  .server(async ({ next, context }) => next({ context: { bearerToken: context.bearerToken } }));

/** Public: the published Emergency Plumbing storefront (or defaults). */
export const getPlumbingStorefront = createServerFn({ method: "GET" }).handler(async () => {
  const loaded = await import("./plumbing-storefront.server");
  return loaded.readPlumbingStorefront();
});

/** Whether this browser may publish from the studio. */
export const plumbingStudioAccess = createServerFn({ method: "GET" })
  .middleware([optionalBearer])
  .handler(async ({ context }) => {
    const loaded = await import("./plumbing-storefront.server");
    return loaded.canEditStorefront(context.bearerToken);
  });

/** Publish a new version. Input is re-sanitized on the server. */
export const savePlumbingStorefront = createServerFn({ method: "POST" })
  .middleware([optionalBearer])
  .validator((input: unknown) => {
    const size = JSON.stringify(input ?? null).length;
    if (size > 24_000) throw new Error("That storefront is too large to save.");
    return input;
  })
  .handler(async ({ data, context }) => {
    const loaded = await import("./plumbing-storefront.server");
    return loaded.savePlumbingStorefront(data, context.bearerToken);
  });
