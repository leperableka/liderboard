import React from 'react';
import type { LeaderboardEntry } from '../types';
import { Avatar } from './Avatar';

interface PodiumProps {
  entries: LeaderboardEntry[];
}

interface PodiumItemProps {
  entry: LeaderboardEntry;
  rank: 1 | 2 | 3;
}

const RANK_BADGE_STYLES: Record<1 | 2 | 3, { bg: string }> = {
  1: { bg: 'linear-gradient(135deg, #FFD700, #FFA500)' },
  2: { bg: 'linear-gradient(135deg, #C0C0C0, #A0A0A0)' },
  3: { bg: 'linear-gradient(135deg, #CD7F32, #A0622E)' },
};

const PodiumItem: React.FC<PodiumItemProps> = ({ entry, rank }) => {
  const isFirst = rank === 1;
  const avatarSize = isFirst ? 76 : 60;
  const badgeStyle = RANK_BADGE_STYLES[rank];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: 110,
        marginBottom: isFirst ? 16 : 0,
      }}
    >
      <div style={{ position: 'relative', display: 'inline-flex' }}>
        {isFirst && (
          <span
            style={{
              position: 'absolute',
              top: -18,
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: 22,
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
              zIndex: 2,
            }}
            aria-hidden="true"
          >
            👑
          </span>
        )}
        <div
          style={{
            borderRadius: '50%',
            border: isFirst ? '4px solid #fff' : '3px solid rgba(255,255,255,0.8)',
            boxShadow: isFirst ? '0 4px 20px rgba(0,0,0,0.15)' : undefined,
            position: 'relative',
          }}
        >
          <Avatar name={entry.displayName} avatarUrl={entry.avatarUrl} size={avatarSize} />
          <div
            style={{
              position: 'absolute',
              bottom: -4,
              right: -4,
              width: 24,
              height: 24,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 800,
              color: '#fff',
              border: '2px solid #fff',
              background: badgeStyle.bg,
              zIndex: 2,
            }}
            aria-hidden="true"
          >
            {rank}
          </div>
        </div>
      </div>
      <p
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: '#fff',
          marginTop: 8,
          textShadow: '0 1px 2px rgba(0,0,0,0.1)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: 100,
          textAlign: 'center',
        }}
      >
        {entry.displayName}
      </p>
      <p
        style={{
          fontSize: 13,
          fontWeight: 700,
          marginTop: 2,
          padding: '2px 8px',
          borderRadius: 6,
          background: 'rgba(255,255,255,0.2)',
          backdropFilter: 'blur(4px)',
          color: entry.pnlPercent >= 0 ? '#d4fce4' : '#fca5a5',
        }}
      >
        {entry.pnlPercent >= 0 ? '+' : ''}{entry.pnlPercent.toFixed(1)}%
      </p>
    </div>
  );
};

export const Podium: React.FC<PodiumProps> = ({ entries }) => {
  const top3 = entries.slice(0, 3);
  const first = top3[0];
  const second = top3[1];
  const third = top3[2];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: '4px 16px 30px',
      }}
      role="list"
      aria-label="Топ-3 участника"
    >
      {second && (
        <div role="listitem">
          <PodiumItem entry={second} rank={2} />
        </div>
      )}
      {first && (
        <div role="listitem">
          <PodiumItem entry={first} rank={1} />
        </div>
      )}
      {third && (
        <div role="listitem">
          <PodiumItem entry={third} rank={3} />
        </div>
      )}
    </div>
  );
};
