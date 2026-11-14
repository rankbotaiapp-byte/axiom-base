'use client';
import React from 'react';
export function OutreachCheckoutModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-[#050507] border border-[#00ffcc]/40 rounded-2xl p-6 max-w-md w-full text-white shadow-2xl">
        <h3 className="text-xl font-bold text-[#00ffcc] mb-2">Axiom Founder Provisioning</h3>
        <p className="text-gray-400 text-sm mb-4">Instant Stripe Connect 24/7 booking activation for local trade contractors.</p>
        <button onClick={onClose} className="w-full py-3 bg-[#00ffcc] text-black font-bold rounded-xl hover:bg-[#00ffcc]/90 transition">Close</button>
      </div>
    </div>
  );
}
export default OutreachCheckoutModal;
