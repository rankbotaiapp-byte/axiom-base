import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Component, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import {
  CanvasTexture,
  ClampToEdgeWrapping,
  Color,
  DataTexture,
  DoubleSide,
  LinearFilter,
  NoColorSpace,
  NoToneMapping,
  RGBAFormat,
  ShaderMaterial,
  SRGBColorSpace,
  Vector2,
  Vector4,
  VideoTexture,
  type Mesh,
} from "three";
import { CORE_PRESENCE_FRAG, CORE_PRESENCE_VERT } from "@/components/core-presence-shader";
import {
  approachCamera,
  frameCover,
  orbitCamera,
  stateIndex,
  surfaceAt,
  type CoreStateId,
} from "@/lib/axiom/core-presence";
import {
  FLUID_SIZE,
  clearInquiry,
  createFluid,
  diffuseGlyphs,
  gestureCurl,
  gestureVelocity,
  injectGesture,
  packField,
  stepFluid,
  swipeBreaksGlyphs,
} from "@/lib/axiom/orb-fluid";

const STEP = 1 / 60;
const ROOM = new Color("#121216");
const RING = new Color("#2ee6d6");

export function CoreSphere({
  text,
  videoRef,
  reduced = false,
  onTap,
  onUnavailable,
  state = "water",
  portal = "orbit",
  framed = false,
  room = true,
  label = "Ask the assistant",
}: {
  text: string;
  videoRef: RefObject<HTMLVideoElement | null>;
  reduced?: boolean;
  onTap: () => void;
  onUnavailable: () => void;
  state?: CoreStateId;
  portal?: "orbit" | "inside";
  framed?: boolean;
  /** Floor and grid. Off while the orb floats on a filmed hero. */
  room?: boolean;
  label?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const fluidRef = useRef(createFluid());
  const textRef = useRef(text);
  const reducedRef = useRef(reduced);
  const onTapRef = useRef(onTap);
  const stateRef = useRef(state);
  const portalRef = useRef(portal);
  const gestureRef = useRef(0);
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);
  const [steer, setSteer] = useState(false);
  const failRef = useRef(onUnavailable);
  textRef.current = text;
  reducedRef.current = reduced;
  onTapRef.current = onTap;
  stateRef.current = state;
  portalRef.current = portal;
  failRef.current = onUnavailable;

  useEffect(() => {
    setVideo(videoRef.current);
  }, [videoRef]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const field = fluidRef.current;
    let down = false;
    let moved = 0;
    let lastPointer = 0;
    let prev = { x: 0, y: 0, t: 0, vx: 0, vy: 0 };

    const ingest = (clientX: number, clientY: number, time: number) => {
      if (root.dataset.steer === "on") return;
      const box = root.getBoundingClientRect();
      const u = (clientX - box.left) / Math.max(1, box.width);
      const v = (clientY - box.top) / Math.max(1, box.height);
      const dt = Math.max(0.001, (time - prev.t) / 1000);
      const dx = clientX - prev.x;
      const dy = clientY - prev.y;
      moved += Math.hypot(dx, dy);
      const motion = gestureVelocity(dx, dy, dt);
      const curl = gestureCurl(prev.vx, prev.vy, motion.vx, motion.vy);
      injectGesture(field, u, v, motion.vx, motion.vy, curl);
      gestureRef.current += 1;
      prev = { x: clientX, y: clientY, t: time, vx: motion.vx, vy: motion.vy };
      root.dataset.speed = motion.speed.toFixed(0);
      root.dataset.curl = curl.toFixed(0);
    };

    const onDown = (event: PointerEvent) => {
      if (root.dataset.steer === "on") return;
      if (event.target instanceof Element && event.target.closest(".core-bar, button, a, input, textarea")) return;
      down = true;
      moved = 0;
      prev = { x: event.clientX, y: event.clientY, t: performance.now(), vx: 0, vy: 0 };
      try {
        root.setPointerCapture(event.pointerId);
      } catch {
        /* Synthetic presses have no capture. */
      }
    };
    const onMove = (event: PointerEvent) => {
      if (!down) return;
      lastPointer = performance.now();
      ingest(event.clientX, event.clientY, lastPointer);
    };
    const onUp = () => {
      if (down && moved < 12 && root.dataset.steer !== "on") onTapRef.current();
      down = false;
    };
    const onTouch = (event: TouchEvent) => {
      if (!down || event.touches.length !== 1 || root.dataset.steer === "on") return;
      event.preventDefault();
      const now = performance.now();
      if (now - lastPointer < 40) return;
      const touch = event.touches[0];
      if (!touch) return;
      ingest(touch.clientX, touch.clientY, now);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.target !== root.querySelector(".orb-hit")) return;
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      onTapRef.current();
    };

    root.addEventListener("pointerdown", onDown);
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerup", onUp);
    root.addEventListener("pointercancel", onUp);
    root.addEventListener("touchmove", onTouch, { passive: false });
    root.addEventListener("keydown", onKey);
    return () => {
      root.removeEventListener("pointerdown", onDown);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerup", onUp);
      root.removeEventListener("pointercancel", onUp);
      root.removeEventListener("touchmove", onTouch);
      root.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={framed ? "orb-fluid is-frame" : "orb-fluid"}
      data-orb-fluid="live"
      data-core="live"
      data-state={state}
      data-portal={portal}
      data-steer={steer ? "on" : "off"}
      data-film="no"
    >
      <div className="orb-hit" role="button" tabIndex={0} aria-label={label} />
      <PresenceBoundary onFail={() => failRef.current()}>
        <Canvas
          camera={{ position: [0, 0.16, ORBIT_Z], fov: 46 }}
          dpr={[1, 1.5]}
          gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
          style={{ width: "100%", height: "100%", background: "transparent", pointerEvents: steer ? "auto" : "none" }}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0);
            gl.toneMapping = NoToneMapping;
          }}
        >
          <PresenceRig
            rootRef={rootRef}
            fluidRef={fluidRef}
            video={video}
            textRef={textRef}
            reducedRef={reducedRef}
            stateRef={stateRef}
            portalRef={portalRef}
            gestureRef={gestureRef}
            steer={steer}
            room={room}
            onSteer={setSteer}
          />
        </Canvas>
      </PresenceBoundary>
    </div>
  );
}

const ORBIT_Z = 3.1;

function PresenceRig({
  rootRef,
  fluidRef,
  video,
  textRef,
  reducedRef,
  stateRef,
  portalRef,
  gestureRef,
  steer,
  room,
  onSteer,
}: {
  rootRef: RefObject<HTMLDivElement | null>;
  fluidRef: RefObject<ReturnType<typeof createFluid>>;
  video: HTMLVideoElement | null;
  textRef: RefObject<string>;
  reducedRef: RefObject<boolean>;
  stateRef: RefObject<CoreStateId>;
  portalRef: RefObject<"orbit" | "inside">;
  gestureRef: RefObject<number>;
  steer: boolean;
  room: boolean;
  onSteer: (on: boolean) => void;
}) {
  const meshRef = useRef<Mesh>(null);
  const ringRef = useRef<Mesh>(null);
  const morph = useRef(0);
  const orbitT = useRef(0);
  const departT = useRef(0);
  const insideStop = useRef(orbitCamera(0));
  const flight = useRef(1);
  const from = useRef(orbitCamera(0));
  const wasInside = useRef(false);
  const steerOn = useRef(false);
  const painted = useRef("");
  const glyphKey = useRef("");
  const breaking = useRef(false);
  const breakStart = useRef(0);
  const armedGen = useRef(0);
  const acc = useRef(0);
  const last = useRef(0);
  const coverUniform = useMemo(() => new Vector4(1, 1, 0, 0), []);
  const resolutionUniform = useMemo(() => new Vector2(1, 1), []);
  const bytes = useMemo(() => new Uint8Array(FLUID_SIZE * FLUID_SIZE * 4), []);
  const fieldTex = useMemo(() => {
    const tex = new DataTexture(bytes, FLUID_SIZE, FLUID_SIZE, RGBAFormat);
    tex.colorSpace = NoColorSpace;
    tex.magFilter = LinearFilter;
    tex.minFilter = LinearFilter;
    tex.wrapS = ClampToEdgeWrapping;
    tex.wrapT = ClampToEdgeWrapping;
    tex.flipY = false;
    tex.needsUpdate = true;
    return tex;
  }, [bytes]);
  const textCanvas = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    return canvas;
  }, []);
  const textTex = useMemo(() => {
    const tex = new CanvasTexture(textCanvas);
    tex.colorSpace = SRGBColorSpace;
    tex.flipY = true;
    tex.magFilter = LinearFilter;
    tex.minFilter = LinearFilter;
    return tex;
  }, [textCanvas]);
  const videoTex = useMemo(() => {
    if (!video) return null;
    const tex = new VideoTexture(video);
    tex.colorSpace = SRGBColorSpace;
    tex.magFilter = LinearFilter;
    tex.minFilter = LinearFilter;
    return tex;
  }, [video]);
  const material = useMemo(() => {
    const mat = new ShaderMaterial({
      vertexShader: CORE_PRESENCE_VERT,
      fragmentShader: CORE_PRESENCE_FRAG,
      transparent: true,
      depthWrite: true,
      side: DoubleSide,
      toneMapped: false,
      uniforms: {
        uTime: { value: 0 },
        uDisplace: { value: 0.03 },
        uFog: { value: 0 },
        uVideo: { value: videoTex ?? fieldTex },
        uField: { value: fieldTex },
        uText: { value: textTex },
        uCover: { value: coverUniform },
        uResolution: { value: resolutionUniform },
        uHasFilm: { value: 0 },
        uBreak: { value: 0 },
        uHasText: { value: 0 },
        uWarp: { value: 0.04 },
        uRoughness: { value: 0.04 },
        uMetal: { value: 0 },
        uFlow: { value: 0.5 },
      },
    });
    return mat;
  }, [coverUniform, fieldTex, resolutionUniform, textTex, videoTex]);

  useEffect(() => {
    void document.fonts?.ready.then(() => {
      glyphKey.current = "";
    });
    return () => {
      material.dispose();
      fieldTex.dispose();
      textTex.dispose();
      videoTex?.dispose();
    };
  }, [fieldTex, material, textTex, videoTex]);

  useFrame((state, delta) => {
    const root = rootRef.current;
    const field = fluidRef.current;
    if (!root || !field) return;
    const step = Math.min(delta, 0.05);
    const now = state.clock.elapsedTime * 1000;
    if (last.current === 0) last.current = now;
    acc.current += Math.min(0.05, (now - last.current) / 1000);
    last.current = now;
    let steps = 0;
    while (acc.current >= STEP && steps < 3) {
      stepFluid(field, STEP);
      if (reducedRef.current) stepFluid(field, STEP);
      acc.current -= STEP;
      steps += 1;
    }

    const value = textRef.current.trim();
    if (value !== painted.current) {
      breaking.current = false;
      breakStart.current = 0;
      armedGen.current = gestureRef.current;
      clearInquiry(field);
      root.dataset.sheared = "no";
      painted.current = value;
    }
    if (value !== glyphKey.current) {
      paintGlyphs(textCanvas.getContext("2d"), value);
      glyphKey.current = value;
      textTex.needsUpdate = true;
    }
    if (value && !breaking.current && gestureRef.current !== armedGen.current && swipeBreaksGlyphs(field)) {
      breaking.current = true;
      breakStart.current = now;
      diffuseGlyphs(field);
      root.dataset.sheared = "yes";
    }
    if (!value) root.dataset.sheared = "no";
    const opened = breaking.current ? Math.min(1, (now - breakStart.current) / (reducedRef.current ? 160 : 480)) : 0;

    const target = stateIndex(stateRef.current);
    const ease = reducedRef.current ? 1 : Math.min(1, step * 2.4);
    morph.current += (target - morph.current) * ease;
    const surface = surfaceAt(morph.current);
    if (!reducedRef.current) material.uniforms.uTime.value += step;
    material.uniforms.uDisplace.value = surface.displace;
    material.uniforms.uFog.value = surface.fog;
    material.uniforms.uWarp.value = surface.warp;
    material.uniforms.uRoughness.value = surface.roughness;
    material.uniforms.uMetal.value = surface.metal;
    material.uniforms.uFlow.value = reducedRef.current ? 0 : surface.flow;
    material.uniforms.uBreak.value = opened;
    material.uniforms.uHasText.value = value ? 1 : 0;
    resolutionUniform.set(state.gl.domElement.width, state.gl.domElement.height);

    packField(field, bytes);
    fieldTex.needsUpdate = true;

    const film = video && video.readyState >= 2 && video.videoWidth > 0 ? video : null;
    material.uniforms.uHasFilm.value = film ? 1 : 0;
    if (videoTex) material.uniforms.uVideo.value = videoTex;
    root.dataset.film = film ? "yes" : "no";
    if (film && videoTex) {
      const orbRect = root.getBoundingClientRect();
      const cover =
        orbRect.width > 0 && orbRect.height > 0
          ? frameCover(orbRect.width, orbRect.height, film.videoWidth, film.videoHeight)
          : { mulX: 1, mulY: 1, addX: 0, addY: 0 };
      coverUniform.set(cover.mulX, cover.mulY, cover.addX, cover.addY);
    }

    const wantInside = portalRef.current === "inside";
    if (wantInside !== wasInside.current) {
      from.current = { x: state.camera.position.x, y: state.camera.position.y, z: state.camera.position.z };
      if (wantInside) {
        departT.current = orbitT.current;
        insideStop.current = approachCamera(from.current);
      } else {
        orbitT.current = departT.current;
      }
      flight.current = 0;
      wasInside.current = wantInside;
    }
    const dur = reducedRef.current ? 0.28 : 1.35;
    if (flight.current < 1) flight.current = Math.min(1, flight.current + step / dur);
    if (!wantInside && !reducedRef.current && flight.current >= 1) orbitT.current += step * 0.04;

    const cruising = !wantInside && flight.current >= 1;
    const steering = wantInside && flight.current >= 1;
    if (steering !== steerOn.current) {
      steerOn.current = steering;
      onSteer(steering);
    }
    root.dataset.steer = steering ? "on" : "off";
    root.dataset.flight = flight.current.toFixed(2);
    if (!steering) {
      const dest = wantInside ? insideStop.current : cruising ? orbitCamera(orbitT.current) : orbitCamera(departT.current);
      const p = flight.current * flight.current * (3 - 2 * flight.current);
      const cam = cruising
        ? dest
        : {
            x: from.current.x + (dest.x - from.current.x) * p,
            y: from.current.y + (dest.y - from.current.y) * p,
            z: from.current.z + (dest.z - from.current.z) * p,
          };
      state.camera.position.set(cam.x, cam.y, cam.z);
      state.camera.lookAt(0, 0, 0);
      root.dataset.cam = `${cam.x.toFixed(2)},${cam.y.toFixed(2)},${cam.z.toFixed(2)}`;
    } else {
      const cam = state.camera.position;
      root.dataset.cam = `${cam.x.toFixed(2)},${cam.y.toFixed(2)},${cam.z.toFixed(2)}`;
    }
    if (ringRef.current && !reducedRef.current) ringRef.current.rotation.z += step * 0.2;
  });

  return (
    <>
      {room ? (
        <>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]}>
            <circleGeometry args={[5.5, 48]} />
            <meshBasicMaterial color={ROOM} />
          </mesh>
          <gridHelper args={[7, 14, RING, ROOM]} position={[0, -1.48, 0]} />
        </>
      ) : null}
      <mesh ref={ringRef} rotation={[1.15, 0.2, 0]}>
        <torusGeometry args={[1.42, 0.012, 12, 80]} />
        <meshBasicMaterial color={RING} transparent opacity={0.55} />
      </mesh>
      <mesh ref={meshRef} material={material}>
        <sphereGeometry args={[1, 72, 72]} />
      </mesh>
      <OrbitControls
        enabled={steer}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={1.4}
        maxDistance={6}
        maxPolarAngle={Math.PI * 0.82}
        target={[0, 0, 0]}
      />
    </>
  );
}

class PresenceBoundary extends Component<{ onFail: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFail();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function paintGlyphs(ctx: CanvasRenderingContext2D | null, value: string) {
  if (!ctx) return;
  const size = ctx.canvas.width;
  ctx.clearRect(0, 0, size, size);
  const clean = value.replace(/\s+/g, " ").trim().slice(0, 180);
  if (!clean) return;
  const ink = getComputedStyle(document.documentElement).getPropertyValue("--color-fg").trim();
  ctx.fillStyle = ink || "rgb(243, 241, 235)";
  ctx.font = "600 52px 'Instrument Serif', serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const maxWidth = size * 0.72;
  const words = clean.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  const shown = lines.slice(0, 4);
  const gap = 62;
  const top = size / 2 - ((shown.length - 1) * gap) / 2;
  shown.forEach((row, index) => {
    ctx.fillText(row, size / 2, top + index * gap, maxWidth);
  });
}
