import { useEffect, useRef, useState } from "react";
import type { Room, RemoteTrack } from "livekit-client";
import { Mic, PhoneOff, Video } from "lucide-react";
import { ericGreeting, ownerWelcome, type AvatarContext } from "@/lib/axiom/avatar";

type Phase = "idle" | "connecting" | "live" | "offline" | "error";

type SessionReply = {
  configured?: boolean;
  greeting?: string;
  error?: string;
  livekitUrl?: string;
  livekitClientToken?: string;
};

const GREET_DELAY_MS = 1500;
/** Wait until A/V attach, then a short settle so lip-sync clock is warm. */
const SPEAK_AFTER_MEDIA_MS = 280;
const SPEAK_FALLBACK_MS = 2400;
const SEEN_PREFIX = "axiom:owner-greet:";

function greetingSeen(shopSlug: string): boolean {
  try {
    return localStorage.getItem(SEEN_PREFIX + shopSlug) === "1";
  } catch {
    return false;
  }
}

function markGreetingSeen(shopSlug: string) {
  try {
    localStorage.setItem(SEEN_PREFIX + shopSlug, "1");
  } catch {
    /* a private window still plays this visit */
  }
}

async function publishAgentControl(room: Room, payload: Record<string, unknown>) {
  await room.localParticipant.publishData(new TextEncoder().encode(JSON.stringify(payload)), {
    reliable: true,
    topic: "agent-control",
  });
}

async function interruptAvatar(room: Room) {
  await publishAgentControl(room, {
    event_id: crypto.randomUUID(),
    event_type: "avatar.interrupt",
  }).catch(() => undefined);
}

/** Queue spoken text after media is live — LiveAvatar lip-syncs TTS to the video track. */
async function speakLine(room: Room, text: string) {
  const line = text.trim();
  if (!line) return;
  await interruptAvatar(room);
  await publishAgentControl(room, {
    event_id: crypto.randomUUID(),
    event_type: "avatar.speak_text",
    text: line,
  });
}

function wireRemoteAudio(track: RemoteTrack, host: HTMLDivElement): HTMLMediaElement {
  const element = track.attach() as HTMLMediaElement;
  element.autoplay = true;
  element.setAttribute("playsinline", "true");
  element.volume = 1;
  // Prefer low-latency playout when the browser exposes it.
  try {
    (element as HTMLAudioElement & { preservesPitch?: boolean }).preservesPitch = true;
  } catch {
    /* optional */
  }
  host.replaceChildren(element);
  return element;
}

export function AskEricAvatar({
  businessName,
  trade,
  city,
  startOpen = false,
  welcome,
  docked = false,
}: AvatarContext & { startOpen?: boolean; welcome?: string; docked?: boolean }) {
  const context = { businessName, trade, city };
  const greeting = ericGreeting(context);
  const welcomeLine = ownerWelcome(context);
  const [open, setOpen] = useState(startOpen);
  const [phase, setPhase] = useState<Phase>("idle");
  const [detail, setDetail] = useState(greeting);
  const [soundBlocked, setSoundBlocked] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLDivElement>(null);
  const roomRef = useRef<Room | null>(null);
  const runRef = useRef(0);
  const launchRef = useRef<() => void>(() => undefined);
  const mediaReadyRef = useRef({ video: false, audio: false });

  useEffect(() => {
    return () => {
      runRef.current += 1;
      roomRef.current?.disconnect();
      roomRef.current = null;
    };
  }, []);

  async function hangUp() {
    roomRef.current?.disconnect();
    roomRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.removeAttribute("src");
    }
    if (audioRef.current) audioRef.current.replaceChildren();
    mediaReadyRef.current = { video: false, audio: false };
    setSoundBlocked(false);
    setSpeaking(false);
    setPhase("idle");
    setDetail(welcome ? welcomeLine : greeting);
  }

  async function start(options?: { script?: string; microphone?: boolean }) {
    if (phase === "connecting" || phase === "live") return;
    const script = options?.script;
    const microphone = options?.microphone !== false;
    const run = ++runRef.current;
    setPhase("connecting");
    setSoundBlocked(false);
    setSpeaking(false);
    mediaReadyRef.current = { video: false, audio: false };
    setDetail(script || "Opening the line…");
    try {
      const response = await fetch("/api/get-avatar-token", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(context),
      });
      const payload = (await response.json().catch(() => null)) as SessionReply | null;
      if (run !== runRef.current) return;
      if (!payload?.configured) {
        setPhase("offline");
        setDetail(script || payload?.greeting || greeting);
        return;
      }
      if (!response.ok || !payload.livekitUrl || !payload.livekitClientToken) {
        setPhase("error");
        setDetail(payload?.error || "The live line did not open.");
        return;
      }
      const { Room, RoomEvent, Track } = await import("livekit-client");
      if (run !== runRef.current) return;

      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        disconnectOnPageLeave: true,
      });
      roomRef.current = room;

      let spoken = false;
      const trySpeak = () => {
        if (spoken || !script || run !== runRef.current) return;
        const { video, audio } = mediaReadyRef.current;
        // Need video for lip-sync; audio track preferred but video-only can still drive TTS.
        if (!video) return;
        spoken = true;
        window.setTimeout(() => {
          if (run !== runRef.current) return;
          void speakLine(room, script).catch(() => undefined);
        }, audio ? SPEAK_AFTER_MEDIA_MS : SPEAK_AFTER_MEDIA_MS + 120);
      };

      room.on(RoomEvent.DataReceived, (data, _participant, _kind, topic) => {
        if (run !== runRef.current || topic !== "agent-response") return;
        try {
          const event = JSON.parse(new TextDecoder().decode(data)) as { event_type?: string };
          if (event.event_type === "avatar.speak_started") setSpeaking(true);
          if (event.event_type === "avatar.speak_ended") setSpeaking(false);
        } catch {
          /* ignore malformed agent frames */
        }
      });

      room.on(RoomEvent.TrackSubscribed, (track) => {
        if (run !== runRef.current) return;
        if (track.kind === Track.Kind.Video && videoRef.current) {
          track.attach(videoRef.current);
          videoRef.current.playsInline = true;
          videoRef.current.muted = false;
          void videoRef.current.play().catch(() => setSoundBlocked(true));
          mediaReadyRef.current.video = true;
          trySpeak();
        }
        if (track.kind === Track.Kind.Audio && audioRef.current) {
          const element = wireRemoteAudio(track, audioRef.current);
          void element.play().catch(() => setSoundBlocked(true));
          mediaReadyRef.current.audio = true;
          trySpeak();
        }
      });

      await room.connect(payload.livekitUrl, payload.livekitClientToken);
      if (run !== runRef.current) {
        room.disconnect();
        return;
      }
      void room.startAudio().catch(() => setSoundBlocked(true));
      if (microphone) await room.localParticipant.setMicrophoneEnabled(true);
      // Fallback only — prefer A/V-ready gate above for lip-sync timing.
      window.setTimeout(trySpeak, SPEAK_FALLBACK_MS);
      setPhase("live");
      setDetail(script || greeting);
    } catch (err) {
      if (run !== runRef.current) return;
      roomRef.current?.disconnect();
      roomRef.current = null;
      setPhase("error");
      setDetail(err instanceof Error ? err.message : "The live line did not open.");
    }
  }

  launchRef.current = () => {
    setOpen(true);
    void start({ script: welcomeLine, microphone: false });
  };

  useEffect(() => {
    if (!welcome || greetingSeen(welcome)) return;
    const timer = window.setTimeout(() => {
      markGreetingSeen(welcome);
      launchRef.current();
    }, GREET_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [welcome]);

  function dismiss() {
    runRef.current += 1;
    void hangUp();
    setOpen(false);
  }

  function toggle() {
    if (open) {
      dismiss();
      return;
    }
    setOpen(true);
    if (welcome) void start({ script: welcomeLine, microphone: false });
  }

  async function resumeSound() {
    setSoundBlocked(false);
    try {
      await roomRef.current?.startAudio();
      await videoRef.current?.play();
      audioRef.current?.querySelectorAll("audio").forEach((node) => {
        node.volume = 1;
        void node.play();
      });
    } catch {
      setSoundBlocked(true);
    }
  }

  return (
    <div
      className={
        docked
          ? "flex w-[min(22rem,calc(100vw-2rem))] flex-col items-end gap-3"
          : "fixed right-4 bottom-4 z-40 flex w-[min(22rem,calc(100vw-2rem))] flex-col items-end gap-3"
      }
    >
      {open ? (
        <section className="glass-btn w-full overflow-hidden rounded-[24px] bg-surface/90">
          <div className="relative aspect-[4/5] bg-bg">
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              autoPlay
              playsInline
              // Keep video unmuted so browser A/V clocks stay aligned for lip-sync.
            />
            <div ref={audioRef} className="hidden" aria-hidden />
            {phase === "live" && speaking ? (
              <p className="pointer-events-none absolute left-3 top-3 rounded-full bg-bg/70 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-accent">
                Speaking
              </p>
            ) : null}
            {phase !== "live" ? (
              <div className="absolute inset-0 flex flex-col justify-end bg-bg/80 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted">Eric</p>
                <p className="mt-2 text-sm leading-relaxed text-fg">{detail}</p>
              </div>
            ) : null}
          </div>
          {phase === "live" && welcome ? (
            <p className="px-4 py-3 text-sm leading-relaxed text-muted">{welcomeLine}</p>
          ) : null}
          <div className="flex flex-col gap-2 p-3">
            {welcome ? (
              <button
                type="button"
                onClick={dismiss}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-fg px-3 text-sm font-medium text-bg"
              >
                Close / Skip to Setup
              </button>
            ) : null}
            {soundBlocked ? (
              <button
                type="button"
                onClick={() => void resumeSound()}
                className="inline-flex h-11 items-center justify-center rounded-xl px-3 text-sm text-fg"
              >
                Play greeting
              </button>
            ) : null}
            {phase === "live" && !welcome ? (
              <button
                type="button"
                onClick={() => void hangUp()}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-fg px-3 text-sm font-medium text-bg"
              >
                <PhoneOff className="size-4" aria-hidden />
                End
              </button>
            ) : null}
            {phase !== "live" && !welcome ? (
              <button
                type="button"
                onClick={() => void start()}
                disabled={phase === "connecting"}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-fg px-3 text-sm font-medium text-bg disabled:opacity-40"
              >
                <Mic className="size-4" aria-hidden />
                {phase === "connecting" ? "Connecting" : "Talk with Eric"}
              </button>
            ) : null}
          </div>
        </section>
      ) : null}
      <button
        type="button"
        aria-expanded={open}
        aria-label={open ? "Close Eric" : "Ask Eric"}
        onClick={toggle}
        className="inline-flex h-12 items-center gap-2 rounded-full bg-fg px-4 text-sm font-medium text-bg shadow-[0_0_0_1px_rgba(243,241,235,0.12)]"
      >
        <Video className="size-4" aria-hidden />
        Ask Eric
      </button>
    </div>
  );
}
