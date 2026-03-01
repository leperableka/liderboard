import React, { useEffect, useRef, useState } from 'react';
import type { HistoryResponse, LeaderboardEntry, Market } from '../types';
import { MARKET_LABELS } from '../types';
import { getHistory } from '../api/client';
import { Avatar } from './Avatar';
import { LineChart } from './LineChart';
import { Skeleton } from './Skeleton';

const MARKET_BADGE_COLOR: Record<Market, string> = {
  crypto: '#92400E',
  moex:   '#1E40AF',
  forex:  '#065F46',
};
const MARKET_BADGE_BG: Record<Market, string> = {
  crypto: 'rgba(254,243,199,0.6)',
  moex:   'rgba(219,234,254,0.6)',
  forex:  'rgba(209,250,229,0.6)',
};

interface UserHistoryModalProps {
  entry: LeaderboardEntry | null;
  onClose: () => void;
}

const RANK_BADGE: Record<number, { bg: string }> = {
  1: { bg: 'linear-gradient(135deg, #FFD700, #FFA500)' },
  2: { bg: 'linear-gradient(135deg, #C0C0C0, #A0A0A0)' },
  3: { bg: 'linear-gradient(135deg, #CD7F32, #A0622E)' },
};

export const UserHistoryModal: React.FC<UserHistoryModalProps> = ({ entry, onClose }) => {
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!entry) {
      setData(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setData(null);
    setError(null);
    getHistory(entry.telegramId)
      .then((res) => { if (!cancelled) setData(res); })
      .catch((err: unknown) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Ошибка загрузки'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [entry?.telegramId]);

  // Scroll lock + Escape key + Tab focus trap
  useEffect(() => {
    if (!entry) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'Tab' && sheetRef.current) {
        const focusable = Array.from(sheetRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
        if (focusable.length === 0) { e.preventDefault(); return; }
        const first = focusable[0]!;
        const last = focusable[focusable.length - 1]!;
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus(); }
        } else {
          if (document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    // Move focus into the sheet on open
    const firstFocusable = sheetRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    firstFocusable?.focus();

    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [entry, onClose]);

  if (!entry) return null;

  const badgeBg = RANK_BADGE[entry.position]?.bg;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(2px)',
        }}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          background: 'var(--bg)',
          borderRadius: '24px 24px 0 0',
          maxHeight: '88vh',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
          paddingBottom: 'env(safe-area-inset-bottom, 16px)',
        }}
        role="dialog"
        aria-modal="true"
        aria-label={`История ${entry.displayName}`}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--border)' }} />
        </div>

        {/* User header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '12px 20px 16px',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <Avatar name={entry.displayName} avatarUrl={entry.avatarUrl} size={52} />
            {badgeBg && (
              <div style={{
                position: 'absolute',
                bottom: -4,
                right: -4,
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: badgeBg,
                border: '2px solid var(--bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 800,
                color: '#fff',
              }}>
                {entry.position}
              </div>
            )}
            {!badgeBg && (
              <div style={{
                position: 'absolute',
                bottom: -4,
                right: -4,
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: 'var(--text-3)',
                border: '2px solid var(--bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                fontWeight: 800,
                color: '#fff',
              }}>
                {entry.position}
              </div>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 17,
              fontWeight: 700,
              color: 'var(--text)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontFamily: 'var(--font)',
            }}>
              {entry.displayName}
            </div>
            <div style={{
              marginTop: 3,
              fontSize: 13,
              fontWeight: 700,
              color: entry.pnlPercent >= 0 ? 'var(--green)' : 'var(--red)',
              fontFamily: 'var(--font)',
            }}>
              {entry.pnlPercent >= 0 ? '+' : ''}{entry.pnlPercent.toFixed(1)}% за всё время
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '2px 7px',
                borderRadius: 5,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.3px',
                background: MARKET_BADGE_BG[entry.market],
                color: MARKET_BADGE_COLOR[entry.market],
                fontFamily: 'var(--font)',
              }}>
                {MARKET_LABELS[entry.market]}
              </span>
              {entry.instruments.map((inst) => (
                <span key={inst} style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '2px 7px',
                  borderRadius: 5,
                  fontSize: 11,
                  fontWeight: 600,
                  background: MARKET_BADGE_BG[entry.market],
                  color: MARKET_BADGE_COLOR[entry.market],
                  opacity: 0.8,
                  fontFamily: 'var(--font)',
                }}>
                  {inst}
                </span>
              ))}
              {entry.depositCategory != null && (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '2px 7px',
                  borderRadius: 5,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.3px',
                  background: 'rgba(139,92,246,0.12)',
                  color: '#6D28D9',
                  fontFamily: 'var(--font)',
                }}>
                  Категория {entry.depositCategory}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Закрыть"
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: 'none',
              background: 'var(--border)',
              color: 'var(--text-2)',
              fontSize: 16,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '16px 20px 20px' }}>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {loading ? (
              <>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </>
            ) : data ? (
              <>
                <StatCard value={String(data.daysParticipated)} label="Дней" valueColor="var(--text)" />
                <StatCard
                  value={`${data.pnlPercent >= 0 ? '+' : ''}${data.pnlPercent.toFixed(1)}%`}
                  label="PnL"
                  valueColor={data.pnlPercent >= 0 ? 'var(--green)' : 'var(--red)'}
                />
                <StatCard
                  value={data.initialDeposit.toLocaleString('ru-RU')}
                  label={`Нач. ${data.currency}`}
                  valueColor="var(--text)"
                />
              </>
            ) : null}
          </div>

          {error && (
            <p style={{ fontSize: 14, color: 'var(--red)', textAlign: 'center', padding: '20px 0' }}>
              {error}
            </p>
          )}

          {/* Chart */}
          <div style={{
            background: 'var(--white)',
            borderRadius: 'var(--radius)',
            padding: '14px 14px 10px',
            marginBottom: 16,
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 10, fontFamily: 'var(--font)' }}>
              Динамика депозита
            </div>
            {loading ? (
              <Skeleton width="100%" height={140} borderRadius={8} />
            ) : data && data.entries.length > 0 ? (
              <LineChart entries={data.entries} currency={data.currency} />
            ) : !error ? (
              <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-3)', padding: '24px 0' }}>
                Нет данных
              </p>
            ) : null}
          </div>

          {/* PnL detail */}
          {data && !loading && (
            <div style={{
              background: 'var(--white)',
              borderRadius: 'var(--radius)',
              padding: '12px 14px',
              marginBottom: 16,
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: 'var(--text-2)', fontFamily: 'var(--font)' }}>Текущий депозит</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font)' }}>
                  {data.currentDeposit.toLocaleString('ru-RU')} {data.currency}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: 'var(--text-2)', fontFamily: 'var(--font)' }}>Абсолютный PnL</span>
                <span style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: data.pnlAbsolute >= 0 ? 'var(--green)' : 'var(--red)',
                  fontFamily: 'var(--font)',
                }}>
                  {data.pnlAbsolute >= 0 ? '+' : ''}{data.pnlAbsolute.toLocaleString('ru-RU')} {data.currency}
                </span>
              </div>
            </div>
          )}

          {/* Operations list */}
          {(loading || data) && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 8, fontFamily: 'var(--font)' }}>
                История операций
              </div>

              {loading ? (
                Array.from({ length: 5 }, (_, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)', gap: 10 }}>
                    <Skeleton width={44} height={13} borderRadius={4} />
                    <Skeleton width="50%" height={13} borderRadius={4} />
                    <Skeleton width={42} height={13} borderRadius={4} style={{ marginLeft: 'auto' }} />
                  </div>
                ))
              ) : data ? (
                [...data.entries].reverse().map((entry, i, arr) => (
                  <div
                    key={entry.date}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '10px 0',
                      borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    <span style={{ fontSize: 13, color: 'var(--text-2)', width: 48, flexShrink: 0, fontFamily: 'var(--font)' }}>
                      {entry.dateLabel}
                    </span>
                    <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font)' }}>
                      {entry.amount.toLocaleString('ru-RU')} {data.currency}
                    </span>
                    <span style={{
                      fontSize: 13,
                      fontWeight: 700,
                      flexShrink: 0,
                      fontFamily: 'var(--font)',
                      color: entry.dailyChange === null
                        ? 'var(--text-3)'
                        : entry.dailyChange >= 0
                        ? 'var(--green)'
                        : 'var(--red)',
                    }}>
                      {entry.dailyChange === null
                        ? '—'
                        : `${entry.dailyChange >= 0 ? '+' : ''}${entry.dailyChange.toFixed(1)}%`}
                    </span>
                  </div>
                ))
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ value: string; label: string; valueColor: string }> = ({ value, label, valueColor }) => (
  <div style={{
    flex: 1,
    background: 'var(--white)',
    borderRadius: 'var(--radius-sm)',
    padding: '10px 8px',
    textAlign: 'center',
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
  }}>
    <p style={{ fontSize: 16, fontWeight: 800, color: valueColor, margin: 0, fontFamily: 'var(--font)' }}>{value}</p>
    <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.3px', margin: '2px 0 0', fontFamily: 'var(--font)' }}>{label}</p>
  </div>
);

const StatCardSkeleton: React.FC = () => (
  <div style={{
    flex: 1,
    background: 'var(--white)',
    borderRadius: 'var(--radius-sm)',
    padding: '10px 8px',
    textAlign: 'center',
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 5,
  }}>
    <Skeleton width="60%" height={16} borderRadius={4} />
    <Skeleton width="80%" height={9} borderRadius={4} />
  </div>
);
