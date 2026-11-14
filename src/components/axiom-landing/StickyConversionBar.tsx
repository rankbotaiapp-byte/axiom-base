"use client";

import { useEffect, useState } from "react";
import { demoName } from "@/lib/axiom-landing/demos";
import { getShowcase } from "@/lib/axiom-landing/showcase";
import { buildPrice } from "@/lib/axiom-landing/pricing";
import { PRICING, fmt } from "@/lib/axiom-landing/pricing";
import { RippleButton } from "./RippleButton";
import { useFunnel } from "./FunnelProvider";

/**
 * Glassmorphic conversion anchor.
 * Appears while the Proof-of-Work section is on screen or a demo is open,
 * and LOCKS ON for the rest of the visit once any demo has been opened.
 */
export default function StickyConversionBar() {
  const { stickyLocked, previewId, showcaseId, selectedTemplateId, wizardOpen, startOnboarding } = useFunnel();
  const [proofInView, setProofInView] = useState(false);

  useEffect(() => {
    const el = document.getElementById("proof");
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setProofInView(e.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const visible = !wizardOpen && (stickyLocked || proofInView || !!previewId || !!showcaseId);

  // Reserve space so the bar never covers the footer.
  useEffect(() => {
    document.body.style.paddingBottom = visible ? "112px" : "";
    return () => {
      document.body.style.paddingBottom = "";
    };
  }, [visible]);

  if (!visible) return null;
  const id = previewId ?? showcaseId ?? selectedTemplateId;
  const name = demoName(id);
  const build = getShowcase(id);

  return (
    <div
      className="slide-up glass fixed bottom-[max(12px,env(safe-area-inset-bottom))] left-1/2 z-[70] w-[calc(100%-20px)] max-w-4xl rounded-2xl p-2.5 shadow-[0_20px_60px_-10px_rgb(0_0_0/0.8)] sm:rounded-full sm:p-2"
      role="region"
      aria-label="Get started"
      data-sample-color="#e08a3c"
    >
      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        <div className="hidden min-w-0 flex-1 items-center gap-2.5 pl-3 lg:flex">
          <span className="pulse-dot h-2 w-2 shrink-0 rounded-full bg-[#7cf0c5]" />
          <p className="truncate text-sm text-mist">
            {name ? (
              <>
                Viewing <span className="font-semibold text-white">{name}</span>
              </>
            ) : (
              "Your back office, live in minutes"
            )}
          </p>
        </div>
        {build ? (
        <div className="grid grid-cols-2 gap-2 sm:flex sm:w-full sm:justify-center lg:w-auto">
          <RippleButton
            variant="ghost"
            className="!px-3 !py-3 text-[13px] sm:!px-5 sm:text-sm"
            onClick={() => startOnboarding({ plan: "free-setup", templateId: build.id })}
          >
            Talk to us first
          </RippleButton>
          <RippleButton
            variant="primary"
            className="!px-3 !py-3 text-[13px] sm:!px-5 sm:text-sm"
            onClick={() => startOnboarding({ plan: "cinematic", templateId: build.id })}
          >
            Make this mine — {fmt(buildPrice(build.price))}
          </RippleButton>
        </div>
        ) : (
        <div className="grid grid-cols-2 gap-2 sm:flex sm:w-full sm:justify-center lg:w-auto">
          <RippleButton
            variant="ghost"
            className="!px-3 !py-3 text-[13px] sm:!px-5 sm:text-sm"
            onClick={() => startOnboarding({ plan: "free-setup", templateId: name ? id : null })}
          >
            Use This Template For My Business
          </RippleButton>
          <RippleButton
            variant="primary"
            className="!px-3 !py-3 text-[13px] sm:!px-5 sm:text-sm"
            onClick={() => startOnboarding({ plan: "lifetime", templateId: name ? id : null })}
          >
            Own it forever — {fmt(PRICING.lifetime.price)}
          </RippleButton>
        </div>
        )}
      </div>
    </div>
  );
}
