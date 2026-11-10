"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RunCycleButton({ slug }: { slug: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  return (
    <div className="flex items-center gap-3">
      {msg ? <span className="text-xs text-white/55">{msg}</span> : null}
      <button
        className="tb tb-ice"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          const res = await fetch(`/api/cron/content?slug=${encodeURIComponent(slug)}`);
          const data = (await res.json()) as { results?: { generated?: number; published?: number; error?: string }[] };
          const r = data.results?.[0];
          setMsg(r?.error ? `Error: ${r.error}` : `+${r?.generated ?? 0} queued · ${r?.published ?? 0} published`);
          setBusy(false);
          router.refresh();
        }}
      >
        <span className="tb-label">{busy ? "Running…" : "Run content cycle"}</span>
      </button>
    </div>
  );
}
