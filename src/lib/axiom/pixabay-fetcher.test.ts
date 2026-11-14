import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  pickPixabayMp4,
  pixabayHitToStockAsset,
  type PixabayVideoHit,
} from "./pixabay-fetcher.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

function sampleHit(overrides: Partial<PixabayVideoHit> = {}): PixabayVideoHit {
  return {
    id: 42,
    pageURL: "https://pixabay.com/videos/id-42/",
    type: "film",
    tags: "plumbing, repair",
    duration: 12,
    picture_id: "abc123",
    videos: {
      large: {
        url: "https://cdn.pixabay.com/video/2020/01/01/42-large.mp4",
        width: 1920,
        height: 1080,
        size: 9_000_000,
      },
      medium: {
        url: "https://cdn.pixabay.com/video/2020/01/01/42-medium.mp4",
        width: 1280,
        height: 720,
        size: 4_000_000,
      },
      small: {
        url: "https://cdn.pixabay.com/video/2020/01/01/42-small.mp4",
        width: 640,
        height: 360,
        size: 1_000_000,
        thumbnail: "https://cdn.pixabay.com/video/2020/01/01/42-thumb.jpg",
      },
    },
    views: 10,
    downloads: 2,
    likes: 1,
    user: "TradeFilms",
    user_id: 7,
    ...overrides,
  };
}

describe("pixabay fetcher", () => {
  it("prefers HD MP4 under 1080p from a Pixabay hit", () => {
    const file = pickPixabayMp4(sampleHit());
    assert.ok(file);
    assert.match(file!.url, /\.mp4$/);
    assert.equal(file!.width, 1280);
  });

  it("maps a hit into a commercially attributed stock video asset", () => {
    const asset = pixabayHitToStockAsset(sampleHit(), "plumber under sink", true);
    assert.ok(asset);
    assert.equal(asset!.kind, "video");
    assert.equal(asset!.license.provider, "pixabay");
    assert.equal(asset!.license.license, "pixabay");
    assert.match(asset!.license.attribution, /Pixabay/);
    assert.match(asset!.src, /\.mp4$/);
    assert.equal(asset!.query, "plumber under sink");
  });

  it("wires into Autopilot stock rotation and daily cron branding", () => {
    const fetcher = readFileSync(join(root, "src/lib/axiom/pixabay-fetcher.ts"), "utf8");
    const server = readFileSync(join(root, "src/lib/axiom/autopilot-content.server.ts"), "utf8");
    const tick = readFileSync(join(root, "src/lib/axiom/shop-autopilot.server.ts"), "utf8");
    const cron = readFileSync(join(root, "src/lib/axiom/outreach-cron.server.ts"), "utf8");
    assert.match(fetcher, /pixabay\.com\/api\/videos/);
    assert.match(fetcher, /fetchPixabayTradeVideo/);
    assert.match(fetcher, /PIXABAY_API_KEY/);
    assert.match(server, /fetchPixabayTradeVideo/);
    assert.match(server, /pixabay-fetcher/);
    assert.match(server, /kind: "video"/);
    assert.match(tick, /sourceBrandedContentForShop/);
    assert.match(cron, /tickShopAutopilot/);
    assert.match(cron, /stockBranded/);
  });
});
