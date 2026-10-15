import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import {
  deleteMerchantPricing,
  listMerchantPricing,
  saveMerchantPricing,
} from "@/lib/axiom/merchant-pricing-api";
import { pricingLabel, type CollectionMode, type MerchantPrice, type MerchantPricingType } from "@/lib/axiom/merchant-pricing";
import { formatMoney } from "@/lib/utils";

const TYPES: { id: MerchantPricingType; label: string }[] = [
  { id: "flat", label: "Flat rate" },
  { id: "deposit", label: "Deposit" },
  { id: "package", label: "Package" },
];

export function PricingSettings({ slug, readonly }: { slug: string; readonly: boolean }) {
  const [rows, setRows] = useState<MerchantPrice[]>([]);
  const [serviceName, setServiceName] = useState("");
  const [pricingType, setPricingType] = useState<MerchantPricingType>("flat");
  const [priceAmount, setPriceAmount] = useState("");
  const [banner, setBanner] = useState("");
  const [collectionMode, setCollectionMode] = useState<CollectionMode>("online");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function load() {
    void listMerchantPricing({ data: slug })
      .then((result) => setRows(result.rows))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Prices could not load"));
  }

  useEffect(() => {
    load();
  }, [slug]);

  function edit(row: MerchantPrice) {
    setServiceName(row.serviceName);
    setPricingType(row.pricingType === "tiered" ? "package" : row.pricingType);
    setPriceAmount(String(row.priceAmount));
    setBanner(row.activeDealsBanner);
    setCollectionMode(row.collectionMode);
  }

  return (
    <div className="grid max-w-3xl gap-4">
      <div className="rounded-[24px] bg-surface p-5 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Pricing</p>
        <h2 className="mt-2 font-display text-3xl">Services, deposits, and deals</h2>
        <p className="mt-2 text-sm text-muted">
          These prices replace the menu amount on the public booking page. Online lines open card payment. In-person lines are collected at the visit.
        </p>
        <form
          className="mt-5 grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (readonly) return;
            setBusy(true);
            setError(null);
            void saveMerchantPricing({
              data: {
                slug,
                serviceName,
                pricingType,
                priceAmount: Number(priceAmount),
                activeDealsBanner: banner,
                collectionMode,
              },
            })
              .then(() => {
                setServiceName("");
                setPriceAmount("");
                setBanner("");
                load();
              })
              .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not save"))
              .finally(() => setBusy(false));
          }}
        >
          <div>
            <Label htmlFor="price-service">Service</Label>
            <Input id="price-service" value={serviceName} onChange={(event) => setServiceName(event.target.value)} required disabled={readonly} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="price-type">Structure</Label>
              <select
                id="price-type"
                className="mt-1 h-11 w-full rounded-xl bg-bg px-3 text-sm"
                value={pricingType}
                disabled={readonly}
                onChange={(event) => setPricingType(event.target.value as MerchantPricingType)}
              >
                {TYPES.map((type) => (
                  <option key={type.id} value={type.id}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="price-amount">Amount (USD)</Label>
              <Input id="price-amount" inputMode="decimal" value={priceAmount} onChange={(event) => setPriceAmount(event.target.value)} required disabled={readonly} />
            </div>
          </div>
          <div>
            <Label htmlFor="price-collect">Collection</Label>
            <select
              id="price-collect"
              className="mt-1 h-11 w-full rounded-xl bg-bg px-3 text-sm"
              value={collectionMode}
              disabled={readonly}
              onChange={(event) => setCollectionMode(event.target.value as CollectionMode)}
            >
              <option value="online">Upfront online</option>
              <option value="in_person">In person</option>
            </select>
          </div>
          <div>
            <Label htmlFor="price-banner">Deal banner</Label>
            <Input id="price-banner" value={banner} onChange={(event) => setBanner(event.target.value)} disabled={readonly} placeholder="Optional" />
          </div>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button type="submit" disabled={readonly || busy}>{busy ? "Saving" : "Save price"}</Button>
        </form>
      </div>
      <ul className="grid gap-2">
        {rows.length === 0 ? <li className="text-sm text-faint">No custom prices yet. The menu price is used.</li> : null}
        {rows.map((row) => (
          <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-surface p-4 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]">
            <div>
              <p className="font-medium">{row.serviceName}</p>
              <p className="text-sm text-muted">
                {pricingLabel(row.pricingType)} · {formatMoney(Math.round(row.priceAmount * 100))} · {row.collectionMode === "in_person" ? "In person" : "Online"}
              </p>
              {row.activeDealsBanner ? <p className="mt-1 text-sm text-copper">{row.activeDealsBanner}</p> : null}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" disabled={readonly} onClick={() => edit(row)}>Edit</Button>
              <Button
                type="button"
                variant="ghost"
                disabled={readonly}
                onClick={() => {
                  void deleteMerchantPricing({ data: { slug, id: row.id } }).then(load).catch((err: unknown) => {
                    setError(err instanceof Error ? err.message : "Could not remove");
                  });
                }}
              >
                Remove
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
