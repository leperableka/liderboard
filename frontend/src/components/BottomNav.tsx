import React from 'react';
import type { Screen } from '../types';

interface BottomNavProps {
  current: 'leaderboard' | 'history' | 'profile' | 'rules';
  onNavigate: (screen: Screen) => void;
}

const tabStyle = (active: boolean): React.CSSProperties => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 3,
  fontSize: 10,
  fontWeight: 600,
  color: active ? 'var(--gold-2)' : 'var(--text-3)',
  cursor: 'pointer',
  padding: '4px 0',
  border: 'none',
  background: 'none',
  fontFamily: 'var(--font)',
  transition: 'color 0.2s',
  minHeight: 44,
  flex: 1,
});

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
      aria-label="Рейтинг"
      aria-current={current === 'leaderboard' ? 'page' : undefined}
      style={tabStyle(current === 'leaderboard')}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={22} height={22} aria-hidden="true">
        <path d="M18 20V10M12 20V4M6 20v-6" />
      </svg>
      Рейтинг
    </button>

    <button
      className={`bottom-tab${current === 'history' ? ' active' : ''}`}
      onClick={() => onNavigate('history')}
      aria-label="История"
      aria-current={current === 'history' ? 'page' : undefined}
      style={tabStyle(current === 'history')}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={22} height={22} aria-hidden="true">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
      История
    </button>

    <button
      className={`bottom-tab${current === 'rules' ? ' active' : ''}`}
      onClick={() => onNavigate('rules')}
      aria-label="Правила"
      aria-current={current === 'rules' ? 'page' : undefined}
      style={tabStyle(current === 'rules')}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={22} height={22} aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
      Правила
    </button>

    <button
      className={`bottom-tab${current === 'profile' ? ' active' : ''}`}
      onClick={() => onNavigate('profile')}
      aria-label="Профиль"
      aria-current={current === 'profile' ? 'page' : undefined}
      style={tabStyle(current === 'profile')}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={22} height={22} aria-hidden="true">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
      Профиль
    </button>
  </div>
);
