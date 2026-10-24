// File: src/components/character-morph-studio.tsx
'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { traitScale, type CharacterProfile, type Traits } from '@/lib/axiom/character-morph';

interface CharacterPartner {
  id: string;
  name: string;
  gender: 'female' | 'male';
  archetype: string;
  bio: string;
  voiceManner: string;
  jobBehavior: string;
}

const PARTNERS_ROSTER: CharacterPartner[] = [
  {
    id: 'nyx-vale',
    name: 'Nyx Vale',
    gender: 'female',
    archetype: 'Neo Rogue',
    bio: 'Sharp tactical specialist with an edge for high-stakes urban environments.',
    voiceManner: 'Calm, direct, and authoritative with a low cadence.',
    jobBehavior: 'Handles customer objections instantly and secures booking commitments.',
  },
  {
    id: 'aria-vance',
    name: 'Aria Vance',
    gender: 'female',
    archetype: 'Cyber Tactical',
    bio: 'Elite cyber-security interface built for technical precision and system diagnostics.',
    voiceManner: 'Crisp, analytical, and highly articulate.',
    jobBehavior: 'Filters inbound leads and diagnoses service ticket requests seamlessly.',
  },
  {
    id: 'elena-rostova',
    name: 'Elena Rostova',
    gender: 'female',
    archetype: 'Apex Operative',
    bio: 'High-end executive strategist specializing in luxury service conversion.',
    voiceManner: 'Warm, welcoming, and impeccably professional.',
    jobBehavior: 'Manages high-ticket consultations and calendar scheduling.',
  },
  {
    id: 'lyra-vanguard',
    name: 'Lyra Vanguard',
    gender: 'female',
    archetype: 'Vanguard Titan',
    bio: 'Robust operational backbone designed for heavy industrial and contractor storefronts.',
    voiceManner: 'Steady, reassuring, and uncompromising on clarity.',
    jobBehavior: 'Dispatches emergency service crews and confirms estimate pricing.',
  },
  {
    id: 'jaxson-reed',
    name: 'Jaxson Reed',
    gender: 'male',
    archetype: 'Apex Operative',
    bio: 'Confident tech operative engineered for executive dashboards and client intake.',
    voiceManner: 'Deep, decisive, and reassuringly confident.',
    jobBehavior: 'Closes inbound inquiries and coordinates field technician dispatch.',
  },
  {
    id: 'kainen-cole',
    name: 'Kainen Cole',
    gender: 'male',
    archetype: 'Vanguard Titan',
    bio: 'Heavy infrastructure and security specialist with a commanding presence.',
    voiceManner: 'Gravelly, calm, and deliberate.',
    jobBehavior: 'Secures high-value contracts and manages on-site logistics.',
  },
  {
    id: 'dante-thorne',
    name: 'Dante Thorne',
    gender: 'male',
    archetype: 'Neo Rogue',
    bio: 'Sleek nocturnal strategist built for high-end boutique and custom builds.',
    voiceManner: 'Smooth, calculated, and engaging.',
    jobBehavior: 'Qualifies premium design leads and guides user checkouts.',
  },
  {
    id: 'ronin-vance',
    name: 'Ronin Vance',
    gender: 'male',
    archetype: 'Cyber Tactical',
    bio: 'Tactical systems analyst optimized for digital storefront automation.',
    voiceManner: 'Precise, technical, and objective.',
    jobBehavior: 'Automates customer data ingestion and real-time appointment booking.',
  }
];

export function CharacterMorphStudio() {
  const [selectedGender, setSelectedGender] = useState<'female' | 'male'>('female');
  const filteredRoster = PARTNERS_ROSTER.filter(p => p.gender === selectedGender);
  
  const [selectedIndex, setSelectedIndex] = useState(0);
  const currentPartner = filteredRoster[selectedIndex] || filteredRoster[0];

  // Storefront Desk State
  const [businessName, setBusinessName] = useState('New Era Auto & Service');
  const [greeting, setGreeting] = useState('Welcome to the desk. How can we secure your booking today?');
  const [pricing, setPricing] = useState('$150/hr diagnostic');
  const [customerQuery, setCustomerQuery] = useState('');
  const [chatLog, setChatLog] = useState<{ sender: string; text: string }[]>([]);

  // Mindset State
  const [mindsetNote, setMindsetNote] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'morph' | 'storefront' | 'mindset'>('morph');

  const handleSwitchGender = (gender: 'female' | 'male') => {
    setSelectedGender(gender);
    setSelectedIndex(0);
    setChatLog([]);
  };

  const handleNextPartner = () => {
    const nextIdx = (selectedIndex + 1) % filteredRoster.length;
    setSelectedIndex(nextIdx);
    setChatLog([]);
  };

  const handlePrevPartner = () => {
    const prevIdx = (selectedIndex - 1 + filteredRoster.length) % filteredRoster.length;
    setSelectedIndex(prevIdx);
    setChatLog([]);
  };

  const handlePlayGreeting = () => {
    setChatLog([{ sender: currentPartner.name, text: greeting }]);
  };

  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerQuery.trim()) return;

    const userText = customerQuery;
    setCustomerQuery('');

    let responseText = '';
    if (!pricing.trim() && (userText.toLowerCase().includes('cost') || userText.toLowerCase().includes('price'))) {
      responseText = `${currentPartner.name}: Pricing is currently pending review for ${businessName}.`;
    } else {
      responseText = `${currentPartner.name}: Acknowledged at ${businessName}. Pricing guide: ${pricing || 'Pending'}. Let's get your slot confirmed.`;
    }

    setChatLog(prev => [
      ...prev,
      { sender: 'Customer', text: userText },
      { sender: currentPartner.name, text: responseText }
    ]);
  };

  const triggerMindsetNote = (type: 'Stress Reset' | 'Daily Strategy' | 'Workflow Optimization') => {
    if (type === 'Stress Reset') {
      setMindsetNote(`[Stress Reset - ${currentPartner.name}]: Lower your shoulders, take a deep breath. Focus solely on the immediate operational blocker. You are building structural generational wealth; isolate the current task and clear the static.`);
    } else if (type === 'Daily Strategy') {
      setMindsetNote(`[Daily Strategy - ${currentPartner.name}]: Protect your focus window. Execute high-leverage client acquisition early, automate outreach queues via Axiom, and eliminate low-value friction before noon.`);
    } else {
      setMindsetNote(`[Workflow Optimization - ${currentPartner.name}]: Streamline your Supabase and Vercel deployment loops. Keep UI components modular and eliminate redundant state re-renders.`);
    }
  };

  return (
    <div className="relative w-full min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col items-center justify-start overflow-hidden font-sans">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/20 via-slate-950 to-purple-950/20 pointer-events-none" />

      {/* Header & Mode Selectors */}
      <div className="relative z-10 w-full max-w-7xl mb-6 flex flex-col md:flex-row justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500">
            AXIOM // HOLOGRAPHIC COMPANION & MORPH STUDIO
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Active Partner: <span className="text-cyan-300 font-bold">{currentPartner.name}</span> ({currentPartner.archetype})
          </p>
        </div>

        <div className="mt-4 md:mt-0 flex gap-2">
          {(['morph', 'storefront', 'mindset'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs uppercase tracking-widest font-bold rounded-lg border transition-all cursor-pointer ${
                activeTab === tab
                  ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                  : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main Studio Container */}
      <div className="relative z-10 w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Partner Roster & Swiping */}
        <div className="lg:col-span-3 flex flex-col gap-4 bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="flex justify-between items-center">
            <h2 className="text-xs uppercase tracking-widest text-cyan-400 font-bold">Roster Catalog</h2>
            <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => handleSwitchGender('female')}
                className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all cursor-pointer ${
                  selectedGender === 'female' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
                }`}
              >
                Female
              </button>
              <button
                onClick={() => handleSwitchGender('male')}
                className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all cursor-pointer ${
                  selectedGender === 'male' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
                }`}
              >
                Male
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handlePrevPartner}
              className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold border border-slate-700 transition-all cursor-pointer"
            >
              ← Prev
            </button>
            <button
              onClick={handleNextPartner}
              className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold border border-slate-700 transition-all cursor-pointer"
            >
              Next →
            </button>
          </div>

          <div className="flex flex-col gap-2 max-h-[450px] overflow-y-auto pr-1">
            {filteredRoster.map((partner, idx) => (
              <div
                key={partner.id}
                onClick={() => {
                  setSelectedIndex(idx);
                  setChatLog([]);
                }}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col gap-1 ${
                  selectedIndex === idx
                    ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
                    : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-200">{partner.name}</span>
                  <span className="text-[10px] text-cyan-400 font-mono">{partner.archetype}</span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2">{partner.bio}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Center Column: 3D Holographic Stage */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl p-6 relative min-h-[420px] shadow-2xl flex flex-col items-center justify-center">
            
            {/* Holographic Header Bar */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-center px-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest">Hologram 3D Projection Live</span>
              </div>
              <span className="text-[10px] font-mono text-fuchsia-400 bg-fuchsia-950/40 px-2 py-0.5 rounded border border-fuchsia-500/30">
                CRT Scanline Active
              </span>
            </div>

            {/* 3D Holographic Stage Container */}
            <motion.div
              whileHover={{ scale: 1.02, rotateX: 2, rotateY: -2 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="relative w-full max-w-xs h-[360px] rounded-2xl overflow-hidden border border-cyan-500/50 shadow-[0_0_40px_rgba(6,182,212,0.25)] flex items-center justify-center bg-slate-950 mt-6 group cursor-pointer"
            >
              {/* CRT Scanline Overlay */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.4)_50%)] bg-[length:100%_4px] pointer-events-none z-30 opacity-60" />

              {/* Iridescent Holographic Foil Shimmer */}
              <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 via-transparent to-fuchsia-500/10 pointer-events-none z-20 group-hover:opacity-100 transition-opacity" />

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPartner.id}
                  initial={{ opacity: 0, scale: 0.95, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, scale: 1.05, filter: 'blur(8px)' }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 flex flex-col justify-end p-6 text-left z-10"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent z-10" />
                  
                  {/* Holographic glowing perimeter border inside stage */}
                  <div className="absolute inset-2 border border-cyan-400/20 rounded-xl pointer-events-none" />

                  <div className="relative z-20">
                    <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.4)]">
                      {currentPartner.archetype}
                    </span>
                    <h3 className="text-xl font-bold mt-2 text-white text-glow">{currentPartner.name}</h3>
                    <p className="text-xs text-cyan-200 mt-1 italic font-mono">{currentPartner.voiceManner}</p>
                    <p className="text-[11px] text-fuchsia-400 font-mono mt-2">{currentPartner.voiceManner}</p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Active Tab Content Panel */}
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl">
            {activeTab === 'morph' && (
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs uppercase tracking-widest text-cyan-400 font-bold">Job Behavior Protocol</h3>
                </div>
                <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800 font-mono">
                  {currentPartner.jobBehavior}
                </p>
              </div>
            )}

            {activeTab === 'storefront' && (
              <div className="flex flex-col gap-4">
                <h3 className="text-xs uppercase tracking-widest text-cyan-400 font-bold">Storefront Customer Desk</h3>
                
                <div className="flex gap-2">
                  <button
                    onClick={handlePlayGreeting}
                    className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold rounded-xl border border-cyan-500/40 transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                  >
                    Play Hologram Greeting
                  </button>
                </div>

                {chatLog.length > 0 && (
                  <div className="flex flex-col gap-2 max-h-36 overflow-y-auto bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                    {chatLog.map((c, i) => (
                      <div key={i} className="text-xs font-mono">
                        <span className="font-bold text-cyan-400">{c.sender}:</span> <span className="text-slate-300">{c.text}</span>
                      </div>
                    ))}
                  </div>
                )}

                <form onSubmit={handleCustomerSubmit} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ask a question the way a customer would..."
                    value={customerQuery}
                    onChange={(e) => setCustomerQuery(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                  />
                  <button type="submit" className="cursor-pointer rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold">
                    Ask
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'mindset' && (
              <div className="flex flex-col gap-3">
                <h3 className="text-xs uppercase tracking-widest text-cyan-400 font-bold">Stress and Mindset</h3>
                {(['Stress Reset', 'Daily Strategy', 'Workflow Optimization'] as const).map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => triggerMindsetNote(prompt)}
                    className="cursor-pointer rounded-xl border border-slate-700 bg-slate-950 py-2 text-xs font-bold text-slate-200"
                  >
                    {prompt}
                  </button>
                ))}
                {mindsetNote ? <p className="text-xs leading-5 text-slate-300">{mindsetNote}</p> : null}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-3 flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-400">Desk notes</h2>
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase text-slate-400">Business Name</span>
            <input value={businessName} onChange={(event) => setBusinessName(event.target.value)} className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-200" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase text-slate-400">Greeting Note</span>
            <input value={greeting} onChange={(event) => setGreeting(event.target.value)} className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-200" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase text-slate-400">Pricing Rules</span>
            <input value={pricing} onChange={(event) => setPricing(event.target.value)} className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-200" />
          </label>
        </div>
      </div>
    </div>
  );
}

export function CharacterBust({ profile, traits }: { profile: CharacterProfile; traits: Traits }) {
  const reduce = useReducedMotion();
  const transition = reduce ? { duration: 0 } : { type: 'spring' as const, stiffness: 280, damping: 30 };
  const origin = { transformBox: 'fill-box' as const, transformOrigin: 'center' };
  const frame = profile.frame === 'block' ? 1.06 : 0.94;

  return (
    <svg viewBox="0 0 200 260" className="h-full w-full" aria-hidden="true">
      <motion.path
        d="M54 214c8 16 84 16 92 0-18 18-74 18-92 0z"
        fill={profile.armor}
        stroke={profile.trim}
        animate={{ scaleX: traitScale(traits.glutes, 0.8, 1.3) }}
        style={origin}
        transition={transition}
      />
      <motion.path
        d="M64 146h72l12 52H52z"
        fill={profile.armor}
        stroke={profile.trim}
        animate={{ scaleY: traitScale(traits.chest, 0.88, 1.18) }}
        style={origin}
        transition={transition}
      />
      <motion.path
        d="M22 112h156l-22 34H44z"
        fill={profile.armor}
        stroke={profile.trim}
        animate={{ scaleX: traitScale(traits.shoulders, 0.76, 1.22) * frame }}
        style={origin}
        transition={transition}
      />
      <ellipse cx="100" cy="78" rx="30" ry="34" fill={profile.skin} />
      <motion.path
        d="M76 92c8 18 40 18 48 0-10 10-38 10-48 0z"
        fill={profile.skin}
        animate={{ scaleX: traitScale(traits.jaw, 0.74, 1.3) }}
        style={origin}
        transition={transition}
      />
      <motion.rect
        x="90"
        y="102"
        width="20"
        height="4"
        rx="2"
        fill={profile.lip}
        animate={{ scaleX: traitScale(traits.lips, 0.7, 1.55), scaleY: traitScale(traits.lips, 0.65, 1.8) }}
        style={origin}
        transition={transition}
      />
    </svg>
  );
}