import { useEffect, useState } from "react";
import { readLiveDesk } from "@/lib/actions/live-desk-actions";
import { liveDeskState, type LiveDeskState } from "@/lib/axiom/live-desk-state";

const EMPTY = liveDeskState();

function supabaseRealtimeUrl(): { url: string; key: string } | null {
  const meta = import.meta as { env?: Record<string, string | undefined> };
  const env = meta.env ?? {};
  const url = (env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
  const key = env.VITE_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url || !key) return null;
  return { url, key };
}

/**
 * Keeps `{ paused, caps, sentToday }` current for the active shop-slug.
 * Polls the desk snapshot and, when Supabase is configured, also listens on
 * `outbound_engine_state` / `appointments` so a send shows up without a refresh.
 */
export function useLiveDeskState(shopSlug: string) {
  const [state, setState] = useState<LiveDeskState>(EMPTY);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const slug = shopSlug.trim().toLowerCase();
    if (!slug) return;
    let cancelled = false;

    async function pull() {
      try {
        const shot = await readLiveDesk({ data: { slug } });
        if (cancelled) return;
        setState(shot.state);
        setUpdatedAt(shot.updatedAt);
        setError(null);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Desk telemetry unavailable");
      }
    }

    void pull();
    const poll = window.setInterval(() => {
      if (document.visibilityState === "hidden") return;
      void pull();
    }, 2500);

    const realtime = supabaseRealtimeUrl();
    let socket: WebSocket | null = null;
    if (realtime) {
      const params = new URLSearchParams({
        apikey: realtime.key,
        vsn: "1.0.0",
      });
      socket = new WebSocket(`${realtime.url.replace(/^http/, "ws")}/realtime/v1/websocket?${params}`);
      socket.addEventListener("open", () => {
        const join = (topic: string) =>
          socket?.send(
            JSON.stringify({
              topic,
              event: "phx_join",
              payload: { config: { postgres_changes: [{ event: "*", schema: "public" }] } },
              ref: topic,
            }),
          );
        join("realtime:public:outbound_engine_state");
        join("realtime:public:appointments");
        join("realtime:public:hero_studio_jobs");
      });
      socket.addEventListener("message", () => {
        void pull();
      });
    }

    return () => {
      cancelled = true;
      window.clearInterval(poll);
      socket?.close();
    };
  }, [shopSlug]);

  return { state, updatedAt, error };
}
