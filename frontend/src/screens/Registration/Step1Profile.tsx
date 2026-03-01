import React, { useRef, useState } from 'react';
import type { RegistrationData } from '../../types';

interface Step1ProfileProps {
  data: RegistrationData;
  onChange: (patch: Partial<RegistrationData>) => void;
  onNext: () => void;
}

const MAX_AVATAR_BYTES = 10 * 1024 * 1024; // 10 MB

export const Step1Profile: React.FC<Step1ProfileProps> = ({ data, onChange, onNext }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevObjectUrlRef = useRef<string | null>(null);
  const [nameError, setNameError] = useState('');
  const [avatarError, setAvatarError] = useState('');

  const canProceed =
    data.displayName.trim().length > 0 && data.pdConsent && data.rulesConsent;

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError('Размер файла не должен превышать 10 МБ');
      return;
    }
    setAvatarError('');
    // Revoke the previous object URL to prevent memory leak
    if (prevObjectUrlRef.current) {
      URL.revokeObjectURL(prevObjectUrlRef.current);
    }
    const url = URL.createObjectURL(file);
    prevObjectUrlRef.current = url;
    onChange({ avatarUrl: url, avatarFile: file });
  }

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    onChange({ displayName: val });
    if (val.trim().length === 0) {
      setNameError('Введите имя');
    } else {
      setNameError('');
    }
  }

  function handleNext() {
    if (!data.displayName.trim()) {
      setNameError('Введите имя');
      return;
    }
    onNext();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      {/* Avatar */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0 0' }}>
        <div style={{ position: 'relative' }}>
          <button
            aria-label="Изменить фото профиля"
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: 96,
              height: 96,
              borderRadius: '50%',
              background: data.avatarUrl
                ? 'none'
                : 'linear-gradient(135deg, #E5E7EB, #D1D5DB)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              padding: 0,
            }}
          >
            {data.avatarUrl ? (
              <img
                src={data.avatarUrl}
                alt="Аватар"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" width={44} height={44} aria-hidden="true">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            )}
          </button>
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'var(--gold-2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '3px solid var(--bg)',
              pointerEvents: 'none',
            }}
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" aria-hidden="true">
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            style={{ display: 'none' }}
            aria-hidden="true"
          />
        </div>
      </div>

      {avatarError && (
        <p
          role="alert"
          style={{ fontSize: 12, color: 'var(--red)', textAlign: 'center', marginTop: 6, padding: '0 20px' }}
        >
          {avatarError}
        </p>
      )}

      {/* Form */}
      <div style={{ padding: '16px 20px 0', flex: 1 }}>
        <div style={{ marginBottom: 16 }}>
          <label
            htmlFor="display-name"
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
            Отображаемое имя
          </label>
          <input
            id="display-name"
            type="text"
            value={data.displayName}
            onChange={handleNameChange}
            placeholder="Ваше имя"
            maxLength={50}
            aria-describedby={nameError ? 'name-error' : undefined}
            aria-invalid={!!nameError}
            style={{
              width: '100%',
              height: 50,
              borderRadius: 'var(--radius-sm)',
              border: `1.5px solid ${nameError ? 'var(--red)' : 'var(--border)'}`,
              padding: '0 16px',
              fontSize: 16,
              fontFamily: 'var(--font)',
              color: 'var(--text)',
              background: nameError ? '#FEF2F2' : 'var(--white)',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => {
              if (!nameError) e.currentTarget.style.borderColor = 'var(--gold-2)';
            }}
            onBlur={(e) => {
              if (!nameError) e.currentTarget.style.borderColor = 'var(--border)';
            }}
          />
          {nameError && (
            <p
              id="name-error"
              role="alert"
              style={{ fontSize: 12, color: 'var(--red)', marginTop: 6 }}
            >
              {nameError}
            </p>
          )}
        </div>

        {/* Checkboxes */}
        <CheckRow
          id="pd-consent"
          checked={data.pdConsent}
          onChange={(v) => onChange({ pdConsent: v })}
          label={
            <>
              Я согласен на{' '}
              <a
                href="https://vesperfin.com/upload/iblock/95c/policy_ip_kundiy.pdf"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--gold-3)', textDecoration: 'underline' }}
                onClick={(e) => e.stopPropagation()}
              >
                обработку персональных данных
              </a>
            </>
          }
        />
        <CheckRow
          id="rules-consent"
          checked={data.rulesConsent}
          onChange={(v) => onChange({ rulesConsent: v })}
          label={
            <>
              Я принимаю{' '}
              <a
                href="https://vesperfin.com/upload/iblock/c4b/qy6xk5n5cf1v8iqdszp93k3qp9kp0gbq/pravila_konkursa.pdf"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--gold-3)', textDecoration: 'underline' }}
                onClick={(e) => e.stopPropagation()}
              >
                правила турнира
              </a>
            </>
          }
        />
      </div>

      {/* Button */}
      <div style={{ padding: '12px 20px 28px' }}>
        <button
          onClick={handleNext}
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

interface CheckRowProps {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: React.ReactNode;
}

const CheckRow: React.FC<CheckRowProps> = ({ id, checked, onChange, label }) => (
  <label
    htmlFor={id}
    style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
      padding: '12px 0',
      cursor: 'pointer',
      WebkitTapHighlightColor: 'transparent',
    }}
  >
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
    />
    <div
      aria-hidden="true"
      style={{
        width: 22,
        height: 22,
        borderRadius: 6,
        border: `2px solid ${checked ? 'var(--gold-2)' : 'var(--border)'}`,
        background: checked ? 'var(--gold-2)' : 'transparent',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s',
        marginTop: 1,
      }}
    >
      {checked && (
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      )}
    </div>
    <span style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.4 }}>
      {label}
    </span>
  </label>
);
