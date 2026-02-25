import React, { useState } from 'react';
import type { LeaderboardEntry, Market } from '../types';
import { Avatar } from './Avatar';
import { MarketBadge } from './Badge';

const MARKET_BADGE_COLOR: Record<Market, string> = {
  crypto: '#92400E',
  moex:   '#1E40AF',
  forex:  '#065F46',
};
const MARKET_BADGE_BG: Record<Market, string> = {
  crypto: 'rgba(254,243,199,0.5)',
  moex:   'rgba(219,234,254,0.5)',
  forex:  'rgba(209,250,229,0.5)',
};

const MAX_VISIBLE = 2;

interface InstrumentTagsProps {
  instruments: string[];
  market: Market;
}

const InstrumentTags: React.FC<InstrumentTagsProps> = ({ instruments, market }) => {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? instruments : instruments.slice(0, MAX_VISIBLE);
  const overflow = instruments.length - MAX_VISIBLE;

  const tagStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '1px 6px',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '0.3px',
    background: MARKET_BADGE_BG[market],
    color: MARKET_BADGE_COLOR[market],
    border: `1px solid ${MARKET_BADGE_COLOR[market]}22`,
    whiteSpace: 'nowrap',
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
      <MarketBadge market={market} />
      {visible.map(inst => (
        <span key={inst} style={tagStyle}>{inst}</span>
      ))}
      {!expanded && overflow > 0 && (
        <button
          onClick={e => { e.stopPropagation(); setExpanded(true); }}
          style={{
            padding: '1px 6px',
            borderRadius: 4,
            fontSize: 10,
            fontWeight: 700,
            background: 'rgba(107,114,128,0.12)',
            color: 'var(--text-2)',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          +{overflow}
        </button>
      )}
    </div>
  );
};

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  isCurrentUser?: boolean;
  innerRef?: React.Ref<HTMLDivElement>;
}

export const LeaderboardRow: React.FC<LeaderboardRowProps> = ({
  entry,
  isCurrentUser = false,
  innerRef,
}) => {
  const pnlUp = entry.pnlPercent >= 0;

  return (
    <div
      ref={innerRef}
      role="row"
      aria-label={`${entry.position} место — ${entry.displayName}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '11px 8px',
        borderRadius: 'var(--radius-sm)',
        background: isCurrentUser ? 'rgba(245,166,35,0.08)' : 'transparent',
        border: isCurrentUser ? '1.5px solid rgba(245,166,35,0.3)' : '1.5px solid transparent',
        marginBottom: 2,
        transition: 'background 0.15s',
      }}
    >
      <span
        style={{
          width: 24,
          textAlign: 'center',
          fontSize: 14,
          fontWeight: 700,
          color: isCurrentUser ? 'var(--gold-3)' : 'var(--text-2)',
          flexShrink: 0,
        }}
        aria-label={`Позиция ${entry.position}`}
      >
        {entry.position}
      </span>

      <Avatar name={entry.displayName} avatarUrl={entry.avatarUrl} size={40} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: isCurrentUser ? 'var(--gold-3)' : 'var(--text)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            margin: '0 0 4px',
          }}
        >
          {entry.displayName}
          {isCurrentUser && (
            <span
              style={{
                marginLeft: 6,
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--gold-3)',
                background: 'rgba(245,166,35,0.15)',
                padding: '1px 6px',
                borderRadius: 4,
              }}
            >
              ВЫ
            </span>
          )}
        </p>
        <InstrumentTags instruments={entry.instruments} market={entry.market} />
      </div>

      <span
        style={{
          fontSize: 15,
          fontWeight: 700,
          flexShrink: 0,
          color: pnlUp ? 'var(--green)' : 'var(--red)',
        }}
        aria-label={`PnL ${entry.pnlPercent >= 0 ? 'плюс' : 'минус'} ${Math.abs(entry.pnlPercent).toFixed(1)} процентов`}
      >
        {pnlUp ? '+' : ''}{entry.pnlPercent.toFixed(1)}%
      </span>
    </div>
  );
};
