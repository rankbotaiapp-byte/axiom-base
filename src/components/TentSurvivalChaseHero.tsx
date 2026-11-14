import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import { useReducedMotion } from "framer-motion";
import {
  Color,
  LinearFilter,
  NoToneMapping,
  ShaderMaterial,
  SRGBColorSpace,
  Texture,
  TextureLoader,
  type BufferGeometry,
} from "three";
import { Button } from "@/components/ui/button";
import {
  TENT_DAYS,
  TENT_MILESTONES,
  TENT_SLOTS,
  TENT_TIERS,
  tentPhaseIndex,
  zipperBreach,
  type TentPhase,
} from "@/lib/axiom/tent-chase";

const PLANE: [number, number] = [2.4, 2.4 * (1792 / 2400)];
const HOME_Z = 2.42;
const DEBRIS = 220;
const ACCENT = new Color("#2ee6d6");

const VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAG = `
uniform sampler2D uDawn;
uniform sampler2D uChase;
uniform sampler2D uCover;
uniform float uPhase;
uniform float uPeel;
uniform float uBlur;
uniform float uTime;
varying vec2 vUv;

vec3 sampleBlur(sampler2D tex, vec2 uv, float amount) {
  vec2 dir = vec2(amount * 0.018, amount * 0.006);
  vec3 acc = vec3(0.0);
  for (int i = 0; i < 5; i++) {
    float t = float(i) / 4.0 - 0.5;
    acc += texture2D(tex, uv + dir * t).rgb;
  }
  return acc / 5.0;
}

void main() {
  vec2 uv = vUv;
  vec2 pulled = uv;
  pulled.x += sign(uv.x - 0.2) * uPeel * 0.14;
  float gap = max(uPeel * 0.62, 0.001);
  float inGap = 1.0 - smoothstep(gap * 0.82, gap, abs(uv.x - 0.2));
  vec3 tent = texture2D(uDawn, pulled).rgb;
  vec3 woods = texture2D(uChase, uv).rgb;
  vec3 stealth = mix(tent, woods, inGap * uPeel);
  vec3 chase = sampleBlur(uChase, uv + vec2(sin(uTime * 18.0), cos(uTime * 15.0)) * uBlur * 0.004, uBlur);
  vec3 cover = texture2D(uCover, uv).rgb;
  float toChase = smoothstep(0.0, 1.0, clamp(uPhase, 0.0, 1.0));
  float toCover = clamp(uPhase - 1.0, 0.0, 1.0);
  vec3 color = mix(stealth, chase, toChase);
  color = mix(color, cover, toCover);
  gl_FragColor = vec4(color, 1.0);
}
`;

function playTwig(ctx: AudioContext) {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(220, now);
  osc.frequency.exponentialRampToValueAtTime(48, now + 0.09);
  gain.gain.setValueAtTime(0.18, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.18);

  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.12), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    const fade = 1 - i / data.length;
    data[i] = (Math.random() * 2 - 1) * fade * fade;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.32, now);
  noise.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  noise.start(now);
}

function ChaseScene({
  dawn,
  chase,
  cover,
  phaseRef,
  peelRef,
  frozenRef,
  reduced,
}: {
  dawn: Texture;
  chase: Texture;
  cover: Texture;
  phaseRef: RefObject<TentPhase>;
  peelRef: RefObject<number>;
  frozenRef: RefObject<boolean>;
  reduced: boolean;
}) {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        toneMapped: false,
        uniforms: {
          uDawn: { value: dawn },
          uChase: { value: chase },
          uCover: { value: cover },
          uPhase: { value: 0 },
          uPeel: { value: 0 },
          uBlur: { value: 0 },
          uTime: { value: 0 },
        },
      }),
    [chase, cover, dawn],
  );
  const positions = useMemo(() => {
    const data = new Float32Array(DEBRIS * 3);
    for (let i = 0; i < DEBRIS; i += 1) {
      data[i * 3] = (Math.random() - 0.5) * 2.3;
      data[i * 3 + 1] = (Math.random() - 0.5) * 1.7;
      data[i * 3 + 2] = 0.08 + Math.random() * 0.62;
    }
    return data;
  }, []);
  const velocity = useMemo(() => {
    const data = new Float32Array(DEBRIS * 3);
    for (let i = 0; i < DEBRIS; i += 1) {
      data[i * 3] = (Math.random() - 0.35) * 0.55;
      data[i * 3 + 1] = 0.15 + Math.random() * 0.45;
      data[i * 3 + 2] = (Math.random() - 0.5) * 0.15;
    }
    return data;
  }, []);
  const geo = useRef<BufferGeometry>(null);
  const phaseMix = useRef(0);

  useEffect(() => () => material.dispose(), [material]);

  useFrame((state, delta) => {
    const step = Math.min(delta, 0.05);
    const target = tentPhaseIndex(phaseRef.current ?? "stealth");
    const ease = reduced ? 1 : Math.min(1, step * 1.6);
    phaseMix.current += (target - phaseMix.current) * ease;
    const frozen = Boolean(frozenRef.current);
    const chasing = (phaseRef.current ?? "stealth") === "chase" && !frozen;
    material.uniforms.uPhase.value = phaseMix.current;
    material.uniforms.uPeel.value = peelRef.current ?? 0;
    material.uniforms.uBlur.value = chasing && !reduced ? 1 : 0;
    material.uniforms.uTime.value += reduced ? 0 : step;

    const attr = geo.current?.getAttribute("position");
    if (attr && chasing) {
      const array = attr.array as Float32Array;
      for (let i = 0; i < DEBRIS; i += 1) {
        array[i * 3] += velocity[i * 3] * step;
        array[i * 3 + 1] += velocity[i * 3 + 1] * step;
        array[i * 3 + 2] += velocity[i * 3 + 2] * step;
        if (array[i * 3 + 1] > 0.95) {
          array[i * 3] = (Math.random() - 0.5) * 2.3;
          array[i * 3 + 1] = -0.9;
          array[i * 3 + 2] = 0.08 + Math.random() * 0.62;
        }
      }
      attr.needsUpdate = true;
    }

    if (!frozen) {
      const shake = chasing && !reduced ? 1 : 0;
      const t = state.clock.elapsedTime;
      state.camera.position.set(Math.sin(t * 23) * 0.014 * shake, Math.sin(t * 19) * 0.01 * shake, HOME_Z);
      state.camera.lookAt(0, 0, 0);
    }
  });

  return (
    <>
      <mesh material={material}>
        <planeGeometry args={PLANE} />
      </mesh>
      <points visible={phaseRef.current === "chase" || phaseMix.current > 0.35}>
        <bufferGeometry ref={geo}>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial color={ACCENT} size={0.028} transparent opacity={0.85} depthWrite={false} sizeAttenuation />
      </points>
      <OrbitControls
        enabled={Boolean(frozenRef.current) && phaseRef.current === "chase"}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={1.7}
        maxDistance={4.1}
        target={[0, 0, 0]}
      />
    </>
  );
}

export function TentSurvivalChaseHero() {
  const reduce = useReducedMotion();
  const [maps, setMaps] = useState<{ dawn: Texture; chase: Texture; cover: Texture } | null>(null);
  const [failed, setFailed] = useState(false);
  const [phase, setPhase] = useState<TentPhase>("stealth");
  const [peel, setPeel] = useState(0);
  const [frozen, setFrozen] = useState(false);
  const [day, setDay] = useState("wed");
  const [slot, setSlot] = useState<string | null>(null);
  const [tier, setTier] = useState<string | null>(null);
  const [reserved, setReserved] = useState(false);
  const phaseRef = useRef<TentPhase>("stealth");
  const peelRef = useRef(0);
  const frozenRef = useRef(false);
  const snapped = useRef(false);
  const audio = useRef<AudioContext | null>(null);
  const drag = useRef<{ y: number; peel: number } | null>(null);
  phaseRef.current = phase;
  peelRef.current = peel;
  frozenRef.current = frozen;

  useEffect(() => {
    const loader = new TextureLoader();
    let alive = true;
    void Promise.all([
      loader.loadAsync(TENT_MILESTONES.dawn),
      loader.loadAsync(TENT_MILESTONES.chase),
      loader.loadAsync(TENT_MILESTONES.cover),
    ])
      .then(([dawn, chase, cover]) => {
        for (const tex of [dawn, chase, cover]) {
          tex.colorSpace = SRGBColorSpace;
          tex.magFilter = LinearFilter;
          tex.minFilter = LinearFilter;
          tex.needsUpdate = true;
        }
        if (alive) setMaps({ dawn, chase, cover });
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => () => {
    maps?.dawn.dispose();
    maps?.chase.dispose();
    maps?.cover.dispose();
  }, [maps]);

  useEffect(() => {
    if (phase !== "stealth" || snapped.current || !zipperBreach(peel)) return;
    snapped.current = true;
    const ctx = audio.current;
    if (ctx) {
      void ctx.resume().then(() => playTwig(ctx));
    }
    setPhase("chase");
    setFrozen(false);
  }, [peel, phase]);

  function armAudio() {
    if (!audio.current) {
      const Ctx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (Ctx) audio.current = new Ctx();
    }
    void audio.current?.resume();
  }

  function resetSprint() {
    snapped.current = false;
    setPeel(0);
    setFrozen(false);
    setPhase("stealth");
    setReserved(false);
    setSlot(null);
    setTier(null);
  }

  function onZipDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (phase !== "stealth") return;
    armAudio();
    drag.current = { y: event.clientY, peel };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onZipMove(event: ReactPointerEvent<HTMLDivElement>) {
    const start = drag.current;
    if (!start) return;
    const height = event.currentTarget.getBoundingClientRect().height || 1;
    const next = Math.max(0, Math.min(1, start.peel + (event.clientY - start.y) / height));
    setPeel(next);
  }

  return (
    <section
      className={frozen ? "tent-hero is-frozen" : "tent-hero"}
      data-phase={phase}
      data-frozen={frozen ? "yes" : "no"}
      data-peel={peel.toFixed(2)}
      aria-label="Tent survival chase"
    >
      <div className="tent-stage">
        {maps ? (
          <Canvas
            camera={{ position: [0, 0, HOME_Z], fov: 42 }}
            dpr={[1, 1.5]}
            gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
            onCreated={({ gl }) => {
              gl.toneMapping = NoToneMapping;
              gl.setClearColor(0x050505, 1);
            }}
          >
            <ChaseScene
              dawn={maps.dawn}
              chase={maps.chase}
              cover={maps.cover}
              phaseRef={phaseRef}
              peelRef={peelRef}
              frozenRef={frozenRef}
              reduced={Boolean(reduce)}
            />
          </Canvas>
        ) : (
          <p className="tent-hold">{failed ? "The milestone stills did not load." : "Loading the treeline"}</p>
        )}

        <p className="tent-kicker">
          {phase === "stealth" ? "Breach the treeline" : phase === "chase" ? "Chase active" : "Cover secured"}
        </p>
        <div className="tent-phases" role="tablist" aria-label="Sequence">
          {(["stealth", "chase", "cover"] as const).map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={phase === id}
              className={phase === id ? "tent-phase is-on" : "tent-phase"}
              onClick={() => {
                if (id === "stealth") resetSprint();
                else {
                  setPhase(id);
                  setFrozen(false);
                }
              }}
            >
              {id === "stealth" ? "Stealth" : id === "chase" ? "Chase" : "Cover"}
            </button>
          ))}
        </div>

        {phase === "stealth" ? (
          <div
            className="tent-zipper"
            role="slider"
            tabIndex={0}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(peel * 100)}
            aria-label="Tent zipper"
            onPointerDown={onZipDown}
            onPointerMove={onZipMove}
            onPointerUp={() => {
              drag.current = null;
            }}
            onKeyDown={(event) => {
              if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
              event.preventDefault();
              armAudio();
              const delta = event.key === "ArrowDown" ? 0.08 : -0.08;
              setPeel((current) => Math.max(0, Math.min(1, current + delta)));
            }}
          >
            <span className="tent-zipper-pull" style={{ top: `${8 + peel * 78}%` }} />
          </div>
        ) : null}

        <div className="tent-actions">
          {phase === "stealth" ? (
            <Button
              variant="accent"
              onClick={() => {
                armAudio();
                setPeel(1);
              }}
            >
              Unzip and exit
            </Button>
          ) : null}
          {phase === "chase" ? (
            <>
              <Button
                variant={frozen ? "accent" : "secondary"}
                aria-pressed={frozen}
                onClick={() => setFrozen((current) => !current)}
              >
                {frozen ? "Resume chase" : "Freeze matrix"}
              </Button>
              <Button variant="secondary" onClick={() => setPhase("cover")}>
                Take cover
              </Button>
            </>
          ) : null}
          {phase === "cover" ? (
            <>
              <Button variant="accent" onClick={resetSprint}>
                Replay sprint
              </Button>
              <Link to="/" className="tent-link">
                Visit storefront
              </Link>
            </>
          ) : null}
        </div>

        {phase === "chase" && frozen ? <p className="tent-freeze">Matrix view. Drag to orbit the frozen chase.</p> : null}
        {phase === "stealth" ? <p className="tent-hint">Drag the zipper down. A snap opens the treeline.</p> : null}

        {phase === "cover" ? (
          <form
            className="tent-book"
            onSubmit={(event) => {
              event.preventDefault();
              if (!tier || !slot) return;
              setReserved(true);
            }}
          >
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Service bookings</p>
            <div className="tent-days" role="group" aria-label="Day">
              {TENT_DAYS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={day === item.id ? "tent-day is-on" : "tent-day"}
                  aria-pressed={day === item.id}
                  onClick={() => setDay(item.id)}
                >
                  <span>{item.label}</span>
                  <strong>{item.date}</strong>
                </button>
              ))}
            </div>
            <div className="tent-slots" role="group" aria-label="Open time">
              {TENT_SLOTS.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={slot === item ? "tent-slot is-on" : "tent-slot"}
                  aria-pressed={slot === item}
                  onClick={() => setSlot(item)}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="tent-tiers" role="group" aria-label="Service tier">
              {TENT_TIERS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={tier === item.id ? "tent-tier is-on" : "tent-tier"}
                  aria-pressed={tier === item.id}
                  onClick={() => setTier(item.id)}
                >
                  <span>{item.name}</span>
                  <small>{item.detail}</small>
                </button>
              ))}
            </div>
            {reserved ? <p className="text-sm text-accent">Service reserved. Stay under cover.</p> : null}
            <Button type="submit" variant="accent" disabled={!tier || !slot}>
              Book service
            </Button>
          </form>
        ) : null}
      </div>
    </section>
    );
}
