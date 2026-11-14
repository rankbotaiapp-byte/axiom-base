"use client";

import { useEffect, useImperativeHandle, useRef } from "react";
import * as THREE from "three";
import { media, tierSettings, videoCrop } from "./config";
import { createParticleField } from "./gl/particles";
import {
  blurFragment,
  brightPassFragment,
  compositeFragment,
  fullscreenVertex,
  videoGradeFragment,
} from "./gl/shaders";
import { computeCoverWindow, CrossfadeVideoLoop, sourcePointToNdc } from "./gl/videoLoop";
import type { StageProps } from "./stage-types";

interface WebGLStageProps extends StageProps {
  tier: "desktop" | "mobile";
  onPerformanceDrop: () => void;
}

/** One full-screen triangle-pair pass with a raw shader. */
class FullscreenPass {
  readonly scene = new THREE.Scene();
  readonly material: THREE.RawShaderMaterial;
  private readonly mesh: THREE.Mesh;

  constructor(fragmentShader: string, uniforms: Record<string, THREE.IUniform>) {
    this.material = new THREE.RawShaderMaterial({
      vertexShader: fullscreenVertex,
      fragmentShader,
      uniforms,
      depthTest: false,
      depthWrite: false,
    });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material);
    this.mesh.frustumCulled = false;
    this.scene.add(this.mesh);
  }

  render(renderer: THREE.WebGLRenderer, camera: THREE.Camera, target: THREE.WebGLRenderTarget | null) {
    renderer.setRenderTarget(target);
    renderer.render(this.scene, camera);
  }

  dispose() {
    this.mesh.geometry.dispose();
    this.material.dispose();
  }
}

const createTarget = (w: number, h: number) =>
  new THREE.WebGLRenderTarget(Math.max(1, w), Math.max(1, h), {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: false,
    generateMipmaps: false,
  });

const createVideoTexture = (video: HTMLVideoElement) => {
  const tex = new THREE.VideoTexture(video);
  tex.colorSpace = THREE.NoColorSpace; // sample raw gamma values — no double conversion / washed blacks
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  return tex;
};

export default function WebGLStage({ tier, rig, flameHue, onReady, onPerformanceDrop, stageRef }: WebGLStageProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const surgeRef = useRef({ surge: 0, flash: 0, shake: 0, punch: 0 });
  const flameHueRef = useRef(flameHue);
  const callbacks = useRef({ onReady, onPerformanceDrop });
  callbacks.current = { onReady, onPerformanceDrop };

  useEffect(() => {
    flameHueRef.current = flameHue;
  }, [flameHue]);

  useImperativeHandle(
    stageRef,
    () => ({
      surge() {
        const s = surgeRef.current;
        s.surge = 1;
        s.flash = 1;
        s.shake = 1;
        s.punch = 1;
      },
    }),
    [],
  );

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const settings = tierSettings[tier];

    /* ---------------- renderer ---------------- */
    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: false,
      depth: false,
      stencil: false,
      powerPreference: tier === "desktop" ? "high-performance" : "default",
    });
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.autoClear = false;
    renderer.setClearColor(0x000000, 1);
    const canvas = renderer.domElement;
    canvas.className = "absolute inset-0 h-full w-full";
    canvas.setAttribute("aria-hidden", "true");
    host.appendChild(canvas);

    /* ---------------- video ---------------- */
    const loop = new CrossfadeVideoLoop(media.master);
    const texA = createVideoTexture(loop.a);
    const texB = createVideoTexture(loop.b);

    const tryPlay = async () => {
      const ok = await loop.play();
      if (ok) window.removeEventListener("pointerdown", tryPlay);
    };
    void tryPlay();
    window.addEventListener("pointerdown", tryPlay);

    let readyFired = false;
    const onFrameReady = () => {
      if (readyFired) return;
      readyFired = true;
      callbacks.current.onReady?.();
    };
    loop.a.addEventListener("playing", onFrameReady, { once: true });

    /* ---------------- passes ---------------- */
    const { crop, inpaint, source } = videoCrop;
    const gradePass = new FullscreenPass(videoGradeFragment, {
      uVideoA: { value: texA },
      uVideoB: { value: texB },
      uMix: { value: 0 },
      uSourceSize: { value: new THREE.Vector2(source.width, source.height) },
      uCrop: { value: new THREE.Vector4(crop.x, crop.y, crop.w, crop.h) },
      uWindow: { value: new THREE.Vector4(0, 0, 1, 1) },
      uInpaint: { value: new THREE.Vector4(inpaint.x, inpaint.y, inpaint.w, inpaint.h) },
      uBlack: { value: 0.045 },
      uFlameHue: { value: flameHueRef.current },
      uExposure: { value: 1 },
      uSharpen: { value: tier === "desktop" ? 0.9 : 0.6 },
    });

    const sceneRT = createTarget(1, 1);
    const bloomA = createTarget(1, 1);
    const bloomB = createTarget(1, 1);

    const brightPass = new FullscreenPass(brightPassFragment, {
      uScene: { value: sceneRT.texture },
      uTexel: { value: new THREE.Vector2() },
      uThreshold: { value: 0.42 },
    });
    const blurPass = new FullscreenPass(blurFragment, {
      uInput: { value: bloomA.texture },
      uDirection: { value: new THREE.Vector2() },
    });
    const compositePass = new FullscreenPass(compositeFragment, {
      uScene: { value: sceneRT.texture },
      uBloom: { value: bloomA.texture },
      uBloomStrength: { value: tier === "desktop" ? 1.25 : 1.0 },
      uShake: { value: 0 },
      uFlash: { value: 0 },
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
    });
    const orthoCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    /* ---------------- particles ---------------- */
    const particleScene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.set(0, 0, 10);
    let pixelRatio = Math.min(window.devicePixelRatio || 1, settings.maxPixelRatio);
    const particles = createParticleField(settings.particleScale, pixelRatio);
    particleScene.add(particles.group);

    /* ---------------- sizing ---------------- */
    let width = 1;
    let height = 1;
    const resize = () => {
      width = Math.max(1, host.clientWidth);
      height = Math.max(1, host.clientHeight);
      pixelRatio = Math.min(window.devicePixelRatio || 1, settings.maxPixelRatio);
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(width, height, false);
      const bw = Math.round(width * pixelRatio);
      const bh = Math.round(height * pixelRatio);
      sceneRT.setSize(bw, bh);
      const lw = Math.round(bw * settings.bloomResolution);
      const lh = Math.round(bh * settings.bloomResolution);
      bloomA.setSize(lw, lh);
      bloomB.setSize(lw, lh);
      (brightPass.material.uniforms.uTexel.value as THREE.Vector2).set(1 / bw, 1 / bh);
      (compositePass.material.uniforms.uResolution.value as THREE.Vector2).set(bw, bh);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      particles.setUniform("uPixelRatio", pixelRatio);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(host);

    /* ---------------- context loss ---------------- */
    const onContextLost = (e: Event) => {
      e.preventDefault();
      callbacks.current.onPerformanceDrop();
    };
    canvas.addEventListener("webglcontextlost", onContextLost);

    /* ---------------- frame loop ---------------- */
    const clock = new THREE.Clock();
    const emitVec = new THREE.Vector3();
    const dirVec = new THREE.Vector3();
    const leanVec = new THREE.Vector2();
    const emitA = new THREE.Vector3();
    const emitB = new THREE.Vector3();
    const frameTimes: number[] = [];
    let watchdogTripped = false;
    let elapsedTotal = 0;
    let hidden = document.hidden;
    const onVisibility = () => {
      hidden = document.hidden;
      clock.getDelta();
      frameTimes.length = 0;
    };
    document.addEventListener("visibilitychange", onVisibility);

    const ndcToWorldPlane = (ndc: { x: number; y: number }, out: THREE.Vector3) => {
      emitVec.set(ndc.x, ndc.y, 0.5).unproject(camera);
      dirVec.copy(emitVec).sub(camera.position).normalize();
      const t = -camera.position.z / dirVec.z;
      out.copy(camera.position).addScaledVector(dirVec, t);
    };

    renderer.setAnimationLoop(() => {
      if (hidden) return;
      const dt = Math.min(clock.getDelta(), 0.1);
      elapsedTotal += dt;
      const r = rig.current;
      const s = surgeRef.current;

      // Launch envelope decay.
      s.surge *= Math.exp(-dt / 1.5);
      s.flash *= Math.exp(-dt / 0.28);
      s.shake *= Math.exp(-dt / 0.55);
      s.punch *= Math.exp(-dt / 0.4);
      loop.setPlaybackRate(1 + s.surge * 0.35);

      // Video window (cover + lean + pinch zoom + launch punch).
      loop.update();
      if (!readyFired && loop.a.readyState >= 2) onFrameReady();
      const zoom = r.zoom * (1 + s.punch * 0.045);
      const win = computeCoverWindow(width / height, { x: r.x, y: r.y }, zoom);
      const gu = gradePass.material.uniforms;
      (gu.uWindow.value as THREE.Vector4).set(win.ox, win.oy, win.fx, win.fy);
      gu.uMix.value = loop.weightB;
      gu.uFlameHue.value += (flameHueRef.current - (gu.uFlameHue.value as number)) * (1 - Math.exp(-dt * 4));
      gu.uExposure.value = 1 + s.flash * 0.25;

      // Camera leans toward the cursor; pinch dollies in.
      camera.position.set(r.x * 1.1, r.y * 0.65, 10 / r.zoom);
      camera.lookAt(0, 0, 0);
      camera.rotation.z = -r.x * 0.015;
      camera.updateMatrixWorld();

      // Embers track the exhaust tips through the cover window.
      const [ea, eb] = videoCrop.emitters;
      if (ea && eb) {
        ndcToWorldPlane(sourcePointToNdc(ea, win), emitA);
        ndcToWorldPlane(sourcePointToNdc(eb, win), emitB);
      }
      particles.setUniform("uEmitA", emitA);
      particles.setUniform("uEmitB", emitB);
      particles.setUniform("uTime", elapsedTotal);
      particles.setUniform("uSurge", s.surge);
      particles.setUniform("uSwirl", r.swirl);
      particles.setUniform("uLean", leanVec.set(r.x, r.y));

      // 1. graded, cropped video → sceneRT
      gradePass.render(renderer, orthoCamera, sceneRT);
      // 2. cyan bright-pass → bloomA
      brightPass.render(renderer, orthoCamera, bloomA);
      // 3. blur ping-pong
      const bu = blurPass.material.uniforms;
      const dir = bu.uDirection.value as THREE.Vector2;
      for (let i = 0; i < settings.bloomPasses; i++) {
        const spread = 1 + i;
        bu.uInput.value = bloomA.texture;
        dir.set(spread / bloomA.width, 0);
        blurPass.render(renderer, orthoCamera, bloomB);
        bu.uInput.value = bloomB.texture;
        dir.set(0, spread / bloomA.height);
        blurPass.render(renderer, orthoCamera, bloomA);
      }
      // 4. composite → screen, then particles on top
      const cu = compositePass.material.uniforms;
      cu.uShake.value = s.shake;
      cu.uFlash.value = s.flash;
      cu.uTime.value = elapsedTotal;
      cu.uBloomStrength.value = (tier === "desktop" ? 1.25 : 1.0) + s.surge * 1.6;
      renderer.setRenderTarget(null);
      renderer.clear();
      compositePass.render(renderer, orthoCamera, null);
      renderer.render(particleScene, camera);

      // FPS watchdog → downgrade a tier if this device can't hold ~28 fps.
      if (!watchdogTripped && elapsedTotal > 2.5) {
        frameTimes.push(dt);
        if (frameTimes.length > 90) frameTimes.shift();
        if (frameTimes.length === 90) {
          const avg = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
          if (avg > 1 / 28) {
            watchdogTripped = true;
            callbacks.current.onPerformanceDrop();
          }
        }
      }
    });

    return () => {
      renderer.setAnimationLoop(null);
      observer.disconnect();
      window.removeEventListener("pointerdown", tryPlay);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      loop.a.removeEventListener("playing", onFrameReady);
      loop.dispose();
      texA.dispose();
      texB.dispose();
      gradePass.dispose();
      brightPass.dispose();
      blurPass.dispose();
      compositePass.dispose();
      particles.dispose();
      sceneRT.dispose();
      bloomA.dispose();
      bloomB.dispose();
      renderer.dispose();
      canvas.remove();
    };
  }, [tier, rig]);

  return <div ref={hostRef} className="absolute inset-0 overflow-hidden bg-black" />;
}
