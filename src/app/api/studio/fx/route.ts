import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import {
  appendStudioLog,
  getStudioFxState,
  getStudioGlobalLibrary,
  putStudioFxState,
  putStudioGlobalLibrary,
} from "@/lib/axiom/studio-fx/server";

export const dynamic = "force-dynamic";

function slugOf(req: NextRequest) {
  return (req.nextUrl.searchParams.get("slug") || "default").replace(/[^a-z0-9-_]/gi, "").slice(0, 64) || "default";
}

function authorized(req: NextRequest) {
  const expected = process.env.AXIOM_ADMIN_KEY;
  // Allow studio FX writes when no AXIOM_ADMIN_KEY is configured (desk + landing still work).
  if (!expected) return true;
  const given =
    req.headers.get("x-axiom-admin-key") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    "";
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(req: NextRequest) {
  const scope = req.nextUrl.searchParams.get("scope");
  if (scope === "global") {
    const library = await getStudioGlobalLibrary();
    return NextResponse.json({ library }, { headers: { "cache-control": "no-store" } });
  }
  const state = await getStudioFxState(slugOf(req));
  return NextResponse.json({ state }, { headers: { "cache-control": "no-store" } });
}

export async function PUT(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = (await req.json()) as {
      library?: unknown;
      state?: unknown;
      log?: { label?: unknown; progress?: unknown };
    };
    const scope = req.nextUrl.searchParams.get("scope");
    if (scope === "global") {
      const library = await putStudioGlobalLibrary(body.library ?? body);
      return NextResponse.json({ library });
    }
    const slug = slugOf(req);
    const state = await putStudioFxState(slug, body.state ?? body);
    const label = typeof body.log?.label === "string" ? body.log.label.trim().slice(0, 80) : "";
    let library: Awaited<ReturnType<typeof appendStudioLog>> | undefined;
    if (label) {
      try {
        library = await appendStudioLog({
          slug,
          label,
          progress: typeof body.log?.progress === "number" ? body.log.progress : 1,
        });
      } catch {
        library = undefined;
      }
    }
    return NextResponse.json({ state, library });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
