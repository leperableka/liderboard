import React, { useState } from 'react';
import type { RegistrationData } from '../../types';
import { MARKET_CURRENCY } from '../../types';

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

        <p style={{ fontSize: 13, color: 'var(--text-3)', textAlign: 'center', marginTop: 12 }}>
          Укажите реальный размер вашего торгового счёта
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
