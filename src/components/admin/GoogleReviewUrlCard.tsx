"use client";

import { useEffect, useState } from "react";

export function GoogleReviewUrlCard({ slug, readonly = false }: { slug: string; readonly?: boolean }) {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    let stop = false;
    void fetch(`/api/storefront/review-url?slug=${encodeURIComponent(slug)}`)
      .then(async (response) => (response.ok ? ((await response.json()) as { url?: string }) : { url: "" }))
      .then((json) => {
        if (!stop) setUrl(json.url || "");
      })
      .catch(() => undefined);
    return () => {
      stop = true;
    };
  }, [slug]);

  async function save() {
    setStatus("");
    const response = await fetch("/api/storefront/review-url", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug, url }),
    });
    const json = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string; url?: string };
    if (!response.ok) {
      setStatus(json.error || "Could not save.");
      return;
    }
    setUrl(json.url || "");
    setStatus(json.url ? "Saved. Text REVIEW plus a customer mobile to send the link." : "Cleared.");
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#00f2fe]">Google reviews · 1 tap</p>
      <p className="mt-2 text-sm text-white/70">
        Optional. After a job, text <code className="text-[#ffe500]">REVIEW 5415550148</code> to your Axiom number — or
        MMS a proof photo with that mobile in the caption.
      </p>
      <label className="mt-3 block text-xs uppercase tracking-[0.14em] text-white/50">
        Google review URL
        <input
          className="mt-1 w-full rounded-xl border border-white/10 bg-[#050507] px-3 py-2 text-sm text-[#f4f7fb] outline-none focus:border-[#00f2fe]"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://g.page/r/your-shop/review"
          disabled={readonly}
          inputMode="url"
        />
      </label>
      {readonly ? null : (
        <button
          type="button"
          className="mt-3 min-h-11 rounded-full bg-[#ffe500] px-4 text-sm font-semibold text-[#050507]"
          onClick={() => void save()}
        >
          Save review link
        </button>
      )}
      {status ? <p className="mt-2 text-sm text-[#00ffcc]">{status}</p> : null}
    </section>
  );
}
