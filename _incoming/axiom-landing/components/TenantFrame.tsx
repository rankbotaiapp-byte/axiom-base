"use client";

import { useEffect, useRef, useState } from "react";
import { applyBranding, type BrandSpec, type TenantBrand } from "@/lib/brand-inject";

/**
 * Full-screen tenant site: loads the purchased build and white-labels it with
 * the tenant's stored business name, phone and logo before revealing it.
 */
export default function TenantFrame({ src, spec, tenant }: { src: string; spec: BrandSpec; tenant: TenantBrand }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const cleanup = useRef<() => void>(() => {});

  useEffect(() => {
    const iframe = ref.current;
    if (!iframe) return;
    let reveal: number | undefined;

    const onLoad = () => {
      cleanup.current();
      const doc = iframe.contentDocument;
      if (!doc) return setReady(true);
      // Let the build hydrate first, then brand it — editing before hydration would be reverted.
      const win = iframe.contentWindow!;
      win.requestAnimationFrame(() =>
        win.requestAnimationFrame(() => {
          window.setTimeout(() => {
            try {
              cleanup.current = applyBranding(doc, spec, tenant);
            } finally {
              setReady(true);
            }
          }, 120);
        }),
      );
    };
    iframe.addEventListener("load", onLoad);
    if (iframe.contentDocument?.readyState === "complete" && iframe.contentDocument.URL !== "about:blank") onLoad();
    reveal = window.setTimeout(() => setReady(true), 4000); // never leave a blank screen
    return () => {
      iframe.removeEventListener("load", onLoad);
      window.clearTimeout(reveal);
      cleanup.current();
    };
  }, [spec, tenant]);

  return (
    <div className="fixed inset-0 bg-black">
      {!ready && (
        <div className="absolute inset-0 grid place-items-center">
          {tenant.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tenant.logo_url} alt={tenant.business_name} className="h-16 w-auto max-w-[60vw] animate-pulse object-contain" />
          ) : (
            <p className="animate-pulse font-display text-xl text-white/80">{tenant.business_name}</p>
          )}
        </div>
      )}
      <iframe
        ref={ref}
        src={src}
        title={tenant.business_name}
        className={`h-full w-full border-0 transition-opacity duration-500 ${ready ? "opacity-100" : "opacity-0"}`}
        allow="autoplay; fullscreen; accelerometer; gyroscope; microphone"
      />
    </div>
  );
}
