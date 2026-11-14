'use client';
import React, { useState } from 'react';

export default function AxiomLandingPage() {
  const [step, setStep] = useState(1);
  const [businessName, setBusinessName] = useState('Accurate Plumbing');
  const [trade, setTrade] = useState('Plumbing & Emergency');

  return (
    <main className="min-h-screen bg-[#050507] text-white font-sans selection:bg-[#00ffcc] selection:text-black">
      {/* Top Navigation */}
      <nav className="border-b border-[#00ffcc]/20 px-6 py-4 flex items-center justify-between bg-[#050507]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#00ffcc] flex items-center justify-center shadow-[0_0_15px_rgba(0,255,204,0.4)]">
            <span className="text-[#00ffcc] font-mono text-xs font-bold">AX</span>
          </div>
          <span className="font-bold tracking-wider text-lg text-white">AXIOM <span className="text-[#00ffcc] text-xs font-mono ml-2">24/7 STUDIO</span></span>
        </div>
        <div className="hidden md:flex items-center space-x-6 text-sm text-gray-400">
          <span className="text-[#00ffcc]">● Live Node Active</span>
          <span>Jackson & Josephine County</span>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 py-20 max-w-6xl mx-auto flex flex-col items-center text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-[#00ffcc]/10 via-transparent to-transparent pointer-events-none blur-3xl" />
        <div className="inline-block mb-4 px-4 py-1.5 rounded-full border border-[#00ffcc]/30 bg-[#00ffcc]/5 text-[#00ffcc] text-xs font-mono tracking-widest uppercase shadow-[0_0_20px_rgba(0,255,204,0.2)]">
          Autonomous 24/7 Lead Capture & Booking
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 max-w-3xl">
          Never Miss Another Emergency Call.
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mb-10">
          Automated SMS routing, instant Stripe Connect invoicing, and cinematic storefronts built for local trade contractors.
        </p>

        {/* Interactive 4-Step Studio Widget */}
        <div className="w-full max-w-3xl bg-[#050507] border border-[#00ffcc]/30 rounded-2xl p-6 md:p-8 shadow-[0_0_50px_rgba(0,255,204,0.15)] text-left">
          <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
            <div>
              <h3 className="text-xl font-bold text-white">Axiom Studio Builder</h3>
              <p className="text-xs text-gray-400">Test your live storefront provisioning below.</p>
            </div>
            <div className="flex space-x-1 font-mono text-xs text-[#00ffcc]">
              <span>STEP {step} OF 4</span>
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <label className="block text-sm text-gray-300 font-medium">Business Name</label>
              <input 
                type="text" 
                value={businessName} 
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full bg-black/60 border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-[#00ffcc] outline-none transition"
              />
              <label className="block text-sm text-gray-300 font-medium">Trade Niche</label>
              <select 
                value={trade} 
                onChange={(e) => setTrade(e.target.value)}
                className="w-full bg-black/60 border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-[#00ffcc] outline-none transition"
              >
                <option>Plumbing & Emergency</option>
                <option>HVAC & Climate</option>
                <option>Electrical & Lighting</option>
                <option>Rogue River Guide & Outfitter</option>
              </select>
              <button 
                onClick={() => setStep(2)}
                className="w-full mt-4 py-3 bg-[#00ffcc] text-black font-bold rounded-xl hover:bg-[#00ffcc]/90 transition shadow-[0_0_20px_rgba(0,255,204,0.3)]"
              >
                Next: Preview Hero Assets →
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="p-4 bg-black/50 border border-[#00ffcc]/20 rounded-xl">
                <h4 className="font-bold text-[#00ffcc] text-sm mb-1">{businessName} Storefront Ready</h4>
                <p className="text-xs text-gray-400">Cinematic 3D Blender loop and emergency booking calendar synchronized for {trade}.</p>
              </div>
              <div className="flex space-x-3">
                <button onClick={() => setStep(1)} className="w-1/2 py-3 border border-gray-800 rounded-xl text-gray-400 hover:text-white transition">Back</button>
                <button onClick={() => setStep(3)} className="w-1/2 py-3 bg-[#00ffcc] text-black font-bold rounded-xl hover:bg-[#00ffcc]/90 transition">Test Booking Machine →</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-3 bg-black/40 border border-gray-800 rounded-lg">
                  <span className="text-gray-500 block">STATUS</span>
                  <span className="text-emerald-400 font-bold">● 24/7 LISTENING</span>
                </div>
                <div className="p-3 bg-black/40 border border-gray-800 rounded-lg">
                  <span className="text-gray-500 block">ROUTING</span>
                  <span className="text-cyan-400 font-bold">TWILIO + RESEND</span>
                </div>
              </div>
              <div className="p-4 bg-black/60 border border-amber-500/30 rounded-xl text-sm">
                <p className="text-amber-400 font-bold mb-1">Simulated Emergency Dispatch:</p>
                <p className="text-gray-300 text-xs">"Burst pipe at 420 Rogue River Hwy. Need plumber immediately." → Automatically booked into calendar & SMS sent.</p>
              </div>
              <div className="flex space-x-3">
                <button onClick={() => setStep(2)} className="w-1/2 py-3 border border-gray-800 rounded-xl text-gray-400 hover:text-white transition">Back</button>
                <button onClick={() => setStep(4)} className="w-1/2 py-3 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-400 transition">Proceed to Checkout →</button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 text-center py-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#00ffcc]/20 border border-[#00ffcc] flex items-center justify-center text-[#00ffcc] font-bold text-lg">✓</div>
              <h4 className="text-xl font-bold text-white">Storefront Provisioned Successfully</h4>
              <p className="text-sm text-gray-400 max-w-md mx-auto">Ready to deploy live for Sal, Garrett, and Ben & Jade with instant Stripe Connect integration.</p>
              <button 
                onClick={() => alert('Storefront live demo activated!')}
                className="w-full py-4 bg-[#00ffcc] text-black font-extrabold rounded-xl hover:shadow-[0_0_30px_rgba(0,255,204,0.5)] transition"
              >
                Launch Live Demo Link 🚀
              </button>
              <button onClick={() => setStep(1)} className="text-xs text-gray-500 underline hover:text-gray-300">Reset Simulator</button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
