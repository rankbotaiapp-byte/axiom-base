"use client";

import { useEffect, useState } from "react";
import { getShowcase, showcaseSrc } from "@/lib/showcase";
import { useFunnel } from "./FunnelProvider";
import { RippleButton } from "./RippleButton";
import { buildPrice, fmt } from "@/lib/pricing";

export default function ShowcaseModal() {
  const { showcaseId, closeShowcase, startOnboarding } = useFunnel();
  const b = getShowcase(showcaseId);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => setLoaded(false), [showcaseId]);

  useEffect(() => {
    if (!b) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeShowcase();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [b, closeShowcase]);

  if (!b) return null;
  const src = showcaseSrc(b, b.entry);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black/85 backdrop-blur-sm" role="dialog" aria-modal aria-label={`${b.name} live demo`}>
      <div className="pop mx-auto flex h-full w-full max-w-[1600px] flex-col p-2 pb-[120px] sm:p-4 sm:pb-[100px]">
        <div className="mb-2 flex items-center justify-between gap-3 px-1">
          <div className="min-w-0">
            <p className="truncate font-display text-base font-semibold text-white sm:text-lg">
              <span className="mr-2 inline-block h-2 w-2 rounded-full align-middle" style={{ background: b.accent, boxShadow: `0 0 12px ${b.accent}` }} />
              {b.name} <span className="font-normal text-mist">· {b.niche}</span>
            </p>
            <p className="hidden truncate text-xs text-mist sm:block">Try it: {b.tryIt.join(" · ")}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <RippleButton
              variant="primary"
              className="!px-4 !py-2 text-sm"
              onClick={() => startOnboarding({ plan: "cinematic", templateId: b.id })}
            >
              Buy This — {fmt(buildPrice(b.price))}
            </RippleButton>
            <a
              href={src}
              target="_blank"
              rel="noopener"
              className="hidden rounded-full border border-white/15 px-3.5 py-2 text-sm text-mist transition hover:scale-105 hover:border-white/40 hover:text-white sm:inline-block"
            >
              Open full screen ↗
            </a>
            <button
              onClick={closeShowcase}
              className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-mist transition hover:scale-105 hover:border-white/40 hover:text-white"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        <div
          className="relative flex-1 overflow-hidden rounded-2xl border bg-ink"
          style={{ borderColor: `${b.accent}55`, boxShadow: `0 0 80px -30px ${b.accent}` }}
        >
          {!loaded && (
            <div className="absolute inset-0 grid place-items-center">
              <div className="flex flex-col items-center gap-3 text-sm text-mist">
                <span className="h-10 w-10 animate-spin rounded-full border-2 border-white/10" style={{ borderTopColor: b.accent }} />
                Loading live demo…
              </div>
            </div>
          )}
          <iframe
            key={b.id}
            src={src}
            title={`${b.name} live demo`}
            onLoad={() => setLoaded(true)}
            className={`h-full w-full transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
            allow="autoplay; fullscreen; accelerometer; gyroscope"
          />
        </div>
      </div>
    </div>
  );
}
