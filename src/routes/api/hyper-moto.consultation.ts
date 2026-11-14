import { createFileRoute } from "@tanstack/react-router";

type TranscriptLine = { from: "concierge" | "client"; text: string };

type ConsultationPayload = {
  name: string;
  bike: string;
  goal: string;
  phone: string;
  source: string;
  page: string;
  transcript: TranscriptLine[];
};

const MAX = 500;
const str = (v: unknown, max = MAX): string | null =>
  typeof v === "string" && v.trim().length > 0 && v.length <= max ? v.trim() : null;

function parse(body: unknown): ConsultationPayload | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const name = str(b.name, 120);
  const bike = str(b.bike, 200);
  const goal = str(b.goal, 300);
  const phone = str(b.phone, 32);
  if (!name || !bike || !goal || !phone || phone.replace(/\D/g, "").length !== 10) return null;
  const transcript = Array.isArray(b.transcript)
    ? (b.transcript as unknown[])
        .slice(0, 40)
        .filter(
          (l): l is TranscriptLine =>
            !!l &&
            typeof l === "object" &&
            ((l as TranscriptLine).from === "concierge" || (l as TranscriptLine).from === "client") &&
            typeof (l as TranscriptLine).text === "string",
        )
        .map((l) => ({ from: l.from, text: l.text.slice(0, MAX) }))
    : [];
  return {
    name,
    bike,
    goal,
    phone,
    transcript,
    source: str(b.source, 80) ?? "hyper-moto",
    page: str(b.page, 300) ?? "",
  };
}

/**
 * Mock consultation intake — expandable to webhook / DB later.
 * POST /api/hyper-moto/consultation
 */
export const Route = createFileRoute("/api/hyper-moto/consultation")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }
        const lead = parse(body);
        if (!lead) {
          return Response.json({ error: "Invalid consultation payload" }, { status: 400 });
        }

        const delivered: string[] = ["mock"];
        const webhook = process.env.CONSULT_WEBHOOK_URL ?? process.env.VITE_CONSULT_WEBHOOK_URL;
        if (webhook) {
          try {
            const res = await fetch(webhook, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                type: "build_consultation",
                receivedAt: new Date().toISOString(),
                ...lead,
              }),
            });
            if (res.ok) delivered.push("webhook");
          } catch {
            /* keep mock delivery */
          }
        }

        return Response.json({
          ok: true,
          reference: `HM-${Date.now().toString(36).toUpperCase()}`,
          delivered,
        });
      },
    },
  },
});
