"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  AcousticLogEntry,
  DEFAULT_SHOP_SLUG,
  INITIAL_SLOTS,
  LayoutSlot,
  LayoutSlotId,
  StorefrontLayoutConfig,
  THEMED_BACKGROUNDS,
  TRADE_FREQUENCIES,
  ThemedBackground,
  TradeFrequency,
  TradeFrequencyId,
  UploadedAsset,
  buildLayoutConfig,
  completionPercent,
  readLayoutFromStorage,
  slotStatusForAsset,
  tradeById,
  writeLayoutToStorage,
} from "@/lib/axiom/storefront-layout";

type StorefrontLayoutContextValue = {
  hydrated: boolean;
  shopSlug: string;
  setShopSlug: (slug: string) => void;
  slots: LayoutSlot[];
  assets: UploadedAsset[];
  selectedBg: ThemedBackground;
  activeTrade: TradeFrequency;
  activeSlotId: LayoutSlotId;
  setActiveSlotId: (id: LayoutSlotId) => void;
  acousticLog: AcousticLogEntry[];
  completion: number;
  ready: boolean;
  deploying: boolean;
  uploading: boolean;
  assignAsset: (slotId: LayoutSlotId, assetUrl: string | null) => void;
  selectBackground: (bg: ThemedBackground) => void;
  selectTrade: (id: TradeFrequencyId) => void;
  uploadFiles: (files: FileList | File[]) => Promise<void>;
  deployStack: () => Promise<{ ok: boolean; message: string }>;
  configSnapshot: StorefrontLayoutConfig;
};

const StorefrontLayoutContext = createContext<StorefrontLayoutContextValue | null>(null);

function pushLog(
  prev: AcousticLogEntry[],
  trade: TradeFrequency,
  message: string,
): AcousticLogEntry[] {
  const entry: AcousticLogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    at: new Date().toISOString(),
    trade: trade.trade,
    frequencyHz: trade.frequencyHz,
    message,
  };
  return [entry, ...prev].slice(0, 24);
}

function triggerTradeTactile(trade: TradeFrequency) {
  if (typeof window === "undefined") return;
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  const action = trade.orbAction;
  if (action === "hum") navigator.vibrate([15, 80, 15]);
  else if (action === "drill") navigator.vibrate([10, 15, 10, 15, 10, 15]);
  else if (action === "hammer") navigator.vibrate([140, 250, 140]);
  else navigator.vibrate(0);
}

export function StorefrontLayoutProvider({
  children,
  initialSlug = DEFAULT_SHOP_SLUG,
}: {
  children: ReactNode;
  initialSlug?: string;
}) {
  const [hydrated, setHydrated] = useState(false);
  const [shopSlug, setShopSlug] = useState(initialSlug);
  const [slots, setSlots] = useState<LayoutSlot[]>(INITIAL_SLOTS);
  const [assets, setAssets] = useState<UploadedAsset[]>([]);
  const [selectedBg, setSelectedBg] = useState<ThemedBackground>(THEMED_BACKGROUNDS[0]!);
  const [activeTradeId, setActiveTradeId] = useState<TradeFrequencyId>("cutting");
  const [activeSlotId, setActiveSlotId] = useState<LayoutSlotId>("slot-pow");
  const [acousticLog, setAcousticLog] = useState<AcousticLogEntry[]>([]);
  const [deploying, setDeploying] = useState(false);
  const [uploading, setUploading] = useState(false);

  const activeTrade = tradeById(activeTradeId);
  const completion = completionPercent(slots);
  const ready = completion === 100;

  useEffect(() => {
    const saved = readLayoutFromStorage();
    if (saved) {
      setShopSlug(saved.shopSlug || initialSlug);
      setSlots(saved.slots.length ? saved.slots : INITIAL_SLOTS);
      setAssets(saved.assets.filter((a) => a.url && !a.url.startsWith("blob:")));
      setActiveTradeId(saved.activeTradeId);
      const bg =
        THEMED_BACKGROUNDS.find((b) => b.id === saved.backgroundId) ||
        THEMED_BACKGROUNDS.find((b) => b.videoUrl === saved.backgroundUrl) ||
        THEMED_BACKGROUNDS[0]!;
      setSelectedBg(bg);
      setAcousticLog([
        {
          id: "log-restore",
          at: new Date().toISOString(),
          trade: tradeById(saved.activeTradeId).trade,
          frequencyHz: tradeById(saved.activeTradeId).frequencyHz,
          message: "Restored layout stack from local settings.",
        },
      ]);
    } else {
      setAcousticLog([
        {
          id: "log-boot",
          at: new Date().toISOString(),
          trade: "Cutting",
          frequencyHz: 850,
          message: "Axiom acoustic engine online — matching micro vibration frequency.",
        },
      ]);
    }
    setHydrated(true);
  }, [initialSlug]);

  const configSnapshot = useMemo(
    () =>
      buildLayoutConfig({
        shopSlug,
        background: selectedBg,
        activeTradeId,
        slots,
        assets,
      }),
    [shopSlug, selectedBg, activeTradeId, slots, assets],
  );

  useEffect(() => {
    if (!hydrated) return;
    writeLayoutToStorage(configSnapshot);
  }, [hydrated, configSnapshot]);

  const assignAsset = useCallback(
    (slotId: LayoutSlotId, assetUrl: string | null) => {
      setSlots((prev) =>
        prev.map((slot) =>
          slot.id === slotId
            ? {
                ...slot,
                assignedAsset: assetUrl,
                status: slotStatusForAsset(slotId, assetUrl, selectedBg.videoUrl),
              }
            : slot,
        ),
      );
      setActiveSlotId(slotId);
    },
    [selectedBg.videoUrl],
  );

  const selectBackground = useCallback((bg: ThemedBackground) => {
    setSelectedBg(bg);
    setSlots((prev) =>
      prev.map((slot) =>
        slot.id === "slot-hero"
          ? {
              ...slot,
              assignedAsset: bg.videoUrl,
              status: "Optimized",
            }
          : slot,
      ),
    );
  }, []);

  const selectTrade = useCallback((id: TradeFrequencyId) => {
    const trade = tradeById(id);
    setActiveTradeId(id);
    triggerTradeTactile(trade);
    setAcousticLog((prev) =>
      pushLog(
        prev,
        trade,
        `Axiom is ${trade.trade.toLowerCase()} — locked to ${trade.frequencyLabel} micro acoustic vibration.`,
      ),
    );
  }, []);

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files);
      if (!list.length) return;
      setUploading(true);
      try {
        const next: UploadedAsset[] = [];
        for (const file of list) {
          let url: string | null = null;
          let remote = false;
          try {
            const body = new FormData();
            body.append("file", file);
            body.append("slug", shopSlug);
            const res = await fetch("/api/storefront/assets", { method: "POST", body });
            const json = (await res.json()) as {
              ok?: boolean;
              remote?: boolean;
              url?: string | null;
            };
            if (json.ok && json.remote && json.url) {
              url = json.url;
              remote = true;
            }
          } catch {
            // fall through to local object URL
          }
          if (!url) {
            url = URL.createObjectURL(file);
            remote = false;
          }
          next.push({
            id: `asset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            name: file.name,
            url,
            mime: file.type || "application/octet-stream",
            remote,
            createdAt: new Date().toISOString(),
          });
        }
        setAssets((prev) => [...next, ...prev]);
        setAcousticLog((prev) =>
          pushLog(
            prev,
            activeTrade,
            `Ingested ${next.length} asset(s) into gallery (${next.filter((a) => a.remote).length} remote).`,
          ),
        );
      } finally {
        setUploading(false);
      }
    },
    [shopSlug, activeTrade],
  );

  const deployStack = useCallback(async () => {
    if (!ready) {
      return { ok: false, message: "Assign every blueprint slot before deploy." };
    }
    setDeploying(true);
    try {
      writeLayoutToStorage(configSnapshot);
      const res = await fetch("/api/storefront/layout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(configSnapshot),
      });
      const json = (await res.json()) as { ok?: boolean; target?: string; error?: string };
      if (!res.ok || !json.ok) {
        return { ok: false, message: json.error || "Deploy failed." };
      }
      const target = json.target || "local";
      setAcousticLog((prev) =>
        pushLog(
          prev,
          activeTrade,
          `Deploy stack synced (${target}) — ${activeTrade.trade} @ ${activeTrade.frequencyLabel}.`,
        ),
      );
      return {
        ok: true,
        message:
          target === "local"
            ? "Stack saved locally — Supabase unavailable, layout cached on device."
            : `Stack deployed to ${target}. Storefront layout is live.`,
      };
    } catch (err) {
      return {
        ok: false,
        message: err instanceof Error ? err.message : "Deploy failed.",
      };
    } finally {
      setDeploying(false);
    }
  }, [ready, configSnapshot, activeTrade]);

  const value: StorefrontLayoutContextValue = {
    hydrated,
    shopSlug,
    setShopSlug,
    slots,
    assets,
    selectedBg,
    activeTrade,
    activeSlotId,
    setActiveSlotId,
    acousticLog,
    completion,
    ready,
    deploying,
    uploading,
    assignAsset,
    selectBackground,
    selectTrade,
    uploadFiles,
    deployStack,
    configSnapshot,
  };

  return (
    <StorefrontLayoutContext.Provider value={value}>{children}</StorefrontLayoutContext.Provider>
  );
}

export function useStorefrontLayout(): StorefrontLayoutContextValue {
  const ctx = useContext(StorefrontLayoutContext);
  if (!ctx) {
    throw new Error("useStorefrontLayout must be used within StorefrontLayoutProvider");
  }
  return ctx;
}

export { TRADE_FREQUENCIES, THEMED_BACKGROUNDS };
