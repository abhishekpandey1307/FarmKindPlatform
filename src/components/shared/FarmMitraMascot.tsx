// =============================================================================
// FARMKIND — FARM MITRA MASCOT AVATAR
// Friendly agrarian AI companion mascot with headset mic & seedling crown
// =============================================================================

interface FarmMitraMascotProps {
  size?: number;
  className?: string;
  isListening?: boolean;
}

export function FarmMitraMascot({ size = 56, className = '', isListening = false }: FarmMitraMascotProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 72 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`farm-mitra-avatar ${isListening ? 'farm-mitra-avatar--listening' : ''} ${className}`}
      aria-hidden="true"
    >
      <defs>
        {/* Glow & Gradient definitions */}
        <radialGradient id="mitra-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="mitra-turban" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="50%" stopColor="#16a34a" />
          <stop offset="100%" stopColor="#15803d" />
        </linearGradient>
        <linearGradient id="mitra-gold-band" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#fbbf24" />
        </linearGradient>
        <linearGradient id="mitra-face" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fed7aa" />
          <stop offset="100%" stopColor="#fdba74" />
        </linearGradient>
        <linearGradient id="mitra-headset" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
      </defs>

      {/* Outer ambient glow */}
      <circle cx="36" cy="36" r="34" fill="url(#mitra-halo)" />

      {/* Base Badge Circle */}
      <circle cx="36" cy="36" r="32" fill="#061c14" stroke="#22c55e" strokeWidth="2" strokeOpacity="0.4" />

      {/* Sprout / Seedling on Head (Sign of Growth & Agriculture) */}
      <path
        d="M36 12 C36 7, 30 5, 29 9 C28 12, 33 13, 36 13 Z"
        fill="#4ade80"
      />
      <path
        d="M36 12 C37 6, 43 5, 43 9 C43 12, 38 13, 36 13 Z"
        fill="#22c55e"
      />
      <path
        d="M36 12 L36 17"
        stroke="#15803d"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* Farmer Turban / Pagdi Cap */}
      <path
        d="M20 25 C20 17, 52 17, 52 25 C54 27, 55 31, 52 33 C49 35, 23 35, 20 33 C17 31, 18 27, 20 25 Z"
        fill="url(#mitra-turban)"
      />
      {/* Golden Pagdi Ribbon Band */}
      <path
        d="M20 30 C25 28, 47 28, 52 30 C51 32, 48 33, 36 33 C24 33, 21 32, 20 30 Z"
        fill="url(#mitra-gold-band)"
      />

      {/* Friendly Rounded Face */}
      <ellipse cx="36" cy="42" rx="16" ry="14" fill="url(#mitra-face)" />

      {/* Cheerful Sparkling Eyes */}
      <g className="mitra-eyes">
        {/* Left Eye */}
        <ellipse cx="30" cy="40" rx="2.4" ry="3.2" fill="#0f172a" />
        <circle cx="31" cy="39" r="1" fill="#ffffff" />
        
        {/* Right Eye */}
        <ellipse cx="42" cy="40" rx="2.4" ry="3.2" fill="#0f172a" />
        <circle cx="43" cy="39" r="1" fill="#ffffff" />
      </g>

      {/* Rosy Friendly Cheeks */}
      <circle cx="26" cy="44" r="2.8" fill="#f87171" opacity="0.45" />
      <circle cx="46" cy="44" r="2.8" fill="#f87171" opacity="0.45" />

      {/* Broad Friendly Smile */}
      <path
        d="M31 46 Q36 51 41 46"
        stroke="#9a3412"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />

      {/* Modern Agritech Headset & Mic */}
      {/* Headband arch on left ear */}
      <path
        d="M20 34 C19 39, 19 44, 21 47"
        stroke="url(#mitra-headset)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Earphone cup */}
      <ellipse cx="20" cy="40" rx="2.5" ry="4" fill="#0284c7" />
      {/* Mic Boom curving to mouth */}
      <path
        d="M20 42 Q23 49 32 49"
        stroke="url(#mitra-headset)"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      {/* Glowing Mic Tip */}
      <circle cx="33" cy="49" r="2.2" fill="#38bdf8" />
      <circle cx="33" cy="49" r="1" fill="#ffffff" />

      {/* Soundwaves if listening */}
      {isListening && (
        <g className="mitra-soundwaves" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" fill="none">
          <path d="M54 38 Q57 42 54 46" opacity="0.8" />
          <path d="M57 35 Q61 42 57 49" opacity="0.5" />
        </g>
      )}
    </svg>
  );
}
