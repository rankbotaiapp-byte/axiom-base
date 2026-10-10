import React from 'react';

interface OnboardingVideoModalProps {
  isOpen: boolean;
  shopName: string;
  onClose: () => void;
}

export const OnboardingVideoModal: React.FC<OnboardingVideoModalProps> = ({
  isOpen,
  shopName,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      {/* Modal Container with Dark Neon Border Accent */}
      <div className="relative w-full max-w-2xl bg-zinc-950 border border-cyan-500/40 rounded-xl shadow-2xl p-6 overflow-hidden">
        
        {/* Header with Dynamic Business Name */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-cyan-400">
              Custom software architecture built specifically for {shopName || 'your business'} in record time.
            </h3>
            <p className="text-sm text-zinc-400 mt-1">
              Precision-built application framework tailored to your exact operational workflow.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors p-2 rounded-lg"
          >
            ✕
          </button>
        </div>

        {/* Video Player */}
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border border-zinc-800 mb-6">
          <video
            src="/media/heroes/setup-complete.mp4"
            controls
            autoPlay
            className="w-full h-full object-cover"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-semibold rounded-lg transition-colors"
          >
            Enter Main Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};