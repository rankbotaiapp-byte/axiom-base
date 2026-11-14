import { useEffect, useState } from "react";
import { saveTradeProfile } from "@/lib/axiom/server";
import { CORD_LABEL, CORD_SIZES, layoutFor, linesToList, type CordSize, type TradeProfile } from "@/lib/axiom/trade-layout";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import type { Shop } from "@/lib/axiom/types";

export function TradeDesk({
  shop,
  readonly,
  onReload,
}: {
  shop: Shop;
  readonly: boolean;
  onReload: () => void;
}) {
  const layout = layoutFor(shop.niche);
  const [profile, setProfile] = useState<TradeProfile>(shop.tradeProfile);
  const [lists, setLists] = useState(() => listDraft(shop.tradeProfile));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setProfile(shop.tradeProfile);
    setLists(listDraft(shop.tradeProfile));
  }, [shop.tradeProfile]);

  function patch(next: Partial<TradeProfile>) {
    setProfile((current) => ({ ...current, ...next }));
  }

  return (
    <form
      className="max-w-xl rounded-[24px] bg-surface p-5 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]"
      onSubmit={(event) => {
        event.preventDefault();
        if (readonly) return;
        setBusy(true);
        setError(null);
        const next = {
          ...profile,
          species: linesToList(lists.species),
          cuts: linesToList(lists.cuts),
          dropZones: linesToList(lists.dropZones),
          kinds: linesToList(lists.kinds),
        };
        void saveTradeProfile({ data: { slug: shop.slug, profile: next } })
          .then(() => onReload())
          .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not save"))
          .finally(() => setBusy(false));
      }}
    >
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted">{layout.kicker}</p>
      <p className="mt-1 font-display text-3xl">This trade</p>
      <p className="mt-2 text-sm text-muted">These fields are what the public page shows for this niche.</p>
      {layout.fields.includes("cords") ? (
        <fieldset className="mt-5">
          <legend className="text-sm text-muted">Cord sizes on the page</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {CORD_SIZES.map((size) => {
              const on = profile.cords.includes(size);
              return (
                <button
                  key={size}
                  type="button"
                  aria-pressed={on}
                  disabled={readonly}
                  onClick={() => {
                    const cords = on ? profile.cords.filter((item) => item !== size) : [...profile.cords, size];
                    patch({ cords: cords.length ? cords : [size] });
                  }}
                  className="h-11 rounded-full bg-surface-2 px-4 text-sm disabled:opacity-40"
                  style={on ? { boxShadow: "0 0 0 1px var(--color-fg)" } : undefined}
                >
                  {CORD_LABEL[size as CordSize]}
                </button>
              );
            })}
          </div>
        </fieldset>
      ) : null}
      {layout.fields.includes("species") ? (
        <ListField
          id="trade-species"
          label="Wood species"
          value={lists.species}
          disabled={readonly}
          onChange={(species) => setLists((current) => ({ ...current, species }))}
        />
      ) : null}
      {layout.fields.includes("cuts") ? (
        <ListField
          id="trade-cuts"
          label="Cut lengths"
          value={lists.cuts}
          disabled={readonly}
          onChange={(cuts) => setLists((current) => ({ ...current, cuts }))}
        />
      ) : null}
      {layout.fields.includes("dropZones") ? (
        <ListField
          id="trade-zones"
          label="Drop zones"
          value={lists.dropZones}
          disabled={readonly}
          onChange={(dropZones) => setLists((current) => ({ ...current, dropZones }))}
        />
      ) : null}
      {layout.fields.includes("deliveryNote") ? (
        <NoteField
          id="trade-delivery"
          label="Delivery note"
          value={profile.deliveryNote}
          disabled={readonly}
          onChange={(deliveryNote) => patch({ deliveryNote })}
        />
      ) : null}
      {layout.fields.includes("kinds") ? (
        <ListField
          id="trade-kinds"
          label="Service types"
          value={lists.kinds}
          disabled={readonly}
          onChange={(kinds) => setLists((current) => ({ ...current, kinds }))}
        />
      ) : null}
      {layout.fields.includes("dispatchOn") ? (
        <div className="mt-5">
          <Label>Emergency dispatch</Label>
          <button
            type="button"
            aria-pressed={profile.dispatchOn}
            disabled={readonly}
            onClick={() => patch({ dispatchOn: !profile.dispatchOn })}
            className="mt-2 h-11 rounded-full bg-surface-2 px-4 text-sm disabled:opacity-40"
            style={profile.dispatchOn ? { boxShadow: "0 0 0 1px var(--color-fg)" } : undefined}
          >
            {profile.dispatchOn ? "Rolling" : "At the desk"}
          </button>
        </div>
      ) : null}
      {layout.fields.includes("responseMin") ? (
        <NumberField
          id="trade-response"
          label="Response target, minutes"
          value={profile.responseMin}
          disabled={readonly}
          onChange={(responseMin) => patch({ responseMin })}
        />
      ) : null}
      {layout.fields.includes("emergencyCents") ? (
        <NumberField
          id="trade-emergency"
          label="Emergency rate, dollars"
          value={Math.round(profile.emergencyCents / 100)}
          disabled={readonly}
          onChange={(dollars) => patch({ emergencyCents: dollars * 100 })}
        />
      ) : null}
      {layout.fields.includes("radiusMiles") ? (
        <NumberField
          id="trade-radius"
          label="Service radius, miles"
          value={profile.radiusMiles}
          disabled={readonly}
          onChange={(radiusMiles) => patch({ radiusMiles })}
        />
      ) : null}
      {layout.fields.includes("partyMax") ? (
        <NumberField
          id="trade-party"
          label="Group size"
          value={profile.partyMax}
          disabled={readonly}
          onChange={(partyMax) => patch({ partyMax })}
        />
      ) : null}
      {layout.fields.includes("note") ? (
        <NoteField
          id="trade-note"
          label="Note on the public page"
          value={profile.note}
          disabled={readonly}
          onChange={(note) => patch({ note })}
        />
      ) : null}
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      <Button type="submit" className="mt-5" disabled={readonly || busy}>
        {busy ? "Saving" : "Save trade"}
      </Button>
    </form>
  );
}

function listDraft(profile: TradeProfile) {
  return {
    species: profile.species.join("\n"),
    cuts: profile.cuts.join("\n"),
    dropZones: profile.dropZones.join("\n"),
    kinds: profile.kinds.join("\n"),
  };
}

function ListField({
  id,
  label,
  value,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="mt-5">
      <Label htmlFor={id}>{label}</Label>
      <textarea
        id={id}
        disabled={disabled}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        className="mt-2 w-full rounded-xl bg-surface-2 px-3 py-2 text-sm text-fg shadow-[0_0_0_1px_rgba(243,241,235,0.08)]"
      />
      <p className="mt-1 text-xs text-faint">One per line.</p>
    </div>
  );
}

function NoteField({
  id,
  label,
  value,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="mt-5">
      <Label htmlFor={id}>{label}</Label>
      <textarea
        id={id}
        disabled={disabled}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        className="mt-2 w-full rounded-xl bg-surface-2 px-3 py-2 text-sm text-fg shadow-[0_0_0_1px_rgba(243,241,235,0.08)]"
      />
    </div>
  );
}

function NumberField({
  id,
  label,
  value,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  disabled: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <div className="mt-5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        min={0}
        disabled={disabled}
        value={Number.isFinite(value) ? String(value) : ""}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}
