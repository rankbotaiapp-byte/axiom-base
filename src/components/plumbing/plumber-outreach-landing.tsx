'use client';
import React from 'react';
export function PlumberOutreachLanding() {
  return (
    <div className="min-h-screen bg-[#050507] text-white p-8 flex flex-col items-center justify-center">
      <div className="max-w-2xl w-full bg-[#050507] border border-[#00ffcc]/30 rounded-2xl p-8 shadow-2xl text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full border-2 border-[#00ffcc] flex items-center justify-center shadow-[0_0_20px_rgba(0,255,204,0.3)]">
          <span className="text-[#00ffcc] font-mono text-xs font-bold">AXIOM</span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-wide">Plumber & Trade Growth Engine</h1>
        <p className="text-gray-400 text-sm">Never miss another emergency call with 24/7 automated booking, instant SMS routing, and live Stripe checkout.</p>
      </div>
    </div>
  );
}
export default PlumberOutreachLanding;
