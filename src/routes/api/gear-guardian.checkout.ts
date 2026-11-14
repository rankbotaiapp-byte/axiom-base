import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/gear-guardian/checkout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let amountCents = 0;
        try {
          const body = (await request.json()) as { amountCents?: number };
          amountCents = Number(body.amountCents) || 0;
        } catch {
          amountCents = 0;
        }
        await new Promise((r) => setTimeout(r, 2000));
        const paymentId = `gg_${crypto.randomUUID().replace(/-/g, "").slice(0, 18)}`;
        return Response.json({
          status: "success",
          paymentId,
          amountCents,
          processor: "gear_guardian_mock",
        });
      },
    },
  },
});
