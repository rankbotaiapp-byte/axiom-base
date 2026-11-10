"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MotionConfig } from "framer-motion";
import { ArsenalSection } from "./ArsenalSection";
import { FireTestOverlay } from "./FireTestOverlay";
import { HeroSection } from "./HeroSection";
import { ModdingSection } from "./ModdingSection";
import { PrecisionSection } from "./PrecisionSection";
import { SpecsModal } from "./SpecsModal";
import { playFireTest } from "./fireTestAudio";
import type { UpgradePackageId } from "./data";
import "./cyber-augment.css";

const FIRE_COOLDOWN_MS = 700;

export function CyberAugmentExperience() {
  const [burstKey, setBurstKey] = useState(0);
  const [firing, setFiring] = useState(false);
  const [specsOpen, setSpecsOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<UpgradePackageId>("full-chassis");
  const lastFire = useRef(0);
  const fireTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (fireTimer.current) clearTimeout(fireTimer.current);
  }, []);

  const handleFireTest = useCallback(() => {
    const now = Date.now();
    if (now - lastFire.current < FIRE_COOLDOWN_MS) return;
    lastFire.current = now;
    playFireTest();
    setBurstKey((k) => k + 1);
    setFiring(true);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.([30, 40, 30, 40, 30]);
    if (fireTimer.current) clearTimeout(fireTimer.current);
    fireTimer.current = setTimeout(() => setFiring(false), 650);
  }, []);

  const scrollToBooking = useCallback(() => {
    setSpecsOpen(false);
    // Wait a frame so the modal's scroll lock releases before scrolling.
    requestAnimationFrame(() => document.getElementById("book")?.scrollIntoView({ behavior: "smooth" }));
  }, []);

  const openSpecs = useCallback(() => setSpecsOpen(true), []);
  const closeSpecs = useCallback(() => setSpecsOpen(false), []);

  return (
    <MotionConfig reducedMotion="user">
      <div className="cyber-augment-root">
        <main className="relative overflow-x-clip bg-obsidian">
          <HeroSection
            burstKey={burstKey}
            glitching={firing}
            onFireTest={handleFireTest}
            onOpenSpecs={openSpecs}
            onBook={scrollToBooking}
          />
          <PrecisionSection />
          <ArsenalSection onBook={scrollToBooking} />
          <ModdingSection selectedPackage={selectedPackage} onSelectPackage={setSelectedPackage} />
        </main>
        <FireTestOverlay burstKey={burstKey} active={firing} />
        <SpecsModal open={specsOpen} onClose={closeSpecs} onBook={scrollToBooking} />
      </div>
    </MotionConfig>
  );
}
