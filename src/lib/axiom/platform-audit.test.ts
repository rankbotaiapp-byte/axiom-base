import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { MASTER_CATEGORY_IDS, MASTER_HERO_DEFAULTS } from "../../config/MasterHeroDefaults.ts";
import { HERO_LIBRARY } from "../../config/HeroLibrary.ts";
import { resolveAutopilotLoops, pickAutopilotLoop } from "../../config/AutopilotContentEngine.ts";
import { LOOP_TAIL_TRIM_SEC } from "./loop-trim.ts";
import { isCatalogHeroUrl } from "./hero-films.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const repo = join(root, "..");

function read(rel: string) {
  return readFileSync(join(repo, rel), "utf8");
}

describe("axiom platform audit", () => {
  it("routes the customer storefront, tenant desk, and employee studio", () => {
    const tree = read("src/routeTree.gen.ts");
    assert.match(tree, /'\/\$shopSlug'/);
    assert.match(tree, /'\/\$shopSlug\/admin'/);
    assert.match(tree, /'\/\$shopSlug\/employee'/);
    assert.match(read("src/routes/$shopSlug/index.tsx"), /createFileRoute\("\/\$shopSlug\/"\)/);
    assert.match(read("src/routes/$shopSlug/admin.tsx"), /createFileRoute\("\/\$shopSlug\/admin"\)/);
    assert.match(read("src/routes/$shopSlug/employee.tsx"), /createFileRoute\("\/\$shopSlug\/employee"\)/);
    assert.match(read("src/routes/$shopSlug/employee.tsx"), /ProofStudio/);
    assert.match(read("src/routes/$shopSlug/admin.tsx"), /EmployeeOversight/);
    assert.equal(existsSync(join(repo, "src/components/employee/ProofStudio.tsx")), true);
    assert.equal(existsSync(join(repo, "src/components/admin/EmployeeOversight.tsx")), true);
  });

  it("keeps five master cinematic loops, library pins, and autopilot rotation healthy", () => {
    const publicDir = join(repo, "public");
    assert.equal(MASTER_CATEGORY_IDS.length, 5);
    for (const id of MASTER_CATEGORY_IDS) {
      const src = MASTER_HERO_DEFAULTS[id].src;
      assert.equal(MASTER_HERO_DEFAULTS[id].loopTailTrimSec, LOOP_TAIL_TRIM_SEC);
      assert.equal(existsSync(join(publicDir, src.replace(/^\//, ""))), true, src);
      assert.equal(isCatalogHeroUrl(src), true);
    }
    assert.equal(HERO_LIBRARY.length > 20, true);
    assert.equal(isCatalogHeroUrl("/media/apex-launch-hero-animation.mp4"), true);
    const loops = resolveAutopilotLoops({
      shopConfig: {
        selectedAutopilotLoops: ["/media/apex-launch-hero-animation.mp4", "/media/otter-hero-animation.mp4"],
      },
      niche: "auto",
    });
    assert.equal(pickAutopilotLoop(loops, 0).loopUrl, "/media/apex-launch-hero-animation.mp4");
    assert.match(read("src/routes/api/master.autopilot.ts"), /\/api\/master\/autopilot/);
    assert.match(read("src/routes/api/master.telemetry.ts"), /\/api\/master\/telemetry/);
    assert.match(read("src/routes/api/master.tenants.ts"), /\/api\/master\/tenants/);
    assert.match(read("src/components/master/global-master-dashboard.tsx"), /Global Master Dashboard/);
    assert.match(read("src/lib/axiom/shop-autopilot.server.ts"), /queueSocialClip/);
    assert.match(read("src/lib/axiom/shop-autopilot.server.ts"), /composeAutopilotClip/);
    assert.match(read("src/lib/axiom/server.ts"), /runShopAutopilotTick/);
    assert.match(read("src/lib/axiom/server.ts"), /authMiddleware/);
    assert.doesNotMatch(read("src/lib/axiom/outbound-engine.server.ts"), /deliverOutreachMessage/);
    assert.doesNotMatch(read("src/lib/axiom/outbound-engine.server.ts"), /from "\.\/notify/);
  });

  it("enforces customer, employee, and owner boundaries in policy and handlers", () => {
    const rls = read("migrations/0002_schema.sql");
    const oversight = read("migrations/0077_portfolio_oversight.sql");
    const server = read("src/lib/axiom/shop-server.server.ts");
    assert.match(rls, /alter table portfolio_items enable row level security/);
    assert.match(rls, /is_shop_owner/);
    assert.match(oversight, /is_staff_profile/);
    assert.match(oversight, /portfolio_staff_write/);
    assert.match(oversight, /portfolio_owner_write/);
    assert.match(server, /actor\.role !== "employee"/);
    assert.match(server, /canModeratePortfolio/);
    assert.match(read("src/components/admin/EmployeeOversight.tsx"), /moderatePortfolioItem/);
    assert.match(read("src/components/employee/ProofStudio.tsx"), /updateStaffAvatar/);
    assert.match(server, /status = 'approved'/);
    assert.match(server, /Hide every still from the public gallery/);
    assert.match(read("src/lib/axiom/portfolio-access.ts"), /return "pending"/);
    assert.match(read("src/app/[shopSlug]/page.tsx"), /ImmutableStorefront/);
    assert.match(read("src/components/storefront/immutable-storefront.tsx"), /bustStorefrontFilm/);
    assert.match(read("src/components/storefront/immutable-storefront.tsx"), /Book Now/);
    assert.match(read("src/lib/axiom/server.ts"), /lockTenantBrand/);
    assert.match(read("src/lib/axiom/server.ts"), /orchestrateFinalWebBuild/);
    assert.match(read("src/lib/axiom/zero-ui-orchestrator.server.ts"), /frontendTemplate/);
    assert.match(read("src/lib/axiom/zero-ui-orchestrator.server.ts"), /selectedAutopilotLoops/);
    assert.doesNotMatch(read("src/lib/axiom/zero-ui-orchestrator.server.ts"), /selectedAutopilotLoops = \[\]/);
    assert.match(read("src/routes/$shopSlug/admin.brand-studio.tsx"), /createFileRoute\("\/\$shopSlug\/admin\/brand-studio"\)/);
    assert.match(read("src/components/admin/brand-web-studio.tsx"), /Spark Magic/);
    assert.match(read("src/components/admin/brand-web-studio.tsx"), /Build This Web Page/);
    assert.match(read("src/lib/axiom/outreach-queue.ts"), /value\?\.trim\(\)\.toLowerCase\(\) === "live"/);
    assert.match(read("src/lib/axiom/notify-target.ts"), /digits\.length === 10/);
    assert.match(read("src/components/admin/hero-library-bench.tsx"), /router\.invalidate/);
  });
});
