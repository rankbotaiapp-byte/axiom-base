/**
 * Next.js-compatible shim for `@tanstack/react-start/server`.
 * Cookies and request helpers read from the ambient Next.js request when present.
 */

import { cookies, headers } from "next/headers";

export type RequestHandler = (request: Request) => Response | Promise<Response>;

let ambientRequest: Request | null = null;

export function setAmbientRequest(request: Request | null) {
  ambientRequest = request;
}

export function getRequest(): Request {
  if (ambientRequest) return ambientRequest;
  const hdrs = headers() as unknown as Headers | Promise<Headers>;
  // next/headers may be sync or async depending on Next version — normalize later callers.
  if (hdrs && typeof (hdrs as Promise<Headers>).then === "function") {
    throw new Error("getRequest() needs setAmbientRequest() in async Next 15 route handlers");
  }
  return new Request("http://localhost/", { headers: hdrs as Headers });
}

export function getCookie(name: string): string | undefined {
  try {
    const bag = cookies() as unknown as { get?: (n: string) => { value: string } | undefined };
    return bag.get?.(name)?.value;
  } catch {
    return undefined;
  }
}

export function setCookie(
  name: string,
  value: string,
  opts?: { path?: string; maxAge?: number; httpOnly?: boolean; sameSite?: string; secure?: boolean },
) {
  try {
    const bag = cookies() as unknown as {
      set?: (n: string, v: string, o?: Record<string, unknown>) => void;
    };
    bag.set?.(name, value, {
      path: opts?.path ?? "/",
      maxAge: opts?.maxAge,
      httpOnly: opts?.httpOnly ?? true,
      sameSite: opts?.sameSite ?? "lax",
      secure: opts?.secure,
    });
  } catch {
    /* cookie mutation unavailable outside a Server Action / Route Handler */
  }
}

export function getWebRequest(): Request {
  return getRequest();
}

export function defineHandler(handler: RequestHandler): RequestHandler {
  return handler;
}

export default {
  getRequest,
  getCookie,
  setCookie,
  getWebRequest,
  defineHandler,
  setAmbientRequest,
};
