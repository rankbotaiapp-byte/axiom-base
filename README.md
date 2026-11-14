# Axiom landing page: brand hero, video sections, Studio wizard

## Install
1. `npm i framer-motion lucide-react` (Tailwind CSS v4 must already be set up).
2. Copy `components/axiom/` into your app and `public/media/axiom/` into `public/`.
3. Render it from a client component (Next.js App Router, `app/page.tsx`):

```tsx
"use client";
import AxiomLanding from "@/components/axiom/AxiomLanding";

export default function Page() {
  return (
    <AxiomLanding
      onCheckout={async (signup) => {
        // signup = { businessName, niche, accent, plan: "trial" | "lifetime" }
        const res = await fetch("/api/checkout", { method: "POST", body: JSON.stringify(signup) });
        const { url } = await res.json();
        window.location.assign(url);
      }}
    />
  );
}
```

## Files
| File | What it does |
|---|---|
| `landing.config.ts` | All copy, links, prices, trades, colors and media paths. Edit here first. |
| `AxiomBrandHero.tsx` | Top hero: brand still, tilt, neon pulse rings, sparks, Play/Pause for the animated loop. |
| `MediaSections.tsx` | Heart-to-phone pitch band, trades-reel feature section, logo-sting divider. |
| `AxiomStudioWizard.tsx` | 4-step wizard: business, preview, booking test, checkout. |
| `SparkField.tsx` | Canvas spark overlay. |
| `haptics.ts` | Vibration helper (Android only; iOS has no vibrate API). |

## To finish before launch
- **Brand still:** `public/media/axiom/brand-hero.jpg` is a frame pulled from the ring animation. Save `cee8a042.jpeg` over it, keeping the file name.
- **Checkout:** without `onCheckout` the sign-up button shows "Checkout isn't connected". Point it at your Stripe checkout and provisioning.
- **Prices:** `$1 then $150/mo` and `$1,500 lifetime` are in `landing.config.ts` under `studio.plans`.
- **Wizard steps 2 and 3 are samples:** the hero preview is a stock loop with the visitor's name over it, the posts are templates, and the booking test creates nothing.
