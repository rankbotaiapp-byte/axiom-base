/**
 * Minimal Next.js-compatible shim for leftover `@tanstack/react-start` APIs.
 * Server functions become async callables that accept `{ data }` (and optional context).
 */

type HandlerCtx<TData> = { data: TData; context: { userId: string } };

type Chain<TData, TResult> = {
  middleware: (mids: unknown[]) => Chain<TData, TResult>;
  validator: <TNext>(fn: (d: TData) => TNext) => Chain<TNext, TResult>;
  handler: (fn: (ctx: HandlerCtx<TData>) => Promise<TResult> | TResult) => ServerFn<TData, TResult>;
};

export type ServerFn<TData = unknown, TResult = unknown> = ((
  input?: { data: TData } | TData,
) => Promise<TResult>) & {
  url?: string;
};

function wrap<TData, TResult>(
  run: (ctx: HandlerCtx<TData>) => Promise<TResult> | TResult,
  validate?: (d: unknown) => TData,
): ServerFn<TData, TResult> {
  const fn = (async (input?: { data: TData } | TData) => {
    const raw =
      input && typeof input === "object" && "data" in (input as object)
        ? (input as { data: TData }).data
        : (input as TData);
    const data = validate ? validate(raw) : (raw as TData);
    return run({ data, context: { userId: "local-dev" } });
  }) as ServerFn<TData, TResult>;
  return fn;
}

export function createServerFn(_opts?: { method?: string }): Chain<any, any> {
  let validate: ((d: unknown) => unknown) | undefined;
  const chain: Chain<any, any> = {
    middleware() {
      return chain;
    },
    validator(fn) {
      validate = fn as (d: unknown) => unknown;
      return chain;
    },
    handler(fn) {
      return wrap(fn, validate);
    },
  };
  return chain;
}

export function createMiddleware() {
  return {
    middleware() {
      return this;
    },
    server() {
      return this;
    },
    client() {
      return this;
    },
  };
}

export function createStart() {
  return {};
}

export default { createServerFn, createMiddleware, createStart };
