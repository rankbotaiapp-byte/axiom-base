/**
 * Legacy TanStack Start entry — unused by the Next.js App Router build.
 * Kept as a no-op so leftover imports do not break compilation.
 */

export type RequestHandler = (request: Request) => Response | Promise<Response>;

export const fetch: RequestHandler = async () =>
  new Response("Use Next.js App Router routes under src/app.", { status: 501 });

export default { fetch };
