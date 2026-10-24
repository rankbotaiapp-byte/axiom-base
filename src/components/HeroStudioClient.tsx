import { useCallback, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { OrbGenesisHero } from "@/components/OrbGenesisHero";
import HeroStudioUpload from "@/components/HeroStudioUpload";
import type { Shop } from "@/lib/axiom/types";

type StudioPreview = {
  plateUrl: string;
  tagline: string;
  prompt: string;
};

export function HeroStudioClient({ shop, readonly }: { shop: Shop; readonly: boolean }) {
  const [film, setFilm] = useState<string | null>(null);
  const [preview, setPreview] = useState<StudioPreview>({
    plateUrl: "",
    tagline: shop.heroBrandingTagline,
    prompt: shop.heroPrompt,
  });
  const plateRef = useRef("");

  const onPreview = useCallback((next: StudioPreview) => {
    setPreview((prev) =>
      prev.plateUrl === next.plateUrl && prev.tagline === next.tagline && prev.prompt === next.prompt ? prev : next,
    );
    if (next.plateUrl !== plateRef.current) {
      plateRef.current = next.plateUrl;
      setFilm(null);
    }
  }, []);

  return (
    <div className="hero-studio">
      <header className="hero-studio-bar">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted">Hero studio</p>
          <h1 className="font-display text-4xl text-fg">{shop.name}</h1>
        </div>
        <Link to="/$shopSlug/admin" params={{ shopSlug: shop.slug }} className="hero-studio-back">
          Back to the desk
        </Link>
      </header>
      <HeroStudioUpload
        shopId={shop.id}
        readonly={readonly}
        initialTagline={shop.heroBrandingTagline}
        onPreview={onPreview}
        onReady={setFilm}
      >
        <div className="hero-studio-stage">
          {film ? (
            <video className="hero-studio-media" src={film} autoPlay muted loop playsInline />
          ) : (
            <OrbGenesisHero
              prompt={preview.prompt}
              tagline={preview.tagline}
              name={shop.name}
              plateUrl={preview.plateUrl}
              durationSec={5}
            />
          )}
          {preview.tagline ? <p className="hero-studio-caption font-display">{preview.tagline}</p> : null}
        </div>
      </HeroStudioUpload>
    </div>
  );
}
