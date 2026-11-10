"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { LoaderCircle, Mic, PhoneOff } from "lucide-react";
import Vapi from "@vapi-ai/web";
import { cn } from "@/lib/utils";

const VAPI_PUBLIC_KEY = "91d61dd4-6df0-4c94-b216-685b1677f005";
const VAPI_ASSISTANT_ID = "864408f6-2ecf-41ad-af16-321573f7c8db";

type VoiceStatus = "inactive" | "loading" | "active";

const COPY: Record<VoiceStatus, { label: string; hint: string }> = {
  inactive: { label: "Talk with the desk", hint: "Start a live voice session" },
  loading: { label: "Connecting", hint: "Opening the line" },
  active: { label: "End call", hint: "Line is live" },
};

export function AiVoiceManager({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const vapiRef = useRef<Vapi | null>(null);
  const [status, setStatus] = useState<VoiceStatus>("inactive");
  const [detail, setDetail] = useState("");

  useEffect(() => {
    const client = new Vapi(VAPI_PUBLIC_KEY);
    vapiRef.current = client;
    const onStart = () => {
      setStatus("active");
      setDetail("");
    };
    const onEnd = () => {
      setStatus("inactive");
    };
    const onError = (error: unknown) => {
      setStatus("inactive");
      setDetail(error instanceof Error ? error.message : "The line did not open.");
    };
    client.on("call-start", onStart);
    client.on("call-end", onEnd);
    client.on("error", onError);
    return () => {
      client.removeListener("call-start", onStart);
      client.removeListener("call-end", onEnd);
      client.removeListener("error", onError);
      void client.stop();
      vapiRef.current = null;
    };
  }, []);

  async function toggle() {
    const client = vapiRef.current;
    if (!client || status === "loading") return;
    if (status === "active") {
      setStatus("loading");
      try {
        await client.stop();
      } finally {
        setStatus("inactive");
      }
      return;
    }
    setStatus("loading");
    setDetail("");
    try {
      await client.start(VAPI_ASSISTANT_ID);
    } catch (error) {
      setStatus("inactive");
      setDetail(error instanceof Error ? error.message : "The line did not open.");
    }
  }

  const copy = COPY[status];
  const live = status === "active";
  const busy = status === "loading";

  return (
    <div className={cn("flex flex-col items-end gap-2", className)}>
      <motion.button
        type="button"
        onClick={() => void toggle()}
        disabled={busy}
        aria-pressed={live}
        aria-label={copy.hint}
        animate={
          reduce
            ? undefined
            : live
              ? { boxShadow: "0 0 0 1px color-mix(in srgb, var(--color-danger) 70%, transparent), 0 0 28px color-mix(in srgb, var(--color-danger) 35%, transparent)" }
              : busy
                ? { opacity: [1, 0.65, 1] }
                : { boxShadow: "0 0 0 1px color-mix(in srgb, var(--color-accent) 48%, transparent), 0 0 28px color-mix(in srgb, var(--color-accent) 22%, transparent)" }
        }
        transition={busy && !reduce ? { duration: 1.1, repeat: Infinity, ease: "easeInOut" } : { duration: 0.25 }}
        className={cn(
          "inline-flex h-12 min-w-12 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium disabled:opacity-70",
          live ? "bg-danger text-bg" : "bg-surface text-accent",
        )}
      >
        {busy ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden />
        ) : live ? (
          <PhoneOff className="size-4" aria-hidden />
        ) : (
          <Mic className="size-4" aria-hidden />
        )}
        {copy.label}
      </motion.button>
      <AnimatePresence>
        {detail ? (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="max-w-xs text-right text-xs text-danger"
            role="status"
          >
            {detail}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
