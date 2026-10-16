import { getSql } from "@/lib/db";
import {
  applyStylePatch,
  emptyPatch,
  parseCopilotJson,
  parseStylePatch,
  heroGenerationPrompt,
  promoteStagedHero,
  publicHeroUrl,
  packBusinessMemory,
  rememberColors,
  rememberPrompt,
  sanitizeAssetUrl,
  sanitizePlain,
  snapshotFromHud,
  stageHero,
  stageLibraryHero,
  type CopilotDesk,
  type CopilotLook,
  type CopilotMemoryView,
  type CopilotSendResult,
  type StagedHero,
  type StyleSnapshot,
  type StyleTokenPatch,
} from "./copilot.ts";
import { parseHud } from "./hud.ts";
import { sanitizeAccent } from "./prospect-brand.ts";
import { parseTradeProfile } from "./trade-layout.ts";
import { isShopNiche } from "./types.ts";

const CHAT_URL = "https://api.x.ai/v1/chat/completions";
const IMAGE_URL = "https://api.x.ai/v1/images/generations";
const VIDEO_URL = "https://api.x.ai/v1/videos/generations";
const MAX_TOKENS = 480;
const UNAVAILABLE = "Generation is unavailable in this environment";

const busyUntil = new Map<string, number>();

type Gate = {
  id: string;
  name: string;
  niche: string;
  neon_accent: string | null;
  ring_color: string;
  trade_profile: string | null;
};

type MemoryRow = {
  brand_notes: string;
  niche: string;
  preferred_accent: string;
  past_prompts: string;
  style_snapshots: string;
  owner_feedback: string;
  confirmed_colors: string;
  aesthetic_preferences: string;
  style_tokens: string;
  staged_hero_url: string;
  staged_hero_medium: string;
  staged_hero_prompt: string;
};

type StoredMemory = {
  view: CopilotMemoryView;
  prompts: string[];
  snapshots: StyleSnapshot[];
  colors: string[];
  aesthetic: string;
  styleTokens: StyleTokenPatch;
  staged: StagedHero | null;
};

function xaiKey(): string {
  return process.env.XAI_API_KEY?.trim() ?? "";
}

function claim(shopId: string): boolean {
  const now = Date.now();
  if ((busyUntil.get(shopId) ?? 0) > now) return false;
  busyUntil.set(shopId, now + 45_000);
  return true;
}

function release(shopId: string) {
  busyUntil.delete(shopId);
}

async function ownedShop(userId: string, slug: string): Promise<Gate | null> {
  const sql = await getSql();
  const rows = await sql<Gate>`
    select s.id, s.name, s.niche, s.neon_accent, s.ring_color, s.trade_profile
    from shops s
    where s.slug = ${slug}
      and (
        s.owner_user_id = ${userId}
        or exists (
          select 1 from shop_members m
          where m.shop_id = s.id
            and m.user_id = ${userId}
            and m.role = 'owner'
        )
      )
    limit 1
  `;
  return rows[0] ?? null;
}

function lookOf(row: Gate): CopilotLook {
  const niche = isShopNiche(row.niche) ? row.niche : "location";
  let parsed: unknown = {};
  if (row.trade_profile) {
    try {
      parsed = JSON.parse(row.trade_profile) as unknown;
    } catch {
      parsed = {};
    }
  }
  const profile = parseTradeProfile(niche, parsed);
  return {
    accent: sanitizeAccent(row.neon_accent) || sanitizeAccent(row.ring_color),
    hud: profile.hud,
  };
}

function readJsonList(raw: string): unknown[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function snapshotsOf(raw: string): StyleSnapshot[] {
  const out: StyleSnapshot[] = [];
  for (const item of readJsonList(raw)) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    out.push(
      snapshotFromHud(
        parseHud({
          fade: record.fade,
          glow: record.glow,
          headline: record.headline,
          card: record.card,
          blur: record.blur,
          rim: record.rim,
          force: record.force,
          radius: record.radius,
          damp: record.damp,
        }),
        String(record.accent ?? ""),
        String(record.summary ?? ""),
        String(record.assetUrl ?? ""),
        String(record.at ?? ""),
      ),
    );
  }
  return out.slice(-8);
}

function promptsOf(raw: string): string[] {
  return rememberPrompt(
    readJsonList(raw).filter((item): item is string => typeof item === "string"),
    "",
  );
}

function colorsOf(raw: string): string[] {
  return rememberColors(
    readJsonList(raw).filter((item): item is string => typeof item === "string"),
    "",
  );
}

function stagedOf(row: MemoryRow | undefined): StagedHero | null {
  if (!row) return null;
  return stageHero(row.staged_hero_url, row.staged_hero_medium, row.staged_hero_prompt);
}

function tokensOf(raw: string): StyleTokenPatch {
  try {
    return packBusinessMemory({ styleTokens: JSON.parse(raw) as unknown }).styleTokens;
  } catch {
    return {};
  }
}

async function readMemory(shopId: string, niche: string): Promise<StoredMemory> {
  const sql = await getSql();
  const rows = await sql<MemoryRow>`
    select brand_notes, niche, preferred_accent, style_tokens, past_prompts, style_snapshots, owner_feedback,
      confirmed_colors, aesthetic_preferences, staged_hero_url, staged_hero_medium, staged_hero_prompt
    from business_memories
    where shop_id = ${shopId}
    limit 1
  `;
  const row = rows[0];
  const packed = packBusinessMemory({
    brandNotes: row?.brand_notes ?? "",
    styleTokens: tokensOf(row?.style_tokens ?? "{}"),
    aesthetic: row?.aesthetic_preferences ?? "",
    pastPrompts: promptsOf(row?.past_prompts ?? "[]"),
  });
  const snapshots = snapshotsOf(row?.style_snapshots ?? "[]");
  const colors = colorsOf(row?.confirmed_colors ?? "[]");
  const staged = stagedOf(row);
  const latest = snapshots[snapshots.length - 1];
  return {
    prompts: packed.pastPrompts,
    snapshots,
    colors,
    aesthetic: packed.aesthetic,
    styleTokens: packed.styleTokens,
    staged,
    view: {
      brandNotes: packed.brandNotes,
      niche: sanitizePlain(row?.niche || niche, 80),
      preferredAccent: sanitizeAccent(row?.preferred_accent),
      pastPrompts: packed.pastPrompts,
      feedback: sanitizePlain(row?.owner_feedback ?? "", 400),
      latestSummary: latest?.summary ?? "",
      confirmedColors: colors,
      aesthetic: packed.aesthetic,
      styleTokens: packed.styleTokens,
      stagedHero: staged,
    },
  };
}

async function writeMemory(shopId: string, niche: string, memory: StoredMemory) {
  const sql = await getSql();
  const packed = packBusinessMemory({
    brandNotes: memory.view.brandNotes,
    styleTokens: memory.styleTokens,
    aesthetic: memory.aesthetic,
    pastPrompts: memory.prompts,
  });
  const accent = sanitizeAccent(memory.view.preferredAccent);
  const feedback = sanitizePlain(memory.view.feedback, 400);
  const prompts = JSON.stringify(packed.pastPrompts);
  const tokens = JSON.stringify(packed.styleTokens);
  const snapshots = JSON.stringify(memory.snapshots.slice(-8));
  const colors = JSON.stringify(rememberColors(memory.colors, ""));
  const staged = memory.staged;
  await sql`
    insert into business_memories (
      shop_id, brand_notes, niche, preferred_accent, style_tokens, past_prompts, style_snapshots, owner_feedback,
      confirmed_colors, aesthetic_preferences, staged_hero_url, staged_hero_medium, staged_hero_prompt, updated_at
    ) values (
      ${shopId}, ${packed.brandNotes}, ${sanitizePlain(niche, 80)}, ${accent}, ${tokens}, ${prompts}, ${snapshots}, ${feedback},
      ${colors}, ${packed.aesthetic}, ${staged?.url ?? ""}, ${staged?.medium ?? ""}, ${staged?.prompt ?? ""}, now()
    )
    on conflict (shop_id) do update set
      brand_notes = excluded.brand_notes,
      niche = excluded.niche,
      preferred_accent = excluded.preferred_accent,
      style_tokens = excluded.style_tokens,
      past_prompts = excluded.past_prompts,
      style_snapshots = excluded.style_snapshots,
      owner_feedback = excluded.owner_feedback,
      confirmed_colors = excluded.confirmed_colors,
      aesthetic_preferences = excluded.aesthetic_preferences,
      staged_hero_url = excluded.staged_hero_url,
      staged_hero_medium = excluded.staged_hero_medium,
      staged_hero_prompt = excluded.staged_hero_prompt,
      updated_at = now()
    where business_memories.shop_id = ${shopId}
  `;
}

function memoryBrief(name: string, memory: CopilotMemoryView, look: CopilotLook): string {
  const prompts = memory.pastPrompts.slice(-6).map((line) => `- ${line}`).join("\n");
  return [
    `Shop: ${sanitizePlain(name, 80)}`,
    `Niche: ${memory.niche || "unknown"}`,
    `Preferred accent: ${memory.preferredAccent || look.accent || "none"}`,
    `Saved style tokens: ${JSON.stringify(memory.styleTokens)}`,
    `Confirmed colors: ${memory.confirmedColors.join(", ") || "none"}`,
    `Aesthetic: ${memory.aesthetic || memory.brandNotes || "none"}`,
    `Current edge feather: ${look.hud.fade}`,
    `Current neon glow: ${look.hud.glow}`,
    `Blur threshold index: ${look.hud.blur}`,
    `Border glow: ${look.hud.rim ? "on" : "off"}`,
    `Headline: ${look.hud.headline || "niche line"}`,
    `Owner feedback: ${memory.feedback || "none"}`,
    `Last confirmed look: ${memory.latestSummary || "none"}`,
    "A staged hero is not on the public storefront.",
    prompts ? `Recent prompts:\n${prompts}` : "Recent prompts: none",
  ].join("\n");
}

const SYSTEM = [
  "You are the shop owner's design partner.",
  "Return one JSON object and nothing else.",
  '{"reply":"short plain text","style":{},"hero":null,"brandNote":""}',
  "style may set only these keys: accent (hex #RRGGBB), edgeFeather (28|44|60|76|92), glow (0|25|50|75|100), cardOpacity (0.38|0.52|0.66|0.82), blur (12|18|28|40), borderGlow (true|false), headline (plain text).",
  "Omit style keys you are not changing.",
  "hero is null or {\"medium\":\"image\"|\"video\",\"prompt\":\"one visual sentence\"}.",
  "Map a request like a more aggressive subject plus an accent into that prompt and the matching style fields.",
  "Never return CSS, HTML, code, or instructions to run code.",
  "brandNote stays empty unless the owner asked you to remember a brand fact.",
  "Do not include chain-of-thought, secrets, or payment data.",
].join(" ");

async function xaiFetch(url: string, key: string, body: unknown, retryJson: boolean): Promise<Response> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });
  if (res.status === 400 && retryJson && body && typeof body === "object" && "response_format" in body) {
    const next = { ...(body as Record<string, unknown>) };
    delete next.response_format;
    return xaiFetch(url, key, next, false);
  }
  return res;
}

async function generateImage(key: string, prompt: string): Promise<string> {
  const res = await xaiFetch(
    IMAGE_URL,
    key,
    { model: "grok-imagine-image", prompt, n: 1, response_format: "url" },
    false,
  );
  if (!res.ok) return "";
  const body = (await res.json()) as { data?: { url?: string }[] };
  return sanitizeAssetUrl(body.data?.[0]?.url);
}

async function generateVideo(key: string, prompt: string): Promise<string> {
  const res = await xaiFetch(VIDEO_URL, key, { model: "grok-imagine-video", prompt, duration: 5 }, false);
  if (!res.ok) return "";
  const started = (await res.json()) as { request_id?: string };
  const requestId = String(started.request_id ?? "");
  if (!/^[a-zA-Z0-9-]{8,80}$/.test(requestId)) return "";
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const poll = await fetch(`${VIDEO_URL.replace(/\/generations$/, "")}/${requestId}`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!poll.ok) return "";
    const body = (await poll.json()) as { status?: string; video?: { url?: string } };
    if (body.status === "failed") return "";
    if (body.status === "done") return sanitizeAssetUrl(body.video?.url);
  }
  return "";
}

function blankSend(available: boolean, error: string, look: CopilotLook, memory: CopilotMemoryView): CopilotSendResult {
  return {
    ok: false,
    available,
    error,
    reply: "",
    style: {},
    hero: null,
    brandNote: "",
    look,
    memory,
  };
}

export async function readCopilotHandler(ctx: { data: { slug: string }; context: { userId: string } }): Promise<CopilotDesk> {
  const shop = await ownedShop(ctx.context.userId, ctx.data.slug);
  if (!shop) throw new Error("Forbidden");
  const look = lookOf(shop);
  const memory = await readMemory(shop.id, shop.niche);
  return {
    available: Boolean(xaiKey()),
    shopName: shop.name,
    look,
    memory: memory.view,
  };
}

export async function sendCopilotHandler(ctx: {
  data: { slug: string; message: string; history: { role: "user" | "assistant"; content: string }[] };
  context: { userId: string };
}): Promise<CopilotSendResult> {
  const shop = await ownedShop(ctx.context.userId, ctx.data.slug);
  if (!shop) throw new Error("Forbidden");
  const look = lookOf(shop);
  const loaded = await readMemory(shop.id, shop.niche);
  const prompts = rememberPrompt(loaded.prompts, ctx.data.message);
  const remembered: StoredMemory = {
    ...loaded,
    prompts,
    view: { ...loaded.view, pastPrompts: prompts, niche: shop.niche },
  };
  await writeMemory(shop.id, shop.niche, remembered);
  const memory = remembered.view;
  const key = xaiKey();
  if (!key) return blankSend(false, UNAVAILABLE, look, memory);
  if (!claim(shop.id)) {
    return blankSend(true, "A generation is already running. Wait for it to finish.", look, memory);
  }
  try {
    const prior = ctx.data.history.filter((turn, index, all) => {
      const last = index === all.length - 1 && turn.role === "user" && turn.content === ctx.data.message;
      return !last;
    });
    const res = await xaiFetch(
      CHAT_URL,
      key,
      {
        model: "grok-4.5",
        max_tokens: MAX_TOKENS,
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          { role: "system", content: memoryBrief(shop.name, memory, look) },
          ...prior,
          { role: "user", content: ctx.data.message },
        ],
      },
      true,
    );
    if (!res.ok) return blankSend(true, "Generation failed. You can still apply style tokens.", look, memory);
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = body.choices?.[0]?.message?.content ?? "";
    const turn = parseCopilotJson(text);
    const reply = turn.reply || (emptyPatch(turn.style) && !turn.hero ? "I could not read a style action from that reply." : "Here is a look to confirm.");
    let assetUrl = "";
    let staged = remembered.staged;
    if (turn.hero) {
      const accent = sanitizeAccent(turn.style.accent) || memory.preferredAccent || look.accent;
      const prompt = heroGenerationPrompt(
        `${turn.hero.prompt} Storefront hero for a ${shop.niche || "local"} business.`,
        accent,
      );
      assetUrl = turn.hero.medium === "video" ? await generateVideo(key, prompt) : await generateImage(key, prompt);
      const nextStage = stageHero(assetUrl, turn.hero.medium, turn.hero.prompt);
      if (nextStage) staged = nextStage;
      else assetUrl = "";
    }
    const nextTokens = emptyPatch(turn.style) ? remembered.styleTokens : parseStylePatch({ ...remembered.styleTokens, ...turn.style });
    const withStage: StoredMemory = {
      ...remembered,
      styleTokens: nextTokens,
      staged,
      view: { ...memory, styleTokens: nextTokens, stagedHero: staged },
    };
    const heroChanged = (staged?.url ?? "") !== (remembered.staged?.url ?? "");
    if (heroChanged || !emptyPatch(turn.style)) await writeMemory(shop.id, shop.niche, withStage);
    return {
      ok: true,
      available: true,
      error: "",
      reply,
      style: turn.style,
      hero: turn.hero ? { ...turn.hero, assetUrl: staged && staged.url === assetUrl ? assetUrl : "" } : null,
      brandNote: turn.brandNote,
      look,
      memory: withStage.view,
    };
  } catch {
    return blankSend(true, "Generation failed. You can still apply style tokens.", look, memory);
  } finally {
    release(shop.id);
  }
}

export async function stageCopilotPreviewHandler(ctx: {
  data: { slug: string; libraryId: string; style: unknown };
  context: { userId: string };
}): Promise<{ ok: true; look: CopilotLook; memory: CopilotMemoryView } | { ok: false; error: string }> {
  const shop = await ownedShop(ctx.context.userId, ctx.data.slug);
  if (!shop) throw new Error("Forbidden");
  const loaded = await readMemory(shop.id, shop.niche);
  const patch = parseStylePatch(ctx.data.style);
  let staged = loaded.staged;
  if (ctx.data.libraryId) {
    const picked = stageLibraryHero(ctx.data.libraryId);
    if (!picked) return { ok: false, error: "That film is not in the staging library" };
    staged = picked;
  }
  if (!ctx.data.libraryId && emptyPatch(patch)) return { ok: false, error: "Nothing to stage" };
  const styleTokens = emptyPatch(patch) ? loaded.styleTokens : patch;
  await writeMemory(shop.id, shop.niche, {
    ...loaded,
    styleTokens,
    staged,
    view: { ...loaded.view, styleTokens, stagedHero: staged, niche: shop.niche },
  });
  const saved = await readMemory(shop.id, shop.niche);
  return { ok: true, look: lookOf(shop), memory: saved.view };
}

export async function confirmCopilotHandler(ctx: {
  data: { slug: string; style: unknown; assetUrl: string; summary: string; brandNote: string };
  context: { userId: string };
}): Promise<{ ok: true; applied: boolean; look: CopilotLook; memory: CopilotMemoryView } | { ok: false; error: string }> {
  const shop = await ownedShop(ctx.context.userId, ctx.data.slug);
  if (!shop) throw new Error("Forbidden");
  const patch: StyleTokenPatch = parseStylePatch(ctx.data.style);
  const brandNote = sanitizePlain(ctx.data.brandNote, 400);
  const summary = sanitizePlain(ctx.data.summary, 200);
  const look = lookOf(shop);
  const loaded = await readMemory(shop.id, shop.niche);
  const staged = loaded.staged;
  const visual = !emptyPatch(patch);
  const alreadyLive = staged ? publicHeroUrl(look.hud, staged.url) === staged.url : false;
  const publishHero = Boolean(staged) && !alreadyLive;
  if (!visual && !brandNote && !staged) return { ok: false, error: "Nothing to apply" };
  let nextHud = applyStylePatch(look.hud, patch);
  if (publishHero && staged) {
    nextHud = promoteStagedHero(nextHud, staged);
    if (publicHeroUrl(nextHud, staged.url) !== staged.url) {
      return { ok: false, error: "That hero did not pass the URL check" };
    }
  }
  const accent = patch.accent || look.accent;
  if (visual || publishHero) {
    const niche = isShopNiche(shop.niche) ? shop.niche : "location";
    let parsed: unknown = {};
    if (shop.trade_profile) {
      try {
        parsed = JSON.parse(shop.trade_profile) as unknown;
      } catch {
        parsed = {};
      }
    }
    const profile = parseTradeProfile(niche, parsed);
    const sql = await getSql();
    await sql`
      update shops set
        trade_profile = ${JSON.stringify({ ...profile, hud: nextHud })},
        neon_accent = ${accent},
        glow_enabled = ${patch.borderGlow ?? nextHud.rim}
      where id = ${shop.id}
        and (
          owner_user_id = ${ctx.context.userId}
          or exists (
            select 1 from shop_members m
            where m.shop_id = shops.id
              and m.user_id = ${ctx.context.userId}
              and m.role = 'owner'
          )
        )
    `;
  }
  const snapshots = [...loaded.snapshots];
  if (visual || publishHero) {
    snapshots.push(
      snapshotFromHud(
        nextHud,
        accent,
        summary || "Confirmed staging",
        publishHero && staged ? staged.url : "",
        new Date().toISOString(),
      ),
    );
  }
  const colors = patch.accent ? rememberColors(loaded.colors, patch.accent) : loaded.colors;
  const aesthetic = brandNote || loaded.aesthetic;
  const styleTokens = visual ? patch : loaded.styleTokens;
  const clearStaged = Boolean(staged);
  await writeMemory(shop.id, shop.niche, {
    ...loaded,
    snapshots,
    colors,
    aesthetic,
    styleTokens,
    staged: clearStaged ? null : loaded.staged,
    view: {
      ...loaded.view,
      brandNotes: brandNote || loaded.view.brandNotes,
      preferredAccent: patch.accent || loaded.view.preferredAccent,
      confirmedColors: colors,
      aesthetic,
      styleTokens,
      stagedHero: null,
      niche: shop.niche,
    },
  });
  const saved = await readMemory(shop.id, shop.niche);
  return {
    ok: true,
    applied: visual || publishHero,
    look: { accent, hud: nextHud },
    memory: saved.view,
  };
}

export async function promoteCopilotHeroHandler(ctx: {
  data: { slug: string };
  context: { userId: string };
}): Promise<{ ok: true; look: CopilotLook; memory: CopilotMemoryView } | { ok: false; error: string }> {
  const shop = await ownedShop(ctx.context.userId, ctx.data.slug);
  if (!shop) throw new Error("Forbidden");
  const loaded = await readMemory(shop.id, shop.niche);
  const staged = loaded.staged;
  if (!staged) return { ok: false, error: "No staged hero to confirm" };
  const look = lookOf(shop);
  if (publicHeroUrl(look.hud, staged.url) === staged.url) {
    return { ok: true, look, memory: loaded.view };
  }
  const nextHud = promoteStagedHero(look.hud, staged);
  if (publicHeroUrl(nextHud, staged.url) !== staged.url) {
    return { ok: false, error: "That hero did not pass the URL check" };
  }
  const niche = isShopNiche(shop.niche) ? shop.niche : "location";
  let parsed: unknown = {};
  if (shop.trade_profile) {
    try {
      parsed = JSON.parse(shop.trade_profile) as unknown;
    } catch {
      parsed = {};
    }
  }
  const profile = parseTradeProfile(niche, parsed);
  const sql = await getSql();
  await sql`
    update shops set trade_profile = ${JSON.stringify({ ...profile, hud: nextHud })}
    where id = ${shop.id}
      and (
        owner_user_id = ${ctx.context.userId}
        or exists (
          select 1 from shop_members m
          where m.shop_id = shops.id
            and m.user_id = ${ctx.context.userId}
            and m.role = 'owner'
        )
      )
  `;
  const snapshots = [
    ...loaded.snapshots,
    snapshotFromHud(nextHud, look.accent, "Confirmed hero", staged.url, new Date().toISOString()),
  ];
  await writeMemory(shop.id, shop.niche, {
    ...loaded,
    snapshots,
    staged: null,
    view: { ...loaded.view, stagedHero: null, niche: shop.niche },
  });
  const saved = await readMemory(shop.id, shop.niche);
  return { ok: true, look: { accent: look.accent, hud: nextHud }, memory: saved.view };
}

export async function saveCopilotFeedbackHandler(ctx: {
  data: { slug: string; feedback: string };
  context: { userId: string };
}): Promise<{ ok: true; memory: CopilotMemoryView }> {
  const shop = await ownedShop(ctx.context.userId, ctx.data.slug);
  if (!shop) throw new Error("Forbidden");
  const feedback = sanitizePlain(ctx.data.feedback, 400);
  if (!feedback) throw new Error("Write the note to save");
  const loaded = await readMemory(shop.id, shop.niche);
  await writeMemory(shop.id, shop.niche, {
    ...loaded,
    aesthetic: feedback,
    view: { ...loaded.view, feedback, aesthetic: feedback, niche: shop.niche },
  });
  const saved = await readMemory(shop.id, shop.niche);
  return { ok: true, memory: saved.view };
}
