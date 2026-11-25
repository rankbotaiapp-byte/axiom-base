"use client";

/**
 * Live Axiom config.
 *  1. Starts from server-rendered `initial` (no flash), else localStorage cache, else defaults.
 *  2. Fetches the saved version from /api/axiom/config.
 *  3. Listens on BroadcastChannel → every open tab updates the instant you edit in /axiom-studio.
 *  4. Optional Supabase Realtime → other devices update when the studio saves.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { AxiomConfig, DEFAULT_AXIOM_CONFIG, axiomSettingKey, normalizeConfig } from "./config";

const channelName = (slug: string) => `axiom-config:${slug}`;
const cacheKey = (slug: string) => `axiom-config-cache:${slug}`;

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPA_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function readCachedConfig(slug: string): AxiomConfig | null {
  try {
    const raw = localStorage.getItem(cacheKey(slug));
    return raw ? normalizeConfig(raw) : null;
  } catch {
    return null;
  }
}

function writeCache(slug: string, cfg: AxiomConfig) {
  try {
    localStorage.setItem(cacheKey(slug), JSON.stringify(cfg));
  } catch {}
}

/** Broadcast an unsaved draft to every open Axiom page (studio live preview). */
export function broadcastAxiomDraft(slug: string, cfg: AxiomConfig) {
  writeCache(slug, cfg);
  try {
    const bc = new BroadcastChannel(channelName(slug));
    bc.postMessage(cfg);
    bc.close();
  } catch {}
}

export async function saveAxiomConfig(slug: string, cfg: AxiomConfig, adminKey: string) {
  broadcastAxiomDraft(slug, cfg);
  const res = await fetch(`/api/axiom/config?slug=${encodeURIComponent(slug)}`, {
    method: "PUT",
    headers: { "content-type": "application/json", "x-axiom-admin-key": adminKey },
    body: JSON.stringify(cfg),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `Save failed (${res.status})`);
  return normalizeConfig((await res.json()).config);
}

export function useAxiomConfig(slug = "default", initial?: AxiomConfig) {
  const [config, setConfig] = useState<AxiomConfig>(initial ?? DEFAULT_AXIOM_CONFIG);
  const [loaded, setLoaded] = useState(Boolean(initial));
  const slugRef = useRef(slug);
  slugRef.current = slug;

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/axiom/config?slug=${encodeURIComponent(slugRef.current)}`, { cache: "no-store" });
      if (!res.ok) return;
      const cfg = normalizeConfig((await res.json()).config);
      setConfig(cfg);
      writeCache(slugRef.current, cfg);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!initial) {
      const cached = readCachedConfig(slug);
      if (cached) setConfig(cached);
    }
    refresh();

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel(channelName(slug));
      bc.onmessage = (e) => setConfig(normalizeConfig(e.data));
    } catch {}

    let unsub = () => {};
    if (SUPA_URL && SUPA_ANON) {
      const supa = createClient(SUPA_URL, SUPA_ANON);
      const ch = supa
        .channel(`axiom-${slug}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "app_settings", filter: `setting_key=eq.${axiomSettingKey(slug)}` },
          (payload) => {
            const row = payload.new as { setting_value?: unknown } | undefined;
            if (row?.setting_value) setConfig(normalizeConfig(row.setting_value));
          }
        )
        .subscribe();
      unsub = () => void supa.removeChannel(ch);
    }

    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      bc?.close();
      unsub();
      window.removeEventListener("focus", onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  return { config, setConfig, loaded, refresh };
}
