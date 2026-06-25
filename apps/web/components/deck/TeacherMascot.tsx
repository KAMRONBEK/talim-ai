'use client';

/**
 * An in-house 2D teacher mascot (pure SVG/CSS — no Lottie asset or external
 * service). The mouth opens via the `--mouth` CSS variable (0..1) which the
 * video player drives in real time from the narration audio's amplitude
 * (Web Audio AnalyserNode), so the character lip-syncs to the voice-over.
 * Idle blink + gentle bob keep it lively when paused.
 */
export function TeacherMascot({ speaking = false }: { speaking?: boolean }) {
  return (
    <div className={`tm-root ${speaking ? 'tm-speaking' : ''}`} aria-hidden>
      <style>{`
        .tm-root { width: 100%; height: 100%; }
        .tm-bob { animation: tm-bob 3.2s ease-in-out infinite; transform-origin: 50% 100%; }
        .tm-speaking .tm-bob { animation-duration: 2s; }
        @keyframes tm-bob { 0%,100% { transform: translateY(0) rotate(0deg);} 50% { transform: translateY(-4px) rotate(-1.2deg);} }
        .tm-eye { animation: tm-blink 4.6s infinite; transform-box: fill-box; transform-origin: center; }
        @keyframes tm-blink { 0%,6%,100% { transform: scaleY(1);} 3% { transform: scaleY(0.1);} }
        .tm-mouth { transform-box: fill-box; transform-origin: center; transform: scaleY(var(--mouth, 0.12)); transition: transform 60ms linear; }
        .tm-glow { opacity: 0; transition: opacity .25s ease; }
        .tm-speaking .tm-glow { opacity: 1; animation: tm-pulse 1.4s ease-in-out infinite; }
        @keyframes tm-pulse { 0%,100% { transform: scale(1); opacity:.35;} 50% { transform: scale(1.06); opacity:.6;} }
      `}</style>
      <svg viewBox="0 0 200 230" className="h-full w-full overflow-visible drop-shadow-[0_8px_20px_rgba(0,0,0,0.35)]">
        <defs>
          <linearGradient id="tm-skin" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fde7c9" />
            <stop offset="1" stopColor="#f4cfa3" />
          </linearGradient>
          <linearGradient id="tm-cap" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#7c5cff" />
            <stop offset="1" stopColor="#5b3fd6" />
          </linearGradient>
        </defs>

        {/* speaking glow */}
        <circle className="tm-glow" cx="100" cy="120" r="78" fill="#7c5cff" style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />

        <g className="tm-bob">
          {/* shoulders / body */}
          <path d="M44 230 Q44 176 100 176 Q156 176 156 230 Z" fill="#5b3fd6" />
          <path d="M86 178 h28 v14 a14 14 0 0 1 -28 0 Z" fill="url(#tm-skin)" />

          {/* head */}
          <circle cx="100" cy="112" r="60" fill="url(#tm-skin)" />
          {/* ears */}
          <circle cx="42" cy="112" r="10" fill="url(#tm-skin)" />
          <circle cx="158" cy="112" r="10" fill="url(#tm-skin)" />

          {/* glasses */}
          <g stroke="#3b2f6b" strokeWidth="4" fill="#ffffff" fillOpacity="0.85">
            <circle cx="80" cy="104" r="17" />
            <circle cx="120" cy="104" r="17" />
          </g>
          <line x1="97" y1="104" x2="103" y2="104" stroke="#3b2f6b" strokeWidth="4" />

          {/* eyes (blink) */}
          <circle className="tm-eye" cx="80" cy="104" r="6" fill="#2b2440" />
          <circle className="tm-eye" cx="120" cy="104" r="6" fill="#2b2440" />

          {/* eyebrows */}
          <path d="M68 86 q12 -7 24 -1" stroke="#7a5230" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M108 85 q12 -6 24 1" stroke="#7a5230" strokeWidth="4" fill="none" strokeLinecap="round" />

          {/* mouth (lip-sync) */}
          <ellipse className="tm-mouth" cx="100" cy="140" rx="16" ry="13" fill="#a23b4e" />
          <ellipse className="tm-mouth" cx="100" cy="143" rx="9" ry="6" fill="#e07a8b" />

          {/* graduation cap */}
          <g>
            <polygon points="100,42 168,66 100,90 32,66" fill="url(#tm-cap)" />
            <rect x="86" y="64" width="28" height="14" rx="3" fill="#5b3fd6" />
            <line x1="160" y1="68" x2="160" y2="96" stroke="#ffd34e" strokeWidth="3" />
            <circle cx="160" cy="98" r="5" fill="#ffd34e" />
          </g>
        </g>
      </svg>
    </div>
  );
}
