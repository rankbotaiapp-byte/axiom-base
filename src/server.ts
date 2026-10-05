import {
  createStartHandler,
  defaultStreamHandler,
} from "@tanstack/react-start/server";
import type { Register } from "@tanstack/react-router";
import type { RequestHandler } from "@tanstack/react-start/server";
import { isClientAbort } from "@/lib/client-abort";

const logError = console.error.bind(console);
console.error = (...args: unknown[]) => {
  if (isClientAbort(args[0])) return;
  logError(...args);
};

const fetch = createStartHandler(defaultStreamHandler);

// Providing `RequestHandler` from `@tanstack/react-start/server` is required so that the output types don't import it from `@tanstack/start-server-core`
export type ServerEntry = { fetch: RequestHandler<Register> };

export function createServerEntry(entry: ServerEntry): ServerEntry {
  return {
    async fetch(...args) {
      try {
        return await entry.fetch(...args);
      } catch (error) {
        if (isClientAbort(error)) return new Response(null, { status: 499 });
        throw error;
      }
    },
  };
}

export default createServerEntry({ fetch });
