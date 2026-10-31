import { useState } from "react";
import { revalidateStorefront, updateShopBrand } from "@/lib/axiom/server";
import type { Shop } from "@/lib/axiom/types";

/** Master switch that arms branded still + loop generation from shop credits. */
export function AiContentAutopilotToggle({
  shop,
  readonly,
  onChange,
}: {
  shop: Shop;
  readonly: boolean;
  onChange?: (on: boolean) => void;
}) {
  const [on, setOn] = useState(Boolean(shop.aiContentAutopilot));
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  async function flip() {
    if (readonly || busy) return;
    const next = !on;
    setOn(next);
    setBusy(true);
    setNote("");
    try {
      const result = await updateShopBrand({
        data: { slug: shop.slug, aiContentAutopilot: next, markHero: true },
      });
      await revalidateStorefront({ data: shop.slug });
      onChange?.(next);
      setNote(result.aiHero?.detail || (next ? "Autopilot is armed." : "Autopilot is paused."));
    } catch (err) {
      setOn(!next);
      setNote(err instanceof Error ? err.message : "Could not save Autopilot");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="ai-auto-card" aria-label="Autopilot AI content generation">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        disabled={readonly || busy}
        className={on ? "mission-switch is-on is-master" : "mission-switch is-master"}
        onClick={() => void flip()}
      >
        <span>
          <span className="block text-sm text-fg">Autopilot AI Content Generation</span>
          <span className="mt-1 block text-sm text-muted">
            Uses locked Brand DNA and this shop’s AI credits to refresh the branded still and cinematic loop.
          </span>
        </span>
        <span className="mission-knob" aria-hidden />
      </button>
      {note ? <p className="motion-status">{note}</p> : null}
    </section>
  );
}
