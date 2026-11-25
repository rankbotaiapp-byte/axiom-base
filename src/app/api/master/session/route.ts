import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AutopilotError, assertAutopilotDesk } from "@/lib/axiom/autopilot.server";
import { bypassConfigured, bypassSecret, acceptMasterKey } from "@/lib/axiom/master-bypass.server";
import { signMasterPass } from "@/lib/axiom/master-bypass";
import { MASTER_COOKIE, MASTER_MAX_AGE_SECONDS } from "@/lib/axiom/master-owner";
import { setAmbientRequest } from "@/lib/tanstack-start-server-shim";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cookieSecure(request: Request): boolean {
  const forwarded = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  if (forwarded) return forwarded === "https";
  try {
    return new URL(request.url).protocol === "https:";
  } catch {
    return false;
  }
}

async function deskAttached(request: Request): Promise<boolean> {
  try {
    await assertAutopilotDesk(request);
    return true;
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  setAmbientRequest(request);
  const configured = bypassConfigured();
  const attached = await deskAttached(request);
  return NextResponse.json({
    attached,
    configured,
    access: attached ? (configured ? "bypass" : "session") : "signed-out",
  });
}

export async function POST(request: Request) {
  setAmbientRequest(request);
  try {
    const body = (await request.json().catch(() => ({}))) as { key?: string };
    const key = String(body.key ?? "").trim();
    const secret = bypassSecret();
    if (!secret) {
      return NextResponse.json({ error: "Master bypass is not configured" }, { status: 409 });
    }
    if (!acceptMasterKey(key)) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      return NextResponse.json({ error: "That key does not open the desk." }, { status: 401 });
    }
    const exp = Math.floor(Date.now() / 1000) + MASTER_MAX_AGE_SECONDS;
    const token = signMasterPass(secret, exp);
    const jar = await cookies();
    jar.set(MASTER_COOKIE, token, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: cookieSecure(request),
      maxAge: MASTER_MAX_AGE_SECONDS,
    });
    const response = NextResponse.json({ ok: true, attached: true, configured: true, access: "bypass" });
    response.cookies.set(MASTER_COOKIE, token, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: cookieSecure(request),
      maxAge: MASTER_MAX_AGE_SECONDS,
    });
    return response;
  } catch (err) {
    const status = err instanceof AutopilotError ? err.status : 500;
    const error = err instanceof Error ? err.message : "Master session failed.";
    return NextResponse.json({ error }, { status });
  }
}
