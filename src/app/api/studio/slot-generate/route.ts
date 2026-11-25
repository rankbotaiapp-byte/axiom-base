import { NextResponse } from "next/server";
import { z } from "zod";
import {
  findCachedBackgroundMotion,
  findCachedProofTouchup,
  generateAiBrandedSlot,
  generateBackgroundMotion,
  generateProofTouchupSlot,
} from "@/lib/axiom/ai-client";
import {
  authorizeAndConsumeGeneration,
  generationGuardJson,
  refundGeneration,
} from "@/lib/axiom/generation-guard";
import { getSessionUser } from "@/lib/auth/verify.server";
import { INLAY_PRESET_IDS, MOTION_PRESET_IDS, isTemplateSkinId } from "@/lib/axiom/storefront-themes";

export const runtime = "nodejs";
export const maxDuration = 300;

const proofTouchupSchema = z.object({
  mode: z.literal("proof_touchup"),
  shopSlug: z.string().min(1).max(80),
  sourceImageUrl: z.string().url().max(2000),
  slotLabel: z.string().max(80).optional(),
  niche: z.string().max(40).optional(),
  themeId: z.string().max(40).optional(),
  shopName: z.string().max(80).optional(),
  brandColor: z.string().max(24).optional(),
  inlay: z.enum(INLAY_PRESET_IDS).optional(),
  logoUrl: z.string().url().max(2000).optional(),
});

const backgroundMotionSchema = z.object({
  mode: z.literal("background_motion"),
  shopSlug: z.string().min(1).max(80),
  sourceImageUrl: z.string().url().max(2000),
  niche: z.string().max(40).optional(),
  shopName: z.string().max(80).optional(),
  brandColor: z.string().max(24).optional(),
  motion: z.enum(MOTION_PRESET_IDS).optional(),
  reactions: z.array(z.string().max(64)).max(2).optional(),
});

const aiBrandedSchema = z.object({
  mode: z.literal("ai_branded"),
  shopSlug: z.string().min(1).max(80),
  slotLabel: z.string().min(1).max(80),
  niche: z.string().min(1).max(40),
  brandColor: z.string().max(24).optional(),
  themeId: z.string().max(40).optional(),
  templateSkin: z.string().max(40).optional(),
  userPrompt: z.string().max(600).optional(),
  shopName: z.string().max(80).optional(),
});

const slotJobSchema = z.discriminatedUnion("mode", [proofTouchupSchema, backgroundMotionSchema, aiBrandedSchema]);

const bodySchema = z.union([
  slotJobSchema,
  z.object({
    batch: z.literal(true),
    shopSlug: z.string().min(1).max(80),
    niche: z.string().max(40).optional(),
    shopName: z.string().max(80).optional(),
    themeId: z.string().max(40).optional(),
    jobs: z.array(slotJobSchema).min(1).max(5),
  }),
]);

type SlotJob = z.infer<typeof slotJobSchema>;

function validateTheme(themeId: string | undefined): boolean {
  if (!themeId) return true;
  return isTemplateSkinId(themeId);
}

function validateShopSlug(shopSlug: string): boolean {
  return /^[a-z0-9-]{1,80}$/i.test(shopSlug);
}

async function runSlotJob(
  job: SlotJob,
  defaults: { themeId?: string; shopName?: string; niche?: string },
  userId: string,
  request: Request,
): Promise<{ ok: true; result: unknown } | { ok: false; status: number; body: Record<string, unknown> }> {
  if (job.mode === "proof_touchup" && /^https:\/\//i.test(job.sourceImageUrl)) {
    const cached = await findCachedProofTouchup({
      shopSlug: job.shopSlug,
      sourceImageUrl: job.sourceImageUrl,
      slotLabel: job.slotLabel,
      niche: job.niche || defaults.niche,
      themeId: job.themeId || defaults.themeId,
      shopName: job.shopName || defaults.shopName,
      brandColor: job.brandColor,
      inlay: job.inlay,
      logoUrl: job.logoUrl,
    }).catch(() => null);
    if (cached) return { ok: true, result: cached };
  }

  if (job.mode === "background_motion" && /^https:\/\//i.test(job.sourceImageUrl)) {
    const cached = await findCachedBackgroundMotion({
      shopSlug: job.shopSlug,
      sourceImageUrl: job.sourceImageUrl,
      niche: job.niche || defaults.niche,
      shopName: job.shopName || defaults.shopName,
      brandColor: job.brandColor,
      motion: job.motion,
      reactions: job.reactions,
    }).catch(() => null);
    if (cached) return { ok: true, result: cached };
  }

  const guard = await authorizeAndConsumeGeneration(userId, request.headers);
  if (!guard.allowed) {
    return { ok: false, status: guard.status, body: generationGuardJson(guard) };
  }

  const shopSlug = job.shopSlug.trim();
  if (!validateShopSlug(shopSlug)) {
    await refundGeneration(guard.userId);
    return { ok: false, status: 400, body: { error: "Unknown shop" } };
  }

  const themeId =
    job.mode === "ai_branded" ? job.themeId || job.templateSkin : job.mode === "proof_touchup" ? job.themeId : undefined;
  const mergedTheme = themeId || defaults.themeId;
  if (!validateTheme(mergedTheme)) {
    await refundGeneration(guard.userId);
    return { ok: false, status: 400, body: { error: "Unknown theme id." } };
  }

  try {
    if (job.mode === "proof_touchup") {
      if (!/^https:\/\//i.test(job.sourceImageUrl)) {
        await refundGeneration(guard.userId);
        return { ok: false, status: 400, body: { error: "sourceImageUrl must be a public https URL." } };
      }
      const result = await generateProofTouchupSlot({
        shopSlug,
        sourceImageUrl: job.sourceImageUrl,
        slotLabel: job.slotLabel,
        niche: job.niche || defaults.niche,
        themeId: mergedTheme,
        shopName: job.shopName || defaults.shopName,
        brandColor: job.brandColor,
        inlay: job.inlay,
        logoUrl: job.logoUrl,
      });
      return { ok: true, result };
    }

    if (job.mode === "background_motion") {
      if (!/^https:\/\//i.test(job.sourceImageUrl)) {
        await refundGeneration(guard.userId);
        return { ok: false, status: 400, body: { error: "sourceImageUrl must be a public https URL." } };
      }
      const reserved = await import("@/lib/axiom/hero-motion-studio.server").then((mod) => mod.reserveMicroMotion(shopSlug));
      if (!reserved.ok) {
        await refundGeneration(guard.userId);
        return { ok: false, status: 402, body: { error: reserved.message, code: "CONTENT_BALANCE" } };
      }
      try {
        const result = await generateBackgroundMotion({
          shopSlug,
          sourceImageUrl: job.sourceImageUrl,
          niche: job.niche || defaults.niche,
          shopName: job.shopName || defaults.shopName,
          brandColor: job.brandColor,
          motion: job.motion,
          reactions: job.reactions,
        });
        if (result.cached) {
          const { releaseMicroMotion } = await import("@/lib/axiom/hero-motion-studio.server");
          await releaseMicroMotion(reserved.shopId);
        }
        return { ok: true, result };
      } catch (err) {
        const { releaseMicroMotion } = await import("@/lib/axiom/hero-motion-studio.server");
        await releaseMicroMotion(reserved.shopId);
        throw err;
      }
    }

    const result = await generateAiBrandedSlot({
      shopSlug,
      slotLabel: job.slotLabel,
      niche: job.niche || defaults.niche || "contractor",
      brandColor: job.brandColor,
      themeId: mergedTheme,
      templateSkin: job.templateSkin,
      userPrompt: job.userPrompt,
      shopName: job.shopName || defaults.shopName,
    });
    return { ok: true, result };
  } catch (err) {
    await refundGeneration(guard.userId);
    const message = err instanceof Error ? err.message : "Slot generation did not finish";
    return { ok: false, status: 502, body: { error: message } };
  }
}

export async function POST(request: Request) {
  const session = await getSessionUser(undefined, request.headers).catch(() => null);
  const userId = session?.id ?? "";

  const json = (await request.json().catch(() => ({}))) as unknown;
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid slot generation payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;

  if ("batch" in data && data.batch) {
    if (!validateShopSlug(data.shopSlug.trim())) {
      return NextResponse.json({ error: "Unknown shop" }, { status: 400 });
    }
    if (data.themeId && !validateTheme(data.themeId)) {
      return NextResponse.json({ error: "Unknown theme id." }, { status: 400 });
    }

    const results: unknown[] = [];
    const errors: { index: number; status: number; body: Record<string, unknown> }[] = [];
    for (let i = 0; i < data.jobs.length; i++) {
      const job = { ...data.jobs[i]!, shopSlug: data.jobs[i]!.shopSlug || data.shopSlug };
      const outcome = await runSlotJob(
        job,
        { themeId: data.themeId, shopName: data.shopName, niche: data.niche },
        userId,
        request,
      );
      if (!outcome.ok) {
        errors.push({ index: i, status: outcome.status, body: outcome.body });
        break;
      }
      results.push(outcome.result);
    }

    if (errors[0]) {
      return NextResponse.json(
        { error: "Batch generation stopped.", partial: results, failures: errors },
        { status: errors[0].status },
      );
    }

    return NextResponse.json({ batch: true, results, count: results.length });
  }

  if ("batch" in data) {
    return NextResponse.json({ error: "Invalid slot generation payload." }, { status: 400 });
  }
  const outcome = await runSlotJob(data, {}, userId, request);
  if (!outcome.ok) {
    return NextResponse.json(outcome.body, { status: outcome.status });
  }
  return NextResponse.json(outcome.result);
}