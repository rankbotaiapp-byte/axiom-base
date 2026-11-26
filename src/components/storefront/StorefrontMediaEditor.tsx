"use client";

import { CinematicMediaFrame } from "@/components/storefront/CinematicMediaFrame";
import { resolveCinemaGrade } from "@/lib/axiom/cinematic-media";
import type { BeforeAfterProject, TenantStorefrontConfig } from "@/lib/schemas/tenant";
import { uploadStorefrontAsset } from "@/lib/axiom/storefront-media";

const fieldClass = "mt-1 w-full rounded-xl border border-white/10 bg-[#050507] px-3 py-2 text-sm outline-none focus:border-[#00f2fe]";

type Props = {
  slug: string;
  draft: TenantStorefrontConfig;
  disabled?: boolean;
  onChange: (next: TenantStorefrontConfig) => void;
  onError: (message: string) => void;
  onBusy: (busy: boolean) => void;
};

function assignedHero(draft: TenantStorefrontConfig) {
  const media = draft.hero.media;
  return {
    posterUrl: media.assignedPosterUrl || media.posterUrl,
    videoUrl: media.assignedVideoUrl || media.videoUrl,
  };
}

export function StorefrontMediaEditor({ slug, draft, disabled, onChange, onError, onBusy }: Props) {
  const assigned = assignedHero(draft);

  async function pickHero(file: File | undefined) {
    if (!file) return;
    onBusy(true);
    onError("");
    try {
      const url = await uploadStorefrontAsset(slug, file, "hero");
      const video = /\.(mp4|webm)$/i.test(file.name) || file.type.startsWith("video/");
      onChange({
        ...draft,
        hero: {
          ...draft.hero,
          media: {
            ...draft.hero.media,
            assignedPosterUrl: assigned.posterUrl,
            assignedVideoUrl: assigned.videoUrl,
            kind: video ? "loop-video" : "image",
            posterUrl: video ? draft.hero.media.posterUrl : url,
            videoUrl: video ? url : undefined,
          },
        },
      });
    } catch (err) {
      onError(err instanceof Error ? err.message : "Hero upload did not finish.");
    } finally {
      onBusy(false);
    }
  }

  function resetHero() {
    onChange({
      ...draft,
      hero: {
        ...draft.hero,
        media: {
          ...draft.hero.media,
          kind: assigned.videoUrl ? "loop-video" : "image",
          posterUrl: assigned.posterUrl,
          videoUrl: assigned.videoUrl,
        },
      },
    });
  }

  async function pickProof(index: number, side: "beforeUrl" | "afterUrl", file: File | undefined) {
    if (!file) return;
    onBusy(true);
    onError("");
    try {
      const url = await uploadStorefrontAsset(slug, file, "proof");
      const projects = draft.projects.slice();
      projects[index] = { ...projects[index]!, [side]: url };
      onChange({ ...draft, projects });
    } catch (err) {
      onError(err instanceof Error ? err.message : "Proof upload did not finish.");
    } finally {
      onBusy(false);
    }
  }

  function moveProject(index: number, dir: -1 | 1) {
    const next = index + dir;
    if (next < 0 || next >= draft.projects.length) return;
    const projects = draft.projects.slice();
    const [row] = projects.splice(index, 1);
    projects.splice(next, 0, row!);
    onChange({ ...draft, projects });
  }

  function addProject() {
    const id = `proof-${Date.now().toString(36)}`;
    const placeholder = assigned.posterUrl;
    const row: BeforeAfterProject = {
      id,
      title: "New job photo",
      summary: "",
      beforeUrl: placeholder,
      afterUrl: placeholder,
    };
    onChange({ ...draft, projects: [...draft.projects, row].slice(0, 8) });
  }

  return (
    <div className="grid gap-4">
      <section className="rounded-xl border border-white/10 p-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#00f2fe]">Hero media slot</p>
        <p className="mt-1 text-sm text-white/60">Axiom-assigned loop stays until you upload your own MP4, WebM, JPG, PNG, or WebP.</p>
        <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-black/40">
          <CinematicMediaFrame
            cinemaGrade={resolveCinemaGrade(draft.theme.cinemaGrade, draft.hero.media.cinemaGrade)}
            className="aspect-video w-full"
          >
            {draft.hero.media.videoUrl ? (
              <video src={draft.hero.media.videoUrl} poster={draft.hero.media.posterUrl} className="aspect-video w-full object-cover" muted playsInline controls />
            ) : (
              <img src={draft.hero.media.posterUrl} alt="" className="aspect-video w-full object-cover" />
            )}
          </CinematicMediaFrame>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm text-white/70">
          <input
            type="checkbox"
            className="size-4 accent-[#00f2fe]"
            checked={resolveCinemaGrade(draft.theme.cinemaGrade, draft.hero.media.cinemaGrade)}
            disabled={disabled}
            onChange={(event) =>
              onChange({
                ...draft,
                hero: {
                  ...draft.hero,
                  media: { ...draft.hero.media, cinemaGrade: event.target.checked },
                },
              })
            }
          />
          Cinematic grade on this hero
        </label>
        <div className="mt-3 flex flex-wrap gap-2">
          <label className="inline-flex min-h-11 cursor-pointer items-center rounded-full border border-[#00f2fe] px-4 text-sm font-semibold text-[#00f2fe]">
            Upload hero
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
              className="sr-only"
              disabled={disabled}
              onChange={(event) => void pickHero(event.target.files?.[0])}
            />
          </label>
          <button
            type="button"
            disabled={disabled}
            onClick={resetHero}
            className="min-h-11 rounded-full border border-white/20 px-4 text-sm text-white/80"
          >
            Reset to Assigned Hero
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-white/10 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#00f2fe]">Proof of work</p>
            <p className="mt-1 text-sm text-white/60">Job photos only. Add, replace, reorder, or remove.</p>
          </div>
          <button
            type="button"
            disabled={disabled || draft.projects.length >= 8}
            onClick={addProject}
            className="min-h-11 rounded-full border border-white/20 px-4 text-sm text-white/80"
          >
            Add slot
          </button>
        </div>
        <div className="mt-3 grid gap-3">
          {draft.projects.map((project, index) => (
            <article key={project.id} className="grid gap-2 rounded-xl border border-white/10 p-3 sm:grid-cols-2">
              <label className="text-sm text-white/70 sm:col-span-2">
                Title
                <input
                  className={fieldClass}
                  value={project.title}
                  disabled={disabled}
                  onChange={(event) => {
                    const projects = draft.projects.slice();
                    projects[index] = { ...project, title: event.target.value };
                    onChange({ ...draft, projects });
                  }}
                />
              </label>
              {(["beforeUrl", "afterUrl"] as const).map((side) => (
                <label key={side} className="grid gap-2 text-sm text-white/70">
                  {side === "beforeUrl" ? "Before" : "After"}
                  <CinematicMediaFrame
                    cinemaGrade={resolveCinemaGrade(draft.theme.cinemaGrade, project.cinemaGrade)}
                    className="aspect-[4/3] w-full overflow-hidden rounded-lg"
                  >
                    <img src={project[side]} alt="" className="aspect-[4/3] w-full object-cover" />
                  </CinematicMediaFrame>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={disabled}
                    className="text-xs text-white/50 file:mr-2 file:rounded-full file:border file:border-white/20 file:bg-transparent file:px-3 file:py-1 file:text-white/80"
                    onChange={(event) => void pickProof(index, side, event.target.files?.[0])}
                  />
                </label>
              ))}
              <label className="flex items-center gap-2 text-sm text-white/70 sm:col-span-2">
                <input
                  type="checkbox"
                  className="size-4 accent-[#00f2fe]"
                  checked={resolveCinemaGrade(draft.theme.cinemaGrade, project.cinemaGrade)}
                  disabled={disabled}
                  onChange={(event) => {
                    const projects = draft.projects.slice();
                    projects[index] = { ...project, cinemaGrade: event.target.checked };
                    onChange({ ...draft, projects });
                  }}
                />
                Cinematic grade on this job
              </label>
              <div className="flex flex-wrap gap-2 sm:col-span-2">
                <button type="button" className="text-xs text-white/60" disabled={disabled} onClick={() => moveProject(index, -1)}>
                  Move up
                </button>
                <button type="button" className="text-xs text-white/60" disabled={disabled} onClick={() => moveProject(index, 1)}>
                  Move down
                </button>
                <button
                  type="button"
                  className="text-xs text-[#ff6b7a]"
                  disabled={disabled}
                  onClick={() => onChange({ ...draft, projects: draft.projects.filter((row) => row.id !== project.id) })}
                >
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
