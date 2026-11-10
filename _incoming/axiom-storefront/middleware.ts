import { NextResponse, type NextRequest } from "next/server";

/** Gate /admin behind ADMIN_TOKEN (cookie set by /admin/login). Open in dev if unset. */
export function middleware(req: NextRequest) {
  const token = process.env.ADMIN_TOKEN;
  if (!token) return NextResponse.next();
  if (req.nextUrl.pathname.startsWith("/admin/login")) return NextResponse.next();
  if (req.cookies.get("axiom_admin")?.value === token) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/admin/:path*"] };
