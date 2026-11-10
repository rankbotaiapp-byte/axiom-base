"use client";

import { useEffect, useState, type ReactNode } from "react";
import { RippleButton } from "./RippleButton";
import { useFunnel } from "./FunnelProvider";

const LINKS = [
  { href: "#how", label: "How it works" },
  { href: "#proof", label: "Templates" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export default function Nav({ headerSlot }: { headerSlot?: ReactNode }) {
  const { startOnboarding } = useFunnel();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "border-b border-white/10 bg-ink/70 backdrop-blur-xl" : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <a href="#top" className="flex items-center gap-2.5 font-display text-lg font-bold tracking-[0.2em] text-white">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-ember to-copper text-sm text-ink shadow-[0_0_24px_-4px_rgb(224_138_60/0.8)]">
            A
          </span>
          AXIOM
        </a>
        <ul className="hidden items-center gap-8 text-sm text-mist md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="transition-colors hover:text-white">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-3">
          {headerSlot}
          <RippleButton variant="primary" className="!px-4 !py-2 text-sm" onClick={() => startOnboarding({ plan: "free-setup" })}>
            Free Setup
          </RippleButton>
        </div>
      </nav>
    </header>
  );
}
