"use client";

import { Component, Suspense, useRef, type MutableRefObject, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Float } from "@react-three/drei";
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from "@react-three/postprocessing";
import { KernelSize } from "postprocessing";
import {
  ACESFilmicToneMapping,
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  Vector2,
  type WebGLRenderer,
} from "three";

export type AxiomBotMood = "ALERT" | "JOYFUL" | "STEADY";

export type AxiomBotPointer = {
  x: number;
  y: number;
};

export type AxiomBotInteraction = {
  dragging?: boolean;
  focused?: boolean;
  blinkToken?: number;
  celebrateToken?: number;
};

export type AxiomBotCanvasProps = {
  mood?: AxiomBotMood;
  /** Prefer pointerRef — avoids React re-renders on every move. */
  pointer?: AxiomBotPointer;
  pointerRef?: MutableRefObject<AxiomBotPointer>;
  thrusters?: boolean;
  dragging?: boolean;
  focused?: boolean;
  blinkToken?: number;
  celebrateToken?: number;
  isExpanded?: boolean;
  /** Card/background embed: framed head, no host drop-shadow, softer vignette. */
  embedded?: boolean;
  className?: string;
};

type BotMeshProps = {
  visualState: BotVisualState;
  pointerRef: MutableRefObject<AxiomBotPointer>;
  interactionRef: MutableRefObject<AxiomBotInteraction>;
  scale?: number;
};

const CYBER_CYAN = "#00f0ff";
const ALERT_AMBER = "#ffb020";
const SUCCESS_EMERALD = "#10b981";
const GOLD_BRASS = "#d4a348";
const LOOK_MAX = 0.435; // ~25°
const LOOK_GAIN = 0.4;
const CHROMA_OFFSET = new Vector2(0.001, 0.001);

type BotVisualState = "STEADY" | "ALERT" | "SUCCESS" | "DRAG";

function resolveVisualState(mood: AxiomBotMood, dragging: boolean): BotVisualState {
  if (dragging) return "DRAG";
  if (mood === "JOYFUL") return "SUCCESS";
  if (mood === "ALERT") return "ALERT";
  return "STEADY";
}

function glowFor(state: BotVisualState): string {
  if (state === "ALERT") return ALERT_AMBER;
  if (state === "SUCCESS") return SUCCESS_EMERALD;
  return CYBER_CYAN;
}

function setGlowColor(mesh: Mesh | null, hex: string): void {
  const material = mesh?.material;
  if (material instanceof MeshBasicMaterial) {
    material.color.set(hex);
  }
}

function BotMesh({ visualState, pointerRef, interactionRef, scale = 1 }: BotMeshProps) {
  const meshRef = useRef<Group | null>(null);
  const leftIrisRef = useRef<Group | null>(null);
  const rightIrisRef = useRef<Group | null>(null);
  const leftGlowRef = useRef<Mesh | null>(null);
  const rightGlowRef = useRef<Mesh | null>(null);
  const leftPupilRef = useRef<Mesh | null>(null);
  const rightPupilRef = useRef<Mesh | null>(null);
  const { pointer: canvasPointer } = useThree();

  const rotationTarget = useRef({ x: 0, y: 0 });
  const currentRotation = useRef({ x: 0, y: 0 });
  const blinkProgress = useRef(1);
  const blinkClosing = useRef(false);
  const nextBlinkTime = useRef(typeof performance !== "undefined" ? performance.now() + 4000 : 4000);
  const lastBlinkToken = useRef(0);
  const lastCelebrateToken = useRef(0);
  const celebrateUntil = useRef(0);
  const pupilScale = useRef(1);

  useFrame((_, delta) => {
    const root = meshRef.current;
    if (!root) return;

    const dt = Math.min(delta, 0.033);
    const interaction = interactionRef.current;
    const dragging = Boolean(interaction.dragging) || visualState === "DRAG";
    const focused = Boolean(interaction.focused);

    const externalX = MathUtils.clamp(pointerRef.current.x, -1, 1);
    const externalY = MathUtils.clamp(pointerRef.current.y, -1, 1);
    const canvasX = MathUtils.clamp(canvasPointer.x, -1, 1);
    const canvasY = MathUtils.clamp(canvasPointer.y, -1, 1);
    const useCanvas = Math.hypot(canvasX, canvasY) > Math.hypot(externalX, externalY);
    const px = useCanvas ? canvasX : externalX;
    const py = useCanvas ? canvasY : externalY;

    if (interaction.blinkToken != null && interaction.blinkToken !== lastBlinkToken.current) {
      lastBlinkToken.current = interaction.blinkToken;
      blinkClosing.current = true;
      blinkProgress.current = Math.min(blinkProgress.current, 0.85);
    }
    if (interaction.celebrateToken != null && interaction.celebrateToken !== lastCelebrateToken.current) {
      lastCelebrateToken.current = interaction.celebrateToken;
      celebrateUntil.current = performance.now() + 1600;
      blinkClosing.current = true;
      pupilScale.current = 1.22;
    }

    const lookGain = dragging ? 0.08 : LOOK_GAIN;
    rotationTarget.current.x = MathUtils.clamp(-py * lookGain, -LOOK_MAX, LOOK_MAX);
    rotationTarget.current.y = MathUtils.clamp(px * lookGain, -LOOK_MAX, LOOK_MAX);

    currentRotation.current.x = MathUtils.damp(currentRotation.current.x, rotationTarget.current.x, dragging ? 18 : 12, dt);
    currentRotation.current.y = MathUtils.damp(currentRotation.current.y, rotationTarget.current.y, dragging ? 18 : 12, dt);
    root.rotation.x = currentRotation.current.x;
    root.rotation.y = currentRotation.current.y;

    const now = performance.now();
    if (!blinkClosing.current && now > nextBlinkTime.current) {
      blinkClosing.current = true;
      nextBlinkTime.current = now + 3500 + Math.random() * 3500;
    }

    const targetBlink = blinkClosing.current ? 0.05 : 1;
    const blinkLambda = blinkClosing.current ? 28 : 14;
    blinkProgress.current = MathUtils.damp(blinkProgress.current, targetBlink, blinkLambda, dt);
    if (blinkClosing.current && blinkProgress.current < 0.12) blinkClosing.current = false;
    if (!blinkClosing.current && blinkProgress.current > 0.98) blinkProgress.current = 1;

    const celebrating = now < celebrateUntil.current || visualState === "SUCCESS";
    const liveState: BotVisualState =
      visualState === "ALERT" ? "ALERT" : celebrating ? "SUCCESS" : dragging ? "DRAG" : visualState;
    const glow = glowFor(liveState);
    setGlowColor(leftGlowRef.current, glow);
    setGlowColor(rightGlowRef.current, glow);

    const breath = 1 + Math.sin(now * 0.0017) * 0.05;
    const pupilTarget = focused || celebrating ? 1.15 : breath;
    pupilScale.current = MathUtils.damp(pupilScale.current, pupilTarget, focused ? 14 : 6, dt);

    const saccadeX = Math.sin(now * 0.04) * 0.008;
    const saccadeY = Math.cos(now * 0.037) * 0.007;
    const targetEyeX = px * 0.15 + saccadeX;
    const targetEyeY = -py * 0.15 + saccadeY;

    const eyes: Array<{ iris: Group | null; baseX: number; pupil: Mesh | null }> = [
      { iris: leftIrisRef.current, baseX: -0.22, pupil: leftPupilRef.current },
      { iris: rightIrisRef.current, baseX: 0.22, pupil: rightPupilRef.current },
    ];
    for (const eye of eyes) {
      if (!eye.iris) continue;
      eye.iris.position.x = MathUtils.damp(eye.iris.position.x, eye.baseX + targetEyeX, 15, dt);
      eye.iris.position.y = MathUtils.damp(eye.iris.position.y, 0.18 + targetEyeY, 15, dt);
      eye.iris.scale.y = blinkProgress.current;
      eye.pupil?.scale.setScalar(pupilScale.current);
    }
  });

  return (
    <group ref={meshRef} scale={scale} position={[0, 0.05, 0]}>
      <Float speed={1.4} rotationIntensity={0.08} floatIntensity={0.12}>
        {/* Carbon-obsidian helmet shell */}
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[1.15, 64, 64]} />
          <meshPhysicalMaterial
            color="#0a0c10"
            metalness={0.95}
            roughness={0.15}
            clearcoat={1}
            clearcoatRoughness={0.1}
            ior={1.5}
            envMapIntensity={1.35}
          />
        </mesh>

        {/* Gold-brass collar rim */}
        <mesh position={[0, -0.82, 0.05]} rotation={[Math.PI / 2.15, 0, 0]}>
          <torusGeometry args={[0.92, 0.07, 24, 64]} />
          <meshStandardMaterial color={GOLD_BRASS} metalness={0.95} roughness={0.18} envMapIntensity={1.2} />
        </mesh>

        {/* Antennae */}
        <mesh position={[-0.42, 1.05, 0.15]}>
          <cylinderGeometry args={[0.03, 0.04, 0.28, 10]} />
          <meshStandardMaterial color="#1f2937" metalness={0.85} roughness={0.3} />
        </mesh>
        <mesh position={[-0.42, 1.22, 0.15]}>
          <sphereGeometry args={[0.07, 20, 20]} />
          <meshStandardMaterial color={ALERT_AMBER} emissive={ALERT_AMBER} emissiveIntensity={0.45} toneMapped={false} />
        </mesh>
        <mesh position={[0.42, 1.08, 0.15]}>
          <cylinderGeometry args={[0.03, 0.04, 0.28, 10]} />
          <meshStandardMaterial color="#1f2937" metalness={0.85} roughness={0.3} />
        </mesh>
        <mesh position={[0.42, 1.25, 0.15]}>
          <sphereGeometry args={[0.07, 20, 20]} />
          <meshStandardMaterial color={CYBER_CYAN} emissive={CYBER_CYAN} emissiveIntensity={0.55} toneMapped={false} />
        </mesh>

        {/* Optical eyes */}
        <group ref={leftIrisRef} position={[-0.28, 0.18, 1.0]} renderOrder={2}>
          <mesh ref={leftGlowRef} renderOrder={2}>
            <circleGeometry args={[0.24, 32]} />
            <meshBasicMaterial color={glowFor(visualState)} toneMapped={false} />
          </mesh>
          <mesh ref={leftPupilRef} position={[0, 0, 0.02]} renderOrder={3}>
            <circleGeometry args={[0.1, 32]} />
            <meshBasicMaterial color="#02040a" />
          </mesh>
        </group>

        <group ref={rightIrisRef} position={[0.28, 0.18, 1.0]} renderOrder={2}>
          <mesh ref={rightGlowRef} renderOrder={2}>
            <circleGeometry args={[0.24, 32]} />
            <meshBasicMaterial color={glowFor(visualState)} toneMapped={false} />
          </mesh>
          <mesh ref={rightPupilRef} position={[0, 0, 0.02]} renderOrder={3}>
            <circleGeometry args={[0.1, 32]} />
            <meshBasicMaterial color="#02040a" />
          </mesh>
        </group>
      </Float>
    </group>
  );
}

type SceneBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

type SceneBoundaryState = {
  failed: boolean;
};

class SceneBoundary extends Component<SceneBoundaryProps, SceneBoundaryState> {
  state: SceneBoundaryState = { failed: false };

  static getDerivedStateFromError(): SceneBoundaryState {
    return { failed: true };
  }

  render(): ReactNode {
    if (this.state.failed) return this.props.fallback ?? null;
    return this.props.children;
  }
}

function FallbackOrb({ glow }: { glow: string }) {
  return (
    <div
      className="flex h-full w-full items-center justify-center"
      style={{ filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.95))" }}
    >
      <div
        className="h-24 w-24 rounded-full border border-white/10 bg-[#0f1115]"
        style={{ boxShadow: `0 0 28px ${glow}66, inset 0 0 18px ${glow}33` }}
      />
    </div>
  );
}

export function AxiomBotCanvas({
  mood = "STEADY",
  pointer,
  pointerRef: externalPointerRef,
  thrusters = false,
  dragging = false,
  focused = false,
  blinkToken = 0,
  celebrateToken = 0,
  isExpanded = false,
  embedded = false,
  className = "",
}: AxiomBotCanvasProps) {
  const localPointerRef = useRef<AxiomBotPointer>({ x: 0, y: 0 });
  const pointerRef = externalPointerRef ?? localPointerRef;
  const interactionRef = useRef<AxiomBotInteraction>({
    dragging: false,
    focused: false,
    blinkToken: 0,
    celebrateToken: 0,
  });

  if (!externalPointerRef && pointer) {
    pointerRef.current.x = pointer.x;
    pointerRef.current.y = pointer.y;
  }

  interactionRef.current.dragging = dragging;
  interactionRef.current.focused = focused || thrusters;
  interactionRef.current.blinkToken = blinkToken;
  interactionRef.current.celebrateToken = celebrateToken;

  const visualState = resolveVisualState(mood, dragging);
  const glow = glowFor(visualState);
  const heightClass = /\bh-/.test(className) ? "" : isExpanded ? "h-80" : "h-44";
  const cameraZ = embedded ? 3.35 : 3.8;
  const meshScale = embedded ? 0.92 : 1;

  return (
    <div
      className={`relative w-full overflow-hidden ${heightClass} ${className}`}
      style={embedded ? undefined : { filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.95))" }}
      data-expanded={isExpanded ? "true" : "false"}
      data-embedded={embedded ? "true" : "false"}
    >
      <SceneBoundary fallback={<FallbackOrb glow={glow} />}>
        <Canvas
          camera={{ position: [0, 0.12, cameraZ], fov: embedded ? 40 : 45 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            background: "transparent",
            pointerEvents: "none",
          }}
          onCreated={({ gl }: { gl: WebGLRenderer }) => {
            gl.setClearColor(0x000000, 0);
            gl.toneMapping = ACESFilmicToneMapping;
            gl.toneMappingExposure = embedded ? 1.25 : 1.12;
          }}
        >
          <ambientLight intensity={1.4} />
          <directionalLight position={[4, 4, 3]} intensity={3} color={CYBER_CYAN} />
          <directionalLight position={[-4, -3, -2]} intensity={2} color={GOLD_BRASS} />
          <pointLight position={[0, 0.5, 3]} intensity={2.5} color="#ffffff" />
          <Suspense fallback={null}>
            <BotMesh
              visualState={visualState}
              pointerRef={pointerRef}
              interactionRef={interactionRef}
              scale={meshScale}
            />
            <Environment preset="city" environmentIntensity={0.95} resolution={128} />
          </Suspense>
          <EffectComposer multisampling={2}>
            <Bloom
              intensity={embedded ? 1.35 : 1.6}
              luminanceThreshold={0.15}
              luminanceSmoothing={0.8}
              mipmapBlur
              kernelSize={KernelSize.LARGE}
            />
            <ChromaticAberration offset={CHROMA_OFFSET} radialModulation={false} modulationOffset={0} />
            <Vignette eskil={false} offset={embedded ? 0.35 : 0.4} darkness={embedded ? 0.28 : 0.5} />
          </EffectComposer>
        </Canvas>
      </SceneBoundary>
    </div>
  );
}

export default AxiomBotCanvas;
