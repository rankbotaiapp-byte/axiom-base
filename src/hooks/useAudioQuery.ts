"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

type SpeechResult = { isFinal: boolean; 0: { transcript: string } };
type SpeechEvent = { resultIndex: number; results: ArrayLike<SpeechResult> };
type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

function recognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const host = window as Window & {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return host.SpeechRecognition ?? host.webkitSpeechRecognition ?? null;
}

export type AudioQuery = {
  supported: boolean;
  isListening: boolean;
  transcript: string;
  audioAmplitude: number;
  amplitudeRef: RefObject<number>;
  error: string | null;
  start: () => void;
  stop: () => void;
};

/** Hear one spoken question. Volume comes from an analyser; words come from speech recognition. */
export function useAudioQuery(onFinal: (transcript: string) => void): AudioQuery {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [audioAmplitude, setAudioAmplitude] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(false);
  const amplitudeRef = useRef(0);
  const onFinalRef = useRef(onFinal);
  const latestRef = useRef("");
  const stopRef = useRef<(() => void) | null>(null);
  const aliveRef = useRef(true);

  useEffect(() => {
    onFinalRef.current = onFinal;
  }, [onFinal]);

  useEffect(() => {
    setSupported(Boolean(recognitionCtor()) && Boolean(navigator.mediaDevices?.getUserMedia));
  }, []);

  useEffect(
    () => () => {
      aliveRef.current = false;
      stopRef.current?.();
    },
    [],
  );

  function stop() {
    stopRef.current?.();
  }

  async function start() {
    stop();
    const Ctor = recognitionCtor();
    if (!Ctor || !navigator.mediaDevices?.getUserMedia) {
      setError("This browser cannot hear a question yet.");
      return;
    }
    setError(null);
    setTranscript("");
    latestRef.current = "";

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError("The microphone stayed closed.");
      return;
    }

    const audio = new AudioContext();
    const source = audio.createMediaStreamSource(stream);
    const analyser = audio.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    const samples = new Uint8Array(analyser.fftSize);
    let frame = 0;
    let lastUi = 0;

    const pump = (now: number) => {
      analyser.getByteTimeDomainData(samples);
      let energy = 0;
      for (let i = 0; i < samples.length; i += 1) {
        const sample = (samples[i] - 128) / 128;
        energy += sample * sample;
      }
      const rms = Math.min(1, Math.sqrt(energy / samples.length) * 3.4);
      amplitudeRef.current = amplitudeRef.current * 0.62 + rms * 0.38;
      if (now - lastUi > 80) {
        lastUi = now;
        setAudioAmplitude(amplitudeRef.current);
      }
      frame = requestAnimationFrame(pump);
    };
    frame = requestAnimationFrame(pump);

    const recognition = new Ctor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      let spoken = "";
      for (let i = 0; i < event.results.length; i += 1) {
        spoken += event.results[i][0]?.transcript ?? "";
      }
      const clean = spoken.replace(/\s+/g, " ").trim();
      latestRef.current = clean;
      setTranscript(clean);
    };
    recognition.onerror = (event) => {
      if (event.error !== "aborted" && event.error !== "no-speech") setError("The question did not come through.");
    };
    recognition.onend = () => {
      const spoken = latestRef.current.trim();
      cleanup();
      if (aliveRef.current && spoken) onFinalRef.current(spoken);
    };

    let closed = false;
    const cleanup = () => {
      if (closed) return;
      closed = true;
      cancelAnimationFrame(frame);
      amplitudeRef.current = 0;
      setAudioAmplitude(0);
      setIsListening(false);
      stream.getTracks().forEach((track) => track.stop());
      void audio.close();
      stopRef.current = null;
    };
    stopRef.current = () => {
      const spoken = latestRef.current.trim();
      try {
        recognition.stop();
      } catch {
        cleanup();
        if (spoken) onFinalRef.current(spoken);
      }
    };

    try {
      recognition.start();
      setIsListening(true);
    } catch {
      cleanup();
      setError("Listening could not start.");
    }
  }

  return { supported, isListening, transcript, audioAmplitude, amplitudeRef, error, start, stop };
}
