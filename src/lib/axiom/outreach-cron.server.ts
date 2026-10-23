import { timingSafeEqual } from "node:crypto";
import { getSql } from "@/lib/db";
import { env } from "@/lib/env.server";
import { drainNurtureTouches, drainOutreachQueue } from "./outreach-queue.server";

function secretMatches(header: string, secret: string): boolean {
  if (header.length !== secret.length) return false;
  return timingSafeEqual(Buffer.from(header), Buffer.from(secret));
}

/** External scheduler. Refuses to run until OUTREACH_CRON_SECRET is set. */
export async function handleOutreachCron(request: Request): Promise<Response> {
  const secret = env("OUTREACH_CRON_SECRET");
  if (!secret) return new Response(null, { status: 404 });
  const header = request.headers.get("x-outreach-cron") ?? "";
  if (!secretMatches(header, secret)) return Response.json({ error: "Forbidden" }, { status: 403 });
  const sql = await getSql();
  const origin = new URL(request.url).origin;
  const batch = await drainOutreachQueue(sql, origin);
  const nurture = await drainNurtureTouches(sql, origin);
  return Response.json({ batchReleased: batch.released, nurtureReleased: nurture.released });
}
