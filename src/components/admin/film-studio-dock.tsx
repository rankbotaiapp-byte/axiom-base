import { useRef, useState } from "react";
import { catalogChoices } from "@/lib/axiom/hero-films";
import { HERO_VIDEO_MAX_BYTES } from "@/lib/axiom/hero-video";
import { updateShopBrand } from "@/lib/axiom/server";
import { writeHeroDraft } from "@/lib/axiom/hero-studio-state";
import { isShopNiche } from "@/lib/axiom/types";
import { getBearerToken } from "@/lib/auth/client";

export function FilmStudioDock({
  shopId,
  slug,
  niche,
  current,
  tagline = "",
  onFilm,
}: {
  shopId: string;
  slug: string;
  niche: string;
  current: string;
  tagline?: string;
  onFilm: (url: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const library = isShopNiche(niche) ? catalogChoices(niche) : [];
  const uploaded = current.startsWith("/api/hero-video/") || current.startsWith("blob:");
  const options = uploaded && !library.some((row) => row.url === current)
    ? [{ url: current, label: "Uploaded loop" }, ...library]
    : library;

  async function choose(url: string) {
    onFilm(url);
    setNote("");
    try {
      await updateShopBrand({ data: { slug, heroFilm: url, markHero: true } });
      try {
        writeHeroDraft(slug, { hero_video_url: url, tagline });
      } catch {
        /* The shop row already has the loop. */
      }
      setNote("Loop is live.");
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Could not save the loop");
    }
  }

  async function upload(file: File | undefined) {
    if (!file) return;
    const mp4 = file.type === "video/mp4" || file.name.toLowerCase().endsWith(".mp4");
    if (!mp4) {
      setNote("Upload an .mp4 file");
      return;
    }
    if (file.size > HERO_VIDEO_MAX_BYTES) {
      setNote("Video must be 12 MB or smaller");
      return;
    }
    const preview = URL.createObjectURL(file);
    onFilm(preview);
    setBusy(true);
    setNote("");
    try {
      const token = getBearerToken();
      const res = await fetch(`/api/hero-video/${shopId}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "content-type": "video/mp4",
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: file,
      });
      const json = (await res.json()) as { heroVideoUrl?: string; error?: string };
      if (!res.ok || !json.heroVideoUrl) throw new Error(json.error || "Upload failed");
      URL.revokeObjectURL(preview);
      onFilm(json.heroVideoUrl);
      try {
        writeHeroDraft(slug, { hero_video_url: json.heroVideoUrl, tagline });
      } catch {
        /* The upload route already stored this loop. */
      }
      setNote("Uploaded loop is live.");
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="film-admin-dock">
      <button type="button" className="studio-switch" disabled={busy} onClick={() => fileRef.current?.click()}>
        {busy ? "Uploading" : "Upload loop"}
      </button>
      <input
        ref={fileRef}
        className="sr-only"
        type="file"
        accept="video/mp4,.mp4"
        aria-label="Upload an mp4 background loop"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          void upload(file);
        }}
      />
      <select
        className="film-select"
        aria-label="Background loop"
        value={options.some((row) => row.url === current) ? current : ""}
        onChange={(event) => {
          if (event.target.value) void choose(event.target.value);
        }}
      >
        <option value="" disabled>
          Choose a loop
        </option>
        {options.map((row) => (
          <option key={row.url} value={row.url}>
            {row.label}
          </option>
        ))}
      </select>
      {note ? <p className="film-admin-note">{note}</p> : null}
    </div>
  );
}
