'use client';
import React from 'react';
export function PricingSettings() {
  return (
    <div className="p-6 bg-[#050507] text-white border border-[#00ffcc]/30 rounded-xl shadow-xl">
      <h3 className="text-lg font-bold text-[#00ffcc] mb-2">Axiom Pricing & Billing Settings</h3>
      <p className="text-gray-400 text-sm">Stripe Connect 1.5% split and Choose Your Price trial configuration active.</p>
    </div>
  );
}
export default PricingSettings;
