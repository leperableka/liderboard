import React from 'react';
import type { Market, RegistrationData } from '../../types';
import { MARKET_LABELS } from '../../types';

interface Step2MarketProps {
  data: RegistrationData;
  onChange: (patch: Partial<RegistrationData>) => void;
  onNext: () => void;
}

interface MarketOption {
  key: Market;
  icon: string;
  iconBg: string;
  description: string;
}

const MARKET_OPTIONS: MarketOption[] = [
  { key: 'crypto', icon: '₿', iconBg: '#FEF3C7', description: 'BTC, ETH и другие' },
  { key: 'moex', icon: '🇷🇺', iconBg: '#DBEAFE', description: 'Московская биржа' },
  { key: 'forex', icon: '🌐', iconBg: '#D1FAE5', description: 'Валютные пары' },
];

export const Step2Market: React.FC<Step2MarketProps> = ({ data, onChange, onNext }) => {
  function selectMarket(market: Market) {
    onChange({ market, instruments: [] });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <div style={{ padding: '12px 20px 0', flex: 1 }}>
        {/* Warning */}
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 14px',
            borderRadius: 'var(--radius-sm)',
            background: '#FEF3C7',
            marginBottom: 16,
          }}
        >
          <span aria-hidden="true" style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
          <p style={{ fontSize: 13, color: '#92400E', lineHeight: 1.4, margin: 0 }}>
            Внимание: выбор рынка нельзя изменить после регистрации
          </p>
        </div>

        {/* Radio cards */}
        <fieldset style={{ border: 'none', padding: 0 }}>
          <legend style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
            Выберите рынок
          </legend>
          {MARKET_OPTIONS.map((opt) => {
            const selected = data.market === opt.key;
            return (
              <label
                key={opt.key}
                htmlFor={`market-${opt.key}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: 16,
                  borderRadius: 'var(--radius)',
                  border: `2px solid ${selected ? 'var(--gold-2)' : 'var(--border)'}`,
                  marginBottom: 10,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: selected ? 'rgba(245,166,35,0.04)' : 'var(--white)',
                  boxShadow: selected ? '0 0 0 1px var(--gold-2)' : 'none',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <input
                  id={`market-${opt.key}`}
                  type="radio"
                  name="market"
                  value={opt.key}
                  checked={selected}
                  onChange={() => selectMarket(opt.key)}
                  style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                />
                <div
                  aria-hidden="true"
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    flexShrink: 0,
                    background: opt.iconBg,
                  }}
                >
                  {opt.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', margin: 0 }}>
                    {MARKET_LABELS[opt.key]}
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2, margin: 0 }}>
                    {opt.description}
                  </p>
                </div>
                <div
                  aria-hidden="true"
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    border: `2px solid ${selected ? 'var(--gold-2)' : 'var(--border)'}`,
                    marginLeft: 'auto',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                  }}
                >
                  {selected && (
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        background: 'var(--gold-2)',
                      }}
                    />
                  )}
                </div>
              </label>
            );
          })}
        </fieldset>
      </div>

      <div style={{ padding: '12px 20px 28px' }}>
        <button
          onClick={onNext}
          disabled={!data.market}
          aria-disabled={!data.market}
          style={{
            width: '100%',
            height: 52,
            borderRadius: 14,
            border: 'none',
            background: data.market ? 'var(--gold-grad)' : '#D1D5DB',
            color: data.market ? '#fff' : '#9CA3AF',
            fontSize: 16,
            fontWeight: 600,
            cursor: data.market ? 'pointer' : 'not-allowed',
            fontFamily: 'var(--font)',
            boxShadow: data.market ? '0 4px 16px rgba(245,166,35,0.35)' : 'none',
            transition: 'all 0.2s',
          }}
        >
          Далее
        </button>
      </div>
    </div>
  );
};
