import { createServerFn } from "@tanstack/react-start";

/** Disk-gated cinematic IDs. `.server` stays inside the handler so the client bundle never imports it. */
export const getReadyShowcaseIds = createServerFn({ method: "GET" }).handler(async () => {
  const { readyShowcaseIds } = await import("./ready.server");
  return readyShowcaseIds();
});
