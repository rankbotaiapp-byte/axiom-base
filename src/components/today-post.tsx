import { useState } from "react";
import { todayFunnelPost } from "@/lib/axiom/server";
import { Button } from "@/components/ui/button";

export function TodayPost({ slug, disabled }: { slug: string; disabled?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [piece, setPiece] = useState<{ post: string; hashtags: string; pageUrl: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function generate() {
    if (disabled || busy) return;
    setBusy(true);
    setError(null);
    setCopied(false);
    try {
      const next = await todayFunnelPost({ data: { slug } });
      setPiece(next);
    } catch (err: unknown) {
      setPiece(null);
      setError(err instanceof Error ? err.message : "Could not write the post");
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!piece) return;
    await navigator.clipboard.writeText(`${piece.post}\n${piece.hashtags}\n${piece.pageUrl}`);
    setCopied(true);
  }

  return (
    <section className="today-post mt-8 rounded-2xl p-4">
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Today</p>
      <h3 className="mt-1 font-display text-2xl">Local post</h3>
      <p className="mt-2 text-sm text-muted">One click. Copy it. Post it.</p>
      <button type="button" className="today-post-go mt-4" disabled={disabled || busy} onClick={() => void generate()}>
        {busy ? "Writing" : "Get today’s post"}
      </button>
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      {piece ? (
        <div className="mt-4 grid gap-3">
          <p className="text-sm">{piece.post}</p>
          <p className="text-sm text-steel">{piece.hashtags}</p>
          <p className="break-all text-sm text-muted">{piece.pageUrl}</p>
          <Button type="button" variant="secondary" size="sm" onClick={() => void copy()}>
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
