"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type Vapi from "@vapi-ai/web";

export type VapiStatus = "unconfigured" | "idle" | "connecting" | "active" | "ending" | "error";

interface UseVapiResult {
  status: VapiStatus;
  /** 0–1 assistant output volume, for the reactive ring */
  volume: number;
  assistantSpeaking: boolean;
  error: string | null;
  start: () => Promise<void>;
  stop: () => Promise<void>;
}

/**
 * Thin wrapper around the Vapi Web SDK.
 * The SDK is dynamically imported on first use so it never weighs down initial page load.
 */
export function useVapi(publicKey: string, assistantId: string): UseVapiResult {
  const configured = publicKey.length > 0 && assistantId.length > 0;
  const [status, setStatus] = useState<VapiStatus>(configured ? "idle" : "unconfigured");
  const [volume, setVolume] = useState(0);
  const [assistantSpeaking, setAssistantSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const vapiRef = useRef<Vapi | null>(null);

  const getClient = useCallback(async (): Promise<Vapi> => {
    if (vapiRef.current) return vapiRef.current;
    const { default: VapiClient } = await import("@vapi-ai/web");
    const client = new VapiClient(publicKey);

    client.on("call-start", () => {
      setStatus("active");
      setError(null);
    });
    client.on("call-end", () => {
      setStatus("idle");
      setVolume(0);
      setAssistantSpeaking(false);
    });
    client.on("volume-level", (v: number) => setVolume(v));
    client.on("speech-start", () => setAssistantSpeaking(true));
    client.on("speech-end", () => setAssistantSpeaking(false));
    client.on("error", (e: unknown) => {
      const message =
        e instanceof Error
          ? e.message
          : typeof e === "object" && e !== null && "message" in e && typeof (e as { message: unknown }).message === "string"
            ? (e as { message: string }).message
            : "Voice line interrupted.";
      setError(message);
      setStatus("error");
      setVolume(0);
    });

    vapiRef.current = client;
    return client;
  }, [publicKey]);

  const start = useCallback(async () => {
    if (!configured) return;
    setError(null);
    setStatus("connecting");
    try {
      const client = await getClient();
      await client.start(assistantId);
    } catch (e) {
      const denied = e instanceof DOMException && (e.name === "NotAllowedError" || e.name === "SecurityError");
      setError(denied ? "Microphone access is needed to talk with our concierge." : "Couldn't reach the concierge. Please try again.");
      setStatus("error");
    }
  }, [assistantId, configured, getClient]);

  const stop = useCallback(async () => {
    const client = vapiRef.current;
    if (!client) return;
    setStatus("ending");
    try {
      await client.stop();
    } finally {
      setStatus("idle");
      setVolume(0);
      setAssistantSpeaking(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      const client = vapiRef.current;
      if (client) {
        void client.stop().catch(() => undefined);
        client.removeAllListeners();
      }
      vapiRef.current = null;
    };
  }, []);

  return { status, volume, assistantSpeaking, error, start, stop };
}
