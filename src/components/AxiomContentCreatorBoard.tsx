"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  StorefrontLayoutProvider,
  THEMED_BACKGROUNDS,
  TRADE_FREQUENCIES,
  useStorefrontLayout,
} from "@/context/StorefrontLayoutContext";
import type { LayoutSlotId } from "@/lib/axiom/storefront-layout";
import { AXIOM_HUD_CYAN, AXIOM_HUD_OBSIDIAN } from "@/lib/axiom/visual-design";

function AcousticWaveform({ frequencyHz, active }: { frequencyHz: number; active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phaseRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;

    const resize = () => {
      const parent = canvas.parentElement;
      const w = parent?.clientWidth || 280;
      const h = 72;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "rgba(3,7,18,0.65)";
      ctx.fillRect(0, 0, w, h);

      const speed = active ? frequencyHz / 900 : 0.15;
      phaseRef.current += speed * 0.35;
      const amp = active ? 18 + Math.min(14, frequencyHz / 80) : 6;

      ctx.beginPath();
      for (let x = 0; x <= w; x += 2) {
        const n1 = Math.sin((x / w) * Math.PI * 6 + phaseRef.current);
        const n2 = Math.sin((x / w) * Math.PI * 13 - phaseRef.current * 1.4) * 0.35;
        const y = h / 2 + (n1 + n2) * amp;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = AXIOM_HUD_CYAN;
      ctx.lineWidth = 1.75;
      ctx.shadowColor = "rgba(34,211,238,0.55)";
      ctx.shadowBlur = active ? 12 : 4;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Secondary harmonic
      ctx.beginPath();
      for (let x = 0; x <= w; x += 3) {
        const y =
          h / 2 +
          Math.sin((x / w) * Math.PI * 10 - phaseRef.current * 1.8) * (amp * 0.45);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = "rgba(244,63,94,0.55)";
      ctx.lineWidth = 1;
      ctx.stroke();

      raf = window.requestAnimationFrame(draw);
    };
    raf = window.requestAnimationFrame(draw);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [frequencyHz, active]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full rounded-xl border border-cyan-500/25"
      aria-hidden
    />
  );
}

function ToastBanner({
  message,
  tone,
  onDismiss,
}: {
  message: string;
  tone: "success" | "error";
  onDismiss: () => void;
}) {
  useEffect(() => {
    const id = window.setTimeout(onDismiss, 4200);
    return () => window.clearTimeout(id);
  }, [onDismiss, message]);

  return (
    <div
      role="status"
      className={`fixed left-1/2 top-5 z-[80] max-w-md -translate-x-1/2 rounded-2xl border px-4 py-3 font-mono text-xs shadow-[0_0_40px_rgba(6,182,212,0.25)] backdrop-blur-xl ${
        tone === "success"
          ? "border-emerald-400/40 bg-emerald-950/90 text-emerald-200"
          : "border-rose-400/40 bg-rose-950/90 text-rose-200"
      }`}
    >
      // {message}
    </div>
  );
}

function BoardInner() {
  const {
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
  } = useStorefrontLayout();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editSlot, setEditSlot] = useState<{ slotId: LayoutSlotId; value: string } | null>(null);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);
  const slugId = useId();

  const activeSlotLabel = useMemo(
    () => slots.find((s) => s.id === activeSlotId)?.label ?? activeSlotId,
    [slots, activeSlotId],
  );

  const handleDeploy = async () => {
    const result = await deployStack();
    setToast({ message: result.message, tone: result.ok ? "success" : "error" });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    await uploadFiles(files);
    e.target.value = "";
    setToast({
      message: "Assets ingested — click a gallery tile to assign to the active slot.",
      tone: "success",
    });
  };

  if (!hydrated) {
    return (
      <div
        className="mx-auto w-full max-w-7xl rounded-3xl border border-cyan-500/20 p-10 font-mono text-xs text-cyan-400/70"
        style={{ backgroundColor: AXIOM_HUD_OBSIDIAN }}
      >
        Hydrating layout stack…
      </div>
    );
  }

  return (
    <div
      className="relative mx-auto w-full max-w-7xl rounded-3xl border border-cyan-500/20 p-6 font-sans text-white shadow-[0_0_50px_rgba(6,182,212,0.1)]"
      style={{ backgroundColor: AXIOM_HUD_OBSIDIAN }}
      data-axiom-content-creator=""
    >
      {toast ? (
        <ToastBanner
          message={toast.message}
          tone={toast.tone}
          onDismiss={() => setToast(null)}
        />
      ) : null}

      <span className="pointer-events-none absolute left-3 top-3 h-3 w-3 border-l border-t border-[#00f2fe]/70" aria-hidden />
      <span className="pointer-events-none absolute right-3 top-3 h-3 w-3 border-r border-t border-[#00f2fe]/70" aria-hidden />
      <span className="pointer-events-none absolute bottom-3 left-3 h-3 w-3 border-b border-l border-[#ff2a3d]/55" aria-hidden />
      <span className="pointer-events-none absolute bottom-3 right-3 h-3 w-3 border-b border-r border-[#ff2a3d]/55" aria-hidden />

      <div className="flex flex-col items-start justify-between gap-4 border-b border-cyan-500/20 pb-6 md:flex-row md:items-center">
        <div className="min-w-0 flex-1">
          <span className="rounded-full border border-cyan-500/40 bg-cyan-950/80 px-3 py-1 font-mono text-xs tracking-widest text-cyan-400">
            AXIOM // STOREFRONT LAYOUT & FREQUENCY ENGINE
          </span>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">
            Content Creator & Acoustic Calibration Board
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <label htmlFor={slugId} className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
              Tenant slug
            </label>
            <input
              id={slugId}
              value={shopSlug}
              onChange={(e) => setShopSlug(e.target.value.trim().toLowerCase() || "axiom-demo")}
              className="rounded-xl border border-cyan-500/30 bg-gray-900 px-3 py-1.5 font-mono text-xs text-cyan-100 outline-none focus:border-cyan-400"
            />
            <span className="font-mono text-[11px] text-slate-400">
              Active slot: <span className="text-cyan-300">{activeSlotLabel}</span>
            </span>
          </div>
        </div>

        <div className="flex w-full items-center gap-4 rounded-2xl border border-gray-800 bg-gray-900/80 p-4 md:w-auto">
          <div className="flex-1">
            <div className="mb-1.5 flex justify-between font-mono text-xs">
              <span className="text-gray-400">STOREFRONT READINESS</span>
              <span className="font-bold text-cyan-400">{completion}%</span>
            </div>
            <div className="h-2 w-48 overflow-hidden rounded-full bg-gray-800">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-500"
                style={{ width: `${completion}%` }}
              />
            </div>
          </div>
          <button
            type="button"
            disabled={!ready || deploying}
            onClick={() => void handleDeploy()}
            className={`rounded-xl px-4 py-2 font-mono text-xs font-bold tracking-wider transition-all ${
              ready && !deploying
                ? "cursor-pointer bg-cyan-500 text-gray-950 shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:bg-cyan-400"
                : "cursor-not-allowed bg-gray-800 text-gray-500"
            }`}
          >
            {deploying ? "DEPLOYING…" : "DEPLOY STACK"}
          </button>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Upload hub */}
          <div className="space-y-4 rounded-2xl border border-cyan-500/30 bg-gray-900/60 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-mono text-sm uppercase tracking-wider text-cyan-400">
                1. Asset & Image Upload Hub
              </h2>
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl bg-cyan-500 px-3 py-1.5 font-mono text-xs font-bold text-gray-950 shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all hover:bg-cyan-400 disabled:opacity-50"
              >
                {uploading ? "Uploading…" : "+ Upload Files"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => void handleUpload(e)}
              />
            </div>
            <p className="font-mono text-[11px] text-slate-400">
              Click a tile to assign it to the active blueprint slot (
              <span className="text-cyan-300">{activeSlotId}</span>). Prefer selecting a slot first.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-1 sm:grid-cols-4">
              {assets.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-800 py-6 font-mono text-xs text-gray-500">
                  No custom assets uploaded yet. Click upload above.
                </div>
              ) : (
                assets.map((asset, idx) => (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => {
                      assignAsset(activeSlotId, asset.url);
                      setToast({
                        message: `Assigned “${asset.name}” → ${activeSlotId}`,
                        tone: "success",
                      });
                    }}
                    className="group relative aspect-square cursor-pointer overflow-hidden rounded-xl border border-cyan-500/40 bg-gray-950 text-left"
                  >
                    {asset.mime.startsWith("video/") ? (
                      <video
                        src={asset.url}
                        muted
                        playsInline
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={asset.url} alt={asset.name} className="h-full w-full object-cover" />
                    )}
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/65 opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="font-mono text-[10px] text-cyan-300">Asset #{idx + 1}</span>
                      <span className="font-mono text-[9px] text-white/80">
                        {asset.remote ? "Supabase" : "Local"} · Assign
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Blueprint slots */}
          <div className="space-y-4">
            <h2 className="font-mono text-sm uppercase tracking-wider text-cyan-400">
              2. Webpage Blueprint Mapping
            </h2>
            <div className="space-y-3">
              {slots.map((slot) => {
                const isActive = activeSlotId === slot.id;
                return (
                  <div
                    key={slot.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setActiveSlotId(slot.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") setActiveSlotId(slot.id);
                    }}
                    className={`flex cursor-pointer flex-col items-start justify-between gap-4 rounded-2xl border p-4 transition-all sm:flex-row sm:items-center ${
                      isActive
                        ? "border-cyan-500 bg-cyan-500/10 shadow-[0_0_18px_rgba(6,182,212,0.15)]"
                        : "border-gray-800 bg-gray-900/60 hover:border-cyan-500/40"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-3 w-3 rounded-full ${
                          slot.status === "Empty"
                            ? "animate-pulse bg-red-500/80"
                            : "bg-emerald-400 shadow-[0_0_10px_#34d399]"
                        }`}
                      />
                      <div>
                        <span className="font-mono text-xs text-cyan-400/80">{slot.category}</span>
                        <h3 className="text-sm font-semibold text-white">{slot.label}</h3>
                        {isActive ? (
                          <span className="font-mono text-[9px] uppercase tracking-wider text-cyan-400">
                            Active assignment target
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex w-full items-center justify-end gap-3 sm:w-auto">
                      {slot.assignedAsset ? (
                        <span className="max-w-[180px] truncate rounded-xl border border-gray-700 bg-gray-800 px-3 py-1.5 font-mono text-xs text-gray-300">
                          {slot.assignedAsset.startsWith("blob:")
                            ? `Local upload · ${slot.category}`
                            : slot.assignedAsset}
                        </span>
                      ) : (
                        <span className="font-mono text-xs text-red-400">Unassigned</span>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditSlot({ slotId: slot.id, value: slot.assignedAsset || "" });
                          setActiveSlotId(slot.id);
                        }}
                        className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 font-mono text-xs text-cyan-400 transition-all hover:bg-cyan-500/20"
                      >
                        {slot.assignedAsset ? "Edit" : "Assign"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {editSlot ? (
            <div className="flex flex-col items-stretch gap-3 rounded-2xl border border-cyan-500/50 bg-cyan-950/40 p-4 sm:flex-row sm:items-center">
              <input
                type="text"
                placeholder="Enter filename or URL"
                value={
                  editSlot.value.startsWith("blob:")
                    ? ""
                    : editSlot.value
                }
                onChange={(e) => setEditSlot({ ...editSlot, value: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    assignAsset(editSlot.slotId, editSlot.value.trim() || null);
                    setEditSlot(null);
                    setToast({ message: `Slot ${editSlot.slotId} updated.`, tone: "success" });
                  }
                }}
                className="flex-1 rounded-xl border border-cyan-500/30 bg-gray-900 px-4 py-2 font-mono text-xs text-white focus:border-cyan-400 focus:outline-none"
                autoFocus
              />
              <button
                type="button"
                onClick={() => {
                  assignAsset(editSlot.slotId, editSlot.value.trim() || null);
                  setEditSlot(null);
                  setToast({ message: `Slot ${editSlot.slotId} updated.`, tone: "success" });
                }}
                className="rounded-xl bg-cyan-500 px-4 py-2 font-mono text-xs font-bold text-gray-950"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditSlot(null)}
                className="rounded-xl bg-gray-800 px-3 py-2 font-mono text-xs text-gray-400"
              >
                Cancel
              </button>
            </div>
          ) : null}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <div className="space-y-4 rounded-2xl border border-cyan-500/40 bg-gradient-to-br from-gray-900 via-gray-900 to-cyan-950/40 p-5 shadow-[0_0_30px_rgba(6,182,212,0.1)]">
            <div className="flex items-center justify-between">
              <h2 className="font-mono text-sm uppercase tracking-wider text-cyan-400">
                3. Acoustic Frequency Engine
              </h2>
              <span className="h-2.5 w-2.5 animate-ping rounded-full bg-emerald-400" />
            </div>

            <p className="font-mono text-xs leading-relaxed text-gray-300">
              <strong className="text-white">
                Axiom is drilling, hammering, cutting, and welding — matching each trade to a micro
                acoustic vibration frequency
              </strong>{" "}
              for real-time field telemetry and automated client responses.
            </p>

            <AcousticWaveform frequencyHz={activeTrade.frequencyHz} active />

            <div className="flex items-center justify-between font-mono text-[11px]">
              <span className="text-slate-400">Live resonance</span>
              <span className="text-cyan-300">
                {activeTrade.trade} · {activeTrade.frequencyLabel}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              {TRADE_FREQUENCIES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => selectTrade(t.id)}
                  className={`rounded-xl border p-2.5 text-left font-mono transition-all ${
                    activeTrade.id === t.id
                      ? "border-cyan-500 bg-cyan-500/20 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                      : "border-gray-800 bg-gray-900/60 text-gray-400 hover:border-gray-700"
                  }`}
                >
                  <div className="text-xs font-bold">{t.trade}</div>
                  <div className="text-[10px] text-cyan-400">{t.frequencyLabel}</div>
                  <div className="mt-1 text-[9px] uppercase tracking-wider text-slate-500">
                    {t.status}
                  </div>
                </button>
              ))}
            </div>

            <div className="max-h-36 space-y-1.5 overflow-y-auto rounded-xl border border-cyan-500/20 bg-[#030712]/70 p-2">
              <div className="font-mono text-[9px] uppercase tracking-wider text-slate-500">
                Vibration telemetry log
              </div>
              {acousticLog.map((entry) => (
                <div key={entry.id} className="font-mono text-[10px] leading-snug text-slate-300">
                  <span className="text-cyan-500/80">
                    {new Date(entry.at).toLocaleTimeString()} · {entry.frequencyHz}Hz
                  </span>
                  <br />
                  {entry.message}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-gray-800 bg-gray-900/60 p-5">
            <h2 className="font-mono text-sm uppercase tracking-wider text-cyan-400">
              4. Themed Background Video
            </h2>
            <div className="relative mb-2 overflow-hidden rounded-xl border border-cyan-500/20 bg-[#030712]">
              <div className={`absolute inset-0 bg-gradient-to-br ${selectedBg.previewColor}`} />
              <video
                key={selectedBg.videoUrl}
                className="relative z-[1] h-24 w-full object-cover opacity-80"
                src={selectedBg.videoUrl}
                muted
                loop
                playsInline
                autoPlay
                onError={(e) => {
                  (e.currentTarget as HTMLVideoElement).style.display = "none";
                }}
              />
            </div>
            <div className="space-y-2">
              {THEMED_BACKGROUNDS.map((bg) => (
                <button
                  key={bg.id}
                  type="button"
                  onClick={() => {
                    selectBackground(bg);
                    setToast({
                      message: `Hero portal optimized → ${bg.name}`,
                      tone: "success",
                    });
                  }}
                  className={`flex w-full cursor-pointer items-center justify-between rounded-xl border p-3 text-left transition-all ${
                    selectedBg.id === bg.id
                      ? "border-cyan-500 bg-cyan-500/10 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                      : "border-gray-800 bg-gray-900/40 hover:border-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-6 w-6 rounded-lg bg-gradient-to-br ${bg.previewColor}`} />
                    <span className="font-mono text-xs font-medium text-white">{bg.name}</span>
                  </div>
                  {selectedBg.id === bg.id ? (
                    <span className="rounded-md border border-cyan-500/30 bg-cyan-950 px-2 py-0.5 font-mono text-[10px] text-cyan-400">
                      ACTIVE
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AxiomContentCreatorBoard() {
  return (
    <StorefrontLayoutProvider>
      <BoardInner />
    </StorefrontLayoutProvider>
  );
}
