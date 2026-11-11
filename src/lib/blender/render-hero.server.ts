import { assertRenderProfit, RENDER_VIDEO_UNITS, saleCents, gpuCostCents } from "../axiom/render-credits.ts";
import { withAxiomVisualLock } from "../axiom/visual-design.ts";
import { HERO_ANIMATOR_MODEL } from "../axiom/hero-animator.ts";
import { renderHeadlessBlender } from "./BlenderService.ts";
import { directBlenderScene, type DirectorInput } from "./creative-director.ts";
import { persistShopHeroMp4 } from "./persist-hero.server.ts";

export type HeroLoopRender = {
  ok: boolean;
  engine: "blender" | "imagine" | "none";
  heroVideoUrl: string;
  effect: string;
  marginCents: number;
  detail: string;
};

async function imagineLoop(prompt: string, still: Uint8Array): Promise<Uint8Array | null> {
  const apiKey = process.env.XAI_API_KEY?.trim();
  if (!apiKey) return null;
  const start = await fetch("https://api.x.ai/v1/videos/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: HERO_ANIMATOR_MODEL,
      prompt: withAxiomVisualLock(prompt),
      image: { url: `data:image/jpeg;base64,${Buffer.from(still).toString("base64")}` },
      duration: 5,
      resolution: "480p",
    }),
  });
  const body = (await start.json().catch(() => ({}))) as { request_id?: string };
  if (!start.ok || !body.request_id) return null;
  for (let i = 0; i < 8; i += 1) {
    await new Promise((resolve) => setTimeout(resolve, 2500));
    const poll = await fetch(`https://api.x.ai/v1/videos/${body.request_id}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const shot = (await poll.json().catch(() => ({}))) as {
      status?: string;
      video?: { url?: string };
    };
    if (shot.status === "failed" || shot.status === "expired") return null;
    if (shot.status === "done" && shot.video?.url) {
      const film = await fetch(shot.video.url, { headers: { Authorization: `Bearer ${apiKey}` } });
      if (!film.ok) return null;
      return new Uint8Array(await film.arrayBuffer());
    }
  }
  return null;
}

/** Margin-gated 3D hero loop: Blender when present, Imagine otherwise. */
export async function renderAutopilotHeroLoop(input: {
  shopId: string;
  director: DirectorInput;
  stillBytes?: Uint8Array | null;
  logoBytes?: Uint8Array | null;
}): Promise<HeroLoopRender> {
  assertRenderProfit("video", RENDER_VIDEO_UNITS);
  const marginCents = saleCents(RENDER_VIDEO_UNITS) - gpuCostCents("video", RENDER_VIDEO_UNITS);
  const shot = await directBlenderScene(input.director);
  const blender = await renderHeadlessBlender({ shot, logoBytes: input.logoBytes });
  let bytes = blender.ok ? blender.bytes : null;
  let engine: HeroLoopRender["engine"] = blender.ok ? "blender" : "none";
  if (!bytes && input.stillBytes) {
    bytes = await imagineLoop(shot.prompt, input.stillBytes);
    if (bytes) engine = "imagine";
  }
  if (!bytes) {
    return { ok: false, engine: "none", heroVideoUrl: "", effect: shot.effect, marginCents, detail: blender.detail };
  }
  const heroVideoUrl = await persistShopHeroMp4(input.shopId, bytes);
  if (!heroVideoUrl) {
    return { ok: false, engine, heroVideoUrl: "", effect: shot.effect, marginCents, detail: "Hero film was not a playable MP4" };
  }
  return {
    ok: true,
    engine,
    heroVideoUrl,
    effect: shot.effect,
    marginCents,
    detail: `${engine} · ${shot.effect} · margin ${marginCents}¢`,
  };
}
