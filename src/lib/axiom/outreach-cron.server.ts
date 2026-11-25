import { getSql } from "@/lib/db";
import { requireCronSecret } from "./cron-auth.server";
import { drainNurtureTouches, drainOutreachQueue } from "./outreach-queue.server";

/** External scheduler. Requires CRON_SECRET / OUTREACH_CRON_SECRET (401 otherwise). */
export async function handleOutreachCron(request: Request): Promise<Response> {
  const denied = requireCronSecret(request);
  if (denied) return denied;
  const sql = await getSql();
  const { resolvePublicAppOrigin } = await import("./public-app-url");
  const origin = resolvePublicAppOrigin(new URL(request.url).origin);
  const engine = await import("./outbound-engine.server");
  const shot = await engine.readOutboundEngine(request).catch(() => null);
  const cronEnabled = shot?.schedule?.cronEnabled === true;
  const { processOutreachQueue, ensureDailyPlumbingOutreach } = await import("./outreach-scheduler.server");
  if (cronEnabled) {
    await ensureDailyPlumbingOutreach(sql).catch(() => 0);
  }
  await processOutreachQueue(sql).catch(() => undefined);
  const batch = cronEnabled
    ? await drainOutreachQueue(sql, origin)
    : { released: false };
  const nurture = cronEnabled ? await drainNurtureTouches(sql, origin) : { released: 0 };
  const shops = await import("./shop-autopilot.server")
    .then((mod) => mod.tickShopAutopilot())
    .catch(() => ({ ran: 0, results: [] as const }));
  const stockBrand = Array.isArray(shops.results)
    ? shops.results.filter((row) => "stockBrand" in row && row.stockBrand).length
    : 0;
  const outbound = await engine.tickOutboundFromCron(request).catch(() => ({
    ticked: 0,
    paused: true as const,
  }));
  const health = await import("./self-correction.server")
    .then((mod) => mod.maybeEvaluateOutreachHealthHourly())
    .catch(() => ({ ran: false, slot: null as string | null }));
  const published = await import("./social-publish.server")
    .then((mod) => mod.publishQueuedSocialPosts())
    .catch(() => ({ published: 0, failed: 0, deliveries: 0 }));
  const refreshed = await import("./social-publish.server")
    .then((mod) => mod.refreshExpiringSocialTokens())
    .catch(() => ({ refreshed: 0, failed: 0 }));
  const engagement = await import("./autopilot-engagement.server")
    .then((mod) => mod.tickSocialEngagement())
    .catch(() => ({ scanned: 0, handled: 0 }));
  const trustClosed = await import("./lifecycle.server")
    .then((mod) => mod.sweepExpiredTrustWindows(sql))
    .catch(() => 0);
  return Response.json({
    batchReleased: batch.released,
    nurtureReleased: nurture.released,
    shopAutopilot: shops.ran,
    stockBranded: stockBrand,
    outboundTicked: outbound.ticked,
    outboundPaused: outbound.paused,
    healthEvaluated: health.ran,
    healthSlot: health.slot,
    socialPublished: published.published,
    socialDeliveries: published.deliveries,
    tokensRefreshed: refreshed.refreshed,
    engagementHandled: engagement.handled,
    trustWindowsClosed: trustClosed,
    cronEnabled,
  });
}
