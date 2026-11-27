import { NextResponse, type NextRequest } from "next/server";

/**
 * Do not canonicalize www vs apex (www.rankbotapp.com ↔ rankbotapp.com).
 * Host rewrites here plus Vercel domain redirects loop /privacy and /terms.
 * Legal paths always continue on the Host that received the request.
 */
export function middleware(request: NextRequest) {
  return NextResponse.next({
    request: {
      headers: request.headers,
    },
  });
}

export const config = {
  matcher: ["/privacy", "/privacy/", "/terms", "/terms/"],
};
