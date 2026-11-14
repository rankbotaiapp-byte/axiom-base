# Axiom — Landing Page & Conversion Funnel

Next.js 15 (App Router) · React 19 · Tailwind v4 · TypeScript. No UI libraries; fonts self-hosted.

## Run / deploy

```bash
npm install
cp .env.example .env.local   # fill in the values below
npm run dev                  # http://localhost:3000
```

Deploy: push to GitHub → import in Vercel → add the env vars → deploy. Nothing else to configure.

| Env var | What it does |
|---|---|
| `NEXT_PUBLIC_STRIPE_LIFETIME_LINK` | Stripe **Payment Link** for the one-time lifetime price. When set, the Lifetime path in the wizard goes straight to checkout with the email prefilled. Blank = lead capture only. |
| `LEAD_WEBHOOK_URL` | Where `/api/lead` forwards each signup (Formspree, Zapier, n8n, Supabase function…). Pre-filled with your shared Formspree endpoint. |
| `NEXT_PUBLIC_SITE_URL` | Your production URL, used for social share images. |

## Where to change things

| Change | File |
|---|---|
| Prices, features, guarantee, founding-spot counter | `lib/pricing.ts` |
| Niche templates (services, sample jobs, colors, optional `liveUrl` iframe) | `lib/templates.ts` |
| Hero copy / video | `components/Hero.tsx` · `public/media/axioms-heart.mp4` |
| Multi-trade video | `public/media/gemini_generated_video_5d59539e.mp4` |
| FAQ | `components/FaqAndCta.tsx` |

## Structure

```
app/
  page.tsx               composes the page
  layout.tsx             metadata, fonts
  globals.css            theme tokens, buttons (glow/ripple/scale), glass, motion
  api/lead/route.ts      validates + forwards leads (honeypot spam guard)
components/
  FunnelProvider.tsx     shared funnel state (open demo, selected template, wizard)
  Hero.tsx               video hero (uncropped centerpiece + blurred fill)
  ParticleTrail.tsx      color-sampling spark trail (mouse + touch)
  ProofOfWork.tsx        multi-trade video + niche cards
  DemoModal.tsx          interactive phone preview: booking / dispatch / admin
  StickyConversionBar.tsx glass action bar — locks on after first demo view
  OnboardingWizard.tsx   Trade → Business → Plan → Done (→ Stripe for lifetime)
  Pricing.tsx, HowItWorks.tsx, Nav.tsx, FaqAndCta.tsx, RippleButton.tsx
```

## How the color-matching trail works

Browsers don't let a page read raw screen pixels, so the trail samples what actually paints the screen:

1. **Videos** marked `data-sample` — the current frame is drawn into a tiny offscreen canvas (~12×/sec) and the pixel under the pointer is read, with `object-fit` mapping applied so it lines up exactly.
2. **Everything else** — the element under the pointer is walked up to its first visible background color or gradient stop; any CSS color format resolves correctly.
3. Escape hatch: put `data-sample-color="#hex"` on any element to tell the trail what color it is.

Very dark pixels are lifted in brightness (same hue) so sparks stay visible on the black background. It's off for users with reduced motion turned on, and it sleeps when nothing is moving.

## Videos

Both videos were re-encoded for the web (H.264, faststart, audio track removed because it plays muted). Same resolution, same frames, nothing cropped. The hero went from 24 MB to 5.4 MB, which matters a lot on phones.

## Before you go live, check these are true

The copy makes promises. Make sure each one holds, or edit it:
- 14-day money-back guarantee (`lib/pricing.ts`)
- "$2,400/yr typical stack" comparison (`compareAt`)
- FAQ: SMS billed at cost, customers can export their data
- Wizard's last screen says the admin login is sent by email and text. Wire that up, or handle it yourself from the lead notification.
- The admin stats in the demo are labeled as sample numbers. Keep that label.

## Cinematic builds (showcase)

9 live, interactive builds sit in the Proof of Work section. Each one is a static site in `public/showcase/<dir>/` and opens full-size inside the page.

| Build | Folder | Entry page |
|---|---|---|
| Ironsight Armory (gunsmith, crosshair fires on tap) | `ironsight-armory` | `index.html` |
| Cyber-Augment Labs | `cyber-augment-labs` | `cyber-augment/` |
| Rogue Rapid Plumbing (emergency otter) | `studio` | `plumbing/` |
| Axiom Drone Hub | `studio` | `drone-hub/` |
| Apex Alpine | `apex-alpine` | `snow-leopard-apex/` |
| Leopard Adventures | `leopard-adventures` | `index.html` |
| Abyssal Systems (shark HUD) | `abyssal-systems` | `index.html` |
| Abyssal Sanctuary (WebGL reef) | `abyssal-sanctuary` | `index.html` |
| Aqua Otter Advocates | `studio` | `otter-adventures/` |

**How they were converted:** each Next.js project was exported with `output: "export"` and `basePath: "/showcase/<dir>"`. Media paths were prefixed, and server API routes were removed. Forms inside the demos that post to `/api/leads` hit a demo endpoint here that saves nothing, so prospects playing with a demo don't create fake leads. The three drop-ins (otter, drone hub, plumbing) are hosted together in one small Next.js export (`studio`). The drone hub and plumbing storefront were ported off TanStack Router.

**Readiness gate:** a card only shows in production once every file in its `requires` list (in `lib/showcase.ts`) exists. Run `npm run dev` to see placeholders for anything missing.

### Buying a build
- Each card shows its price, with **Live Demo** and **Buy** buttons.
- Inside a demo, the header has a **Buy This** button, and the sticky bar switches to **Customize It For Me First** and **Buy This Build**.
- Buy opens a one-screen checkout: business, name, phone, email. It then goes straight to `NEXT_PUBLIC_STRIPE_CINEMATIC_LINK`, with the email prefilled and `client_reference_id=<build-id>_<timestamp>` so you know which build was bought. With no link set, it records the lead and shows a "reserved" confirmation.
- The price is `PRICING.cinematic.price` in `lib/pricing.ts`. Override it per build with `price` in `lib/showcase.ts`.

## White-label tenant provisioning

Buying a cinematic build creates a **tenant**, and their branded site goes live at `/t/<slug>`.

```
Checkout (business name, phone, email, logo)
  → POST /api/tenants      validates, uploads logo to Supabase Storage, inserts tenant row
  → Stripe Payment Link    client_reference_id = tenant.id
  → POST /api/stripe/webhook   verified checkout.session.completed → status = active
  → /welcome               polls until active → "Open my site"
  → /t/<slug>              the build, rebranded live from tenants.business_name / phone / logo_url
```

**How rebranding works:** `/t/<slug>` loads the build and, once it has finished loading, swaps:
- every case variant of the demo brand name for `business_name`
- every format of the demo phone, plus `tel:`/`sms:` links, for `phone`
- the page title

It places `logo_url` beside the first visible brand mark. A watcher keeps content that appears later (quote sheets, call overlays, modals) branded too. Each build's demo name and phone are listed under `brand` in `lib/showcase.ts`. Edit a tenant row in Supabase and the site changes on its next load.

**Status flow:**
- `pending_payment`: Stripe link is set and the buyer hasn't paid yet.
- `active`: paid, or simulated.
- `pending_review`: no Stripe link and no simulation. You approve it by setting the status to `active` in Supabase.
- `suspended`: the site returns 404.

### Go-live checklist
1. **Supabase:** run `supabase/migrations/0001_tenants.sql` in the SQL Editor. This creates the table (RLS on, server-only access) and the public `tenant-logos` bucket.
2. **Vercel env:** add `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_STRIPE_CINEMATIC_LINK` and `STRIPE_WEBHOOK_SECRET`. Redeploy after changing any `NEXT_PUBLIC_` value.
3. **Stripe Payment Link:** under *After payment*, choose "Don't show confirmation page" and redirect to `https://<domain>/welcome`.
4. **Stripe webhook:** point it at `https://<domain>/api/stripe/webhook` with the event `checkout.session.completed`.
5. **Test:** buy with a Stripe test card and confirm that `/welcome` turns into "is live".

**Security:**
- Logos are checked by their actual file contents, not their extension.
- SVGs containing scripts or event handlers are rejected.
- Webhook signatures are verified with HMAC, timing-safe comparison and a 5-minute replay window.
- Business names and phones are inserted as text only, never HTML.
- The service-role key never reaches the browser.

**Limits:**
- Only the name, phone and logo change. Body copy, services, prices and the location in each build stay as built. Edit those per client if they matter, or move them into the tenant table later.
- There is no rate limit on `/api/tenants`, so add Vercel Firewall rules if it gets abused.
