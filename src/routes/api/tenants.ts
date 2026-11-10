import { createFileRoute } from "@tanstack/react-router";
import crypto from "node:crypto";
import { getShowcase } from "@/lib/axiom-landing/showcase";
import { MAX_LOGO_BYTES, cleanText, normalizePhone, slugify, sniffLogo } from "@/lib/axiom-landing/tenants/validate";
import {
  createTenant,
  uploadLogo,
  SlugTakenError,
  storeMode,
  type TenantStatus,
} from "@/lib/axiom-landing/tenants/store";

export const Route = createFileRoute("/api/tenants")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let form: FormData;
        try {
          form = await request.formData();
        } catch {
          return Response.json({ ok: false, error: "Expected form data" }, { status: 400 });
        }

        if (cleanText(form.get("website"), 200)) return Response.json({ ok: true });

        const build = getShowcase(cleanText(form.get("build_id"), 60));
        const business = cleanText(form.get("business_name"), 80);
        const owner = cleanText(form.get("owner_name"), 80);
        const email = cleanText(form.get("email"), 120).toLowerCase();
        const phone = normalizePhone(cleanText(form.get("phone"), 40));

        const errors: string[] = [];
        if (!build) errors.push("Unknown build");
        if (!business) errors.push("Business name is required");
        if (!/^\S+@\S+\.\S+$/.test(email)) errors.push("A valid email is required");
        if (!phone) errors.push("A valid 10-digit phone number is required");

        let logo: { bytes: Buffer; type: string; ext: string } | null = null;
        const file = form.get("logo");
        if (file && typeof file !== "string" && file.size > 0) {
          if (file.size > MAX_LOGO_BYTES) errors.push("Logo must be under 2 MB");
          else {
            const bytes = Buffer.from(await file.arrayBuffer());
            const kind = sniffLogo(bytes);
            if (!kind) errors.push("Logo must be a PNG, JPG, WEBP or SVG");
            else logo = { bytes, ...kind };
          }
        }
        if (errors.length) return Response.json({ ok: false, error: errors.join(". ") }, { status: 422 });

        const checkoutLink =
          process.env.NEXT_PUBLIC_STRIPE_CINEMATIC_LINK || process.env.VITE_STRIPE_CINEMATIC_LINK;
        const simulate = process.env.AXIOM_SIMULATE_CHECKOUT === "1";
        const status: TenantStatus = checkoutLink ? "pending_payment" : simulate ? "active" : "pending_review";

        const base = slugify(business);
        try {
          const logoUrl = logo ? await uploadLogo(logo.bytes, logo.ext, logo.type) : null;
          let tenant;
          for (let attempt = 0; ; attempt++) {
            const slug = attempt === 0 ? base : `${base}-${crypto.randomBytes(2).toString("hex")}`;
            try {
              tenant = await createTenant({
                slug,
                status,
                build_id: build!.id,
                plan: "cinematic",
                business_name: business,
                phone: phone!,
                logo_url: logoUrl,
                owner_name: owner || null,
                email,
              });
              break;
            } catch (e) {
              if (e instanceof SlugTakenError && attempt < 4) continue;
              throw e;
            }
          }

          const hook = process.env.LEAD_WEBHOOK_URL;
          if (hook) {
            fetch(hook, {
              method: "POST",
              headers: { "Content-Type": "application/json", Accept: "application/json" },
              body: JSON.stringify({
                _subject: `New Axiom tenant: ${tenant.business_name} (${build!.name}, ${tenant.status})`,
                business: tenant.business_name,
                name: owner,
                email,
                phone,
                build: build!.name,
                status: tenant.status,
                site: `/t/${tenant.slug}`,
              }),
            }).catch((e) => console.error("[tenants] notify failed", e));
          }

          let next: "checkout" | "live" | "review" = status === "active" ? "live" : "review";
          let checkoutUrl: string | undefined;
          if (status === "pending_payment" && checkoutLink) {
            const u = new URL(checkoutLink);
            u.searchParams.set("prefilled_email", email);
            u.searchParams.set("client_reference_id", tenant.id);
            checkoutUrl = u.toString();
            next = "checkout";
          }

          return Response.json({
            ok: true,
            id: tenant.id,
            slug: tenant.slug,
            status: tenant.status,
            next,
            checkoutUrl,
            siteUrl: `/t/${tenant.slug}`,
          });
        } catch (err) {
          console.error(`[tenants] create failed (store=${storeMode})`, err);
          return Response.json({ ok: false, error: "We couldn't set that up — please try again." }, { status: 502 });
        }
      },
    },
  },
});
