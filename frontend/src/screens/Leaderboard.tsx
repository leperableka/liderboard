import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import type { LeaderboardEntry, LeaderboardCategory, Screen, UserStatus } from '../types';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { Podium } from '../components/Podium';
import { LeaderboardRow } from '../components/LeaderboardRow';
import { BottomNav } from '../components/BottomNav';
import { LeaderboardSkeleton, PodiumSkeleton } from '../components/Skeleton';
import { UserHistoryModal } from '../components/UserHistoryModal';

interface LeaderboardProps {
  userStatus: UserStatus;
  onNavigate: (screen: Screen) => void;
  onUpdateDeposit: () => void;
}

const CATEGORY_OPTIONS: { key: LeaderboardCategory; label: string; subtitle: string }[] = [
  { key: 'all',  label: 'Все',    subtitle: 'Общий рейтинг' },
  { key: '1',    label: 'Кат. 1', subtitle: 'до 69\u202F999\u00A0₽ · по курсу ЦБ РФ' },
  { key: '2',    label: 'Кат. 2', subtitle: '70\u202F000–249\u202F999\u00A0₽ · по курсу ЦБ РФ' },
  { key: '3',    label: 'Кат. 3', subtitle: 'от 250\u202F000\u00A0₽ · по курсу ЦБ РФ' },
];

// Dates configurable via VITE_CONTEST_START / VITE_CONTEST_END (ISO with timezone offset)
const CONTEST_START = new Date(
  (import.meta.env.VITE_CONTEST_START as string | undefined) ?? '2026-03-05T21:00:00Z',
);
const CONTEST_END = new Date(
  (import.meta.env.VITE_CONTEST_END as string | undefined) ?? '2026-03-29T23:59:59+03:00',
);
// Human-readable label derived from CONTEST_START (e.g. "6 марта")
const CONTEST_START_LABEL = CONTEST_START.toLocaleDateString('ru-RU', {
  day: 'numeric',
  month: 'long',
  timeZone: 'Europe/Moscow',
});

function getDaysRemaining(): number {
  const now = new Date();
  const diff = CONTEST_END.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function isContestOver(): boolean {
  return new Date() > CONTEST_END;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  userStatus,
  onNavigate,
  onUpdateDeposit,
}) => {
  const { data, loading, error, category, setCategory, refresh } = useLeaderboard(userStatus.telegramId);
  const currentUserRowRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [stickyCurrentUser, setStickyCurrentUser] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<LeaderboardEntry | null>(null);

  // Tick every 60 s so time-dependent values (isBeforeStart, contestOver, daysLeft)
  // stay fresh if the app is left open across a boundary (e.g. contest start moment).
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const daysLeft = useMemo(
    () => Math.max(0, Math.ceil((CONTEST_END.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))),
    [now],
  );
  const contestOver = useMemo(() => now > CONTEST_END, [now]);
  const isBeforeStart = useMemo(() => now < CONTEST_START, [now]);

  const handleDepositClick = useCallback(() => {
    if (isBeforeStart) {
      // Contest hasn't started yet — show "not started" toast
      setToastVisible(true);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => setToastVisible(false), 3000);
    } else if (userStatus.depositUpdatedToday) {
      // Already submitted today — show "after 00:00" toast
      setToastVisible(true);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => setToastVisible(false), 3000);
    } else {
      onUpdateDeposit();
    }
  }, [isBeforeStart, userStatus.depositUpdatedToday, onUpdateDeposit]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  // Initial fetch
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeCategory = CATEGORY_OPTIONS.find((c) => c.key === category) ?? CATEGORY_OPTIONS[0];

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
          Торговый Турнир
        </h1>
        {contestOver ? (
          <p
            style={{
              textAlign: 'center',
              fontSize: 12,
              color: 'rgba(255,255,255,0.85)',
              marginBottom: 4,
              fontWeight: 600,
              letterSpacing: '0.2px',
            }}
          >
            🏆 Турнир завершён
          </p>
        ) : daysLeft > 0 ? (
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
        ) : null}

        {/* Category tabs */}
        <nav aria-label="Категория" style={{ display: 'flex', justifyContent: 'center', gap: 4, padding: '10px 20px 14px' }}>
          {CATEGORY_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setCategory(opt.key)}
              aria-pressed={category === opt.key}
              style={{
                padding: '8px 14px',
                borderRadius: 40,
                fontSize: 13,
                fontWeight: 600,
                color: category === opt.key ? 'var(--gold-3)' : 'rgba(255,255,255,0.7)',
                cursor: 'pointer',
                border: 'none',
                background: category === opt.key ? 'rgba(255,255,255,0.95)' : 'transparent',
                fontFamily: 'var(--font)',
                boxShadow: category === opt.key ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
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
          <Podium
            entries={topEntries}
            onUserClick={(entry) => setSelectedEntry(entry)}
          />
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
              Рейтинг
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500, marginLeft: 6 }}>
              {activeCategory.subtitle}
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
                  onUserClick={setSelectedEntry}
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
            <LeaderboardRow entry={currentUser} isCurrentUser onUserClick={setSelectedEntry} />
          </div>
        )}

        {contestOver ? (
          <div
            style={{
              width: '100%',
              borderRadius: 14,
              background: 'linear-gradient(135deg, #f5a623 0%, #c9730a 100%)',
              color: '#fff',
              padding: '12px 16px',
              marginBottom: 8,
              textAlign: 'center',
              boxShadow: '0 4px 16px rgba(245,166,35,0.30)',
            }}
          >
            <div style={{ fontSize: 20, marginBottom: 2 }}>🏆</div>
            <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font)', lineHeight: 1.3 }}>
              Турнир завершён. Поздравляем победителей!
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 4, fontFamily: 'var(--font)' }}>
              До встречи на следующем турнире
            </div>
          </div>
        ) : (
          <button
            onClick={handleDepositClick}
            style={{
              width: '100%',
              height: 52,
              borderRadius: 14,
              border: 'none',
              background: (isBeforeStart || userStatus.depositUpdatedToday) ? '#D1D5DB' : 'var(--gold-grad)',
              color: (isBeforeStart || userStatus.depositUpdatedToday) ? '#9CA3AF' : '#fff',
              fontSize: 16,
              fontWeight: 600,
              cursor: (isBeforeStart || userStatus.depositUpdatedToday) ? 'default' : 'pointer',
              fontFamily: 'var(--font)',
              boxShadow: (isBeforeStart || userStatus.depositUpdatedToday) ? 'none' : '0 4px 16px rgba(245,166,35,0.35)',
              marginBottom: 8,
              transition: 'all 0.2s',
            }}
          >
            {isBeforeStart
              ? `Старт ${CONTEST_START_LABEL} 00:00`
              : userStatus.depositUpdatedToday
              ? 'Данные на сегодня внесены ✓'
              : 'Внести данные'}
          </button>
        )}

        <BottomNav current="leaderboard" onNavigate={onNavigate} />
      </div>

      {/* Toast: already updated today */}
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(8px) scale(0.95); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0)   scale(1); }
        }
        @keyframes toastOut {
          from { opacity: 1; transform: translateX(-50%) translateY(0)   scale(1); }
          to   { opacity: 0; transform: translateX(-50%) translateY(8px) scale(0.95); }
        }
      `}</style>
      {toastVisible && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            bottom: 130,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 100,
            background: 'rgba(30,30,30,0.92)',
            color: '#fff',
            borderRadius: 14,
            padding: '12px 20px',
            fontSize: 14,
            fontWeight: 500,
            fontFamily: 'var(--font)',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            backdropFilter: 'blur(8px)',
            animation: 'toastIn 0.25s ease forwards',
          }}
        >
          <span style={{ fontSize: 16 }}>{isBeforeStart ? '🔒' : '🕛'}</span>
          {isBeforeStart
            ? `Турнир начнётся ${CONTEST_START_LABEL} в 00:00 МСК`
            : 'Внести данные можно после 00:00'}
        </div>
      )}

      <UserHistoryModal
        entry={selectedEntry}
        onClose={() => setSelectedEntry(null)}
      />
    </div>
  );
};
