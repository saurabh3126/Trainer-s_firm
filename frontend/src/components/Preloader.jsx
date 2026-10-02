import { useEffect, useState } from 'react';

export default function Preloader({ onComplete }) {
  const [phase, setPhase] = useState('visible'); // skip 'enter', show immediately

  useEffect(() => {
    const visibleTimer = setTimeout(() => setPhase('exit'), 1800);
    return () => clearTimeout(visibleTimer);
  }, []);

  useEffect(() => {
    if (phase === 'exit') {
      const exitTimer = setTimeout(() => {
        if (onComplete) onComplete();
      }, 700);
      return () => clearTimeout(exitTimer);
    }
  }, [phase, onComplete]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{
        background: '#f5f5f5',
        opacity: phase === 'exit' ? 0 : 1,
        transform: phase === 'exit' ? 'scale(1.02)' : 'scale(1)',
        transition: 'opacity 0.65s cubic-bezier(0.4,0,0.2,1), transform 0.65s cubic-bezier(0.4,0,0.2,1)',
        pointerEvents: phase === 'exit' ? 'none' : 'all',
      }}
    >
      {/* Subtle radial glow */}
      <div
        className="absolute"
        style={{
          width: 340,
          height: 340,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)',
          filter: 'blur(40px)',
          animation: 'preloader-pulse 2s ease-in-out infinite',
        }}
      />

      {/* Logo + brand — visible immediately */}
      <div className="relative flex flex-col items-center gap-6">
        {/* Logo mark */}
        <div className="relative flex items-center justify-center">
          {/* Spinning emerald ring */}
          <svg
            width="80"
            height="80"
            viewBox="0 0 80 80"
            style={{ animation: 'preloader-spin 1.6s linear infinite', position: 'absolute' }}
          >
            <circle cx="40" cy="40" r="36" fill="none" stroke="#e5e7eb" strokeWidth="2" />
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeDasharray="55 171"
              strokeLinecap="round"
            />
          </svg>
          {/* Logo — dark version since bg is light */}
          <img
            src="/logo-mark.png"
            alt="Trainer Firm"
            style={{ height: 36, width: 'auto', objectFit: 'contain', position: 'relative', zIndex: 1 }}
          />
        </div>

        {/* Brand text */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-baseline gap-[3px]">
            <span style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.03em', color: '#0a0a0a', fontFamily: 'sans-serif' }}>
              TRAINER
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.02em', color: '#71717a', fontFamily: 'sans-serif' }}>
              FIRM
            </span>
          </div>

          {/* Tagline */}
          <p style={{ fontSize: 11, color: '#9ca3af', letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: 'sans-serif', fontWeight: 500 }}>
            Finding the right trainer for you
          </p>
        </div>

        {/* Progress bar */}
        <div style={{ width: 160, height: 2, background: '#e5e7eb', borderRadius: 2, overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, #10b981, #6ee7b7)',
              borderRadius: 2,
              animation: 'preloader-bar 1.8s cubic-bezier(0.4,0,0.2,1) forwards',
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes preloader-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes preloader-pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.08); }
        }
        @keyframes preloader-bar {
          0%   { width: 0%; }
          60%  { width: 80%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}
