/** Tactical radar insignia inside a gear ring. Pure SVG + CSS animation. */
export default function RadarLogo({ size = 40 }: { size?: number }) {
  return (
    <span className="relative inline-block shrink-0" style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 48 48" className="absolute inset-0 h-full w-full">
        {/* gear teeth */}
        <circle cx="24" cy="24" r="21" fill="none" stroke="#00ffcc" strokeWidth="4" strokeDasharray="4.1 4.1" />
        <circle cx="24" cy="24" r="18.5" fill="#030712" stroke="#00ffcc" strokeWidth="1.5" />
        <circle cx="24" cy="24" r="12" fill="none" stroke="rgba(0,255,204,.45)" strokeWidth="1" />
        <circle cx="24" cy="24" r="6" fill="none" stroke="rgba(0,255,204,.45)" strokeWidth="1" />
        <path d="M24 6.5v35M6.5 24h35" stroke="rgba(0,255,204,.35)" strokeWidth="1" />
        <circle cx="30" cy="17" r="1.6" fill="#99ffef" className="animate-blink" />
      </svg>
      {/* sweep */}
      <span className="absolute inset-[17%] overflow-hidden rounded-full">
        <span
          className="absolute inset-0 animate-sweep rounded-full"
          style={{ background: 'conic-gradient(from 0deg, rgba(0,255,204,.75), rgba(0,255,204,0) 70deg)' }}
        />
      </span>
    </span>
  );
}
