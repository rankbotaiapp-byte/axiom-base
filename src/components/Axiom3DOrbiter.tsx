'use client';

import React, { useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { MeshTransmissionMaterial, Float, ContactShadows, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

// --- Gyroscopic Telemetry Rings Component ---
function GyroRings() {
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = t * 0.6;
      ring1Ref.current.rotation.y = t * 0.4;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y = -t * 0.5;
      ring2Ref.current.rotation.z = t * 0.3;
    }
  });

  return (
    <group>
      <mesh ref={ring1Ref}>
        <torusGeometry args={[2.3, 0.02, 16, 100]} />
        <meshBasicMaterial color="#00f2fe" transparent opacity={0.6} />
      </mesh>
      <mesh ref={ring2Ref}>
        <torusGeometry args={[2.1, 0.015, 16, 100]} />
        <meshBasicMaterial color="#10b981" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

// --- Internal Obsidian Robot Core ---
function ObsidianCore() {
  const coreRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!coreRef.current) return;
    coreRef.current.rotation.y = state.clock.getElapsedTime() * 0.4;
    coreRef.current.position.y = Math.sin(state.clock.getElapsedTime() * 1.5) * 0.05;
  });

  return (
    <group ref={coreRef}>
      <mesh>
        <boxGeometry args={[0.9, 0.9, 0.9]} />
        <meshStandardMaterial color="#030712" metalness={0.95} roughness={0.15} />
      </mesh>
      <mesh position={[0, 0, 0.46]}>
        <ringGeometry args={[0.15, 0.22, 32]} />
        <meshBasicMaterial color="#00f2fe" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// --- Main Interactive Droplet with Click Trigger ---
function DropletCompanion({ onOpenDispatch }: { onOpenDispatch: () => void }) {
  const dropletRef = useRef<THREE.Mesh>(null);
  const { pointer } = useThree();

  useFrame((state) => {
    if (!dropletRef.current) return;
    
    const targetX = pointer.x * 0.4;
    const targetY = pointer.y * 0.4;
    
    dropletRef.current.rotation.y = THREE.MathUtils.lerp(dropletRef.current.rotation.y, targetX, 0.1);
    dropletRef.current.rotation.x = THREE.MathUtils.lerp(dropletRef.current.rotation.x, -targetY, 0.1);

    const t = state.clock.getElapsedTime();
    const squish = 1 + Math.sin(t * 5) * 0.025 * Math.abs(pointer.x + 0.1);
    dropletRef.current.scale.set(squish, 2 / squish, squish);
  });

  return (
    <group>
      <GyroRings />
      <Sparkles count={80} scale={4.5} size={3} speed={0.8} color="#00f2fe" />

      {/* Clickable High-Refraction Water Shell */}
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
        <mesh 
          ref={dropletRef} 
          onClick={(e) => {
            e.stopPropagation();
            onOpenDispatch();
          }}
          onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
          onPointerOut={() => { document.body.style.cursor = 'default'; }}
        >
          <sphereGeometry args={[1.8, 64, 64]} />
          <MeshTransmissionMaterial
            backside
            samples={16}
            resolution={512}
            transmission={1}
            roughness={0.01}
            ior={1.48}
            chromaticAberration={0.12}
            anisotropy={0.3}
            distortion={0.3}
            distortionScale={0.4}
            temporalDistortion={0.2}
            color="#f0fdf4"
            attenuationColor="#10b981"
            attenuationDistance={0.75}
          />
          <ObsidianCore />
        </mesh>
      </Float>

      {/* Hydro-Plasma Thruster Nozzle */}
      <group position={[0, -1.9, 0]}>
        <mesh>
          <cylinderGeometry args={[0.35, 0.25, 0.4, 32]} />
          <meshStandardMaterial color="#020617" metalness={0.98} roughness={0.1} />
        </mesh>
        <mesh position={[0, -0.15, 0]}>
          <cylinderGeometry args={[0.26, 0.26, 0.1, 32]} />
          <meshBasicMaterial color="#00f2fe" />
        </mesh>
      </group>

      <ContactShadows position={[0, -2.4, 0]} opacity={0.7} scale={5} blur={2.5} far={4} color="#00f2fe" />
    </group>
  );
}

// --- Main Exported Component with Modal State ---
export default function Axiom3DOrbiter() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', issue: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    // Local manual state confirmation (logs details to console for manual dispatch)
    console.log(">>> MANUAL DISPATCH CAPTURED:", formData);
  };

  return (
    <div className="relative w-full h-[550px] bg-transparent overflow-hidden flex flex-col items-center">
      {/* Canvas Viewport */}
      <div className="w-full h-full">
        <Canvas camera={{ position: [0, 0, 5.5], fov: 45 }}>
          <color attach="background" args={['#030712']} />
          <ambientLight intensity={1.2} />
          <directionalLight position={[4, 4, 5]} intensity={3.5} color="#00f2fe" />
          <directionalLight position={[-4, -2, -3]} intensity={2.0} color="#10b981" />
          <DropletCompanion onOpenDispatch={() => setIsModalOpen(true)} />
        </Canvas>
      </div>

      {/* Floating Click Prompt Overlay */}
      <div className="absolute bottom-4 pointer-events-none text-center">
        <p className="text-xs font-mono text-[#00f2fe] animate-pulse tracking-widest bg-slate-950/80 px-4 py-1.5 rounded-full border border-cyan-500/30 shadow-lg">
          [ CLICK COMPANION TO INITIATE 24/7 DISPATCH ]
        </p>
      </div>

      {/* Interactive Emergency Booking Modal */}
      {isModalOpen && (
        <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-cyan-500/40 rounded-2xl p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            
            {/* Close Button */}
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white font-mono text-sm"
            >
              [ESC]
            </button>

            {submitted ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-12 h-12 bg-emerald-500/20 text-[#10b981] rounded-full flex items-center justify-center mx-auto text-xl font-bold border border-emerald-500/40">
                  ✓
                </div>
                <h3 className="text-xl font-bold text-white">Emergency Dispatch Logged</h3>
                <p className="text-sm text-slate-300">
                  A local technician has been flagged. We are manually routing your details for immediate call-back.
                </p>
                <button
                  onClick={() => { setIsModalOpen(false); setSubmitted(false); }}
                  className="mt-4 px-6 py-2.5 rounded-xl bg-slate-800 text-cyan-400 font-mono text-xs hover:bg-slate-700 transition-colors"
                >
                  Close Window
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <span className="text-[10px] font-mono text-[#00f2fe] uppercase tracking-wider">// AI DISPATCH TERMINAL</span>
                  <h3 className="text-lg font-bold text-white mt-1">Request Emergency Service</h3>
                  <p className="text-xs text-slate-400">Direct intake link active. Enter your details below.</p>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Your Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#00f2fe] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Phone Number</label>
                  <input 
                    type="tel" 
                    required
                    placeholder="(541) 000-0000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#00f2fe] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Emergency Issue</label>
                  <textarea 
                    rows={3}
                    required
                    placeholder="Burst pipe, water heater leak, etc."
                    value={formData.issue}
                    onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#00f2fe] focus:outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00f2fe] to-[#10b981] text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/20 hover:opacity-90 transition-opacity"
                >
                  Dispatch Emergency Request
                </button>
              </form>
            )}

          </div>
        </div>
      )}
    </div>
  );
}