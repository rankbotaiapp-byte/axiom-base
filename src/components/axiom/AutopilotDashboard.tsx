"use client";

import { useState } from "react";
import { Rocket, Zap } from "lucide-react";
import { triggerHaptic } from "@/lib/axiom/haptics";

interface SocialAccount {
  platform: "Google Business" | "Facebook" | "Instagram";
  connected: boolean;
  lastSync?: string;
}

export function AutopilotDashboard({ shopName }: { shopName: string }) {
  const [accounts, setAccounts] = useState<SocialAccount[]>([
    { platform: "Google Business", connected: true, lastSync: "Today at 8:00 AM" },
    { platform: "Facebook", connected: false },
    { platform: "Instagram", connected: false },
  ]);

  const handleConnect = (platformName: string) => {
    triggerHaptic("success");
    setAccounts((prev) =>
      prev.map((acc) =>
        acc.platform === platformName ? { ...acc, connected: true, lastSync: "Just now" } : acc,
      ),
    );
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6 text-fg">
      <div className="relative overflow-hidden rounded-2xl border border-red-500/30 bg-field p-6 shadow-2xl">
        <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-red-600 via-red-500 to-amber-500" />
        <span className="font-mono text-xs uppercase tracking-widest text-red-400">Autonomous Marketing</span>
        <h1 className="mt-1 text-3xl font-bold">Autopilot Command Center</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Let Axiom completely manage {shopName}&apos;s digital footprint. We create, optimize, and publish localized content daily across your website and connected social channels.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {accounts.map((acc) => (
          <div
            key={acc.platform}
            className="flex flex-col justify-between rounded-xl border border-white/10 bg-white/[0.02] p-5"
          >
            <div>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-lg font-bold">{acc.platform}</span>
                <span
                  className={`h-3 w-3 rounded-full ${acc.connected ? "bg-emerald-500 shadow-lg shadow-emerald-500/50" : "bg-gray-600"}`}
                />
              </div>
              <p className="mb-4 text-xs text-muted">
                {acc.connected
                  ? `Active & syncing. Last update: ${acc.lastSync}`
                  : "Not connected. Click below to grant publishing permissions."}
              </p>
            </div>
            {acc.connected ? (
              <span className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-center font-mono text-xs text-emerald-400">
                [ SECURED & RUNNING ]
              </span>
            ) : (
              <button
                type="button"
                onClick={() => handleConnect(acc.platform)}
                className="w-full rounded-lg bg-red-600 py-2.5 text-sm font-bold tracking-wide text-white shadow-md shadow-red-600/30 transition-all hover:bg-red-500"
              >
                CONNECT & AUTHORIZE
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-white/10 bg-field p-6">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
          <span className="h-2 w-2 animate-ping rounded-full bg-red-500" />
          Live Autopilot Activity Log
        </h3>
        <div className="space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between rounded border border-white/5 bg-white/[0.02] p-3">
            <span className="flex items-center gap-2 text-muted">
              <Zap className="h-3.5 w-3.5 text-red-400" aria-hidden />
              Published &quot;Emergency Service&quot; update to Google Business Profile
            </span>
            <span className="shrink-0 text-red-400">2h ago</span>
          </div>
          <div className="flex items-center justify-between rounded border border-white/5 bg-white/[0.02] p-3">
            <span className="flex items-center gap-2 text-muted">
              <Rocket className="h-3.5 w-3.5 text-red-400" aria-hidden />
              Generated and synced weekly project gallery to website
            </span>
            <span className="shrink-0 text-red-400">1d ago</span>
          </div>
        </div>
      </div>
    </div>
  );
}
