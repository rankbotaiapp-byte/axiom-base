"use client";

import React from "react";

export function DemoLeadInlay(_props?: {
  niche?: string;
  search?: unknown;
}) {
  return (
    <div className="rounded-xl border border-amber-500/30 bg-[#050507] p-4 text-white shadow-lg">
      <h4 className="mb-1 text-sm font-bold text-amber-400">Live 24/7 Booking Inlay</h4>
      <p className="text-xs text-gray-400">
        Emergency call captured, verified, and routed via Twilio &amp; Supabase.
      </p>
    </div>
  );
}

export default DemoLeadInlay;
