import React, { useEffect, useState } from 'react';
import type { UserStatus } from '../types';
import { MARKET_CURRENCY } from '../types';
import { updateDeposit } from '../api/client';
import { Modal } from '../components/Modal';
import { useTelegram } from '../hooks/useTelegram';

interface UpdateDepositProps {
  userStatus: UserStatus;
  onBack: () => void;
  onSuccess: () => void;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatISODate(date: Date): string {
  return date.toISOString().split('T')[0] ?? '';
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

function formatDisplay(raw: string): string {
  if (!raw) return '';
  const [intPart = '', decPart] = raw.split('.');
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F');
  return decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt;
}

function stripFormatting(value: string): string {
  return value.replace(/[\u202F\u00A0\s]/g, '');
}

export const UpdateDeposit: React.FC<UpdateDepositProps> = ({
  userStatus,
  onBack,
  onSuccess,
}) => {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showBackButton, hideBackButton, onBackButtonClicked, hapticFeedback } = useTelegram();

  const currency = userStatus.market ? MARKET_CURRENCY[userStatus.market] : 'USDT';
  const today = new Date();
  const numValue = parseFloat(value);
  const isValid = !isNaN(numValue) && numValue >= 0;
  const prevDeposit = userStatus.initialDeposit;

  useEffect(() => {
    showBackButton();
    const cleanup = onBackButtonClicked(onBack);
    return () => {
      cleanup();
      hideBackButton();
    };
  }, [showBackButton, hideBackButton, onBackButtonClicked, onBack]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const sanitized = sanitizeDecimal(stripFormatting(e.target.value));
    setValue(sanitized);
    const num = parseFloat(sanitized);
    if (sanitized && isNaN(num)) {
      setError('Введите корректное число');
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
      if (value.includes('.')) e.preventDefault();
      return;
    }
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  }

  function handleSave() {
    if (!isValid) {
      setError('Введите сумму депозита');
      return;
    }
    setModalVisible(true);
  }

  async function handleConfirm() {
    setLoading(true);
    try {
      await updateDeposit({
        amount: numValue,
        date: formatISODate(today),
      });
      hapticFeedback('success');
      setModalVisible(false);
      onSuccess();
    } catch (err: unknown) {
      hapticFeedback('error');
      const msg = err instanceof Error ? err.message : 'Ошибка сохранения';
      setError(msg);
      setModalVisible(false);
    } finally {
      setLoading(false);
    }
  }

  const changeAmount = isValid && prevDeposit > 0 ? numValue - prevDeposit : null;
  const changePct =
    changeAmount !== null && prevDeposit > 0
      ? (changeAmount / prevDeposit) * 100
      : null;

  return (
    <>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          background: 'var(--bg)',
        }}
      >
        {/* Back button */}
        <button
          onClick={onBack}
          aria-label="Назад"
          style={{
            position: 'absolute',
            top: 42,
            left: 16,
            zIndex: 20,
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.06)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round" width={20} height={20} aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        {/* Header */}
        <header style={{ padding: '48px 20px 8px', textAlign: 'center' }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.3px' }}>
            Обновите ваш депозит
          </h1>
        </header>

        <p
          style={{
            textAlign: 'center',
            fontSize: 14,
            color: 'var(--text-2)',
            marginBottom: 20,
          }}
        >
          {formatDate(today)}
        </p>

        <main style={{ padding: '0 20px', flex: 1 }}>
          {/* Previous deposit */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 16px',
              background: 'var(--white)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: 16,
              border: '1px solid var(--border)',
            }}
            aria-label="Предыдущий депозит"
          >
            <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Предыдущий депозит</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
              {prevDeposit.toLocaleString('ru-RU')} {currency}
            </span>
          </div>

          {/* Input */}
          <div style={{ marginBottom: 16 }}>
            <label
              htmlFor="current-deposit"
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-2)',
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Текущий депозит
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="current-deposit"
                type="text"
                inputMode="decimal"
                value={formatDisplay(value)}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="0"
                aria-describedby={error ? 'deposit-error' : 'deposit-hint'}
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
            {error ? (
              <p id="deposit-error" role="alert" style={{ fontSize: 12, color: 'var(--red)', textAlign: 'center', marginTop: 6 }}>
                {error}
              </p>
            ) : (
              <p id="deposit-hint" style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', marginTop: 6 }}>
                &nbsp;
              </p>
            )}
          </div>

          {/* Change indicator */}
          <div
            style={{
              textAlign: 'center',
              padding: '8px 0 4px',
              fontSize: 15,
              fontWeight: 600,
              color:
                changePct === null
                  ? 'var(--text-3)'
                  : changePct > 0
                  ? 'var(--green)'
                  : changePct < 0
                  ? 'var(--red)'
                  : 'var(--text-3)',
            }}
            aria-live="polite"
            aria-atomic="true"
          >
            {changePct === null || !isValid || value === '' ? (
              <span style={{ color: 'var(--text-3)' }}>Введите сумму</span>
            ) : changePct === 0 ? (
              '0.0%'
            ) : (
              <>
                {changePct > 0 ? '+' : ''}{changePct.toFixed(1)}%
                {' '}
                ({changeAmount !== null && changeAmount > 0 ? '+' : ''}
                {changeAmount?.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} {currency})
              </>
            )}
          </div>
        </main>

        {/* Save button */}
        <div style={{ padding: '12px 20px 28px' }}>
          <button
            onClick={handleSave}
            disabled={!isValid || !value}
            style={{
              width: '100%',
              height: 52,
              borderRadius: 14,
              border: 'none',
              background: isValid && value ? 'var(--gold-grad)' : '#D1D5DB',
              color: isValid && value ? '#fff' : '#9CA3AF',
              fontSize: 16,
              fontWeight: 600,
              cursor: isValid && value ? 'pointer' : 'not-allowed',
              fontFamily: 'var(--font)',
              boxShadow: isValid && value ? '0 4px 16px rgba(245,166,35,0.35)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            Сохранить
          </button>
        </div>
      </div>

      {/* Confirmation modal */}
      <Modal
        visible={modalVisible}
        title="Подтверждение"
        subtitle={
          isValid && value ? (
            <>
              Сохранить депозит{' '}
              <strong>
                {numValue.toLocaleString('ru-RU')} {currency}
              </strong>
              ?
            </>
          ) : undefined
        }
        onCancel={() => setModalVisible(false)}
        onConfirm={handleConfirm}
        loading={loading}
      />
    </>
  );
};
