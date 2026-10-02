import { useEffect, useState } from 'react';

export default function Preloader({ onComplete }) {
  const [phase, setPhase] = useState('visible');

  // Trigger exit after 1.25s
  useEffect(() => {
    const t = setTimeout(() => setPhase('exit'), 1250);
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
        background: 'rgba(245,245,245,0.45)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        opacity: isExiting ? 0 : 1,
        transform: isExiting ? 'scale(1.03)' : 'scale(1)',
        transition: 'opacity 0.65s cubic-bezier(0.4,0,0.2,1), transform 0.65s cubic-bezier(0.4,0,0.2,1)',
        pointerEvents: isExiting ? 'none' : 'all',
      }}
    >
      <div className="loader" />

      <style>{`
        .loader {
          width: fit-content;
          font-weight: bold;
          font-family: monospace;
          font-size: 30px;
          background: radial-gradient(circle closest-side, #000 94%, #0000) right / calc(200% - 1em) 100%;
          animation: l24 1s infinite alternate linear;
        }

        .loader::before {
          content: "Loading...";
          line-height: 1em;
          color: #0000;
          background: inherit;
          background-image: radial-gradient(circle closest-side, #fff 94%, #000);
          -webkit-background-clip: text;
          background-clip: text;
        }

        @keyframes l24 {
          100% {
            background-position: left;
          }
        }
      `}</style>
    </div>
  );
}
