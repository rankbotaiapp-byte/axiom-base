import { env } from "@/lib/env.server";
import {
  captionHasProofAtoms,
  captionHitsRecent,
  composeProofCaption,
  type ProofCaptionInput,
} from "./autopilot-caption.ts";

const XAI_CHAT = "https://api.x.ai/v1/chat/completions";

export async function generateProofCaption(
  input: ProofCaptionInput,
  recentCaptions: string[] = [],
): Promise<{ ok: true; caption: string } | { ok: false; reason: "queued_needs_copy" }> {
  const fallback = composeProofCaption(input);
  const key = env("XAI_API_KEY");
  if (!key) {
    if (!fallback.ok || captionHitsRecent(fallback.caption, recentCaptions)) {
      return { ok: false, reason: "queued_needs_copy" };
    }
    return fallback;
  }
  try {
    const res = await fetch(XAI_CHAT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "grok-4.5",
        temperature: 0.4,
        max_tokens: 220,
        messages: [
          {
            role: "system",
            content:
              "Write one social caption for a local trade shop. Must include the shop name, city, trade, and the concrete job/proof detail. No phone numbers, no emails, no generic slogans. Under 280 characters.",
          },
          {
            role: "user",
            content: JSON.stringify({
              shopName: input.shopName,
              city: input.city,
              tradeLabel: input.tradeLabel,
              proofAtom: input.proofAtom,
              bookUrl: input.bookUrl ?? "",
            }),
          },
        ],
      }),
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) {
      if (!fallback.ok || captionHitsRecent(fallback.caption, recentCaptions)) {
        return { ok: false, reason: "queued_needs_copy" };
      }
      return fallback;
    }
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const caption = String(body.choices?.[0]?.message?.content ?? "")
      .replace(/^["']|["']$/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (!captionHasProofAtoms(caption, input) || captionHitsRecent(caption, recentCaptions)) {
      if (!fallback.ok || captionHitsRecent(fallback.caption, recentCaptions)) {
        return { ok: false, reason: "queued_needs_copy" };
      }
      return fallback;
    }
    return { ok: true, caption };
  } catch {
    if (!fallback.ok || captionHitsRecent(fallback.caption, recentCaptions)) {
      return { ok: false, reason: "queued_needs_copy" };
    }
    return fallback;
  }
}
