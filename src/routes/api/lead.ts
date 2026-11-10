import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/lead")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: Record<string, unknown>;
        try {
          body = (await request.json()) as Record<string, unknown>;
        } catch {
          return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
        }

        if (typeof body.website === "string" && body.website.trim()) return Response.json({ ok: true });

        const str = (k: string, max = 200) => (typeof body[k] === "string" ? (body[k] as string).trim().slice(0, max) : "");
        const lead = {
          business: str("business"),
          name: str("name"),
          phone: str("phone", 40),
          email: str("email", 120),
          city: str("city"),
          template: str("template"),
          plan: str("plan", 20),
          source: str("source", 60),
          submittedAt: new Date().toISOString(),
        };

        if (!lead.business || !lead.name || !/\S+@\S+\.\S+$/.test(lead.email) || lead.phone.replace(/\D/g, "").length < 10) {
          return Response.json({ ok: false, error: "Missing required fields" }, { status: 422 });
        }

        const hook = process.env.LEAD_WEBHOOK_URL;
        if (!hook) {
          console.warn("[lead] LEAD_WEBHOOK_URL not set — lead logged only:", lead);
          return Response.json({ ok: true, forwarded: false });
        }

        try {
          const res = await fetch(hook, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({ ...lead, _subject: `New Axiom lead: ${lead.business} (${lead.plan})` }),
          });
          if (!res.ok) throw new Error(`Webhook ${res.status}`);
          return Response.json({ ok: true, forwarded: true });
        } catch (err) {
          console.error("[lead] forward failed", err, lead);
          return Response.json({ ok: false, error: "Could not save lead" }, { status: 502 });
        }
      },
    },
  },
});
