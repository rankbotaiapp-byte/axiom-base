"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  COMPANION_STATUS_WINDOW_MS,
  companionSourceFromEventType,
  isCompanionTelemetryStatus,
  scoreCompanionStatus,
  type CompanionTelemetryPulse,
  type CompanionTelemetrySnapshot,
  type CompanionTelemetryStatus,
} from "@/lib/axiom/companion-telemetry";
import { masterDeskFetch } from "@/lib/axiom/master-desk-client";
import { getSupabaseBrowser } from "@/lib/supabase/browser";

type AxiomTelemetryContextValue = {
  status: CompanionTelemetryStatus;
  source: string | null;
  detail: string | null;
  eventType: string | null;
  shopId: string | null;
  updatedAt: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
  /** Master-desk only: push a temporary hue for QA. */
  pulseTest: (status: Exclude<CompanionTelemetryStatus, "idle">) => Promise<void>;
};

const AxiomTelemetryContext = createContext<AxiomTelemetryContextValue | null>(null);

const IDLE: CompanionTelemetrySnapshot = {
  status: "idle",
  source: null,
  detail: null,
  eventType: null,
  shopId: null,
  updatedAt: null,
  windowMs: COMPANION_STATUS_WINDOW_MS,
};

function parsePulse(row: unknown): CompanionTelemetryPulse | null {
  if (!row || typeof row !== "object") return null;
  const data = row as Record<string, unknown>;
  const status = data.status;
  if (!isCompanionTelemetryStatus(status)) return null;
  const eventType =
    typeof data.event_type === "string"
      ? data.event_type
      : typeof data.eventType === "string"
        ? data.eventType
        : "system.pulse";
  const createdAtRaw = data.created_at ?? data.createdAt;
  const createdAt =
    typeof createdAtRaw === "string"
      ? createdAtRaw
      : createdAtRaw instanceof Date
        ? createdAtRaw.toISOString()
        : new Date().toISOString();
  const payload =
    data.payload && typeof data.payload === "object" && !Array.isArray(data.payload)
      ? (data.payload as Record<string, unknown>)
      : {};
  const detail =
    typeof data.detail === "string"
      ? data.detail
      : typeof payload.detail === "string"
        ? payload.detail
        : eventType;
  return {
    id: String(data.id ?? `${eventType}-${createdAt}`),
    status,
    source:
      typeof data.source === "string" ? data.source : companionSourceFromEventType(eventType),
    detail,
    eventType,
    shopId: typeof data.shop_id === "string" ? data.shop_id : typeof data.shopId === "string" ? data.shopId : null,
    createdAt,
  };
}

function parseSnapshotPayload(data: unknown): {
  snapshot: CompanionTelemetrySnapshot;
  pulses: CompanionTelemetryPulse[];
} {
  if (!data || typeof data !== "object") return { snapshot: IDLE, pulses: [] };
  const row = data as Record<string, unknown>;
  const pulsesRaw = Array.isArray(row.pulses) ? row.pulses : [];
  const pulses = pulsesRaw
    .map((item) => parsePulse(item))
    .filter((item): item is CompanionTelemetryPulse => Boolean(item));
  const snapshot: CompanionTelemetrySnapshot = {
    status: isCompanionTelemetryStatus(row.status) ? row.status : "idle",
    source: typeof row.source === "string" ? row.source : null,
    detail: typeof row.detail === "string" ? row.detail : null,
    eventType: typeof row.eventType === "string" ? row.eventType : null,
    shopId: typeof row.shopId === "string" ? row.shopId : null,
    updatedAt: typeof row.updatedAt === "string" ? row.updatedAt : null,
    windowMs: typeof row.windowMs === "number" ? row.windowMs : COMPANION_STATUS_WINDOW_MS,
  };
  if (pulses.length > 0) {
    return { snapshot: scoreCompanionStatus(pulses), pulses };
  }
  return { snapshot, pulses };
}

function prunePulses(pulses: CompanionTelemetryPulse[]): CompanionTelemetryPulse[] {
  const now = Date.now();
  const seen = new Set<string>();
  const next: CompanionTelemetryPulse[] = [];
  for (const pulse of pulses) {
    const at = Date.parse(pulse.createdAt);
    if (!Number.isFinite(at) || now - at > COMPANION_STATUS_WINDOW_MS) continue;
    if (seen.has(pulse.id)) continue;
    seen.add(pulse.id);
    next.push(pulse);
  }
  return next;
}

export function AxiomTelemetryProvider({
  children,
  shopId = null,
}: {
  children: ReactNode;
  shopId?: string | null;
}) {
  const [snapshot, setSnapshot] = useState<CompanionTelemetrySnapshot>(IDLE);
  const [loading, setLoading] = useState(true);
  const pulsesRef = useRef<CompanionTelemetryPulse[]>([]);

  const applyPulses = useCallback((pulses: CompanionTelemetryPulse[]) => {
    const next = prunePulses(pulses);
    pulsesRef.current = next;
    setSnapshot(scoreCompanionStatus(next));
  }, []);

  const refresh = useCallback(async () => {
    try {
      const qs = shopId ? `?shopId=${encodeURIComponent(shopId)}` : "";
      const res = await fetch(`/api/companion/telemetry${qs}`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) return;
      const parsed = parseSnapshotPayload(await res.json());
      if (parsed.pulses.length > 0) applyPulses(parsed.pulses);
      else setSnapshot(parsed.snapshot);
    } catch {
      /* keep last known hue */
    } finally {
      setLoading(false);
    }
  }, [applyPulses, shopId]);

  const pulseTest = useCallback(
    async (status: Exclude<CompanionTelemetryStatus, "idle">) => {
      const res = await masterDeskFetch("/api/companion/telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          detail: `Test ${status} pulse`,
          eventType: `desk-test.${status}`,
          shopId: shopId ?? undefined,
        }),
      });
      if (!res.ok) {
        const message = await res.text().catch(() => "");
        throw new Error(message.slice(0, 160) || `Pulse failed (${res.status})`);
      }
      const body = (await res.json()) as { snapshot?: unknown; pulse?: unknown };
      const fromSnapshot = body.snapshot ? parseSnapshotPayload(body.snapshot) : null;
      if (fromSnapshot?.pulses.length) {
        applyPulses(fromSnapshot.pulses);
        return;
      }
      const inserted = parsePulse(body.pulse);
      if (inserted) {
        applyPulses([inserted, ...pulsesRef.current]);
        return;
      }
      await refresh();
    },
    [applyPulses, refresh, shopId],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;

    const channelName = shopId
      ? `public:companion_telemetry_pulses:${shopId}`
      : "public:companion_telemetry_pulses";

    // No server-side shop filter: global (null shop_id) pulses must still reach tenant desks.
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "companion_telemetry_pulses",
        },
        (payload) => {
          const pulse = parsePulse(payload.new);
          if (!pulse) return;
          if (shopId && pulse.shopId && pulse.shopId !== shopId) return;
          applyPulses([pulse, ...pulsesRef.current]);
        },
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          void refresh();
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [applyPulses, refresh, shopId]);

  const value = useMemo<AxiomTelemetryContextValue>(
    () => ({
      status: snapshot.status,
      source: snapshot.source,
      detail: snapshot.detail,
      eventType: snapshot.eventType,
      shopId: snapshot.shopId,
      updatedAt: snapshot.updatedAt,
      loading,
      refresh,
      pulseTest,
    }),
    [snapshot, loading, refresh, pulseTest],
  );

  return <AxiomTelemetryContext.Provider value={value}>{children}</AxiomTelemetryContext.Provider>;
}

export function useAxiomTelemetry(): AxiomTelemetryContextValue {
  const ctx = useContext(AxiomTelemetryContext);
  if (!ctx) {
    return {
      status: "idle",
      source: null,
      detail: null,
      eventType: null,
      shopId: null,
      updatedAt: null,
      loading: false,
      refresh: async () => undefined,
      pulseTest: async () => undefined,
    };
  }
  return ctx;
}
