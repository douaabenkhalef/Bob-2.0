// AutoFix AI Logo — inline SVG component matching the brand image
// Blue-to-purple gradient "A" with sparkle, on dark rounded background

export default function AutoFixLogo({ size = 48, showText = true }) {
  return (
    <div className="flex items-center gap-3">
      <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="logoGradLeft" x1="20" y1="20" x2="60" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#e0eaff" />
            <stop offset="100%" stopColor="#7eb3ff" />
          </linearGradient>
          <linearGradient id="logoGradRight" x1="100" y1="20" x2="60" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#7eb3ff" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
          <linearGradient id="glowGrad" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.1" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {/* Background rounded square */}
        <rect width="120" height="120" rx="26" fill="#070d1f" />
        <rect width="120" height="120" rx="26" fill="url(#glowGrad)" />
        {/* Left leg of A */}
        <path d="M22 92 L54 22 L62 22 L36 92 Z" fill="url(#logoGradLeft)" filter="url(#glow)" />
        {/* Right leg of A */}
        <path d="M98 92 L66 22 L58 22 L84 92 Z" fill="url(#logoGradRight)" filter="url(#glow)" />
        {/* Crossbar */}
        <path d="M38 66 L82 66 L78 76 L42 76 Z" fill="url(#logoGradRight)" opacity="0.7" />
        {/* Sparkle center */}
        <g filter="url(#glow)">
          <path d="M60 52 L62.5 58 L60 64 L57.5 58 Z" fill="white" opacity="0.95" />
          <path d="M54 58 L60 55.5 L66 58 L60 60.5 Z" fill="white" opacity="0.95" />
        </g>
        {/* Outer glow ring */}
        <rect width="120" height="120" rx="26" fill="none" stroke="#3b82f6" strokeWidth="1.5" opacity="0.4" />
      </svg>

      {showText && (
        <span className="text-xl font-bold tracking-tight select-none">
          <span className="text-white">Auto</span>
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Fix AI</span>
        </span>
      )}
    </div>
  );
}
