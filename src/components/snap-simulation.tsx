import { estimateRange, impactScore, quoteProfile } from "@/lib/axiom/storefront";
import type { ShopNiche } from "@/lib/axiom/types";
import { formatMoney } from "@/lib/utils";

export function SnapSimulation({
  niche,
  imageUrl,
  prices,
}: {
  niche: ShopNiche;
  imageUrl: string;
  prices: number[];
}) {
  const profile = quoteProfile(niche);
  const lane = profile.lanes[0];
  const range = lane ? estimateRange(prices, lane.multiplier) : null;
  const impact = range && lane ? impactScore(lane.multiplier, range.low, range.high) : 0;
  const after =
    range == null
      ? "Bracket ready"
      : range.low === range.high
        ? formatMoney(range.low)
        : `${formatMoney(range.low)}–${formatMoney(range.high)}`;

  return (
    <div className="mb-8">
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Snap-to-Fix · sample</p>
      <h2 className="mt-2 font-display text-3xl">Before the call. After the bracket.</h2>
      <p className="mt-2 max-w-lg text-sm text-muted">
        A sample for this niche. Their own photo stays on the device when they run the estimator below.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <figure className="overflow-hidden rounded-2xl bg-surface shadow-[0_0_0_1px_rgba(243,241,235,0.08)]">
          <img
            src={imageUrl}
            alt=""
            className="aspect-[4/3] w-full object-cover grayscale contrast-75 brightness-75"
          />
          <figcaption className="px-3 py-3 text-sm">
            <span className="text-muted">Before · </span>
            Unscoped
          </figcaption>
        </figure>
        <figure className="overflow-hidden rounded-2xl bg-surface shadow-[0_0_0_1px_rgba(46,230,214,0.45)]">
          <img src={imageUrl} alt="" className="aspect-[4/3] w-full object-cover" />
          <figcaption className="px-3 py-3 text-sm">
            <span className="text-muted">After · </span>
            {lane?.label ?? profile.heading}
            <span className="mt-1 block text-muted">
              Impact {impact} · {after}
            </span>
          </figcaption>
        </figure>
      </div>
    </div>
  );
}
