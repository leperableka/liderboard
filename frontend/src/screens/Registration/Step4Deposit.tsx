import React, { useState } from 'react';
import type { RegistrationData } from '../../types';
import { MARKET_CURRENCY } from '../../types';

// ── Category helpers ────────────────────────────────────────────────────────

const APPROX_RATE = 90; // approximate USD/RUB for display only

const CATEGORY_INFO: Record<1 | 2 | 3, { label: string; range: string; color: string; bg: string }> = {
  1: { label: 'Вы будете соревноваться в\u00A0категории\u00A01 с\u00A0участниками со\u00A0схожим депозитом', range: 'до 69\u202F999 ₽', color: '#2563EB', bg: '#EFF6FF' },
  2: { label: 'Вы будете соревноваться в\u00A0категории\u00A02 с\u00A0участниками со\u00A0схожим депозитом', range: '70\u202F000–249\u202F999 ₽', color: '#D97706', bg: '#FFFBEB' },
  3: { label: 'Вы будете соревноваться в\u00A0категории\u00A03 с\u00A0участниками со\u00A0схожим депозитом', range: 'от 250\u202F000 ₽',  color: '#7C3AED', bg: '#F5F3FF' },
};

function computeCategory(amount: number, currency: string): { cat: 1 | 2 | 3; approximate: boolean } | null {
  if (!amount || amount < 1) return null;
  let rub = currency === 'RUB' ? amount : amount * APPROX_RATE;
  const cat: 1 | 2 | 3 = rub < 70_000 ? 1 : rub < 250_000 ? 2 : 3;
  return { cat, approximate: currency !== 'RUB' };
}

interface Step4DepositProps {
  data: RegistrationData;
  onChange: (patch: Partial<RegistrationData>) => void;
  onNext: () => void;
}

function sanitizeDecimal(value: string): string {
  let v = value.replace(',', '.');
  v = v.replace(/[^\d.]/g, '');
  const parts = v.split('.');
  if (parts.length > 2) {
    v = parts[0] + '.' + parts.slice(1).join('');
  }
  if (parts[1] !== undefined && parts[1].length > 2) {
    v = parts[0] + '.' + parts[1].substring(0, 2);
  }
  return v;
}

// Format raw numeric string with narrow non-breaking spaces as thousand separators
function formatDisplay(raw: string): string {
  if (!raw) return '';
  const [intPart = '', decPart] = raw.split('.');
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F');
  return decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt;
}

// Strip formatting spaces before processing
function stripFormatting(value: string): string {
  return value.replace(/[\u202F\u00A0\s]/g, '');
}

export const Step4Deposit: React.FC<Step4DepositProps> = ({ data, onChange, onNext }) => {
  const [error, setError] = useState('');
  const currency = data.market ? MARKET_CURRENCY[data.market] : 'USDT';
  const numValue = parseFloat(data.initialDeposit);
  const isValid = !isNaN(numValue) && numValue >= 1;
  const catResult = isValid ? computeCategory(numValue, currency) : null;
  const isLargeDeposit = isValid && numValue > 1_000_000;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = stripFormatting(e.target.value);
    const sanitized = sanitizeDecimal(raw);
    onChange({ initialDeposit: sanitized });
    const num = parseFloat(sanitized);
    if (sanitized && isNaN(num)) {
      setError('Введите корректное число');
    } else if (sanitized && num < 1) {
      setError('Минимальный депозит: 1');
    } else {
      setError('');
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const allow = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End',
    ];
    if (allow.includes(e.key)) return;
    if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) return;
    if (e.key === '.' || e.key === ',') {
      if (data.initialDeposit.includes('.')) e.preventDefault();
      return;
    }
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  }

  function handleNext() {
    if (!isValid) {
      setError('Введите сумму депозита (минимум 1)');
      return;
    }
    onNext();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <div style={{ padding: '24px 20px 0', flex: 1 }}>
        <div style={{ position: 'relative' }}>
          <input
            id="initial-deposit"
            type="text"
            inputMode="decimal"
            value={formatDisplay(data.initialDeposit)}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="0"
            aria-label={`Начальный депозит в ${currency}`}
            aria-describedby={error ? 'deposit-error' : undefined}
            aria-invalid={!!error}
            style={{
              width: '100%',
              height: 64,
              borderRadius: 'var(--radius-sm)',
              border: `1.5px solid ${error ? 'var(--red)' : 'var(--border)'}`,
              padding: '0 80px 0 16px',
              fontSize: 28,
              fontWeight: 700,
              textAlign: 'center',
              letterSpacing: 1,
              fontFamily: 'var(--font)',
              color: 'var(--text)',
              background: error ? '#FEF2F2' : 'var(--white)',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => {
              if (!error) e.currentTarget.style.borderColor = 'var(--gold-2)';
            }}
            onBlur={(e) => {
              if (!error) e.currentTarget.style.borderColor = 'var(--border)';
            }}
          />
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              right: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 20,
              fontWeight: 700,
              color: '#9CA3AF',
              pointerEvents: 'none',
            }}
          >
            {currency}
          </span>
        </div>

        {error && (
          <p
            id="deposit-error"
            role="alert"
            style={{ fontSize: 12, color: 'var(--red)', textAlign: 'center', marginTop: 6 }}
          >
            {error}
          </p>
        )}

        {isLargeDeposit && !error && (
          <div
            role="alert"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              background: '#FFFBEB',
              border: '1.5px solid #F5A623',
              borderRadius: 12,
              padding: '10px 14px',
              marginTop: 10,
              fontSize: 13,
              color: '#92610A',
              lineHeight: 1.5,
            }}
          >
            <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>⚠️</span>
            <span>
              Сумма значительно превышает среднее значение депозита участников турнира.
              Максимально допустимо&nbsp;<strong>10&nbsp;000&nbsp;000&nbsp;{currency}</strong>.
            </span>
          </div>
        )}

        {catResult && !error && (
          <div
            style={{
              marginTop: 14,
              padding: '12px 16px',
              borderRadius: 12,
              background: CATEGORY_INFO[catResult.cat].bg,
              border: `1px solid ${CATEGORY_INFO[catResult.cat].color}33`,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: CATEGORY_INFO[catResult.cat].color,
                color: '#fff',
                fontSize: 16,
                fontWeight: 700,
                flexShrink: 0,
                marginTop: 1,
              }}
            >
              {catResult.cat}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: CATEGORY_INFO[catResult.cat].color, lineHeight: 1.4 }}>
                {CATEGORY_INFO[catResult.cat].label}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
                {CATEGORY_INFO[catResult.cat].range}
                {catResult.approximate && '\u00A0· примерно, по курсу ЦБ РФ'}
              </div>
            </div>
          </div>
        )}

        <p style={{ fontSize: 13, color: 'var(--text-3)', textAlign: 'center', marginTop: 12 }}>
          Укажите реальный размер вашего торгового счёта, с&nbsp;которым вы будете участвовать в&nbsp;турнире
        </p>
      </div>

      <div style={{ padding: '12px 20px 28px' }}>
        <button
          onClick={handleNext}
          disabled={!isValid}
          aria-disabled={!isValid}
          style={{
            width: '100%',
            height: 52,
            borderRadius: 14,
            border: 'none',
            background: isValid ? 'var(--gold-grad)' : '#D1D5DB',
            color: isValid ? '#fff' : '#9CA3AF',
            fontSize: 16,
            fontWeight: 600,
            cursor: isValid ? 'pointer' : 'not-allowed',
            fontFamily: 'var(--font)',
            boxShadow: isValid ? '0 4px 16px rgba(245,166,35,0.35)' : 'none',
            transition: 'all 0.2s',
          }}
        >
          Далее
        </button>
      </div>
    </div>
  );
};
