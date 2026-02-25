import React from 'react';
import type { Market } from '../types';

interface MarketBadgeProps {
  market: Market;
  size?: 'sm' | 'md';
}

const MARKET_STYLES: Record<Market, { bg: string; color: string; label: string }> = {
  crypto: { bg: '#FEF3C7', color: '#92400E', label: 'Crypto' },
  moex: { bg: '#DBEAFE', color: '#1E40AF', label: 'MOEX' },
  forex: { bg: '#D1FAE5', color: '#065F46', label: 'Forex' },
};

export const MarketBadge: React.FC<MarketBadgeProps> = ({ market, size = 'sm' }) => {
  const style = MARKET_STYLES[market];
  return (
    <span
      style={{
        display: 'inline-block',
        padding: size === 'md' ? '4px 10px' : '2px 7px',
        borderRadius: 4,
        fontSize: size === 'md' ? 12 : 10,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        background: style.bg,
        color: style.color,
      }}
    >
      {style.label}
    </span>
  );
};

interface InstrumentBadgeProps {
  label: string;
}

export const InstrumentBadge: React.FC<InstrumentBadgeProps> = ({ label }) => (
  <span
    style={{
      display: 'inline-block',
      padding: '4px 10px',
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 600,
      background: 'rgba(245,166,35,0.12)',
      color: 'var(--gold-3)',
    }}
  >
    {label}
  </span>
);
