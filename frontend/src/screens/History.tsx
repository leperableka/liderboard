import React, { useEffect, useState } from 'react';
import type { HistoryResponse, Screen, UserStatus } from '../types';
import { getHistory } from '../api/client';
import { LineChart } from '../components/LineChart';
import { BottomNav } from '../components/BottomNav';
import { Skeleton } from '../components/Skeleton';

interface HistoryProps {
  userStatus: UserStatus;
  onNavigate: (screen: Screen) => void;
}

export const History: React.FC<HistoryProps> = ({ userStatus, onNavigate }) => {
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getHistory(userStatus.telegramId)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Ошибка загрузки');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userStatus.telegramId, retryCount]);

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
        {/* Content wrapper: limits width on large screens */}
        <div style={{ maxWidth: 600, margin: '0 auto' }}>

        {/* Header */}
        <header style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 48px)', paddingLeft: 20, paddingRight: 20, paddingBottom: 8, textAlign: 'center' }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.3px' }}>
            История и статистика
          </h1>
        </header>

        {error && (
          <div role="alert" style={{ padding: '16px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: 'var(--red)', marginBottom: 12 }}>{error}</p>
            <button
              onClick={() => setRetryCount((c) => c + 1)}
              style={{
                padding: '10px 24px',
                borderRadius: 10,
                border: 'none',
                background: 'var(--gold-grad)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--font)',
              }}
            >
              Повторить
            </button>
          </div>
        )}

        {/* Stats */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            padding: '0 20px',
            marginTop: 20,
            marginBottom: 16,
          }}
        >
          {loading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : data ? (
            <>
              <StatCard
                value={String(data.daysParticipated)}
                label="Дней"
                valueColor="var(--text)"
              />
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

        {/* Chart */}
        <section
          aria-label="Динамика депозита"
          style={{
            margin: '0 20px 16px',
            background: 'var(--white)',
            borderRadius: 'var(--radius)',
            padding: '16px 16px 12px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          }}
        >
          <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
            Динамика депозита
          </h2>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 10 }}>
            Тапните по точке для деталей
          </p>
          {loading ? (
            <Skeleton width="100%" height={180} borderRadius={8} />
          ) : data && data.entries.length > 0 ? (
            <LineChart entries={data.entries} currency={data.currency} />
          ) : (
            <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-3)', padding: '32px 0' }}>
              Нет данных для отображения
            </p>
          )}
        </section>

        {/* PnL detail */}
        {data && !loading && (
          <div
            style={{
              margin: '0 20px 16px',
              background: 'var(--white)',
              borderRadius: 'var(--radius)',
              padding: '14px 16px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Текущий депозит</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
                {data.currentDeposit.toLocaleString('ru-RU')} {data.currency}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Абсолютный PnL</span>
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: data.pnlAbsolute >= 0 ? 'var(--green)' : 'var(--red)',
                }}
              >
                {data.pnlAbsolute >= 0 ? '+' : ''}{data.pnlAbsolute.toLocaleString('ru-RU')} {data.currency}
              </span>
            </div>
          </div>
        )}

        {/* History list */}
        <section
          aria-label="История операций"
          style={{ padding: '0 20px' }}
        >
          <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
            История операций
          </h2>

          {loading ? (
            Array.from({ length: 7 }, (_, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: '1px solid var(--border)',
                  gap: 12,
                }}
              >
                <Skeleton width={50} height={14} borderRadius={4} />
                <Skeleton width="50%" height={14} borderRadius={4} />
                <Skeleton width={48} height={14} borderRadius={4} style={{ marginLeft: 'auto' }} />
              </div>
            ))
          ) : data ? (
            <div role="table" aria-label="История депозитов">
              {[...data.entries].reverse().map((entry, i) => (
                <div
                  key={entry.date}
                  role="row"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom:
                      i < data.entries.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <span
                    style={{
                      fontSize: 14,
                      color: 'var(--text-2)',
                      width: 56,
                      flexShrink: 0,
                    }}
                  >
                    {entry.dateLabel}
                  </span>
                  <span
                    style={{
                      flex: 1,
                      fontSize: 15,
                      fontWeight: 600,
                      color: 'var(--text)',
                    }}
                  >
                    {entry.amount.toLocaleString('ru-RU')} {data.currency}
                  </span>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      flexShrink: 0,
                      color:
                        entry.dailyChange === null
                          ? 'var(--text-3)'
                          : entry.dailyChange >= 0
                          ? 'var(--green)'
                          : 'var(--red)',
                    }}
                    aria-label={
                      entry.dailyChange !== null
                        ? `Изменение за день: ${entry.dailyChange >= 0 ? 'плюс' : 'минус'} ${Math.abs(entry.dailyChange).toFixed(1)} процентов`
                        : 'Начальная точка'
                    }
                  >
                    {entry.dailyChange === null
                      ? '—'
                      : `${entry.dailyChange >= 0 ? '+' : ''}${entry.dailyChange.toFixed(1)}%`}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </section>
        </div>{/* /content wrapper */}
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
        <BottomNav current="history" onNavigate={onNavigate} />
      </div>
    </div>
  );
};

interface StatCardProps {
  value: string;
  label: string;
  valueColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ value, label, valueColor }) => (
  <div
    style={{
      flex: 1,
      background: 'var(--white)',
      borderRadius: 'var(--radius-sm)',
      padding: '12px 10px',
      textAlign: 'center',
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    }}
  >
    <p style={{ fontSize: 18, fontWeight: 800, color: valueColor, margin: 0 }}>
      {value}
    </p>
    <p
      style={{
        fontSize: 11,
        color: 'var(--text-3)',
        marginTop: 2,
        textTransform: 'uppercase',
        letterSpacing: '0.3px',
        margin: '2px 0 0',
      }}
    >
      {label}
    </p>
  </div>
);

const StatCardSkeleton: React.FC = () => (
  <div
    style={{
      flex: 1,
      background: 'var(--white)',
      borderRadius: 'var(--radius-sm)',
      padding: '12px 10px',
      textAlign: 'center',
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 6,
    }}
  >
    <Skeleton width="60%" height={18} borderRadius={4} />
    <Skeleton width="80%" height={10} borderRadius={4} />
  </div>
);
