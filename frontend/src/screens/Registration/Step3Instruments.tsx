import React from 'react';
import type { RegistrationData } from '../../types';
import { MARKET_INSTRUMENTS } from '../../types';

interface Step3InstrumentsProps {
  data: RegistrationData;
  onChange: (patch: Partial<RegistrationData>) => void;
  onNext: () => void;
}

export const Step3Instruments: React.FC<Step3InstrumentsProps> = ({ data, onChange, onNext }) => {
  const available = data.market ? MARKET_INSTRUMENTS[data.market] : [];

  function toggleInstrument(instrument: string) {
    const current = data.instruments;
    const next = current.includes(instrument)
      ? current.filter((i) => i !== instrument)
      : [...current, instrument];
    onChange({ instruments: next });
  }

  const canProceed = data.instruments.length >= 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <div style={{ padding: '12px 20px 0', flex: 1 }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            padding: '8px 0',
          }}
          role="group"
          aria-label="Торговые инструменты"
        >
          {available.map((instrument) => {
            const active = data.instruments.includes(instrument);
            return (
              <button
                key={instrument}
                onClick={() => toggleInstrument(instrument)}
                aria-pressed={active}
                style={{
                  padding: '10px 20px',
                  borderRadius: 40,
                  border: `2px solid ${active ? 'var(--gold-2)' : 'var(--border)'}`,
                  fontSize: 15,
                  fontWeight: 500,
                  color: active ? '#fff' : 'var(--text)',
                  cursor: 'pointer',
                  background: active ? 'var(--gold-2)' : 'var(--white)',
                  fontFamily: 'var(--font)',
                  transition: 'all 0.2s',
                  WebkitTapHighlightColor: 'transparent',
                  minHeight: 44,
                }}
              >
                {instrument}
              </button>
            );
          })}
        </div>

        {available.length === 0 && (
          <p style={{ fontSize: 14, color: 'var(--text-3)', marginTop: 16 }}>
            Сначала выберите рынок
          </p>
        )}
      </div>

      <div style={{ padding: '12px 20px 28px' }}>
        <button
          onClick={onNext}
          disabled={!canProceed}
          aria-disabled={!canProceed}
          style={{
            width: '100%',
            height: 52,
            borderRadius: 14,
            border: 'none',
            background: canProceed ? 'var(--gold-grad)' : '#D1D5DB',
            color: canProceed ? '#fff' : '#9CA3AF',
            fontSize: 16,
            fontWeight: 600,
            cursor: canProceed ? 'pointer' : 'not-allowed',
            fontFamily: 'var(--font)',
            boxShadow: canProceed ? '0 4px 16px rgba(245,166,35,0.35)' : 'none',
            transition: 'all 0.2s',
          }}
        >
          Далее
        </button>
      </div>
    </div>
  );
};
