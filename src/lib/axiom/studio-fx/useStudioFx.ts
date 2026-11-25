"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/browser";
import {
  STUDIO_GLOBAL_KEY,
  defaultStudioFxState,
  defaultStudioGlobalLibrary,
  normalizeStudioFxState,
  normalizeStudioGlobal,
  studioFxSettingKey,
} from "./defaults";
import type { StudioFxState, StudioGlobalLibrary } from "./types";

function parseSetting(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

/**
 * Live-subscribe to tenant studio FX in `app_settings`.
 * Falls back to defaults when Supabase anon env is unset.
 */
export function useStudioFx(slug: string, initial?: StudioFxState) {
  const safe = slug.replace(/[^a-z0-9-_]/gi, "").slice(0, 64) || "default";
  const [state, setState] = useState<StudioFxState>(() => initial ?? defaultStudioFxState(safe));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const seq = useRef(0);

  useEffect(() => {
    setState((prev) => (prev.slug === safe ? prev : defaultStudioFxState(safe)));
  }, [safe]);

  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/studio/fx?slug=${encodeURIComponent(safe)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((json: { state?: unknown }) => {
        if (cancelled || !json.state) return;
        setState(normalizeStudioFxState(json.state, safe));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [safe]);

  useEffect(() => {
    const sb = getSupabaseBrowser();
    if (!sb) return;
    const key = studioFxSettingKey(safe);
    const channel = sb
      .channel(`studio-fx:${safe}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "app_settings", filter: `setting_key=eq.${key}` },
        (payload) => {
          const row = payload.new as { setting_value?: unknown } | null;
          const parsed = parseSetting(row?.setting_value);
          if (!parsed || typeof parsed !== "object") return;
          setState(normalizeStudioFxState(parsed, safe));
        },
      )
      .subscribe();
    return () => {
      void sb.removeChannel(channel);
    };
  }, [safe]);

  const save = useCallback(
    async (next: StudioFxState, logLabel?: string) => {
      const id = ++seq.current;
      setSaving(true);
      setError(null);
      try {
        const payload = logLabel
          ? { ...next, log: { label: logLabel, progress: 1 } }
          : next;
        const res = await fetch(`/api/studio/fx?slug=${encodeURIComponent(safe)}`, {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = (await res.json()) as { state?: unknown; library?: unknown; error?: string };
        if (!res.ok) throw new Error(json.error || "Save failed");
        if (json.library && typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("axiom-studio-global", { detail: json.library }));
        }
        const clean = normalizeStudioFxState(json.state ?? next, safe);
        if (id !== seq.current) return clean;
        setState(clean);
        return clean;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Save failed";
        if (id === seq.current) setError(message);
        throw err;
      } finally {
        if (id === seq.current) setSaving(false);
      }
    },
    [safe],
  );

  return { state, setState, save, saving, error };
}

/** Global asset library + tenant oversight, live from `axiom_studio_global`. */
export function useStudioGlobal() {
  const [library, setLibrary] = useState<StudioGlobalLibrary>(() => defaultStudioGlobalLibrary());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/studio/fx?scope=global", { cache: "no-store" })
      .then((r) => r.json())
      .then((json: { library?: unknown }) => {
        if (cancelled || !json.library) return;
        setLibrary(normalizeStudioGlobal(json.library));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onLocal = (event: Event) => {
      const detail = (event as CustomEvent<unknown>).detail;
      if (!detail) return;
      setLibrary(normalizeStudioGlobal(detail));
    };
    window.addEventListener("axiom-studio-global", onLocal);
    return () => window.removeEventListener("axiom-studio-global", onLocal);
  }, []);

  useEffect(() => {
    const sb = getSupabaseBrowser();
    if (!sb) return;
    const channel = sb
      .channel("studio-fx:global")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "app_settings",
          filter: `setting_key=eq.${STUDIO_GLOBAL_KEY}`,
        },
        (payload) => {
          const row = payload.new as { setting_value?: unknown } | null;
          const parsed = parseSetting(row?.setting_value);
          if (!parsed || typeof parsed !== "object") return;
          setLibrary(normalizeStudioGlobal(parsed));
        },
      )
      .subscribe();
    return () => {
      void sb.removeChannel(channel);
    };
  }, []);

  const save = useCallback(async (next: StudioGlobalLibrary) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/studio/fx?scope=global", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ library: next }),
      });
      const json = (await res.json()) as { library?: unknown; error?: string };
      if (!res.ok) throw new Error(json.error || "Save failed");
      const clean = normalizeStudioGlobal(json.library ?? next);
      setLibrary(clean);
      return clean;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Save failed";
      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  return { library, setLibrary, save, saving, error };
}

/** Coalesce slider drags into one `app_settings` write. Flushes on unmount. */
export function useStudioSaveQueue(
  save: (next: StudioFxState) => Promise<unknown>,
) {
  const saveRef = useRef(save);
  saveRef.current = save;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<StudioFxState | null>(null);

  const cancelQueued = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    pending.current = null;
  }, []);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
    if (pending.current) void saveRef.current(pending.current);
  }, []);

  const queueSave = useCallback((next: StudioFxState) => {
    pending.current = next;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const value = pending.current;
      pending.current = null;
      timer.current = null;
      if (value) void saveRef.current(value);
    }, 550);
  }, []);

  return { queueSave, cancelQueued };
}
