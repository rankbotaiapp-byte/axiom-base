import { createFileRoute } from "@tanstack/react-router";
import { assertCatalogNiche, catalogFilmUrl } from "@/config/catalog";
import { requireUserId } from "@/lib/auth/verify.server";
import { isCatalogHeroUrl } from "@/lib/axiom/hero-films";
import { cleanCustomNiche } from "@/lib/axiom/media";
import { provisionShopFromNiche } from "@/lib/axiom/shop-server.server";

/**
 * POST /api/shops/create
 * Body: { niche, name, solo?, ownerName?, leadSlug?, customNiche?, heroFilm? }
 * Validates niche against the 21-loop catalog and binds the matching hero film.
 */
export const Route = createFileRoute("/api/shops/create")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let userId: string;
        try {
          userId = await requireUserId();
        } catch {
          return Response.json({ error: "Sign in before opening this shop" }, { status: 401 });
        }
        let body: Record<string, unknown> = {};
        try {
          body = (await request.json()) as Record<string, unknown>;
        } catch {
          return Response.json({ error: "Invalid JSON body" }, { status: 400 });
        }
        try {
          const niche = assertCatalogNiche(String(body.niche ?? ""));
          const customNiche = cleanCustomNiche(typeof body.customNiche === "string" ? body.customNiche : "");
          const requestedFilm = typeof body.heroFilm === "string" ? body.heroFilm.trim() : "";
          const heroFilm = isCatalogHeroUrl(requestedFilm) ? requestedFilm.split("?")[0]! : catalogFilmUrl(niche);
          const result = await provisionShopFromNiche({
            userId,
            niche,
            name: typeof body.name === "string" ? body.name : "",
            solo: Boolean(body.solo),
            ownerName: typeof body.ownerName === "string" ? body.ownerName : "",
            leadSlug: typeof body.leadSlug === "string" ? body.leadSlug : "",
            customNiche,
            heroFilm,
          });
          return Response.json({ ...result, heroFilm, niche });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Could not create shop";
          const status = /unknown catalog niche/i.test(message) ? 400 : 500;
          return Response.json({ error: message }, { status });
        }
      },
    },
  },
});
