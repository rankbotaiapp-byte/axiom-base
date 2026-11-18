/**
 * Minimal Next.js-compatible shim for leftover `@tanstack/react-start` APIs.
 * Typed loosely so stubbed server-fn chains do not block `tsc --noEmit`.
 */

export type ServerFn = ((input?: any) => Promise<any>) & { url?: string };

export function createServerFn(_opts?: { method?: string }): any {
  let validate: ((d: unknown) => unknown) | undefined;
  const chain: any = {
    middleware() {
      return chain;
    },
    validator(fn: (d: any) => any) {
      validate = fn;
      return chain;
    },
    handler(fn: (ctx: any) => any) {
      const run: ServerFn = (async (input?: any) => {
        const raw =
          input && typeof input === "object" && "data" in input ? input.data : input;
        const data = validate ? validate(raw) : raw;
        return fn({ data, context: { userId: "local-dev", bearerToken: "" } });
      }) as ServerFn;
      return run;
    },
  };
  return chain;
}

export function createMiddleware(_opts?: { type?: string }): any {
  const api: any = {
    middleware() {
      return api;
    },
    server(fn: any) {
      void fn;
      return api;
    },
    client(fn: any) {
      void fn;
      return api;
    },
  };
  return api;
}

export function createStart() {
  return {};
}

export default { createServerFn, createMiddleware, createStart };
