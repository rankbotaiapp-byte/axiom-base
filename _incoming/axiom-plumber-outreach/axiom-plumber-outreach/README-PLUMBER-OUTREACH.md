# Plumber outreach landing — drop-in export

Every path in this zip matches the repo (`axiom-base`). Copy the contents of this
folder over the root of your workspace and let it overwrite.

## New files
- `src/components/plumbing/plumber-outreach-landing.tsx` — the page
- `src/components/plumbing/plumber-outreach.css` — its styles
- `src/components/plumbing/kinetic-button.tsx` — the buttons
- `src/components/plumbing/outreach-checkout-modal.tsx` — Stripe modal, mobile lock, test SMS
- `src/components/plumbing/plumber-outreach-studio.tsx` — admin editor
- `src/routes/axiom-auto/outreach.tsx` — admin route `/axiom-auto/outreach`
- `src/lib/axiom/plumber-outreach.ts` / `.server.ts` / `.functions.ts` / `.test.ts`
- `migrations/0084_territory_dispatch_numbers.sql`
- `public/media/` — 7 media files (hero, phone hero, drain ride, telemetry, posters)

## Replaced files (overwrite)
- `src/routes/t/$slug.tsx` — adds `?niche=plumbing`
- `src/routeTree.gen.ts` — regenerated
- `src/lib/axiom/payments.server.ts` — `embedded` option on `createTerritoryCheckout`
- `src/lib/axiom/plumbing-storefront.ts` — default hero film is now the master file
- `src/components/plumbing/plumbing-studio.tsx` — exports shared editor parts, adds the master film choice
- `package.json` — adds the new test file to `npm test` (no dependency changes)

## Hero video
Both plumbing pages now point at `/media/plumbers-outreach-hero-animation.mp4`:
- `/t/{slug}?niche=plumbing` renders `<video src="/media/plumbers-outreach-hero-animation.mp4" autoPlay muted loop playsInline preload="auto">`
- `/demo/plumbing` (Emergency Plumbing storefront) uses it as its default film

If a hero film was already published from the Emergency Plumbing studio, that saved
choice still wins — pick "Master hero (plumbers outreach)" in the studio and publish.

## Media and Git LFS
`.gitattributes` sends `*.mp4` and `*.jpg` through Git LFS. Committing from your
local workspace (`git add public/media && git commit && git push`) handles that
automatically if `git lfs` is installed.

## After copying
1. `npm install` (only if you have not already)
2. `npm run dev`
3. Open `/t/<a real lead slug>?niche=plumbing` and `/axiom-auto/outreach`
