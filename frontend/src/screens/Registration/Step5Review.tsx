import React, { useState } from 'react';
import type { RegistrationData } from '../../types';
import { MARKET_LABELS, MARKET_CURRENCY } from '../../types';
import { Avatar } from '../../components/Avatar';
import { InstrumentBadge } from '../../components/Badge';

const APPROX_RATE = 90;
const CAT_COLORS: Record<1 | 2 | 3, string> = { 1: '#2563EB', 2: '#D97706', 3: '#7C3AED' };
const CAT_RANGES: Record<1 | 2 | 3, string> = {
  1: 'до 69\u202F999\u00A0₽',
  2: '70\u202F000–249\u202F999\u00A0₽',
  3: 'от 250\u202F000\u00A0₽',
};
function computeCategory(amount: number, currency: string): 1 | 2 | 3 | null {
  if (!amount || amount < 1) return null;
  const rub = currency === 'RUB' ? amount : amount * APPROX_RATE;
  return rub < 70_000 ? 1 : rub < 250_000 ? 2 : 3;
}

interface Step5ReviewProps {
  data: RegistrationData;
  onEdit: () => void;
  onConfirm: () => Promise<void>;
}

export const Step5Review: React.FC<Step5ReviewProps> = ({ data, onEdit, onConfirm }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currency = data.market ? MARKET_CURRENCY[data.market] : 'USDT';
  const marketLabel = data.market ? MARKET_LABELS[data.market] : '—';
  const depositNum = parseFloat(data.initialDeposit) || 0;
  const category = computeCategory(depositNum, currency);

  async function handleConfirm() {
    setLoading(true);
    setError('');
    try {
      await onConfirm();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка при регистрации';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <div style={{ padding: '16px 20px 0', flex: 1 }}>
        <div
          style={{
            background: 'var(--white)',
            borderRadius: 'var(--radius)',
            padding: 20,
            boxShadow: 'var(--shadow)',
          }}
        >
          {/* Profile row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              paddingBottom: 14,
              borderBottom: '1px solid var(--border)',
            }}
          >
            <Avatar name={data.displayName} avatarUrl={data.avatarUrl} size={56} />
            <div>
              <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                {data.displayName || '—'}
              </p>
            </div>
          </div>

          {/* Market */}
          <ReviewRow label="Рынок">
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
              {marketLabel}
            </span>
          </ReviewRow>

          {/* Instruments */}
          <ReviewRow label="Инструменты">
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {data.instruments.map((instr) => (
                <InstrumentBadge key={instr} label={instr} />
              ))}
            </div>
          </ReviewRow>

          {/* Deposit */}
          <ReviewRow label="Депозит" last={!category}>
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
              {depositNum.toLocaleString('ru-RU')} {currency}
            </span>
          </ReviewRow>

          {/* Category */}
          {category && (
            <ReviewRow label="Категория турнира" last>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: CAT_COLORS[category],
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {category}
                </span>
                <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{CAT_RANGES[category]}</span>
              </div>
              {currency !== 'RUB' && (
                <p style={{ fontSize: 11, color: 'var(--text-3)', margin: '2px 0 0', textAlign: 'right' }}>
                  ≈ по курсу ЦБ РФ на момент регистрации
                </p>
              )}
            </ReviewRow>
          )}
        </div>

        {error && (
          <p
            role="alert"
            style={{
              fontSize: 13,
              color: 'var(--red)',
              textAlign: 'center',
              marginTop: 12,
              padding: '10px 16px',
              background: '#FEF2F2',
              borderRadius: 10,
            }}
          >
            {error}
          </p>
        )}
      </div>

      <div style={{ padding: '12px 20px 28px', display: 'flex', gap: 10 }}>
        <button
          onClick={onEdit}
          disabled={loading}
          style={{
            flex: 1,
            height: 52,
            borderRadius: 14,
            border: '2px solid var(--border)',
            background: 'transparent',
            fontSize: 16,
            fontWeight: 600,
            color: 'var(--text)',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font)',
            opacity: loading ? 0.6 : 1,
          }}
        >
          Исправить
        </button>
        <button
          onClick={handleConfirm}
          disabled={loading}
          aria-busy={loading}
          style={{
            flex: 1.5,
            height: 52,
            borderRadius: 14,
            border: 'none',
            background: loading ? '#D1D5DB' : 'var(--gold-grad)',
            color: loading ? '#9CA3AF' : '#fff',
            fontSize: 16,
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font)',
            boxShadow: loading ? 'none' : '0 4px 16px rgba(245,166,35,0.35)',
            transition: 'all 0.2s',
          }}
        >
          {loading ? 'Отправка...' : 'Подтвердить'}
        </button>
      </div>
    </div>
  );
};

interface ReviewRowProps {
  label: string;
  children: React.ReactNode;
  last?: boolean;
}

const ReviewRow: React.FC<ReviewRowProps> = ({ label, children, last = false }) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 0',
      borderBottom: last ? 'none' : '1px solid var(--border)',
    }}
  >
    <span
      style={{
        fontSize: 13,
        color: 'var(--text-2)',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      }}
    >
      {label}
    </span>
    <div style={{ textAlign: 'right' }}>{children}</div>
  </div>
);
