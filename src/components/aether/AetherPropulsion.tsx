'use client';
import React from 'react';
import { motion } from 'framer-motion';

export function AetherPropulsion() {
  return (
    <div className="relative w-full py-12 bg-[#050507] overflow-hidden border border-[#00ffcc]/20 rounded-2xl p-8 shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-r from-[#00ffcc]/10 via-transparent to-amber-500/10 pointer-events-none" />
      <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-4">
        <motion.div 
          animate={{ scale: [1, 1.05, 1], rotate: [0, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="w-24 h-24 rounded-full border-2 border-[#00ffcc] shadow-[0_0_30px_rgba(0,255,204,0.4)] flex items-center justify-center bg-[#050507]/80"
        >
          <div className="w-16 h-16 rounded-full border border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.4)] flex items-center justify-center">
            <span className="text-[#00ffcc] font-mono text-xs font-bold tracking-widest">AETHER</span>
          </div>
        </motion.div>
        <h3 className="text-xl font-bold text-white tracking-wider">Aether Propulsion Core Active</h3>
        <p className="text-gray-400 text-sm max-w-md">Synchronizing 24/7 autonomous lead capture, haptic gyro telemetry, and high-velocity storefront rendering.</p>
      </div>
    </div>
  );
}
export default AetherPropulsion;