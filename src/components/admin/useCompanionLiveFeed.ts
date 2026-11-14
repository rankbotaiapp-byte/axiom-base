import { useCallback, useEffect, useRef, useState } from "react";
import {
  companionAnnouncement,
  companionPulseFromNotice,
  type CompanionPulse,
} from "@/lib/axiom/companion-archetypes";
import { companionPulseSpeak } from "@/lib/axiom/companion-comms";
import { getOperatorData } from "@/lib/axiom/server";
import type { CompanionEnvironment } from "@/lib/axiom/companion-archetypes";

export type CompanionChatLine = {
  id: string;
  role: "sys" | "ops";
  text: string;
};

export function useCompanionLiveFeed(input: {
  enabled: boolean;
  environment: CompanionEnvironment;
  shopSlug: string;
  shopName: string;
  city: string;
  niche?: string | null;
  poll?: boolean;
  voice?: boolean;
}) {
  const [lines, setLines] = useState<CompanionChatLine[]>([]);
  const seen = useRef(new Set<string>());
  const primed = useRef(false);

  useEffect(() => {
    seen.current.clear();
    primed.current = false;
    setLines([]);
  }, [input.shopSlug]);

  useEffect(() => {
    if (!input.enabled) return;

    const onWindowPulse = (event: Event) => {
      const detail = (event as CustomEvent<{ pulse?: CompanionPulse; text?: string; id?: string }>).detail;
      const pulse = detail?.pulse;
      const text =
        detail?.text ||
        (pulse ? companionAnnouncement(pulse, { shopName: input.shopName, city: input.city, niche: input.niche }) : "");
      if (!text) return;
      const id = detail?.id || `evt-${Date.now()}`;
      if (seen.current.has(id)) return;
      seen.current.add(id);
      setLines((rows) => [...rows.slice(-8), { id, role: "sys", text }]);
      if (input.voice !== false) companionPulseSpeak(text, pulse);
    };
    window.addEventListener("axiom-companion-event", onWindowPulse);

    const poll = input.poll ?? input.environment !== "storefront";
    if (!poll) {
      return () => window.removeEventListener("axiom-companion-event", onWindowPulse);
    }

    let stop = false;
    const tick = () => {
      void getOperatorData({ data: input.shopSlug })
        .then((data) => {
          if (stop || !data) return;
          const notices = data.notices ?? [];
          if (!primed.current) {
            for (const notice of notices) seen.current.add(notice.id);
            primed.current = true;
            return;
          }
          for (const notice of notices) {
            if (seen.current.has(notice.id)) continue;
            seen.current.add(notice.id);
            const pulse = companionPulseFromNotice(notice);
            if (!pulse) continue;
            const text = companionAnnouncement(pulse, {
              shopName: input.shopName,
              city: input.city,
              niche: input.niche,
            });
            setLines((rows) => [...rows.slice(-8), { id: notice.id, role: "sys", text }]);
            if (input.voice !== false) companionPulseSpeak(text, pulse);
          }
        })
        .catch(() => undefined);
    };
    tick();
    const id = window.setInterval(tick, 5000);
    return () => {
      stop = true;
      window.clearInterval(id);
      window.removeEventListener("axiom-companion-event", onWindowPulse);
    };
  }, [input.enabled, input.environment, input.poll, input.voice, input.shopSlug, input.shopName, input.city, input.niche]);

  const push = useCallback((role: CompanionChatLine["role"], text: string, pulse?: CompanionPulse) => {
    const id = `cmd-${Date.now()}`;
    setLines((rows) => [...rows.slice(-8), { id, role, text }]);
    if (role === "sys" && input.voice !== false) companionPulseSpeak(text, pulse);
  }, [input.voice]);

  return { lines, push };
}
