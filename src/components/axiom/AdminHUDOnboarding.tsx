"use client";

import { useState } from "react";
import { triggerHaptic } from "@/lib/axiom/haptics";

interface AdminHUDProps {
  shopName: string;
  shopSlug: string;
  initialProgress?: number;
}

export function AdminHUDOnboarding({ shopName, shopSlug, initialProgress = 25 }: AdminHUDProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [progress, setProgress] = useState(initialProgress);
  const [completedTasks, setCompletedTasks] = useState({
    published: true,
    jobPhoto: false,
    phoneAlerts: false,
    facebookShare: false,
  });

  const handleTaskToggle = (taskKey: keyof typeof completedTasks) => {
    triggerHaptic("success");
    setCompletedTasks((prev) => {
      const next = { ...prev, [taskKey]: !prev[taskKey] };
      const completedCount = Object.values(next).filter(Boolean).length;
      setProgress(Math.round((completedCount / Object.keys(next).length) * 100));
      return next;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-red-500/30 bg-field p-6 text-fg shadow-2xl shadow-red-500/10">
        <div className="absolute left-0 right-0 top-0 h-1 animate-pulse bg-gradient-to-r from-red-600 via-red-500 to-amber-500" />

        <div className="mb-4 flex items-start justify-between">
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-red-400">Axiom Tactical HUD</span>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-fg">Welcome to Your Command Center, {shopName}</h2>
          </div>
          <button
            type="button"
            onClick={() => {
              triggerHaptic("light");
              setIsOpen(false);
            }}
            className="rounded border border-white/10 bg-white/5 px-3 py-1 font-mono text-sm text-muted hover:text-fg"
          >
            SKIP TOUR [X]
          </button>
        </div>

        <p className="mb-6 text-sm text-muted">
          Your live storefront is deployed at <code className="font-mono text-red-400">useaxiom.io/{shopSlug}</code>. Complete your launch checklist below to unlock full lead automation.
        </p>

        <div className="mb-6 rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <div className="mb-2 flex justify-between font-mono text-sm">
            <span className="text-muted">Launch Readiness</span>
            <span className="font-bold text-red-400">{progress}% Complete</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-gradient-to-r from-red-600 to-amber-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="mb-6 space-y-3">
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/5 bg-white/[0.03] p-3 hover:border-red-500/30">
            <input
              type="checkbox"
              checked={completedTasks.jobPhoto}
              onChange={() => handleTaskToggle("jobPhoto")}
              className="h-4 w-4 rounded accent-red-500"
            />
            <div className="text-sm">
              <p className="font-semibold text-fg">Add Your First Job Site Photo</p>
              <p className="text-xs text-muted">Boosts local trust and conversion rates by up to 300%.</p>
            </div>
          </label>

          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/5 bg-white/[0.03] p-3 hover:border-red-500/30">
            <input
              type="checkbox"
              checked={completedTasks.phoneAlerts}
              onChange={() => handleTaskToggle("phoneAlerts")}
              className="h-4 w-4 rounded accent-red-500"
            />
            <div className="text-sm">
              <p className="font-semibold text-fg">Connect Twilio Lead Text Alerts</p>
              <p className="text-xs text-muted">Get instant SMS pings the second a customer requests a quote.</p>
            </div>
          </label>
        </div>

        <button
          type="button"
          onClick={() => {
            triggerHaptic("success");
            setIsOpen(false);
          }}
          className="w-full rounded-xl bg-gradient-to-r from-red-600 to-red-500 py-3 font-bold tracking-wide text-white shadow-lg shadow-red-600/30 transition-all hover:brightness-110"
        >
          ENTER STUDIO DASHBOARD
        </button>
      </div>
    </div>
  );
}
