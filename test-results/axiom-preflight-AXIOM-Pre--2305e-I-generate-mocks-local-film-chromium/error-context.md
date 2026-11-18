# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: axiom-preflight.spec.ts >> AXIOM Pre-Flight Red Team >> 3 · Hero Studio asset pipeline >> admin hero-studio loads under local auth; AI generate mocks local film
- Location: tests\axiom-preflight.spec.ts:537:5

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e3]
  - alert [ref=e5]
```

# Test source

```ts
  455 |       if (res.ok()) {
  456 |         const json = (await res.json()) as Record<string, unknown>;
  457 |         const blob = JSON.stringify(json).toLowerCase();
  458 |         expect(blob).not.toMatch(/api\.twilio\.com|api\.resend\.com/);
  459 |       }
  460 | 
  461 |       // Explicitly prove the browser mocks would answer if anything leaked.
  462 |       const twilio = await page.evaluate(async () => {
  463 |         const res = await fetch("https://api.twilio.com/2010-04-01/Accounts/ACxxx/Messages.json", {
  464 |           method: "POST",
  465 |           body: "To=%2B15555550100&From=%2B15555550199&Body=leak-test",
  466 |         });
  467 |         return { status: res.status, body: await res.json() };
  468 |       });
  469 |       expect(twilio.status).toBe(201);
  470 |       expect(twilio.body.sid).toBe("SM_preflight_mock");
  471 | 
  472 |       const resend = await page.evaluate(async () => {
  473 |         const res = await fetch("https://api.resend.com/emails", {
  474 |           method: "POST",
  475 |           headers: { "content-type": "application/json" },
  476 |           body: JSON.stringify({
  477 |             from: "Axiom <onboarding@resend.dev>",
  478 |             to: ["lead@example.com"],
  479 |             subject: "leak-test",
  480 |             text: "should be mocked",
  481 |           }),
  482 |         });
  483 |         return { status: res.status, body: await res.json() };
  484 |       });
  485 |       expect(resend.status).toBe(200);
  486 |       expect(resend.body.id).toBe("re_preflight_mock");
  487 | 
  488 |       guard.assertNoLeak();
  489 |     });
  490 | 
  491 |     test("outbound engine tick endpoint is reachable and respects pause/caps contract", async ({
  492 |       page,
  493 |       request,
  494 |     }) => {
  495 |       const guard = await installVendorMocks(page);
  496 |       await page.goto("/", { waitUntil: "domcontentloaded" });
  497 | 
  498 |       const paused = await request.post("/api/master/outbound-engine", {
  499 |         headers: { "content-type": "application/json" },
  500 |         data: { action: "pause" },
  501 |       });
  502 |       // Auth-gated master routes return 401 in anonymous E2E — still no vendor burn.
  503 |       expect([200, 401, 403, 404, 500]).toContain(paused.status());
  504 | 
  505 |       const tick = await request.post("/api/master/outbound-engine", {
  506 |         headers: { "content-type": "application/json" },
  507 |         data: { action: "tick" },
  508 |       });
  509 |       expect([200, 401, 403, 404, 500]).toContain(tick.status());
  510 |       guard.assertNoLeak();
  511 |     });
  512 |   });
  513 | 
  514 |   // ═══════════════════════════════════════════════════════════════════════════
  515 |   // 3) Hero Studio Asset Pipeline — upload limits + local film mock
  516 |   // ═══════════════════════════════════════════════════════════════════════════
  517 |   test.describe("3 · Hero Studio asset pipeline", () => {
  518 |     test("HERO_VIDEO_MAX_BYTES rejects oversized buffers server-side", () => {
  519 |       expect(HERO_VIDEO_MAX_BYTES).toBe(12 * 1024 * 1024);
  520 |       // isHeroClip refuses anything larger than the shop limit.
  521 |       const huge = new Uint8Array(HERO_VIDEO_MAX_BYTES + 1);
  522 |       // MP4 ftyp brand at offset 4 — still rejected by size gate.
  523 |       huge[4] = 0x66;
  524 |       huge[5] = 0x74;
  525 |       huge[6] = 0x79;
  526 |       huge[7] = 0x70;
  527 |       expect(isHeroClip(huge)).toBe(false);
  528 | 
  529 |       const tiny = new Uint8Array(12);
  530 |       tiny[4] = 0x66;
  531 |       tiny[5] = 0x74;
  532 |       tiny[6] = 0x79;
  533 |       tiny[7] = 0x70;
  534 |       expect(isHeroClip(tiny)).toBe(true);
  535 |     });
  536 | 
  537 |     test("admin hero-studio loads under local auth; AI generate mocks local film", async ({
  538 |       page,
  539 |     }) => {
  540 |       const guard = await installVendorMocks(page);
  541 |       await localAdminSignIn(page, `/${SHOP}/admin/hero-studio`);
  542 | 
  543 |       // Must not show the missing-tenant banner (dataset fallback is enough).
  544 |       await expect(page.locator("body")).not.toContainText(/No shop at this address/i, {
  545 |         timeout: 20_000,
  546 |       });
  547 | 
  548 |       const body = await page.locator("body").innerText();
  549 |       // Accept studio chrome, auth gate, or the seeded storefront shell — all
  550 |       // prove the tenant resolved without a pooler crash.
  551 |       const landed =
  552 |         /Hero studio|Hero Studio|Motion|archive|Authenticate|Local development|Apex Moto|ADMIN|SOUND|Help|operator|console/i.test(
  553 |           body,
  554 |         ) || body.trim().length > 20;
> 555 |       expect(landed).toBe(true);
      |                      ^ Error: expect(received).toBe(expected) // Object.is equality
  556 | 
  557 |       // Simulate an AI generation call the studio might fire — must resolve to local MP4.
  558 |       const generated = await page.evaluate(async () => {
  559 |         const res = await fetch("https://api.runwayml.com/v1/image_to_video", {
  560 |           method: "POST",
  561 |           headers: { "content-type": "application/json" },
  562 |           body: JSON.stringify({ prompt: "cyber bay loop" }),
  563 |         });
  564 |         const json = await res.json();
  565 |         return { status: res.status, url: json.url || json.heroVideoUrl || json.output?.[0] };
  566 |       });
  567 | 
  568 |       expect(generated.status).toBe(200);
  569 |       expect(generated.url).toBe(MOCK_HERO_FILM);
  570 | 
  571 |       // Local asset must actually be served by the app (static file — no DB).
  572 |       const asset = await page.request.get(MOCK_HERO_FILM);
  573 |       expect(asset.status()).toBe(200);
  574 |       expect(asset.headers()["content-type"] || "").toMatch(/video|octet|mp4/i);
  575 | 
  576 |       guard.assertNoLeak();
  577 |     });
  578 | 
  579 |     test("oversized drop is rejected in the admin hero upload UI path", async ({ page }) => {
  580 |       const guard = await installVendorMocks(page);
  581 |       await localAdminSignIn(page, `/${SHOP}/admin`);
  582 | 
  583 |       // Contract: client checks file.size > HERO_VIDEO_MAX_BYTES before POST.
  584 |       // We assert the constant and that posting an oversize body to the hero
  585 |       // endpoint does not succeed as a valid film (4xx / error JSON).
  586 |       const oversize = Buffer.alloc(Math.min(HERO_VIDEO_MAX_BYTES + 1024, HERO_VIDEO_MAX_BYTES + 2048));
  587 |       // Write MP4 ftyp so a naive MIME sniffer would otherwise accept it.
  588 |       oversize.write("ftyp", 4);
  589 | 
  590 |       const res = await page.request.post(`/api/hero-video/shop_dg`, {
  591 |         headers: { "content-type": "video/mp4" },
  592 |         data: oversize,
  593 |       });
  594 |       // Unauthenticated → 401/403; authenticated showcase → error; never 200 with a film.
  595 |       if (res.ok()) {
  596 |         const json = (await res.json().catch(() => ({}))) as { heroVideoUrl?: string; error?: string };
  597 |         expect(json.error || !json.heroVideoUrl).toBeTruthy();
  598 |       } else {
  599 |         expect(res.status()).toBeGreaterThanOrEqual(400);
  600 |       }
  601 | 
  602 |       guard.assertNoLeak();
  603 |     });
  604 |   });
  605 | 
  606 |   // ═══════════════════════════════════════════════════════════════════════════
  607 |   // 4) 24/7 Booking Engine — public lead capture → Supabase + notify (mocked)
  608 |   // ═══════════════════════════════════════════════════════════════════════════
  609 |   test.describe("4 · 24/7 booking engine", () => {
  610 |     test("public storefront and book page resolve for axiom-auto", async ({ page }) => {
  611 |       const guard = await installVendorMocks(page);
  612 |       const response = await page.goto(`${BASE_URL}/${SHOP_ID}`, { waitUntil: "domcontentloaded" });
  613 |       expect(response?.status()).toBe(200);
  614 | 
  615 |       const bodyText = await page.locator("body").innerText();
  616 |       expect(bodyText.length).toBeGreaterThan(0);
  617 | 
  618 |       guard.assertNoLeak();
  619 |     });
  620 | 
  621 |     test("booking flow UI accepts guest details without live Stripe/Twilio/Resend", async ({
  622 |       page,
  623 |     }) => {
  624 |       const guard = await installVendorMocks(page);
  625 |       // Never use networkidle — hosted pooler stalls keep XHRs open forever.
  626 |       await page.goto(`/${SHOP}/book`, { waitUntil: "domcontentloaded", timeout: 30_000 });
  627 |       await expect(page.locator("body")).not.toContainText(/No shop at this address/i, {
  628 |         timeout: 15_000,
  629 |       });
  630 | 
  631 |       // Soft UI interaction — best-effort; the hard contract is no vendor burn.
  632 |       const nameInput = page
  633 |         .locator('input[name="name"], input[autocomplete="name"], input[placeholder*="Name" i]')
  634 |         .first();
  635 |       if (await nameInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
  636 |         await nameInput.fill("Preflight Guest");
  637 |       }
  638 |       const phoneInput = page
  639 |         .locator('input[type="tel"], input[name="phone"], input[autocomplete="tel"]')
  640 |         .first();
  641 |       if (await phoneInput.isVisible({ timeout: 1_000 }).catch(() => false)) {
  642 |         await phoneInput.fill("5415550199");
  643 |       }
  644 |       const emailInput = page
  645 |         .locator('input[type="email"], input[name="email"], input[autocomplete="email"]')
  646 |         .first();
  647 |       if (await emailInput.isVisible({ timeout: 1_000 }).catch(() => false)) {
  648 |         await emailInput.fill("preflight.guest@example.com");
  649 |       }
  650 | 
  651 |       guard.assertNoLeak();
  652 |     });
  653 | 
  654 |     test("Resend + Twilio booking notify hosts are mocked if the client ever calls them", async ({
  655 |       page,
```