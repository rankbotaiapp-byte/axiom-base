"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { getBearerToken } from "@/lib/auth/client";
import { DEMO_NICHES, demoNicheById, type DemoNicheId } from "@/lib/axiom/demoNiches";
import { HERO_ANIMATOR_LABEL, heroAnimatorPrompt, type HeroAnimatorPreset } from "@/lib/axiom/hero-animator";

type GenerateResponse = {
  success?: boolean;
  pending?: boolean;
  requestId?: string;
  heroVideoUrl?: string;
  error?: string;
};

type StudioPreview = {
  plateUrl: string;
  tagline: string;
  prompt: string;
};

async function postIntro(body: FormData) {
  const token = getBearerToken();
  const res = await fetch("/api/admin/hero-studio/generate", {
    method: "POST",
    credentials: "include",
    headers: token ? { authorization: `Bearer ${token}` } : undefined,
    body,
  });
  const data = (await res.json()) as GenerateResponse;
  if (!res.ok || data.success === false) throw new Error(data.error || "The intro could not be made");
  return data;
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export default function HeroStudioUpload({
  shopId,
  readonly = false,
  initialTagline = "",
  onReady,
  onPreview,
  children,
}: {
  shopId: string;
  readonly?: boolean;
  initialTagline?: string;
  onReady?: (heroVideoUrl: string) => void;
  onPreview?: (preview: StudioPreview) => void;
  children?: ReactNode;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [plateUrl, setPlateUrl] = useState("");
  const [stylePreset, setStylePreset] = useState<HeroAnimatorPreset>("liquid_chrome");
  const [nicheId, setNicheId] = useState<DemoNicheId | "">("");
  const [tagline, setTagline] = useState(initialTagline);
  const [loading, setLoading] = useState(false);
  const [loadingNiche, setLoadingNiche] = useState<DemoNicheId | "">("");
  const fileRef = useRef<HTMLInputElement>(null);
  const plateRef = useRef("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const niche = demoNicheById(nicheId);
  const prompt = niche?.prompt ?? heroAnimatorPrompt(stylePreset);

  useEffect(() => {
    onPreview?.({ plateUrl, tagline, prompt });
  }, [onPreview, plateUrl, prompt, tagline]);

  function rememberPlate(next: string) {
    if (plateRef.current.startsWith("blob:")) URL.revokeObjectURL(plateRef.current);
    plateRef.current = next;
    setPlateUrl(next);
  }

  useEffect(() => {
    return () => {
      if (plateRef.current.startsWith("blob:")) URL.revokeObjectURL(plateRef.current);
    };
  }, []);

  async function loadNiche(id: DemoNicheId) {
    if (readonly || loading) return;
    const next = demoNicheById(id);
    if (!next) return;
    setLoadingNiche(id);
    setError(null);
    try {
      const res = await fetch(next.imageUrl);
      if (!res.ok) throw new Error("The sample still could not be loaded");
      const blob = await res.blob();
      const sample = new File([blob], `${next.id}.png`, { type: blob.type || "image/png" });
      setFile(sample);
      setNicheId(next.id);
      setStylePreset(next.substance);
      setTagline(next.tagline);
      if (fileRef.current) fileRef.current.value = "";
      rememberPlate(next.imageUrl);
      setStatus(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The sample still could not be loaded");
    } finally {
      setLoadingNiche("");
    }
  }

  function takeCustom(next: File | null) {
    if (!next || readonly || loading) return;
    setFile(next);
    setNicheId("");
    setStylePreset("liquid_chrome");
    setTagline(initialTagline);
    if (fileRef.current) fileRef.current.value = "";
    rememberPlate(URL.createObjectURL(next));
    setStatus(null);
    setError(null);
  }

  async function handleGenerate() {
    if (!file || readonly || loading) return;
    setLoading(true);
    setError(null);
    setStatus("Rendering the intro…");
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("preset", stylePreset);
      formData.append("tagline", tagline);
      formData.append("shopId", shopId);
      if (nicheId) formData.append("niche", nicheId);
      let data = await postIntro(formData);
      for (let attempt = 0; attempt < 24 && data.pending && data.requestId; attempt += 1) {
        await wait(4000);
        const poll = new FormData();
        poll.append("shopId", shopId);
        poll.append("requestId", data.requestId);
        poll.append("preset", stylePreset);
        poll.append("tagline", tagline);
        if (nicheId) poll.append("niche", nicheId);
        data = await postIntro(poll);
      }
      if (!data.heroVideoUrl) throw new Error("The intro is still rendering. Try again in a moment.");
      setStatus("The hero intro is on the shop.");
      onReady?.(data.heroVideoUrl);
    } catch (err) {
      setStatus(null);
      setError(err instanceof Error ? err.message : "The intro could not be made");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="hero-studio-stack">
      <div className="hero-showcase">
        <div>
          <h2 className="font-display text-2xl text-fg">Showcase</h2>
          <p className="mt-1 text-sm text-muted">
            Pick a niche or your own plate. The glass preview uses that still, line, and material.
          </p>
        </div>
        <div className="hero-showcase-row" role="list">
          {DEMO_NICHES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={nicheId === item.id ? "hero-showcase-card is-on" : "hero-showcase-card"}
              aria-pressed={nicheId === item.id}
              disabled={readonly || loading || loadingNiche !== ""}
              onClick={() => void loadNiche(item.id)}
            >
              <img src={item.imageUrl} alt="" />
              <span>{item.name}</span>
              <small>{HERO_ANIMATOR_LABEL[item.substance]}</small>
            </button>
          ))}
          <label className={file && !nicheId ? "hero-showcase-card is-on" : "hero-showcase-card"}>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={readonly || loading}
              onChange={(event) => takeCustom(event.target.files?.[0] ?? null)}
            />
            <span>Your photo</span>
            <small>{HERO_ANIMATOR_LABEL.liquid_chrome}</small>
          </label>
        </div>
      </div>
      {children}
      <div className="hero-studio-generate">
        {error ? <p className="text-sm text-muted">{error}</p> : null}
        {status ? <p className="text-sm text-accent">{status}</p> : null}
        <Button
          type="button"
          className="w-full"
          variant="accent"
          disabled={readonly || loading || !file}
          onClick={() => void handleGenerate()}
        >
          {loading ? "Rendering the intro" : "Generate Hero Animation"}
        </Button>
      </div>
    </div>
  );
}

export { HeroStudioUpload };
