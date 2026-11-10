import { createMiddleware, createServerFn } from "@tanstack/react-start";

/** Forwards the sign-in bearer token when there is one. Never throws: the handler decides access. */
const optionalBearer = createMiddleware({ type: "function" })
  .client(async ({ next }) => {
    const { getBearerToken } = await import("@/lib/auth/client");
    return next({ sendContext: { bearerToken: getBearerToken() ?? undefined } });
  })
  .server(async ({ next, context }) => next({ context: { bearerToken: context.bearerToken } }));

function slugOf(value: unknown): string {
  return String(value ?? "").trim().toLowerCase().slice(0, 64);
}

function sessionOf(value: unknown): string {
  const id = String(value ?? "").trim();
  if (!/^cs_[A-Za-z0-9_]{1,200}$/.test(id)) throw new Error("Invalid session");
  return id;
}

/** Public: published config + who this link was built for. */
export const getPlumberOutreachPage = createServerFn({ method: "GET" })
  .validator((slug: string) => slugOf(slug))
  .handler(async ({ data }) => {
    const loaded = await import("./plumber-outreach.server");
    return loaded.readOutreachPage(data);
  });

/** Studio: the published config only. */
export const getPlumberOutreach = createServerFn({ method: "GET" }).handler(async () => {
  const loaded = await import("./plumber-outreach.server");
  return loaded.readPlumberOutreach();
});

/** Whether this browser may publish from the studio. */
export const plumberOutreachAccess = createServerFn({ method: "GET" })
  .middleware([optionalBearer])
  .handler(async ({ context }) => {
    const loaded = await import("./plumber-outreach.server");
    return loaded.canEditOutreach(context.bearerToken);
  });

/** Publish a new version. Input is re-sanitized on the server. */
export const savePlumberOutreach = createServerFn({ method: "POST" })
  .middleware([optionalBearer])
  .validator((input: unknown) => {
    const size = JSON.stringify(input ?? null).length;
    if (size > 24_000) throw new Error("That page is too large to save.");
    return input;
  })
  .handler(async ({ data, context }) => {
    const loaded = await import("./plumber-outreach.server");
    return loaded.savePlumberOutreach(data, context.bearerToken);
  });

/** Stripe Embedded Checkout for the $1 Choose Your Price trial, bound to the territory slug. */
export const beginOutreachCheckout = createServerFn({ method: "POST" })
  .validator((input: { slug?: string; dollars?: number }) => ({
    slug: slugOf(input?.slug),
    dollars: Number(input?.dollars) || 1,
  }))
  .handler(async ({ data }) => {
    const loaded = await import("./plumber-outreach.server");
    return loaded.beginOutreachCheckout(data);
  });

export const confirmOutreachCheckout = createServerFn({ method: "POST" })
  .validator((input: { slug?: string; sessionId?: string }) => ({
    slug: slugOf(input?.slug),
    sessionId: sessionOf(input?.sessionId),
  }))
  .handler(async ({ data }) => {
    const loaded = await import("./plumber-outreach.server");
    return loaded.confirmOutreachCheckout(data);
  });

/** Post-checkout mobile lock. */
export const lockDispatchMobile = createServerFn({ method: "POST" })
  .validator((input: { slug?: string; sessionId?: string; phone?: string }) => ({
    slug: slugOf(input?.slug),
    sessionId: sessionOf(input?.sessionId),
    phone: String(input?.phone ?? "").slice(0, 40),
  }))
  .handler(async ({ data }) => {
    const loaded = await import("./plumber-outreach.server");
    return loaded.lockDispatchMobile(data);
  });

/** "Test Live SMS Dispatch" — one real Twilio text to the locked number. */
export const sendTestDispatch = createServerFn({ method: "POST" })
  .validator((input: { slug?: string; sessionId?: string }) => ({
    slug: slugOf(input?.slug),
    sessionId: sessionOf(input?.sessionId),
  }))
  .handler(async ({ data }) => {
    const loaded = await import("./plumber-outreach.server");
    return loaded.sendTestDispatch(data);
  });
