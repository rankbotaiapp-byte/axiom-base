import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { env } from "@/lib/env.server";
import {
  askEricAvatarId,
  avatarMintAllowed,
  avatarSessionPayload,
  clipAvatarField,
  ericGreeting,
  type AvatarContext,
} from "./avatar";

const PROVIDER_URL = "https://api.liveavatar.com";

/** A pasted sample is not a credential. */
function usableApiKey(value: string | undefined): string | undefined {
  if (!value) return undefined;
  if (/your-heygen-api-key-here|placeholder|changeme/i.test(value)) return undefined;
  return value;
}

/** `server/.env` holds the HeyGen key locally. Process env still wins. */
function loadLocalAvatarEnv(): void {
  const path = join(process.cwd(), "server", ".env");
  if (!existsSync(path)) return;
  let text = "";
  try {
    text = readFileSync(path, "utf8");
  } catch {
    return;
  }
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    if (!/^[A-Z][A-Z0-9_]*$/.test(key) || process.env[key]) continue;
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (value) process.env[key] = value;
  }
}

loadLocalAvatarEnv();

function avatarApiKey(): string | undefined {
  return usableApiKey(env("LIVEAVATAR_API_KEY") || env("HEYGEN_API_KEY"));
}

export function avatarConfigured(): boolean {
  return Boolean(avatarApiKey());
}

function readContext(value: unknown): AvatarContext {
  const source = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const text = (key: string) => (typeof source[key] === "string" ? clipAvatarField(source[key]) : "");
  return {
    businessName: text("businessName"),
    trade: text("trade"),
    city: text("city"),
  };
}

function providerBase(): string {
  const configured = env("LIVEAVATAR_API_URL");
  if (!configured) return PROVIDER_URL;
  try {
    const url = new URL(configured);
    if (url.protocol !== "https:") return PROVIDER_URL;
    return url.origin;
  } catch {
    return PROVIDER_URL;
  }
}

function unwrapData(payload: unknown): Record<string, unknown> | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  const data = record.data && typeof record.data === "object" ? (record.data as Record<string, unknown>) : record;
  return data;
}

export async function issueAvatarSession(request: Request): Promise<Response> {
  const raw = await request.text();
  if (raw.length > 2_000) return Response.json({ configured: false, error: "Request is too large" }, { status: 413 });
  let parsed: unknown = {};
  if (raw.trim()) {
    try {
      parsed = JSON.parse(raw) as unknown;
    } catch {
      return Response.json({ configured: false, error: "Request was not JSON" }, { status: 400 });
    }
  }
  const context = readContext(parsed);
  const greeting = ericGreeting(context);
  if (!avatarConfigured()) {
    return Response.json({ configured: false, greeting });
  }
  const caller = (request.headers.get("x-forwarded-for") ?? "local").split(",")[0]?.trim() || "local";
  if (!avatarMintAllowed(caller)) {
    return Response.json({ configured: true, greeting, error: "The live line is busy. Try again shortly." }, { status: 429 });
  }

  const apiKey = avatarApiKey() as string;
  const sandbox = env("LIVEAVATAR_SANDBOX") === "1" || env("LIVEAVATAR_SANDBOX") === "true";
  const body = avatarSessionPayload(context, {
    avatarId: askEricAvatarId(),
    voiceAgentId: env("LIVEAVATAR_VOICE_AGENT_ID"),
    voiceId: env("LIVEAVATAR_VOICE_ID"),
    contextId: env("LIVEAVATAR_CONTEXT_ID"),
    sandbox,
  });
  const base = providerBase();
  try {
    const minted = await fetch(`${base}/v1/sessions/token`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(12_000),
    });
    const mintedJson = unwrapData(await minted.json().catch(() => null));
    const sessionToken = typeof mintedJson?.session_token === "string" ? mintedJson.session_token : "";
    const sessionId = typeof mintedJson?.session_id === "string" ? mintedJson.session_id : "";
    if (!minted.ok || !sessionToken) {
      console.error("avatar token", minted.status);
      return Response.json({ configured: true, greeting, error: "The live line did not start." }, { status: 502 });
    }
    const started = await fetch(`${base}/v1/sessions/start`, {
      method: "POST",
      headers: { accept: "application/json", authorization: `Bearer ${sessionToken}` },
      signal: AbortSignal.timeout(12_000),
    });
    const startedJson = unwrapData(await started.json().catch(() => null));
    const livekitUrl = typeof startedJson?.livekit_url === "string" ? startedJson.livekit_url : "";
    const livekitClientToken = typeof startedJson?.livekit_client_token === "string" ? startedJson.livekit_client_token : "";
    if (!started.ok || !livekitUrl || !livekitClientToken) {
      console.error("avatar start", started.status);
      return Response.json({ configured: true, greeting, error: "The live line did not open." }, { status: 502 });
    }
    return Response.json({
      configured: true,
      greeting,
      sessionId,
      livekitUrl,
      livekitClientToken,
    });
  } catch (err) {
    console.error("avatar session", err instanceof Error ? err.message : "failed");
    return Response.json({ configured: true, greeting, error: "The live line did not answer." }, { status: 502 });
  }
}
