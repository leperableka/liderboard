import React, { useEffect, useRef, useState } from 'react';
import type { Period, Screen, UserStatus } from '../types';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { Podium } from '../components/Podium';
import { LeaderboardRow } from '../components/LeaderboardRow';
import { BottomNav } from '../components/BottomNav';
import { LeaderboardSkeleton, PodiumSkeleton } from '../components/Skeleton';

interface LeaderboardProps {
  userStatus: UserStatus;
  onNavigate: (screen: Screen) => void;
  onUpdateDeposit: () => void;
}

const PERIOD_OPTIONS: { key: Period; label: string; subtitle: string }[] = [
  { key: 'day', label: 'День', subtitle: 'Сегодня' },
  { key: 'week', label: 'Неделя', subtitle: 'На этой неделе' },
  { key: 'month', label: 'Месяц', subtitle: 'За месяц' },
];

function getDaysRemaining(): number {
  const end = new Date('2026-03-29T23:59:59');
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  userStatus,
  onNavigate,
  onUpdateDeposit,
}) => {
  const { data, loading, error, period, setPeriod, refresh } = useLeaderboard(userStatus.telegramId);
  const currentUserRowRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [stickyCurrentUser, setStickyCurrentUser] = useState(false);
  const daysLeft = getDaysRemaining();

  // Initial fetch
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activePeriod = PERIOD_OPTIONS.find((p) => p.key === period) ?? PERIOD_OPTIONS[1];

  // Determine if current user row is visible; if not, show sticky row
  useEffect(() => {
    const listEl = listRef.current;
    const rowEl = currentUserRowRef.current;
    if (!listEl || !rowEl) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setStickyCurrentUser(!entry.isIntersecting);
      },
      { root: listEl, threshold: 0.5 }
    );

    observer.observe(rowEl);
    return () => observer.disconnect();
  }, [data]);

  const topEntries = data?.entries.slice(0, 3) ?? [];
  const listEntries = data?.entries.slice(3) ?? [];
  const currentUser = data?.currentUser;
  const currentUserInList = listEntries.find((e) => e.isCurrentUser);
  const isCurrentUserInTop3 = topEntries.some((e) => e.isCurrentUser);

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
      {/* Header */}
      <div
        style={{
          background: 'var(--gold-grad-h)',
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 42px)',
          flexShrink: 0,
          position: 'relative',
          overflow: 'visible',
        }}
      >
        {/* Brand */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            padding: '0 0 6px',
          }}
        >
          <img
            src="/logo.svg"
            alt="Логотип"
            style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0 }}
          />
          <span
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: '#fff',
              letterSpacing: '-0.3px',
              textShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }}
          >
            Vesperfin&amp;Co.Trading
          </span>
        </div>

        <h1
          style={{
            textAlign: 'center',
            fontSize: 15,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.85)',
            padding: '0 0 4px',
            letterSpacing: '0.3px',
            textTransform: 'uppercase',
          }}
        >
          Торговый Чемпионат
        </h1>
        {daysLeft > 0 && (
          <p
            style={{
              textAlign: 'center',
              fontSize: 12,
              color: 'rgba(255,255,255,0.7)',
              marginBottom: 4,
            }}
          >
            Осталось дней: {daysLeft}
          </p>
        )}

        {/* Period tabs */}
        <nav aria-label="Период" style={{ display: 'flex', justifyContent: 'center', gap: 4, padding: '10px 20px 14px' }}>
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setPeriod(opt.key)}
              aria-pressed={period === opt.key}
              style={{
                padding: '8px 20px',
                borderRadius: 40,
                fontSize: 14,
                fontWeight: 600,
                color: period === opt.key ? 'var(--gold-3)' : 'rgba(255,255,255,0.7)',
                cursor: 'pointer',
                border: 'none',
                background: period === opt.key ? 'rgba(255,255,255,0.95)' : 'transparent',
                fontFamily: 'var(--font)',
                boxShadow: period === opt.key ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.25s',
                minHeight: 44,
              }}
            >
              {opt.label}
            </button>
          ))}
        </nav>

        {/* Podium */}
        {loading && !data ? (
          <PodiumSkeleton />
        ) : topEntries.length > 0 ? (
          <Podium entries={topEntries} />
        ) : null}
      </div>

      {/* White card */}
      <div
        style={{
          background: 'var(--white)',
          borderRadius: '24px 24px 0 0',
          marginTop: -16,
          position: 'relative',
          zIndex: 5,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '18px 20px 6px',
          }}
        >
          <div>
            <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>
              Лидерборд
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500, marginLeft: 6 }}>
              {activePeriod.subtitle}
            </span>
          </div>
        </div>

        {data && (
          <p style={{ padding: '0 20px 10px', fontSize: 13, color: 'var(--text-3)' }}>
            <strong style={{ color: 'var(--text)', fontWeight: 700 }}>
              {data.totalParticipants}
            </strong>{' '}
            участников
          </p>
        )}

        {/* Scrollable list */}
        <div
          ref={listRef}
          role="table"
          aria-label="Таблица лидеров"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0 12px 160px',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {error && (
            <div
              role="alert"
              style={{
                padding: '16px 20px',
                textAlign: 'center',
              }}
            >
              <p style={{ fontSize: 14, color: 'var(--red)', marginBottom: 12 }}>{error}</p>
              <button
                onClick={refresh}
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

          {loading && !data ? (
            <LeaderboardSkeleton />
          ) : (
            <>
              {listEntries.map((entry) => (
                <LeaderboardRow
                  key={entry.telegramId}
                  entry={entry}
                  isCurrentUser={entry.isCurrentUser}
                  innerRef={entry.isCurrentUser ? currentUserRowRef : undefined}
                />
              ))}
              {!isCurrentUserInTop3 && !currentUserInList && currentUser && (
                <LeaderboardRow
                  entry={currentUser}
                  isCurrentUser
                  innerRef={currentUserRowRef}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Fixed bottom */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          background: 'var(--white)',
          borderTop: '1px solid var(--border)',
          padding: '10px 20px 0',
        }}
      >
        {/* Sticky current user row when not visible in list */}
        {stickyCurrentUser && currentUser && (
          <div
            style={{
              marginBottom: 8,
              padding: '0 4px',
              borderRadius: 10,
              background: 'rgba(245,166,35,0.06)',
              border: '1px solid rgba(245,166,35,0.2)',
            }}
          >
            <LeaderboardRow entry={currentUser} isCurrentUser />
          </div>
        )}

        <button
          onClick={onUpdateDeposit}
          disabled={userStatus.depositUpdatedToday}
          style={{
            width: '100%',
            height: 52,
            borderRadius: 14,
            border: 'none',
            background: userStatus.depositUpdatedToday ? '#D1D5DB' : 'var(--gold-grad)',
            color: userStatus.depositUpdatedToday ? '#9CA3AF' : '#fff',
            fontSize: 16,
            fontWeight: 600,
            cursor: userStatus.depositUpdatedToday ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font)',
            boxShadow: userStatus.depositUpdatedToday ? 'none' : '0 4px 16px rgba(245,166,35,0.35)',
            marginBottom: 8,
            transition: 'all 0.2s',
          }}
        >
          {userStatus.depositUpdatedToday ? 'Данные на сегодня внесены' : 'Внести данные'}
        </button>

        <BottomNav current="leaderboard" onNavigate={onNavigate} />
      </div>
    </div>
  );
};
