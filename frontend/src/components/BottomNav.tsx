import React from 'react';
import type { Screen } from '../types';

interface BottomNavProps {
  current: 'leaderboard' | 'history' | 'profile';
  onNavigate: (screen: Screen) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ current, onNavigate }) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-around',
      padding: '4px 0 22px',
    }}
  >
    <button
      className={`bottom-tab${current === 'leaderboard' ? ' active' : ''}`}
      onClick={() => onNavigate('leaderboard')}
      aria-label="Лидерборд"
      aria-current={current === 'leaderboard' ? 'page' : undefined}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 3,
        fontSize: 11,
        fontWeight: 600,
        color: current === 'leaderboard' ? 'var(--gold-2)' : 'var(--text-3)',
        cursor: 'pointer',
        padding: '4px 16px',
        border: 'none',
        background: 'none',
        fontFamily: 'var(--font)',
        transition: 'color 0.2s',
        minHeight: 44,
      }}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={22} height={22} aria-hidden="true">
        <path d="M18 20V10M12 20V4M6 20v-6" />
      </svg>
      Лидерборд
    </button>

    <button
      className={`bottom-tab${current === 'history' ? ' active' : ''}`}
      onClick={() => onNavigate('history')}
      aria-label="История"
      aria-current={current === 'history' ? 'page' : undefined}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 3,
        fontSize: 11,
        fontWeight: 600,
        color: current === 'history' ? 'var(--gold-2)' : 'var(--text-3)',
        cursor: 'pointer',
        padding: '4px 16px',
        border: 'none',
        background: 'none',
        fontFamily: 'var(--font)',
        transition: 'color 0.2s',
        minHeight: 44,
      }}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={22} height={22} aria-hidden="true">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
      История
    </button>

    <button
      className={`bottom-tab${current === 'profile' ? ' active' : ''}`}
      onClick={() => onNavigate('profile')}
      aria-label="Профиль"
      aria-current={current === 'profile' ? 'page' : undefined}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 3,
        fontSize: 11,
        fontWeight: 600,
        color: current === 'profile' ? 'var(--gold-2)' : 'var(--text-3)',
        cursor: 'pointer',
        padding: '4px 16px',
        border: 'none',
        background: 'none',
        fontFamily: 'var(--font)',
        transition: 'color 0.2s',
        minHeight: 44,
      }}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={22} height={22} aria-hidden="true">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
      Профиль
    </button>
  </div>
);
