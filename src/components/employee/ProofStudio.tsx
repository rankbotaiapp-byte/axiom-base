import { useState } from "react";
import {
  addPortfolioItem,
  listStaffPortfolio,
  removePortfolioItem,
  updateStaffAvatar,
} from "@/lib/axiom/server";
import type { Employee, PortfolioItem } from "@/lib/axiom/types";
import { Input, Label } from "@/components/ui/input";

async function compress(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.8);
}

export function ProofStudio({
  slug,
  employee,
  gallery,
  onGallery,
  onAvatar,
  readonly,
}: {
  slug: string;
  employee: Employee;
  gallery: PortfolioItem[];
  onGallery: (items: PortfolioItem[]) => void;
  onAvatar?: (url: string) => void;
  readonly: boolean;
}) {
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  async function refresh() {
    try {
      onGallery(await listStaffPortfolio({ data: { slug } }));
    } catch {
      /* Public getPortfolio only returns approved stills. Keep this desk on staff rows. */
    }
  }

  async function onProof(file: File | undefined) {
    if (!file || readonly) return;
    setBusy(true);
    setNote("");
    try {
      const imageUrl = await compress(file);
      await addPortfolioItem({
        data: { slug, imageUrl, caption, tags, employeeId: employee.id },
      });
      setCaption("");
      setTags("");
      setNote("Queued for the owner. Approved stills land on the public page.");
      await refresh();
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function onPortrait(file: File | undefined) {
    if (!file || readonly) return;
    setBusy(true);
    setNote("");
    try {
      const imageUrl = await compress(file);
      await updateStaffAvatar({ data: { slug, imageUrl, employeeId: employee.id } });
      onAvatar?.(imageUrl);
      setNote("Profile still updated.");
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Portrait failed");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (readonly) return;
    setBusy(true);
    try {
      await removePortfolioItem({ data: { slug, id } });
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  const mine = gallery.filter((item) => !item.employeeId || item.employeeId === employee.id);

  return (
    <section className="mt-12 pb-16">
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Proof of work</p>
      <h2 className="mt-2 font-display text-3xl">Your studio</h2>
      <p className="mt-2 max-w-xl text-sm text-muted">
        Portrait and job stills stay on your station. The shop owner approves what the public page shows.
      </p>

      <div className="mt-6 flex items-center gap-4">
        <img
          src={employee.avatarUrl || ""}
          alt=""
          className="size-20 rounded-2xl bg-surface object-cover shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-fg)_10%,transparent)]"
        />
        <label className="inline-flex h-11 cursor-pointer items-center rounded-xl bg-fg px-4 text-sm font-medium text-bg">
          {busy ? "Saving…" : "Update portrait"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={readonly || busy}
            onChange={(event) => void onPortrait(event.target.files?.[0])}
          />
        </label>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {mine.map((item) => (
          <figure key={item.id} className="overflow-hidden rounded-2xl bg-surface">
            <img src={item.imageUrl} alt="" className="aspect-[4/3] w-full object-cover" />
            <figcaption className="space-y-1 px-3 py-2">
              <p className="text-xs text-muted">{item.caption || "Untitled"}</p>
              <p className="text-[11px] uppercase tracking-[0.14em] text-faint">
                {item.status === "approved" ? "approved" : "pending"}
                {item.featured ? " · featured" : ""}
              </p>
              {item.tags?.length ? <p className="text-xs text-muted">{item.tags.join(" · ")}</p> : null}
              <button
                type="button"
                className="h-11 text-sm text-muted hover:text-fg"
                disabled={readonly || busy}
                onClick={() => void remove(item.id)}
              >
                Remove
              </button>
            </figcaption>
          </figure>
        ))}
      </div>

      <form className="mt-6 max-w-sm" onSubmit={(event) => event.preventDefault()}>
        <Label htmlFor="proof-cap">Caption</Label>
        <Input id="proof-cap" value={caption} onChange={(event) => setCaption(event.target.value)} />
        <Label htmlFor="proof-tags" className="mt-3">
          Tags
        </Label>
        <Input
          id="proof-tags"
          value={tags}
          onChange={(event) => setTags(event.target.value)}
          placeholder="fade, color, sleeve"
        />
        <label className="mt-3 flex h-11 cursor-pointer items-center justify-center rounded-xl bg-fg text-sm font-medium text-bg">
          {busy ? "Uploading…" : "Upload proof"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={readonly || busy}
            onChange={(event) => void onProof(event.target.files?.[0])}
          />
        </label>
        {note ? <p className="mt-2 text-sm text-muted">{note}</p> : null}
        {readonly ? <p className="mt-2 text-xs text-faint">Preview only on the demo shop.</p> : null}
      </form>
    </section>
  );
}
