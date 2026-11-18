/**
 * Persona and UX copy audit of the Axiom studio landing page.
 *
 * Walks http://localhost:3000 as a contractor on a phone: idle, logo drop,
 * Plumbing + Cyber Cyan, processing, generated preview, and the $1 trial CTA.
 * Screenshots plus the visible copy go to one evaluation pass (xAI when
 * XAI_API_KEY is set, otherwise a local rubric). Prints a Markdown report.
 *
 *   npx tsx --env-file=.env scripts/ai-ux-audit.ts
 */
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "screenshots", "ai-ux-audit");
const TARGET = process.env.AI_UX_AUDIT_URL?.trim() || "http://localhost:3000";
const LOGO = join(ROOT, "public", "orb-object.png");
const VIEWPORT = { width: 390, height: 844 };

const PERSONA =
  "A busy, skeptical local service contractor (plumber or fishing guide) with zero tech background, standing in the field on a smartphone, looking for a way to get more phone calls without wasting time or money.";

const CTA = "Launch This Niche Site — $1 Today";
const TRIAL = "14-day trial, then $150/mo, cancel anytime in Admin Billing.";

type StateName = "idle" | "processing" | "generated-preview" | "trial-cta";

type CapturedState = {
  name: StateName;
  title: string;
  text: string;
  fullPagePath: string;
  imageBase64: string;
};

type WalkMetrics = {
  dropToCtaMs: number;
  ctaInThumbZone: boolean;
  ctaBelowFold: boolean;
};

type PlgBenchmark = {
  timeToValue: number;
  thumbZone: number;
  zeroJargon: number;
  composite: number;
  verdict: "Ready for traffic" | "Friction detected.";
  timeNote: string;
  thumbNote: string;
  jargonNote: string;
};

type CopyImprovement = {
  where: string;
  current: string;
  suggested: string;
  why: string;
};

type FrictionPoint = {
  where: string;
  issue: string;
};

type PersonaFindings = {
  source: "grok" | "local-rubric";
  clarityOfValue: number;
  wording: number;
  friction: number;
  humanUsabilityScore: number;
  threeSecondRead: string;
  copyImprovements: CopyImprovement[];
  frictionPoints: FrictionPoint[];
};

type ChromiumBrowser = {
  newContext: (opts: object) => Promise<AuditContext>;
  close: () => Promise<void>;
};

type AuditContext = {
  newPage: () => Promise<AuditPage>;
  close: () => Promise<void>;
};

type AuditPage = {
  goto: (url: string, opts: { waitUntil: "domcontentloaded"; timeout: number }) => Promise<unknown>;
  screenshot: (opts: { path?: string; fullPage?: boolean; type?: "jpeg"; quality?: number }) => Promise<Buffer>;
  locator: (selector: string) => AuditLocator;
  getByRole: (role: "button" | "link", opts: { name: string | RegExp; exact?: boolean }) => AuditLocator;
  getByLabel: (name: string) => AuditLocator;
};

type AuditLocator = {
  click: (opts?: { timeout?: number }) => Promise<void>;
  fill: (value: string) => Promise<void>;
  setInputFiles: (file: string) => Promise<void>;
  waitFor: (opts: { timeout: number; state?: "visible" | "attached" }) => Promise<void>;
  scrollIntoViewIfNeeded: () => Promise<void>;
  boundingBox: () => Promise<{ x: number; y: number; width: number; height: number } | null>;
  screenshot: (opts: { type: "jpeg"; quality: number }) => Promise<Buffer>;
  innerText: () => Promise<string>;
  locator: (selector: string) => AuditLocator;
  getByRole: (role: "button" | "link", opts: { name: string | RegExp; exact?: boolean }) => AuditLocator;
  getByLabel: (name: string) => AuditLocator;
  getByText: (text: string | RegExp) => AuditLocator;
};

function loadEnvFiles(): void {
  for (const name of [".env.local", ".env"]) {
    const path = join(ROOT, name);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
      const match = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(line.trim());
      if (!match || process.env[match[1]]) continue;
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
}

async function loadChromium(): Promise<{ launch: (opts: object) => Promise<ChromiumBrowser> }> {
  const errors: string[] = [];
  try {
    const mod = (await import("playwright")) as { chromium?: { launch: (opts: object) => Promise<ChromiumBrowser> } };
    if (mod.chromium) return mod.chromium;
  } catch (err) {
    errors.push(err instanceof Error ? err.message : String(err));
  }

  const cached = join(ROOT, ".npm-cache", "_npx", "e41f203b7505f1fb", "node_modules", "playwright");
  try {
    const require = createRequire(join(ROOT, "package.json"));
    const mod = require(cached) as { chromium?: { launch: (opts: object) => Promise<ChromiumBrowser> } };
    if (mod.chromium) return mod.chromium;
  } catch (err) {
    errors.push(err instanceof Error ? err.message : String(err));
  }

  try {
    const mod = (await import(pathToFileURL(join(cached, "index.js")).href)) as {
      chromium?: { launch: (opts: object) => Promise<ChromiumBrowser> };
    };
    if (mod.chromium) return mod.chromium;
  } catch (err) {
    errors.push(err instanceof Error ? err.message : String(err));
  }

  throw new Error(errors.at(-1) || "playwright is not installed");
}

async function launchBrowser(): Promise<ChromiumBrowser> {
  const chromium = await loadChromium();
  try {
    return await chromium.launch({ headless: true, channel: "chrome" });
  } catch {
    return await chromium.launch({ headless: true });
  }
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.min(10, Math.round(value)));
}

async function shoot(page: AuditPage, studio: AuditLocator, name: StateName): Promise<CapturedState> {
  const fullPagePath = join(OUT_DIR, `${name}.jpg`);
  await page.screenshot({ path: fullPagePath, fullPage: true, type: "jpeg", quality: 55 });
  const frame = await studio.screenshot({ type: "jpeg", quality: 60 });
  const text = (await page.locator("body").innerText()).replace(/\s+\n/g, "\n").trim();
  return {
    name,
    title: name.replace(/-/g, " "),
    text,
    fullPagePath,
    imageBase64: frame.toString("base64"),
  };
}

async function captureStudio(page: AuditPage): Promise<{ states: CapturedState[]; metrics: WalkMetrics }> {
  await page.goto(TARGET, { waitUntil: "domcontentloaded", timeout: 60_000 });
  const studio = page.locator("#studio");
  await studio.waitFor({ timeout: 30_000 });
  await studio.getByRole("button", { name: "Drop your logo or reference photo to start generating." }).waitFor({ timeout: 20_000 });

  const states: CapturedState[] = [];
  states.push(await shoot(page, studio, "idle"));

  await studio.getByRole("button", { name: "Plumbing", exact: true }).click();
  await studio.getByRole("button", { name: "Cyber Cyan" }).click();
  await studio.getByLabel("Business name").fill("River City Plumbing");

  const seenProcessing = studio.getByText("Neural scan").waitFor({ timeout: 8_000 });
  const droppedAt = Date.now();
  await studio.locator('input[type="file"]').setInputFiles(LOGO);
  await seenProcessing;
  states.push(await shoot(page, studio, "processing"));

  const cta = studio.getByRole("button", { name: CTA });
  await cta.waitFor({ timeout: 20_000 });
  const dropToCtaMs = Date.now() - droppedAt;
  const box = await cta.boundingBox();
  const ctaBelowFold = !box || box.y >= VIEWPORT.height;
  const ctaInThumbZone = Boolean(
    box && box.y >= VIEWPORT.height * 0.58 && box.y + box.height <= VIEWPORT.height + 4 && box.width >= VIEWPORT.width * 0.7,
  );
  states.push(await shoot(page, studio, "generated-preview"));
  await cta.scrollIntoViewIfNeeded();
  states.push(await shoot(page, studio, "trial-cta"));
  return { states, metrics: { dropToCtaMs, ctaInThumbZone, ctaBelowFold } };
}

const JARGON: { word: RegExp; where: string; suggested: string; why: string }[] = [
  {
    word: /neural scan/i,
    where: "Processing overlay",
    suggested: "Building your page",
    why: "A plumber in a driveway does not know what a neural scan is. It sounds like the tool is still thinking instead of making their site.",
  },
  {
    word: /drop your logo or reference photo to start generating/i,
    where: "Idle drop zone",
    suggested: "Add your logo to see your page.",
    why: "“Generating” and “reference photo” are studio words. They need to know a logo turns into a page that gets calls.",
  },
  {
    word: /\bhex\b/i,
    where: "Accent color",
    suggested: "Hide the code field, or label it “Color code” only after they ask.",
    why: "A hex value is a developer control. It adds a decision before they have seen a price.",
  },
  {
    word: /accent color/i,
    where: "Color picker",
    suggested: "Your brand color",
    why: "“Accent” is design jargon. “Brand color” matches a truck, a shirt, or a logo.",
  },
  {
    word: /^generate$/im,
    where: "Generate button",
    suggested: "Show my page",
    why: "Generate does not say what they get. They came for phone calls, not a render.",
  },
];

function evaluateLocally(states: CapturedState[]): PersonaFindings {
  const idle = states.find((state) => state.name === "idle")?.text ?? "";
  const ready = states.find((state) => state.name === "trial-cta")?.text ?? states.at(-1)?.text ?? "";
  const combined = states.map((state) => state.text).join("\n");
  const copyImprovements: CopyImprovement[] = [];
  for (const item of JARGON) {
    const hit = item.word.exec(combined);
    if (!hit) continue;
    copyImprovements.push({
      where: item.where,
      current: hit[0],
      suggested: item.suggested,
      why: item.why,
    });
  }

  const frictionPoints: FrictionPoint[] = [];
  if (!/\$1/.test(idle)) {
    frictionPoints.push({
      where: "First screen",
      issue: "The price is not on the idle screen. They cannot tell what this costs before they touch anything.",
    });
  } else if (!idle.includes(CTA)) {
    frictionPoints.push({
      where: "Studio preview",
      issue: "The top of the page already says $1, but “Launch This Niche Site — $1 Today” only shows up after a logo is uploaded.",
    });
  }
  if (/neural scan/i.test(combined)) {
    frictionPoints.push({
      where: "Processing",
      issue: "The wait state uses lab language instead of telling them their page is being put together.",
    });
  }
  const choiceCount = (ready.match(/Plumbing|Fishing Guide|Contracting|Cyber Cyan|Warm Amber|Electric Purple|Laser Blue|Emerald Green/g) ?? []).length;
  if (choiceCount >= 6) {
    frictionPoints.push({
      where: "Studio controls",
      issue: "Niche chips, five color dots, a hex field, a name box, and Generate are all in view. That is a lot of choices before a single phone call.",
    });
  }
  if (!ready.includes(TRIAL)) {
    frictionPoints.push({
      where: "Trial CTA",
      issue: "The price terms (14 days, then $150/mo, cancel in Admin Billing) were not visible next to the launch button.",
    });
  }

  const firstScreenOffersCalls = /phone call|book|24\/7|\$1/i.test(idle.slice(0, 700));
  const ctaVisible = ready.includes(CTA);
  const clarityOfValue = clampScore((firstScreenOffersCalls ? 7 : 4) + (ctaVisible ? 2 : 0) + (idle.includes("$1") ? 1 : 0));
  const jargonHits = copyImprovements.length;
  const wording = clampScore(9 - jargonHits + (ctaVisible ? 1 : 0));
  const friction = clampScore(9 - frictionPoints.length * 2);
  const humanUsabilityScore = clampScore(clarityOfValue * 0.4 + wording * 0.3 + friction * 0.3);

  const threeSecondRead = firstScreenOffersCalls
    ? "The first screen mentions the offer in plain language a contractor can repeat."
    : "In the first screen they mostly see a logo drop and color controls, not “this gets you calls for $1.”";

  return {
    source: "local-rubric",
    clarityOfValue,
    wording,
    friction,
    humanUsabilityScore,
    threeSecondRead,
    copyImprovements,
    frictionPoints,
  };
}

function asFindings(value: unknown, fallback: PersonaFindings): PersonaFindings | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Partial<PersonaFindings>;
  if (!Array.isArray(row.copyImprovements) || !Array.isArray(row.frictionPoints)) return null;
  return {
    source: "grok",
    clarityOfValue: clampScore(Number(row.clarityOfValue)),
    wording: clampScore(Number(row.wording)),
    friction: clampScore(Number(row.friction)),
    humanUsabilityScore: clampScore(Number(row.humanUsabilityScore ?? fallback.humanUsabilityScore)),
    threeSecondRead: typeof row.threeSecondRead === "string" && row.threeSecondRead.trim() ? row.threeSecondRead.trim() : fallback.threeSecondRead,
    copyImprovements: row.copyImprovements.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const copy = item as CopyImprovement;
      if (!copy.current || !copy.suggested) return [];
      return [{ where: String(copy.where || "Page"), current: String(copy.current), suggested: String(copy.suggested), why: String(copy.why || "") }];
    }),
    frictionPoints: row.frictionPoints.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const point = item as FrictionPoint;
      if (!point.issue) return [];
      return [{ where: String(point.where || "Page"), issue: String(point.issue) }];
    }),
  };
}

async function evaluateWithGrok(states: CapturedState[], fallback: PersonaFindings): Promise<PersonaFindings> {
  const apiKey = process.env.XAI_API_KEY?.trim();
  if (!apiKey) return fallback;

  const prompt = [
    "You are auditing a marketing page for this person:",
    PERSONA,
    "",
    "Score the smartphone studio experience from 1 to 10.",
    "clarityOfValue: can they tell what they get in under 3 seconds?",
    "wording: are instructions and the button “Launch This Niche Site — $1 Today” free of developer jargon?",
    "friction: confusing layout, too many choices, or reasons to hesitate?",
    "humanUsabilityScore: one conversion score for this person.",
    "Return JSON only with keys clarityOfValue, wording, friction, humanUsabilityScore, threeSecondRead, copyImprovements [{where,current,suggested,why}], frictionPoints [{where,issue}].",
    "Quote real copy from the DOM text. Do not invent screens that are not described.",
    "",
    ...states.map((state) => `## ${state.title}\n${state.text.slice(0, 2500)}`),
  ].join("\n");

  const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [{ type: "text", text: prompt }];
  for (const state of states) {
    if (state.imageBase64.length > 900_000) continue;
    content.push({ type: "image_url", image_url: { url: `data:image/jpeg;base64,${state.imageBase64}` } });
  }

  let lastError = "";
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const res = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "grok-4.5",
          temperature: 0.2,
          max_tokens: 1200,
          messages: [{ role: "user", content }],
        }),
      });
      if (!res.ok) {
        lastError = `xAI API error ${res.status}`;
        continue;
      }
      const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const raw = body.choices?.[0]?.message?.content ?? "";
      const jsonStart = raw.indexOf("{");
      const jsonEnd = raw.lastIndexOf("}");
      if (jsonStart < 0 || jsonEnd <= jsonStart) {
        lastError = "model did not return JSON";
        continue;
      }
      const parsed = asFindings(JSON.parse(raw.slice(jsonStart, jsonEnd + 1)), fallback);
      if (parsed && parsed.copyImprovements.length + parsed.frictionPoints.length > 0) return parsed;
      lastError = "model JSON was empty";
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
  }
  fallback.threeSecondRead = `${fallback.threeSecondRead} Vision review did not complete (${lastError}). Scores below are from the on-page rubric.`;
  return fallback;
}

async function evaluatePersona(states: CapturedState[]): Promise<PersonaFindings> {
  const local = evaluateLocally(states);
  return evaluateWithGrok(states, local);
}

function bulletCopy(items: CopyImprovement[]): string {
  if (items.length === 0) return "- No copy changes stood out from the captured text.";
  return items
    .map((item) => `- **${item.where}:** “${item.current}” → “${item.suggested}”. ${item.why}`)
    .join("\n");
}

function benchmarkPlg(states: CapturedState[], metrics: WalkMetrics, findings: PersonaFindings): PlgBenchmark {
  const ready = states.find((state) => state.name === "trial-cta")?.text ?? "";
  const jargonHits = findings.copyImprovements.length;
  const seconds = metrics.dropToCtaMs / 1000;

  let timeToValue = 4;
  if (seconds <= 2) timeToValue = 6;
  else if (seconds <= 5) timeToValue = 5;
  else if (seconds > 8) timeToValue = 2;
  if (states.some((state) => state.name === "idle" && state.text.includes(CTA))) timeToValue = 9;
  timeToValue = clampScore(timeToValue);

  let thumbZone = 3;
  if (metrics.ctaInThumbZone) thumbZone = 9;
  else if (!metrics.ctaBelowFold) thumbZone = 5;
  thumbZone = clampScore(thumbZone);

  const zeroJargon = clampScore(10 - jargonHits * 1.5);
  const composite = clampScore(timeToValue * 0.35 + thumbZone * 0.35 + zeroJargon * 0.3);
  const verdict = timeToValue >= 7 && thumbZone >= 7 && zeroJargon >= 7 ? "Ready for traffic" : "Friction detected.";

  const timeNote =
    seconds <= 5
      ? `Their page and the $1 button appeared ${seconds.toFixed(1)}s after the logo drop. Stripe, Calendly, and Linear put the useful action on the first screen, before any file upload.`
      : `The logo drop took ${seconds.toFixed(1)}s before the $1 button existed. That is a generation step those products do not make people wait through.`;
  const thumbNote = metrics.ctaInThumbZone
    ? "The launch button sits in the bottom thumb zone and spans most of the phone width, which is the Calendly pattern."
    : metrics.ctaBelowFold
      ? "On a 390×844 screen the launch button starts below the fold, under the preview. Stripe and Calendly keep the next action inside the thumb zone without a scroll."
      : "The launch button is on screen, but it is not parked in the bottom thumb zone the way a one-tap booking button is.";
  const jargonNote =
    jargonHits === 0
      ? "The visible words are ones a contractor would say out loud. That matches Linear’s plain verbs and Stripe’s checkout labels."
      : `${jargonHits} labels still sound like a studio: ${findings.copyImprovements.map((item) => item.current).join(", ")}. A non-technical contractor has to translate them before they trust the page.`;

  return {
    timeToValue,
    thumbZone,
    zeroJargon,
    composite,
    verdict,
    timeNote,
    thumbNote,
    jargonNote: ready.includes(CTA) ? jargonNote : `${jargonNote} The launch line itself was missing from the captured copy.`,
  };
}

function bulletFriction(items: FrictionPoint[]): string {
  if (items.length === 0) return "- No extra hesitation points stood out.";
  return items.map((item) => `- **${item.where}:** ${item.issue}`).join("\n");
}

function renderReport(states: CapturedState[], findings: PersonaFindings, plg: PlgBenchmark): string {
  const shots = states
    .map((state) => `| ${state.title} | \`${state.fullPagePath}\` | ${state.text.slice(0, 140).replace(/\|/g, "/").replace(/\n/g, " ")} |`)
    .join("\n");
  return [
    "# Axiom studio UX audit",
    "",
    `**Persona:** ${PERSONA}`,
    "",
    `**Walk:** headless Chrome, ${VIEWPORT.width}×${VIEWPORT.height}, ${TARGET}`,
    `**Reviewer:** ${findings.source === "grok" ? "Grok, with the page text and studio frames" : "On-page rubric (no vision model response)"}`,
    "",
    "## States captured",
    "",
    "| State | Full-page screenshot | Opening text |",
    "| --- | --- | --- |",
    shots,
    "",
    "## Clarity of value",
    "",
    `**${findings.clarityOfValue} / 10.** ${findings.threeSecondRead}`,
    "",
    "## Wording and copy",
    "",
    `**${findings.wording} / 10.**`,
    "",
    bulletCopy(findings.copyImprovements),
    "",
    "## Friction",
    "",
    `**${findings.friction} / 10** (10 means little hesitation).`,
    "",
    bulletFriction(findings.frictionPoints),
    "",
    "## Human Usability & Conversion Score",
    "",
    `**${findings.humanUsabilityScore} / 10**`,
    "",
    "The score is for a contractor on a phone who wants more calls and will leave if the first screen feels like software.",
    "",
    "## PLG Benchmark & Competitive Comparison",
    "",
    "Bar: Stripe (price and the next action share the first screen), Calendly (the page is already the booking), Linear (one plain verb, no lab copy).",
    "",
    `| Check | Axiom | Against that bar |`,
    `| --- | --- | --- |`,
    `| Time-to-Value speed | **${plg.timeToValue} / 10** | ${plg.timeNote} |`,
    `| Thumb-zone CTA dominance | **${plg.thumbZone} / 10** | ${plg.thumbNote} |`,
    `| Zero-jargon readability | **${plg.zeroJargon} / 10** | ${plg.jargonNote} |`,
    "",
    `**PLG composite: ${plg.composite} / 10.**`,
    "",
    `**Verdict: ${plg.verdict}**`,
    "",
  ].join("\n");
}

async function main(): Promise<void> {
  loadEnvFiles();
  if (!existsSync(LOGO)) throw new Error(`Logo fixture missing: ${LOGO}`);
  mkdirSync(OUT_DIR, { recursive: true });

  const browser = await launchBrowser();
  try {
    const context = await browser.newContext({
      viewport: VIEWPORT,
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    const { states, metrics } = await captureStudio(page);
    const findings = await evaluatePersona(states);
    const plg = benchmarkPlg(states, metrics, findings);
    process.stdout.write(`${renderReport(states, findings, plg)}\n`);
    await context.close();
  } finally {
    await browser.close();
  }
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`ai-ux-audit failed: ${message}\n`);
  process.exitCode = 1;
});
