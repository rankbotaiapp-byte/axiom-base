import { useEffect, useState } from "react";
import { listStaffPortfolio, moderatePortfolioItem, revalidateStorefront, updateStaffAvatar } from "@/lib/axiom/server";
import type { Employee, PortfolioItem, Shop } from "@/lib/axiom/types";

export function EmployeeOversight({
  shop,
  employees,
  readonly,
  onReload,
}: {
  shop: Shop;
  employees: Employee[];
  readonly: boolean;
  onReload?: () => void;
}) {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  async function load() {
    try {
      setItems(await listStaffPortfolio({ data: { slug: shop.slug } }));
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Could not load staff uploads");
    }
  }

  useEffect(() => {
    void load();
  }, [shop.slug]);

  async function act(id: string, patch: Parameters<typeof moderatePortfolioItem>[0]["data"]) {
    if (readonly) return;
    setBusy(true);
    setNote("");
    try {
      await moderatePortfolioItem({ data: { ...patch, slug: shop.slug, id } });
      try {
        await revalidateStorefront({ data: shop.slug });
      } catch {
        /* public gallery refreshes on the next fetch */
      }
      await load();
      onReload?.();
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Could not update that still");
    } finally {
      setBusy(false);
    }
  }

  async function portrait(employeeId: string, file: File | undefined) {
    if (!file || readonly) return;
    setBusy(true);
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 800 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas");
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      await updateStaffAvatar({
        data: { slug: shop.slug, employeeId, imageUrl: canvas.toDataURL("image/jpeg", 0.82) },
      });
      onReload?.();
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Portrait failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Staff & portfolio oversight</p>
      <h2 className="mt-1 font-display text-3xl text-fg">Every still on the book</h2>
      <p className="mt-2 max-w-xl text-sm text-muted">
        Approve, feature, reorder, or delete staff uploads. Featured work leads the public proof gallery.
      </p>
      {note ? <p className="mt-3 text-sm text-muted">{note}</p> : null}

      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {employees.map((person) => (
          <li key={person.id} className="flex items-center gap-3 rounded-2xl bg-surface p-3">
            <img src={person.avatarUrl || ""} alt="" className="size-14 rounded-xl object-cover bg-surface-2" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-fg">{person.displayName}</p>
              <p className="text-xs text-muted">{person.title}</p>
            </div>
            <label className="inline-flex h-11 cursor-pointer items-center rounded-xl px-3 text-sm text-muted hover:text-fg">
              Portrait
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={readonly || busy}
                onChange={(event) => void portrait(person.id, event.target.files?.[0])}
              />
            </label>
          </li>
        ))}
      </ul>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
        {items.map((item, index) => (
          <figure key={item.id} className="overflow-hidden rounded-2xl bg-surface">
            <img src={item.imageUrl} alt="" className="aspect-[4/3] w-full object-cover" />
            <figcaption className="space-y-2 p-3">
              <p className="text-sm text-fg">{item.employeeName || "Staff"}</p>
              <p className="text-xs text-muted">{item.caption || "Untitled"}</p>
              <p className="text-[11px] uppercase tracking-[0.14em] text-faint">
                {item.status ?? "pending"}
                {item.featured ? " · featured" : ""}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="h-11 rounded-xl px-3 text-sm text-muted hover:text-fg"
                  disabled={readonly || busy}
                  onClick={() => void act(item.id, { slug: shop.slug, id: item.id, status: "approved" })}
                >
                  Approve
                </button>
                <button
                  type="button"
                  className="h-11 rounded-xl px-3 text-sm text-muted hover:text-fg"
                  disabled={readonly || busy}
                  onClick={() => void act(item.id, { slug: shop.slug, id: item.id, featured: !item.featured })}
                >
                  {item.featured ? "Unfeature" : "Feature"}
                </button>
                <button
                  type="button"
                  className="h-11 rounded-xl px-3 text-sm text-muted hover:text-fg"
                  disabled={readonly || busy || index === 0}
                  onClick={() =>
                    void act(item.id, { slug: shop.slug, id: item.id, sortOrder: Math.max(0, (item.sortOrder ?? index) - 1) })
                  }
                >
                  Up
                </button>
                <button
                  type="button"
                  className="h-11 rounded-xl px-3 text-sm text-danger hover:text-fg"
                  disabled={readonly || busy}
                  onClick={() => void act(item.id, { slug: shop.slug, id: item.id, remove: true })}
                >
                  Delete
                </button>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
      {items.length === 0 ? <p className="mt-4 text-sm text-muted">No staff stills yet.</p> : null}
    </section>
  );
}
