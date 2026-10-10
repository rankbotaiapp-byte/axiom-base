import React, { useState } from 'react';

interface OnboardingVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopName: string;
}

export const OnboardingVideoModal: React.FC<OnboardingVideoModalProps> = ({
  isOpen,
  onClose,
  shopName,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      {/* Modal Container with Neon Border Accent */}
      <div className="relative w-full max-w-2xl bg-zinc-950 border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden p-6 text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-cyan-400">
              Welcome to New Era Apps, {shopName}
            </h3>
            <p className="text-sm text-zinc-400">
              Personalized setup guidance from Eric Mullen
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors p-2 rounded-lg bg-zinc-900/50 hover:bg-zinc-800"
          >
            ✕
          </button>
        </div>

        {/* Video Player Container with Dark Framing */}
        <div className="relative aspect-video w-full bg-black rounded-xl overflow-hidden border border-zinc-800 shadow-inner">
          <video
            className="w-full h-full object-cover"
            controls
            autoPlay
            playsInline
            src="https://resource2.heygen.ai/video/34551d5a335c4ec5b5f3f6693e3ee5b8/video.mp4"
          >
            Your browser does not support the video tag.
          </video>
        </div>

        {/* Action Footer */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-zinc-900">
          <p className="text-xs text-zinc-500 text-center sm:text-left">
            Need direct human help? Your direct support line is active below.
          </p>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-xl transition-all shadow-lg shadow-cyan-500/20"
          >
            Continue to Setup Dashboard
          </button>
        </div>

      </div>
    </div>
  );
};