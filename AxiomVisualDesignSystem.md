# Axiom Visual Design System

Lead visual architect lock for every generated still, loop, HUD overlay, and media-processing prompt.

## Never

- Generic stock photography, pastel SaaS, purple “AI slop,” or unframed product shots
- Fallback styles when a trade photo is messy — wrap it in HUD chrome instead
- Invented logos that replace the tenant mark

## Always (Cyber-Obsidian HUD)

- Dark brushed-metal **obsidian** field (`#030712` / `#050507`)
- Neon cyan highlights **`#00f2fe`** (primary HUD)
- Crimson edge glow `#ff2a3d` used sparingly on corners / alerts
- Volumetric atmospheric smoke or fine particulate in the deep field
- Tactical **corner crosshairs** (L-brackets), not a hard rectangular picture frame
- Holographic data plates, system-stability readouts, hairline cyan strokes
- **Clever branding**: tenant logo, wordmark, and trade tools sit on real surfaces (truck, glass, wrench, visor) *and* in the HUD plate

## Image prompts

Prefix every Imagine / xAI image prompt with the lock in `src/lib/axiom/visual-design.ts`. Keep the original scene and lighting. Weave `#00f2fe` into edges, not as a full-screen wash.

## Video parameters

Hero loops use the same lock plus slow orbit / push-in. No on-film word painting unless the tenant tagline is already in Brand DNA. Default animator: `obsidian_carbon`, 5s, cyan rim light.

## Backend media scripts

Stamp, watermark, SVG HUD frames, and Autopilot `composeBrandedStock` must use `--color-hud: #00f2fe`, obsidian fill, and corner brackets. Do not emit unframed stock stills to tenants.
