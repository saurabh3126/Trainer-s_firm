import { useEffect, useState } from 'react';

const LETTERS = ['T','R','A','I','N','E','R',' ','F','I','R','M'];

export default function Preloader({ onComplete }) {
  const [phase, setPhase] = useState('visible');
  const [litCount, setLitCount] = useState(0);

  // Stagger-light each letter
  useEffect(() => {
    const timers = LETTERS.map((_, i) =>
      setTimeout(() => setLitCount(i + 1), 120 + i * 100)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  // Trigger exit after 2s
  useEffect(() => {
    const t = setTimeout(() => setPhase('exit'), 1500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (phase === 'exit') {
      const t = setTimeout(() => { if (onComplete) onComplete(); }, 700);
      return () => clearTimeout(t);
    }
  }, [phase, onComplete]);

  const isExiting = phase === 'exit';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 36,
        background: 'rgba(245,245,245,0.45)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        opacity: isExiting ? 0 : 1,
        transform: isExiting ? 'scale(1.03)' : 'scale(1)',
        transition: 'opacity 0.65s cubic-bezier(0.4,0,0.2,1), transform 0.65s cubic-bezier(0.4,0,0.2,1)',
        pointerEvents: isExiting ? 'none' : 'all',
      }}
    >
      {/* Big logo — standalone, no circle */}
      <img
        src="/logo-mark.png"
        alt="Trainer Firm"
        style={{
          height: 90,
          width: 'auto',
          objectFit: 'contain',
          filter: 'drop-shadow(0 4px 24px rgba(16,185,129,0.18))',
          animation: 'pl-float 3s ease-in-out infinite',
        }}
      />

      {/* Staggered letters */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
        {LETTERS.map((letter, i) => (
          <span
            key={i}
            style={{
              display: 'inline-block',
              fontSize: letter === ' ' ? 12 : i < 7 ? 28 : 18,
              fontWeight: i < 7 ? 900 : 700,
              letterSpacing: i < 7 ? '-0.04em' : '0.02em',
              color: i < litCount ? '#0a0a0a' : 'rgba(0,0,0,0.12)',
              transition: 'color 0.3s ease',
              fontFamily: 'sans-serif',
              lineHeight: 1,
              marginLeft: letter === ' ' ? 4 : 0,
            }}
          >
            {letter === ' ' ? '\u00a0' : letter}
          </span>
        ))}
      </div>

      {/* Expanding emerald line */}
      <div style={{ position: 'relative', width: 200, height: 2, overflow: 'hidden', borderRadius: 2, background: 'rgba(0,0,0,0.07)' }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, #0a0a0a, #525252, #0a0a0a)',
            backgroundSize: '200% 100%',
            borderRadius: 2,
            animation: 'pl-bar 2s cubic-bezier(0.4,0,0.2,1) forwards, pl-shimmer 1.2s ease infinite',
          }}
        />
      </div>

      {/* Tagline */}
      <p style={{
        fontSize: 10,
        color: '#9ca3af',
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        fontFamily: 'sans-serif',
        fontWeight: 500,
        marginTop: -16,
      }}>
        Connecting trainers & vendors
      </p>

      <style>{`
        @keyframes pl-float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-6px); }
        }
        @keyframes pl-bar {
          0%   { width: 0%; }
          60%  { width: 85%; }
          100% { width: 100%; }
        }
        @keyframes pl-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
