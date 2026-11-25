import { getSessionUser } from "@/lib/auth/verify.server";
import { AutopilotError, hasMasterBypass } from "@/lib/axiom/autopilot.server";
import { isPlatformOwner } from "@/lib/axiom/platform-owner.server";
import { bypassConfigured } from "@/lib/axiom/master-bypass.server";
import {
  emptyMasterSessionJson,
  failClosedMasterSession,
} from "@/lib/axiom/master-session-response";
import { NextResponse } from "next/server";

function noStoreJson(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "cache-control": "no-store" } });
}

/**
 * Probe the desk without hanging on an empty Better Auth session.
 * Bypass cookie/Bearer short-circuits. Null session returns 200 JSON and skips owner DB.
 */
export async function resolveMasterSessionGet(request: Request) {
  const configured = bypassConfigured();
  try {
    if (hasMasterBypass(request)) {
      return noStoreJson({
        attached: true,
        configured: true,
        access: "bypass" as const,
        session: { ok: true },
        user: { ok: true },
      });
    }
    const header = request.headers.get("authorization") ?? "";
    const bearer = /^Bearer\s+(\S+)$/i.exec(header.trim())?.[1] ?? "";
    const user = await getSessionUser(bearer || undefined, request.headers);
    if (!user) return emptyMasterSessionJson(configured);
    if (await isPlatformOwner(user.id, user.email)) {
      return noStoreJson({
        attached: true,
        configured,
        access: "session" as const,
        session: { ok: true },
        user: { id: user.id, email: user.email },
      });
    }
    const { localDevAuthAllowed } = await import("@/lib/auth/local-dev-bypass");
    if (localDevAuthAllowed()) {
      return noStoreJson({
        attached: true,
        configured,
        access: "session" as const,
        session: { ok: true },
        user: { id: user.id, email: user.email },
      });
    }
    return noStoreJson(
      { error: "Email not in MASTER_ADMIN_EMAIL allowlist", session: null, user: null },
      403,
    );
  } catch (err) {
    if (err instanceof AutopilotError && err.status === 401) return emptyMasterSessionJson(configured);
    return failClosedMasterSession(err, configured);
  }
}

export { emptyMasterSessionJson, failClosedMasterSession, masterSessionUnavailable } from "./master-session-response";
