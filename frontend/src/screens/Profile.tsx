import React, { useRef, useState } from 'react';
import type { Screen, UserStatus } from '../types';
import { MARKET_LABELS } from '../types';
import { Avatar } from '../components/Avatar';
import { InstrumentBadge } from '../components/Badge';
import { BottomNav } from '../components/BottomNav';
import { updateProfile } from '../api/client';

interface ProfileProps {
  userStatus: UserStatus;
  onNavigate: (screen: Screen) => void;
  onProfileUpdated: (displayName: string, avatarUrl?: string | null) => void;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const Profile: React.FC<ProfileProps> = ({
  userStatus,
  onNavigate,
  onProfileUpdated,
}) => {
  const [displayName, setDisplayName] = useState(userStatus.displayName);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(userStatus.avatarUrl);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const marketLabel = userStatus.market ? MARKET_LABELS[userStatus.market] : '—';
  const nameChanged = displayName.trim() !== userStatus.displayName;
  const avatarChanged = avatarUrl !== userStatus.avatarUrl;
  const hasChanges = nameChanged || avatarChanged;

  async function handleAvatarClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('Фото не должно превышать 2 МБ');
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      setAvatarUrl(dataUrl);
      setError('');
    } catch {
      setError('Не удалось загрузить фото');
    }
    e.target.value = '';
  }

  async function handleSave() {
    const trimmed = displayName.trim();
    if (!trimmed || trimmed.length < 1) {
      setError('Имя не может быть пустым');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await updateProfile(
        userStatus.telegramId,
        trimmed,
        avatarChanged ? avatarUrl : undefined,
      );
      onProfileUpdated(trimmed, avatarChanged ? avatarUrl : undefined);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--bg)',
      }}
    >
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: 100,
        }}
      >
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          {/* Header */}
          <header
            style={{
              paddingTop: 'calc(env(safe-area-inset-top, 0px) + 48px)',
              paddingLeft: 20,
              paddingRight: 20,
              paddingBottom: 16,
              textAlign: 'center',
            }}
          >
            <h1
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: 'var(--text)',
                letterSpacing: '-0.3px',
              }}
            >
              Профиль
            </h1>
          </header>

          {/* Avatar section */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '0 20px 20px',
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <button
              onClick={handleAvatarClick}
              aria-label="Изменить фото"
              style={{
                position: 'relative',
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                borderRadius: '50%',
              }}
            >
              <Avatar
                name={displayName || userStatus.displayName}
                avatarUrl={avatarUrl}
                size={80}
              />
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  bottom: 2,
                  right: 2,
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: 'var(--gold-2)',
                  border: '2px solid var(--white)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width={13} height={13}>
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </div>
            </button>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 8 }}>
              Нажмите для замены фото
            </p>
          </div>

          {/* Editable display name */}
          <div style={{ padding: '0 20px 16px' }}>
            <label
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-3)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                display: 'block',
                marginBottom: 6,
              }}
            >
              Отображаемое имя
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                setSaved(false);
              }}
              maxLength={128}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: 14,
                border: '1.5px solid var(--border)',
                background: 'var(--white)',
                fontSize: 16,
                color: 'var(--text)',
                fontFamily: 'var(--font)',
                boxSizing: 'border-box',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--gold-2)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
            />
            {error && (
              <p style={{ fontSize: 12, color: 'var(--red)', marginTop: 6 }}>{error}</p>
            )}
          </div>

          {/* Save button */}
          {hasChanges && (
            <div style={{ padding: '0 20px 16px' }}>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  width: '100%',
                  height: 52,
                  borderRadius: 14,
                  border: 'none',
                  background: saving ? '#D1D5DB' : 'var(--gold-grad)',
                  color: saving ? '#9CA3AF' : '#fff',
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font)',
                  boxShadow: saving ? 'none' : '0 4px 16px rgba(245,166,35,0.35)',
                  transition: 'all 0.2s',
                }}
              >
                {saving ? 'Сохранение...' : 'Сохранить имя'}
              </button>
            </div>
          )}

          {saved && (
            <p
              style={{
                textAlign: 'center',
                fontSize: 13,
                color: 'var(--green)',
                padding: '0 20px 8px',
                fontWeight: 600,
              }}
            >
              ✓ Имя сохранено
            </p>
          )}

          {/* Read-only info card */}
          <div
            style={{
              margin: '0 20px 16px',
              background: 'var(--white)',
              borderRadius: 'var(--radius)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
              overflow: 'hidden',
            }}
          >
            <InfoRow label="ID" last={false}>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--text-2)',
                  fontVariantNumeric: 'tabular-nums',
                  background: 'var(--bg)',
                  padding: '4px 10px',
                  borderRadius: 8,
                }}
              >
                #{userStatus.telegramId}
              </span>
            </InfoRow>

            <InfoRow label="Рынок" last={false}>
              <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
                {marketLabel}
              </span>
            </InfoRow>

            <InfoRow label="Инструменты" last>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {userStatus.instruments.length > 0
                  ? userStatus.instruments.map((instr) => (
                      <InstrumentBadge key={instr} label={instr} />
                    ))
                  : <span style={{ fontSize: 14, color: 'var(--text-3)' }}>—</span>
                }
              </div>
            </InfoRow>
          </div>

          {/* Notice */}
          <p
            style={{
              fontSize: 12,
              color: 'var(--text-3)',
              textAlign: 'center',
              padding: '0 32px',
              lineHeight: 1.5,
            }}
          >
            Рынок и инструменты указываются при регистрации и не подлежат изменению.
          </p>
        </div>
      </div>

      {/* Bottom nav */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          background: 'var(--white)',
          borderTop: '1px solid var(--border)',
          padding: '4px 20px 0',
        }}
      >
        <BottomNav current="profile" onNavigate={onNavigate} />
      </div>
    </div>
  );
};

interface InfoRowProps {
  label: string;
  children: React.ReactNode;
  last: boolean;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, children, last }) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '14px 16px',
      borderBottom: last ? 'none' : '1px solid var(--border)',
    }}
  >
    <span
      style={{
        fontSize: 13,
        color: 'var(--text-2)',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        flexShrink: 0,
        marginRight: 12,
      }}
    >
      {label}
    </span>
    <div style={{ textAlign: 'right' }}>{children}</div>
  </div>
);
