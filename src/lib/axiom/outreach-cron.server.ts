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
  return Response.json({
    batchReleased: batch.released,
    nurtureReleased: nurture.released,
    shopAutopilot: shops.ran,
    stockBranded: stockBrand,
    outboundTicked: outbound.ticked,
    outboundPaused: outbound.paused,
    cronEnabled,
  });
}
