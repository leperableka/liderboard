import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => setExiting(true), 1200);
    const doneTimer = setTimeout(() => onComplete(), 1600);
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'linear-gradient(160deg, #f5a623 0%, #e8920a 40%, #c9730a 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        opacity: exiting ? 0 : 1,
        transform: exiting ? 'scale(1.04)' : 'scale(1)',
        transition: exiting ? 'opacity 0.5s ease, transform 0.5s ease' : 'none',
        pointerEvents: exiting ? 'none' : 'all',
      }}
    >
      <style>{`
        @keyframes splashLogoIn {
          0%   { transform: scale(0.2);    opacity: 0; }
          60%  { transform: scale(1.14);   opacity: 1; }
          80%  { transform: scale(0.94);   opacity: 1; }
          100% { transform: scale(1);      opacity: 1; }
        }
        @keyframes splashGlow {
          0%   { box-shadow: 0 0 0 0   rgba(255,255,255,0.55), 0 8px 32px rgba(0,0,0,0.2); }
          60%  { box-shadow: 0 0 0 20px rgba(255,255,255,0),   0 8px 32px rgba(0,0,0,0.2); }
          100% { box-shadow: 0 0 0 0   rgba(255,255,255,0),   0 8px 32px rgba(0,0,0,0.2); }
        }
        @keyframes splashBrandIn {
          0%   { transform: translateY(18px); opacity: 0; }
          100% { transform: translateY(0);    opacity: 1; }
        }
        @keyframes splashSubIn {
          0%   { transform: translateY(12px); opacity: 0; }
          100% { transform: translateY(0);    opacity: 1; }
        }
        @keyframes splashDotPulse {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40%            { transform: scale(1.0); opacity: 1; }
        }
      `}</style>

      {/* Logo: outer div holds glow (box-shadow respects border-radius),
          inner div clips image to same radius */}
      <div
        style={{
          width: 108,
          height: 108,
          borderRadius: '50%',
          flexShrink: 0,
          animation: 'splashLogoIn 0.7s cubic-bezier(0.22,1,0.36,1) forwards, splashGlow 0.9s ease 0.65s 1',
        }}
      >
        <div
          style={{
            width: 108,
            height: 108,
            borderRadius: '50%',
            overflow: 'hidden',
            display: 'block',
          }}
        >
          <img
            src="/logo.svg"
            alt="Логотип"
            style={{ width: 108, height: 108, display: 'block' }}
          />
        </div>
      </div>

      {/* Brand name */}
      <div style={{ textAlign: 'center', animation: 'splashBrandIn 0.5s ease 0.5s both' }}>
        <div
          style={{
            fontSize: 24,
            fontWeight: 800,
            color: '#fff',
            letterSpacing: '-0.4px',
            textShadow: '0 2px 12px rgba(0,0,0,0.18)',
            fontFamily: 'var(--font)',
          }}
        >
          Vesperfin&amp;Co.Trading
        </div>
        <div
          style={{
            fontSize: 12,
            color: 'rgba(255,255,255,0.8)',
            marginTop: 6,
            letterSpacing: '2.5px',
            textTransform: 'uppercase',
            fontFamily: 'var(--font)',
            animation: 'splashSubIn 0.5s ease 0.7s both',
          }}
        >
          Торговый Чемпионат
        </div>
      </div>

      {/* Loading dots */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          animation: 'splashSubIn 0.4s ease 0.9s both',
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.9)',
              animation: `splashDotPulse 1.1s ease ${0.9 + i * 0.18}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
};
