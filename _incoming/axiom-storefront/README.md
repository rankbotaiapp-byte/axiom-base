# Axiom Storefront — cinematic hero + funnel + content engine

Next.js 15 (App Router) · Tailwind v4 · three.js · TypeScript. Builds clean, runs with **zero env vars** (demo mode), and switches to Supabase / Stripe / Anthropic as you add keys.

```bash
npm install
cp .env.example .env.local   # optional — leave blank for demo mode
npm run dev                  # http://localhost:3000
# QA: http://localhost:3000/?freeze=1 triggers the freeze-orbit as soon as it's warm
```

## Layout

```
config/storefront.ts            ← copy, pricing, hero timing, niche presets (re-skin here)
components/hero/
  CinematicHero.tsx             ← media panel: <video> + lazy WebGL + overlaid CTAs
  freeze-orbit.ts               ← three.js engine (code-split, never in the first-load bundle)
  tier.ts                       ← device tiers: off / low / medium / high
components/ui/TactileButton.tsx ← glow · ripple · particle burst · haptic · prefetch → route
components/funnel/              ← StartForm (2-step), BookingForm, RunCycleButton
app/page.tsx                    ← landing (server-rendered copy + JSON-LD)
app/start                       ← funnel → POST /api/provision
app/b/[slug]                    ← the generated tenant app (booking, services, FAQ, articles, PWA)
app/b/[slug]/posts/[post]       ← AI articles (BlogPosting JSON-LD + branded OG card)
app/admin                       ← content-engine control room (ADMIN_TOKEN gated)
app/api/cron/content            ← daily content cycle (vercel.json)
lib/content-engine/             ← generate (Claude) · publishers (web/webhook/FB/IG/GBP) · run
lib/seo/                        ← JSON-LD builders, safe rich-text renderer
lib/tenants/                    ← store (Supabase REST or in-memory), factory, types
supabase/schema.sql             ← axiom_tenants, axiom_posts, axiom_channels (+ reuses `orders`)
scripts/encode-hero.sh          ← re-encode any new hero clip into web assets
```

## 1 · Hero: freeze + orbit

- The native `<video>` plays the footage untouched. WebGL is only on screen during the freeze, so playback quality is never filtered or re-compressed.
- At `freezeAt − rampIn` the clip speed-ramps to 0.25×, then pauses. The paused frame goes onto a subdivided plane framed pixel-for-pixel like `object-fit: cover`, so the hand-off is seamless.
- The plane is pushed into relief (subject + floor toward camera), the camera swings ±`orbitArc` around the subject, and the ice field (instanced refractive shards, IOR 1.31, dispersion, clearcoat; plus additive frozen droplets) turns a **full 360°** around it while lights and the environment sweep reflections across the ice. High tier adds real depth of field. The camera then returns to the exact rest pose and the video resumes at 0.5× → 1×.
- **Honest limit:** a flat video frame has no back side, so the *camera* swings ~±35° rather than going all the way round. For a true 360° camera move, generate a "frozen moment, 360° bullet-time orbit" clip of the leopard and set `hero.orbitClip` — the engine plays it inside the freeze with the shards composited on top.
- Performance: three.js loads only after the panel is visible and the browser is idle; shaders are precompiled while hidden; tiers scale shard/particle counts, transmission and DOF; an in-freeze frame-time guard downgrades automatically. Pauses when offscreen or the tab is hidden. Reduced motion / Save-Data → still poster.
- **Zero CLS** (measured 0 on desktop and mobile): the panel's box is sized by CSS before any media loads; the poster is preloaded as the LCP.
- Re-tune for a new clip: run `bash scripts/encode-hero.sh master.mp4 <freezeSeconds>` and adjust `hero.freezeAt` / `hero.subject` in the config.

## 2 · Buttons → funnel → live app

`TactileButton` prefetches the route on hover or first touch, then fires ripple + burst + an 8 ms haptic and navigates in about 90 ms. It also emits a `window` event `axiom:cta` for analytics.

`/start` → `POST /api/provision`: validates the form → creates the tenant with a unique local slug (`business-city`) → seeds services/hours/FAQ from the niche preset → returns either a Stripe Checkout URL or the live app URL. The app at `/b/<slug>` is **live immediately** as an installable PWA. After the response, `after()` writes and publishes the first local article and queues a week of content.

Stripe is optional. Starter = $150/mo subscription with a 30-day trial plus a one-time $1 item. Lifetime = a one-time $1000 payment. The webhook flips `preview → active`. Custom plan = a lead (set `LEAD_NOTIFY_WEBHOOK` to get it on your phone).

Bookings write to the **existing AXIOM `orders` table** (`business_id` = tenant slug, `source = "axiom-web"`), so your current admin dashboard sees them with no changes.

## 3 · Content engine + local SEO

- Each **content unit** = an on-site article (the asset that ranks) + a Google Business Profile post + a social caption. Both posts link back to the article, so every channel reinforces the same local topic and URL.
- Claude writes the units against the tenant's niche, city, service area and pillars. It avoids repeat topics and is told not to invent prices, stats or reviews. Without an API key, a template generator keeps demo mode working.
- Publishers: `web` (ISR revalidate), `webhook` (Make/Zapier/n8n/Buffer, HMAC-signed — the fastest route to every network), `facebook` (Page feed), `instagram` (needs a JPEG URL — see the code comment), `gbp` (localPosts with OAuth refresh). Retries are idempotent per channel; a post is marked failed after 48 h.
- SEO: niche-specific `LocalBusiness` subtype JSON-LD (address, hours, area served, offer catalog, `ReserveAction`), `FAQPage`, `BreadcrumbList`, `BlogPosting`; canonical URLs, geo meta, a dynamic sitemap of every tenant and article, robots, branded OG cards per page, and a consistent NAP footer. Fake review stars are deliberately left out — Google ignores or penalizes self-served ratings on LocalBusiness pages.
- No code can guarantee a #1 ranking. This handles the on-site and posting work. The other big levers are Google Business Profile completeness, reviews, and consistent citations.

## Integrating with the existing Axiom routes

- Everything lives under `/`, `/start`, `/b/*`, `/admin`, `/api/*`. If your storefront already owns `/admin`, move `app/admin` to `app/admin/content`. The middleware matcher covers the whole `/admin/*` tree.
- To send tenants to the Halo template instead of `/b/[slug]`, change the success URL in `app/api/provision/route.ts` and `lib/payments/stripe.ts`.
- Run `supabase/schema.sql`, then set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Keys are only used on the server.

## Before launch

1. Set `NEXT_PUBLIC_SITE_URL` (sitemap, canonicals, OG, and Stripe redirects use it).
2. Set `CRON_SECRET` and `ADMIN_TOKEN`.
3. Create 3 Stripe prices and add the webhook endpoint `/api/stripe/webhook` (events: `checkout.session.completed`, `customer.subscription.deleted`).
4. Put Vercel Firewall rate limiting in front of `/api/provision` and `/api/bookings` (the in-code limiter only works per instance).
5. Move channel credentials into Supabase Vault.
