import { useEffect, useState } from 'react';

export default function Preloader({ onComplete }) {
  const [phase, setPhase] = useState('enter'); // 'enter' | 'visible' | 'exit'

  useEffect(() => {
    // Show for ~1.8s then trigger exit
    const visibleTimer = setTimeout(() => setPhase('exit'), 1800);
    return () => clearTimeout(visibleTimer);
  }, []);

  useEffect(() => {
    if (phase === 'exit') {
      // Wait for exit animation to finish, then unmount
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
        background: '#0a0a0a',
        opacity: phase === 'exit' ? 0 : 1,
        transform: phase === 'exit' ? 'scale(1.04)' : 'scale(1)',
        transition: 'opacity 0.65s cubic-bezier(0.4,0,0.2,1), transform 0.65s cubic-bezier(0.4,0,0.2,1)',
        pointerEvents: phase === 'exit' ? 'none' : 'all',
      }}
    >
      {/* Subtle radial glow behind logo */}
      <div
        className="absolute"
        style={{
          width: 340,
          height: 340,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)',
          filter: 'blur(32px)',
          animation: 'preloader-pulse 2s ease-in-out infinite',
        }}
      />

      {/* Logo + brand */}
      <div
        className="relative flex flex-col items-center gap-6"
        style={{
          opacity: phase === 'enter' ? 0 : 1,
          transform: phase === 'enter' ? 'translateY(16px)' : 'translateY(0)',
          transition: 'opacity 0.6s ease, transform 0.6s ease',
        }}
      >
        {/* Logo mark */}
        <div className="relative flex items-center justify-center">
          {/* Spinning ring */}
          <svg
            width="72"
            height="72"
            viewBox="0 0 72 72"
            style={{ animation: 'preloader-spin 1.6s linear infinite', position: 'absolute' }}
          >
            <circle cx="36" cy="36" r="32" fill="none" stroke="#1a1a1a" strokeWidth="2" />
            <circle
              cx="36"
              cy="36"
              r="32"
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
              strokeDasharray="50 151"
              strokeLinecap="round"
            />
          </svg>
          {/* Logo */}
          <img
            src="/logo-white.png"
            alt="Trainer Firm"
            style={{ height: 36, width: 'auto', objectFit: 'contain', position: 'relative', zIndex: 1 }}
          />
        </div>

        {/* Brand text */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-baseline gap-[3px]">
            <span
              style={{
                fontSize: 20,
                fontWeight: 900,
                letterSpacing: '-0.03em',
                color: '#ffffff',
                fontFamily: 'sans-serif',
              }}
            >
              TRAINER
            </span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '0.02em',
                color: '#71717a',
                fontFamily: 'sans-serif',
              }}
            >
              FIRM
            </span>
          </div>

          {/* Animated tagline */}
          <p
            style={{
              fontSize: 12,
              color: '#52525b',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              fontFamily: 'sans-serif',
              fontWeight: 500,
            }}
          >
            Finding the right trainer for you
            <span style={{ animation: 'preloader-dots 1.4s steps(4,end) infinite' }} />
          </p>
        </div>

        {/* Progress bar */}
        <div
          style={{
            width: 160,
            height: 2,
            background: '#1a1a1a',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
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
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.08); }
        }
        @keyframes preloader-bar {
          0%   { width: 0%; }
          60%  { width: 80%; }
          100% { width: 100%; }
        }
        @keyframes preloader-dots {
          0%  { content: ''; }
          25% { content: '.'; }
          50% { content: '..'; }
          75% { content: '...'; }
        }
      `}</style>
    </div>
  );
}
