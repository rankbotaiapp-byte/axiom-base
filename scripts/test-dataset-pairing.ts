/**
 * Diagnostic: outbound outreach dataset → niche → MP4 pairing pipeline.
 *
 *   npx tsx scripts/test-dataset-pairing.ts
 */
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  pairDatasetToNichePreview,
  type DatasetBusinessRecord,
  type PersonalizedLeadPreview,
} from "../src/lib/axiom/niche-dataset-pairing.ts";
import { CATALOG_BY_ID } from "../src/config/catalog.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MEDIA = join(ROOT, "public", "media");

type Expectation = {
  niche: string;
  primary: string;
  alternates: readonly string[];
  /** Optional: at least one of these must exist on disk under public/media. */
  requireOnDisk?: boolean;
};

type MockLead = DatasetBusinessRecord & {
  expect: Expectation;
};

const MOCK_DATASET: MockLead[] = [
  {
    businessName: "Abyssal Well Co",
    tradeType: "water-systems",
    tradeLabel: "Well & filtration",
    phone: "541-555-2101",
    email: "desk@abyssalwell.example",
    city: "Ashland",
    county: "Jackson County",
    leadSlug: "abyssal-well-co-ashland",
    expect: {
      niche: "water-systems",
      primary: "/media/otter-hero-animation.mp4",
      alternates: ["/media/shark-hero-animation.mp4"],
      requireOnDisk: true,
    },
  },
  {
    businessName: "Meridian Fab Works",
    tradeType: "fabrication",
    tradeLabel: "Custom weld & fab",
    phone: "541-555-2202",
    city: "Medford",
    county: "Jackson County",
    leadSlug: "meridian-fab-works-medford",
    expect: {
      niche: "fabrication",
      primary: "/media/polar-bear-hero-animation.mp4",
      alternates: ["/media/master-defaults/polar-bear-loop.mp4"],
      requireOnDisk: true,
    },
  },
  {
    businessName: "Night Circuit Auto",
    tradeType: "auto repair",
    tradeLabel: "Mobile mechanic",
    phone: "541-555-2303",
    city: "Grants Pass",
    county: "Josephine County",
    leadSlug: "night-circuit-auto-grants-pass",
    expect: {
      niche: "auto",
      primary: "/media/auto-hero-animation.mp4",
      alternates: ["/media/auto-tuning-hero-animation.mp4"],
      requireOnDisk: true,
    },
  },
  {
    businessName: "Ridge Mount Studio",
    tradeType: "taxidermy",
    tradeLabel: "Wildlife mounts",
    phone: "541-555-2404",
    city: "Roseburg",
    county: "Douglas County",
    leadSlug: "ridge-mount-studio-roseburg",
    expect: {
      niche: "taxidermy",
      primary: "/media/leopard-hero-animation.mp4",
      alternates: ["/media/raptor-hero-animation.mp4"],
      requireOnDisk: true,
    },
  },
  {
    businessName: "Rogue Site Builders",
    tradeType: "general contractor",
    tradeLabel: "Home services",
    phone: "541-555-2505",
    city: "Central Point",
    county: "Jackson County",
    leadSlug: "rogue-site-builders-central-point",
    expect: {
      niche: "contractor",
      primary: "/media/infrastructure-hero-animation.mp4",
      alternates: ["/media/bear-charge-hero-animation.mp4"],
      requireOnDisk: true,
    },
  },
  {
    businessName: "Cascade Panel Electric",
    tradeType: "electrical",
    tradeLabel: "Electrician",
    phone: "541-555-2606",
    city: "Winston",
    county: "Douglas County",
    leadSlug: "cascade-panel-electric-winston",
    expect: {
      niche: "electrical",
      primary: "/media/electrician-hero-animation.mp4",
      alternates: ["/media/locksmith-hero-animation.mp4"],
      requireOnDisk: true,
    },
  },
];

type Check = { ok: boolean; label: string; detail?: string };

const checks: Check[] = [];

function pass(label: string, detail?: string) {
  checks.push({ ok: true, label, detail });
}

function fail(label: string, detail?: string) {
  checks.push({ ok: false, label, detail });
}

function assert(condition: boolean, label: string, detail?: string) {
  if (condition) pass(label, detail);
  else fail(label, detail);
}

function mediaOnDisk(url: string): boolean {
  const file = url.replace(/^\/media\//, "");
  if (!file || file.includes("..")) return false;
  return existsSync(join(MEDIA, file));
}

function hasUndefined(value: unknown, path = "root"): string[] {
  if (value === undefined) return [path];
  if (value === null || typeof value !== "object") return [];
  if (Array.isArray(value)) {
    return value.flatMap((item, i) => hasUndefined(item, `${path}[${i}]`));
  }
  return Object.entries(value as Record<string, unknown>).flatMap(([key, next]) =>
    hasUndefined(next, `${path}.${key}`),
  );
}

function isReachablePreviewPath(path: string): boolean {
  if (!path.startsWith("/?")) return false;
  try {
    const url = new URL(path, "http://axiom.local");
    if (url.pathname !== "/") return false;
    if (url.searchParams.get("utm_source") !== "desk") return false;
    if (!url.searchParams.get("b")) return false;
    return true;
  } catch {
    return false;
  }
}

function verifyPairing(row: MockLead, preview: PersonalizedLeadPreview) {
  const nicheLabel = `${row.expect.niche} · ${row.businessName}`;

  assert(
    preview.niche === row.expect.niche,
    `[${nicheLabel}] niche resolves`,
    `got ${preview.niche}`,
  );

  assert(
    preview.heroVideoUrl === row.expect.primary,
    `[${nicheLabel}] primary loop`,
    `expected ${row.expect.primary} · got ${preview.heroVideoUrl}`,
  );

  for (const alt of row.expect.alternates) {
    assert(
      preview.alternateLoops.includes(alt),
      `[${nicheLabel}] alternate includes ${alt.split("/").pop()}`,
      `got [${preview.alternateLoops.join(", ")}]`,
    );
  }

  if (row.expect.requireOnDisk) {
    const pool = [preview.heroVideoUrl, ...preview.alternateLoops];
    const present = pool.filter(mediaOnDisk);
    const missingPrimary = !mediaOnDisk(preview.heroVideoUrl);
    assert(
      present.length > 0,
      `[${nicheLabel}] verified loop asset on disk`,
      missingPrimary
        ? `primary missing (${preview.heroVideoUrl}); present alternate(s): ${present.join(", ") || "none"}`
        : preview.heroVideoUrl,
    );
    if (missingPrimary && present.length > 0) {
      pass(
        `[${nicheLabel}] primary file absent — alternate covers outreach`,
        `missing ${preview.heroVideoUrl} · using ${present[0]}`,
      );
    }
  }

  const undefinedPaths = hasUndefined(preview);
  assert(
    undefinedPaths.length === 0,
    `[${nicheLabel}] no undefined payload fields`,
    undefinedPaths.length ? undefinedPaths.join(", ") : undefined,
  );

  assert(
    preview.overlay.businessName === row.businessName,
    `[${nicheLabel}] overlay business name`,
    preview.overlay.businessName,
  );
  assert(
    preview.overlay.phone === (row.phone ?? ""),
    `[${nicheLabel}] overlay phone`,
    preview.overlay.phone,
  );
  assert(
    Boolean(preview.overlay.location) && preview.overlay.location.includes(row.city!),
    `[${nicheLabel}] overlay location includes city`,
    preview.overlay.location,
  );
  assert(
    Boolean(preview.overlay.tagline) && preview.overlay.tagline === CATALOG_BY_ID[preview.niche].tagline,
    `[${nicheLabel}] overlay tagline from template`,
    preview.overlay.tagline,
  );

  assert(
    isReachablePreviewPath(preview.previewPath),
    `[${nicheLabel}] preview path is desk funnel route`,
    preview.previewPath,
  );
  assert(
    preview.previewPath.includes(`b=${encodeURIComponent(row.leadSlug!)}`) ||
      preview.previewPath.includes(`b=${row.leadSlug}`),
    `[${nicheLabel}] preview path carries lead slug`,
    preview.previewPath,
  );
  assert(
    preview.previewPath.includes("utm_source=desk"),
    `[${nicheLabel}] preview path is outbound desk source`,
    preview.previewPath,
  );
  assert(
    !preview.previewPath.includes("undefined") && !preview.previewPath.includes("null"),
    `[${nicheLabel}] preview path has no broken tokens`,
    preview.previewPath,
  );
}

function printReport() {
  const passed = checks.filter((c) => c.ok).length;
  const failed = checks.filter((c) => !c.ok).length;
  const total = checks.length;

  console.log("");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  AXIOM · Dataset → Niche Pairing Diagnostic");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`  Records: ${MOCK_DATASET.length} niches`);
  console.log(`  Checks:  ${total}  ·  PASS ${passed}  ·  FAIL ${failed}`);
  console.log("───────────────────────────────────────────────────────────");

  for (const check of checks) {
    const mark = check.ok ? "PASS" : "FAIL";
    const line = check.detail ? `${check.label} — ${check.detail}` : check.label;
    console.log(`  [${mark}] ${line}`);
  }

  console.log("───────────────────────────────────────────────────────────");
  if (failed === 0) {
    console.log("  RESULT: 100% niche records bound to verified assets.");
  } else {
    console.log(`  RESULT: ${failed} check(s) failed — outreach pairing is not green.`);
  }
  console.log("═══════════════════════════════════════════════════════════");
  console.log("");
}

function main() {
  console.log("Pulling mock business dataset for core trades…");
  for (const row of MOCK_DATASET) {
    const preview = pairDatasetToNichePreview(row);
    verifyPairing(row, preview);
  }

  // Coverage roll-up: every mock niche must appear once with a green primary bind.
  const niches = new Set(MOCK_DATASET.map((r) => r.expect.niche));
  const bound = MOCK_DATASET.filter((row) => {
    const preview = pairDatasetToNichePreview(row);
    return preview.niche === row.expect.niche && preview.heroVideoUrl === row.expect.primary;
  });
  assert(
    bound.length === MOCK_DATASET.length,
    "Coverage · 100% of tested niche records pull correct primary bindings",
    `${bound.length}/${MOCK_DATASET.length} · niches=${[...niches].join(",")}`,
  );

  printReport();
  if (checks.some((c) => !c.ok)) process.exit(1);
}

main();
