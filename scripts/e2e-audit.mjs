#!/usr/bin/env node
/**
 * Browser audit against the running app. Covers the locked master and admin
 * gates, and the five Live Preview Studio hero presets. Does not send
 * outreach or call Stripe.
 */
import { chromium } from "playwright";

const base = process.env.E2E_BASE_URL ?? "http://127.0.0.1:8080";

const PRESETS = [
  {
    niche: "tattoo",
    label: "Tattoo shop",
    media: "/media/heroes/tattoo-hero.mp4",
    wash: "ember",
    video: true,
  },
  {
    niche: "location",
    label: "Barber",
    media: "/media/heroes/barber-hero.mp4",
    wash: "obsidian",
    video: true,
  },
  {
    niche: "field",
    label: "Field service",
    media: "/media/heroes/mobile-mechanic-hero.mp4",
    wash: "obsidian",
    video: true,
  },
  {
    niche: "contractor",
    label: "General contractor / Home services",
    media: "/media/heroes/trades-hero.mp4",
    wash: "tide",
    video: true,
  },
  {
    niche: "events",
    label: "Events",
    media: "/media/heroes/events-planner-hero.jpg",
    wash: "copper",
    video: false,
  },
];

const results = [];

function pass(name, detail) {
  results.push({ name, pass: true, detail });
  console.log(`[e2e] ${name}  PASS  ${detail}`);
}

function fail(name, detail) {
  results.push({ name, pass: false, detail });
  console.error(`[e2e] ${name}  FAIL  ${detail}`);
}

async function open(page, url) {
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20_000 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (!/ERR_ABORTED|interrupted by another navigation/i.test(message)) throw err;
    await page.waitForLoadState("domcontentloaded").catch(() => {});
  }
}

async function bodyText(page) {
  return page.locator("body").innerText({ timeout: 20_000 });
}

async function readHero(page) {
  return page.evaluate(() => {
    const stage = document.querySelector(".storefront-stage");
    const style = stage ? getComputedStyle(stage) : null;
    const video = document.querySelector("video.hero-frame");
    const image = document.querySelector("img.hero-frame");
    const plate = document.querySelector(".hero-plate");
    const canvas = document.querySelector(".z-20");
    const node = video || image;
    const src = node instanceof HTMLVideoElement || node instanceof HTMLImageElement ? node.currentSrc : "";
    return {
      src: src.replace(location.origin, ""),
      inSubject: Boolean(node && node.closest(".hero-subject")),
      plateFilter: plate ? getComputedStyle(plate).filter : "",
      video: video
        ? {
            autoplay: video.autoplay,
            loop: video.loop,
            muted: video.muted,
            playsInline: video.playsInline,
            paused: video.paused,
          }
        : null,
      wash: stage?.getAttribute("data-wash") ?? "",
      rim: stage?.getAttribute("data-rim") ?? "",
      scan: stage?.getAttribute("data-scan") ?? "",
      displace: style?.getPropertyValue("--displace").trim() ?? "",
      prox: style?.getPropertyValue("--prox").trim() ?? "",
      blur: style?.getPropertyValue("--glass-blur").trim() ?? "",
      depth: style?.getPropertyValue("--depth-feather").trim() ?? "",
      damp: style?.getPropertyValue("--spring-damp").trim() ?? "",
      canvasZ: canvas ? getComputedStyle(canvas).zIndex : "",
      layerCount: canvas ? canvas.children.length : 0,
    };
  });
}

function offsetOf(transform) {
  const match = /translate3d\(([-\d.]+)px/.exec(transform ?? "");
  return match ? Number(match[1]) : null;
}

async function auditMaster(page) {
  await open(page, `${base}/master`);
  await page.waitForFunction(
    () => /This desk is locked|Open the owner desk|Sign in|Log in/i.test(document.body.innerText),
    null,
    { timeout: 20_000 },
  );
  const master = await bodyText(page);
  if (master.includes("Every shop, one wire.")) fail("master gate", "the desk rendered without an owner session");
  else if (/This desk is locked|Open the owner desk|Sign in|Log in/i.test(master)) {
    pass("master gate", "unsigned visitors do not see the shop wire");
  } else fail("master gate", "the lock screen did not appear");
}

async function auditBadKey(page) {
  await open(page, `${base}/master?key=this-key-is-long-enough-but-wrong`);
  await page.waitForTimeout(1200);
  const rejected = await bodyText(page);
  if (rejected.includes("Every shop, one wire.")) fail("master bad key", "a wrong owner key opened the desk");
  else pass("master bad key", "a wrong owner key stays outside the desk");
}

async function auditAdmin(page) {
  await open(page, `${base}/not-a-real-shop/admin`);
  await page.waitForTimeout(2500);
  const adminUrl = page.url();
  const admin = await bodyText(page);
  if (adminUrl.includes("/login") || /Step in\.|Sign in/i.test(admin)) {
    pass("admin gate", "an unsigned admin visit goes to sign-in");
  } else if (/This console is locked|No shop at this address/i.test(admin)) {
    pass("admin gate", "an unknown shop stays locked");
  } else if (/Brand and book|Campaign parameters/i.test(admin)) {
    fail("admin gate", `the operator desk rendered at ${adminUrl}`);
  } else {
    fail("admin gate", `${adminUrl} :: ${admin.slice(0, 180).replace(/\s+/g, " ")}`);
  }
}

async function auditPreset(page, preset) {
  const errors = [];
  const onError = (err) => errors.push(err.message);
  page.on("pageerror", onError);
  await open(page, `${base}/demo/${preset.niche}`);
  await page.getByRole("combobox", { name: /Explore industries/ }).waitFor({ timeout: 20_000 });
  const industry = page.getByRole("combobox", { name: /Explore industries/ });
  const options = await industry.locator("option").allTextContents();
  if (!options.some((option) => option.trim() === "Events")) {
    fail(`${preset.label} events option`, "Events is missing from the industry list");
  }
  const hero = await readHero(page);
  const problems = [];
  if (hero.src !== preset.media) problems.push(`media ${hero.src}`);
  if (!hero.inSubject) problems.push("media is outside the depth layer");
  if (hero.wash !== preset.wash) problems.push(`wash ${hero.wash}`);
  if (hero.displace !== "20px") problems.push(`displace ${hero.displace}`);
  if (hero.prox !== "170px") problems.push(`prox ${hero.prox}`);
  if (hero.blur !== "40px") problems.push(`blur ${hero.blur}`);
  if (hero.depth !== "1.25") problems.push(`depth ${hero.depth}`);
  if (hero.damp !== "20") problems.push(`damp ${hero.damp}`);
  if (hero.rim !== "on") problems.push("border glow off");
  if (hero.scan !== "on") problems.push("scan off");
  if (hero.canvasZ !== "20") problems.push(`type z-index ${hero.canvasZ}`);
  if (hero.layerCount < 3) problems.push(`layers ${hero.layerCount}`);
  if (!hero.plateFilter.includes("blur(40px)")) problems.push(`plate ${hero.plateFilter}`);
  if (preset.video) {
    if (!hero.video?.autoplay || !hero.video.loop || !hero.video.muted || !hero.video.playsInline) {
      problems.push("video is missing autoplay, loop, muted, or playsInline");
    } else if (hero.video.paused) {
      problems.push("video is paused");
    }
  } else if (hero.video) {
    problems.push("events rendered a video");
  }
  if (problems.length) fail(preset.label, problems.join("; "));
  else pass(preset.label, `${preset.media} · ${preset.wash}`);
  page.off("pageerror", onError);
  if (errors.length) fail(`${preset.label} console`, errors.join(" | "));
}

async function auditLeaveSpring(page) {
  await open(page, `${base}/demo/tattoo`);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator(".hero-subject").waitFor({ timeout: 20_000 });
  const box = await page.locator("section").filter({ has: page.locator(".hero-subject") }).boundingBox();
  if (!box) {
    fail("pointer spring", "the hero has no box");
    return;
  }
  await page.evaluate(() => {
    window.__moves = 0;
    window.addEventListener("pointermove", () => {
      window.__moves += 1;
    });
  });
  const point = { x: box.x + box.width * 0.92, y: box.y + box.height * 0.35 };
  await page.mouse.move(point.x, point.y, { steps: 8 });
  const hit = await page.evaluate(({ x, y }) => {
    const node = document.elementFromPoint(x, y);
    return {
      moves: window.__moves ?? 0,
      tag: node?.tagName ?? "",
      className: String(node?.className ?? "").slice(0, 100),
      inStage: Boolean(node?.closest(".storefront-stage")),
    };
  }, point);
  if (!hit.moves || !hit.inStage) {
    fail("pointer spring", `pointer did not reach the hero (${JSON.stringify(hit)})`);
    return;
  }
  try {
    await page.waitForFunction(
      () => {
        const match = /translate3d\(([-\d.]+)px/.exec(document.querySelector(".hero-subject")?.style.transform ?? "");
        return match ? Math.abs(Number(match[1])) > 10 : false;
      },
      null,
      { timeout: 4_000 },
    );
  } catch {
    const debug = await page.evaluate(() => ({
      reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
      transform: document.querySelector(".hero-subject")?.style.transform ?? "",
      sections: document.querySelectorAll("section").length,
    }));
    fail("pointer spring", `the picture did not follow the pointer (${JSON.stringify(debug)})`);
    return;
  }
  const held = offsetOf(await page.locator(".hero-subject").evaluate((el) => el.style.transform));
  await page.getByText("Live preview studio", { exact: true }).scrollIntoViewIfNeeded();
  const studio = await page.getByText("Live preview studio", { exact: true }).boundingBox();
  if (!studio) {
    fail("pointer spring", "the studio heading is not on screen");
    return;
  }
  await page.mouse.move(studio.x + 12, studio.y + 12);
  await page.locator(".storefront-stage").evaluate((el) => {
    el.dispatchEvent(new MouseEvent("mouseleave", { bubbles: false }));
    el.dispatchEvent(new PointerEvent("pointerleave", { bubbles: false }));
  });
  await page.waitForTimeout(120);
  const early = offsetOf(await page.locator(".hero-subject").evaluate((el) => el.style.transform));
  await page.waitForTimeout(700);
  const later = offsetOf(await page.locator(".hero-subject").evaluate((el) => el.style.transform));
  if (held == null || early == null || later == null) {
    fail("pointer spring", "the depth layer did not publish a transform");
    return;
  }
  const snapped = Math.abs(early) < 6 && Math.abs(held) > 10;
  const eased = Math.abs(later) < Math.abs(held) - 3;
  if (snapped) fail("pointer spring", `left the hero at ${held}px and jumped to ${early}px`);
  else if (!eased) fail("pointer spring", `held ${held}px, early ${early}px, later ${later}px`);
  else pass("pointer spring", `held ${held.toFixed(1)}px, eased through ${early.toFixed(1)}px to ${later.toFixed(1)}px`);
}

const browser = await chromium.launch({
  headless: true,
  channel: "chrome",
  args: ["--disable-gpu", "--disable-extensions"],
});

async function withPage(fn) {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
    reducedMotion: "no-preference",
  });
  try {
    await fn(page);
  } finally {
    await page.close();
  }
}

const steps = [
  auditMaster,
  auditBadKey,
  auditAdmin,
  ...PRESETS.map((preset) => (page) => auditPreset(page, preset)),
  auditLeaveSpring,
];

try {
  for (const step of steps) {
    try {
      await withPage(step);
    } catch (err) {
      fail("runner", err instanceof Error ? err.message : "step failed");
    }
  }
} finally {
  await browser.close();
}

const failed = results.filter((row) => !row.pass);
console.log(`[e2e] ${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
