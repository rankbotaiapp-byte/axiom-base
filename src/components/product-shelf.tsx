import { useMemo, useState } from "react";
import { formatMoney } from "@/lib/utils";
import type { ShelfItem } from "@/lib/axiom/storefront";

type CartLine = { id: string; qty: number };

export function ProductShelf({ items }: { items: ShelfItem[] }) {
  const [stock, setStock] = useState<Record<string, number>>(() =>
    Object.fromEntries(items.map((item) => [item.id, item.stock])),
  );
  const [cart, setCart] = useState<CartLine[]>([]);
  const [order, setOrder] = useState("");
  const [active, setActive] = useState(items[0]?.id ?? "");
  const focus = items.find((item) => item.id === active) ?? items[0];
  const count = cart.reduce((sum, line) => sum + line.qty, 0);
  const total = useMemo(
    () =>
      cart.reduce((sum, line) => {
        const item = items.find((entry) => entry.id === line.id);
        return sum + (item?.priceCents ?? 0) * line.qty;
      }, 0),
    [cart, items],
  );

  function add(item: ShelfItem, take: number) {
    const left = stock[item.id] ?? 0;
    const have = cart.find((line) => line.id === item.id)?.qty ?? 0;
    const next = Math.min(take, Math.max(0, left - have));
    if (next <= 0) return;
    setCart((lines) => {
      const row = lines.find((line) => line.id === item.id);
      if (!row) return [...lines, { id: item.id, qty: next }];
      return lines.map((line) => (line.id === item.id ? { ...line, qty: line.qty + next } : line));
    });
    setOrder("");
  }

  function buyNow() {
    if (count === 0 || !focus) return;
    setStock((current) => {
      const next = { ...current };
      for (const line of cart) next[line.id] = Math.max(0, (next[line.id] ?? 0) - line.qty);
      return next;
    });
    setCart([]);
    setOrder(`Order held for this visit · ${formatMoney(total)}. Nothing was charged.`);
  }

  if (!focus) return null;

  return (
    <section className="grid min-w-0 gap-6">
      <div className="lift-card min-w-0 overflow-hidden rounded-[28px] bg-surface/80 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]">
        <img src={focus.imageUrl} alt="" className="aspect-[4/3] w-full object-cover sm:aspect-[16/9]" />
        <div className="p-5 sm:p-6">
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted">{focus.attribute}</p>
          <h2 className="mt-2 break-words font-display text-3xl">{focus.name}</h2>
          <p className="mt-2 max-w-lg text-sm text-muted">{focus.description}</p>
        </div>
      </div>
      <ul className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
        {items.map((item) => {
          const left = stock[item.id] ?? 0;
          const inCart = cart.find((line) => line.id === item.id)?.qty ?? 0;
          const claim = left - inCart === 1;
          return (
            <li key={item.id} className="lift-card min-w-0 rounded-[24px] bg-surface/80 p-4 shadow-[0_0_0_1px_rgba(243,241,235,0.08)]">
              <button type="button" onClick={() => setActive(item.id)} className="block w-full text-left">
                <img src={item.imageUrl} alt="" className="aspect-[4/3] w-full rounded-2xl object-cover" />
                <p className="mt-3 break-words font-medium">{item.name}</p>
                <p className="text-sm text-muted">{item.attribute}</p>
                <p className="mt-1 text-sm text-muted">{left === 0 ? "Sold out" : `${left} in stock`}</p>
                <p className="mt-2 tabular text-sm">{formatMoney(item.priceCents)}</p>
              </button>
              <button
                type="button"
                disabled={left - inCart <= 0}
                onClick={() => add(item, 1)}
                className="glass-btn mt-3 h-11 w-full rounded-xl px-4 text-sm font-medium disabled:opacity-40"
              >
                {left - inCart <= 0 ? "Sold out" : claim ? "Claim item" : "Add to cart"}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">
          {count === 0 ? "Cart is empty." : `${count} in the cart · ${formatMoney(total)}`}
        </p>
        <button
          type="button"
          disabled={count === 0}
          onClick={buyNow}
          className="glass-btn h-12 rounded-xl px-5 text-sm font-medium disabled:opacity-40"
        >
          Buy now
        </button>
      </div>
      {order ? <p className="text-sm text-muted">{order}</p> : null}
    </section>
  );
}
