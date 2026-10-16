import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { capHistory, cleanSlug, sanitizeAssetUrl, sanitizePlain, type CopilotDesk, type CopilotMemoryView, type CopilotSendResult } from "./copilot.ts";

export const readCopilot = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((slug: string) => cleanSlug(slug))
  .handler(async (ctx): Promise<CopilotDesk> => {
    const loaded = await import("./copilot.server.ts");
    return loaded.readCopilotHandler({ data: { slug: ctx.data }, context: ctx.context });
  });

export const sendCopilot = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { slug?: unknown; message?: unknown; history?: unknown }) => {
    const message = sanitizePlain(input?.message, 500);
    if (!message) throw new Error("Write a message first");
    return { slug: cleanSlug(input?.slug), message, history: capHistory(input?.history) };
  })
  .handler(async (ctx): Promise<CopilotSendResult> => {
    const loaded = await import("./copilot.server.ts");
    return loaded.sendCopilotHandler(ctx);
  });

export const stageCopilotPreview = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { slug?: unknown; libraryId?: unknown; style?: unknown }) => ({
    slug: cleanSlug(input?.slug),
    libraryId: sanitizePlain(input?.libraryId, 40),
    style: input?.style ?? {},
  }))
  .handler(async (ctx): Promise<{ ok: true; look: CopilotDesk["look"]; memory: CopilotMemoryView } | { ok: false; error: string }> => {
    const loaded = await import("./copilot.server.ts");
    return loaded.stageCopilotPreviewHandler(ctx);
  });

export const confirmCopilot = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { slug?: unknown; style?: unknown; assetUrl?: unknown; summary?: unknown; brandNote?: unknown }) => ({
    slug: cleanSlug(input?.slug),
    style: input?.style ?? {},
    assetUrl: sanitizeAssetUrl(input?.assetUrl),
    summary: sanitizePlain(input?.summary, 200),
    brandNote: sanitizePlain(input?.brandNote, 400),
  }))
  .handler(async (ctx): Promise<{ ok: true; applied: boolean; look: CopilotDesk["look"]; memory: CopilotMemoryView } | { ok: false; error: string }> => {
    const loaded = await import("./copilot.server.ts");
    return loaded.confirmCopilotHandler(ctx);
  });

export const promoteCopilotHero = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { slug?: unknown }) => ({ slug: cleanSlug(input?.slug) }))
  .handler(async (ctx): Promise<{ ok: true; look: CopilotDesk["look"]; memory: CopilotMemoryView } | { ok: false; error: string }> => {
    const loaded = await import("./copilot.server.ts");
    return loaded.promoteCopilotHeroHandler(ctx);
  });

export const saveCopilotFeedback = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { slug?: unknown; feedback?: unknown }) => {
    const feedback = sanitizePlain(input?.feedback, 400);
    if (!feedback) throw new Error("Write the note to save");
    return { slug: cleanSlug(input?.slug), feedback };
  })
  .handler(async (ctx): Promise<{ ok: true; memory: CopilotMemoryView }> => {
    const loaded = await import("./copilot.server.ts");
    return loaded.saveCopilotFeedbackHandler(ctx);
  });
