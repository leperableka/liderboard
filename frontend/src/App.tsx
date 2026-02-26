import React, { useCallback, useEffect, useState } from 'react';
import type { Screen, UserStatus, RegistrationData } from './types';
import { getStatus } from './api/client';
import { useTelegram } from './hooks/useTelegram';
import { Welcome } from './screens/Welcome';
import { RegistrationContainer } from './screens/Registration';
import { Leaderboard } from './screens/Leaderboard';
import { UpdateDeposit } from './screens/UpdateDeposit';
import { History } from './screens/History';
import { Profile } from './screens/Profile';
import { Rules } from './screens/Rules';
import { SplashScreen } from './components/SplashScreen';

const IS_DEV = import.meta.env.DEV;

type AppState =
  | { phase: 'loading' }
  | { phase: 'error'; message: string }
  | { phase: 'ready'; screen: Screen; userStatus: UserStatus | null };

function buildDefaultUserStatus(telegramId: number, displayName: string): UserStatus {
  return {
    registered: false,
    depositUpdatedToday: false,
    telegramId,
    displayName,
    market: null,
    instruments: [],
    initialDeposit: 0,
    currency: 'USDT',
    avatarUrl: null,
  };
}

export const App: React.FC = () => {
  const { user, isReady, expand } = useTelegram();
  const [state, setState] = useState<AppState>({ phase: 'loading' });
  const [registrationSeedData, setRegistrationSeedData] = useState<Partial<RegistrationData>>({});
  const [splashDone, setSplashDone] = useState(false);
  const handleSplashComplete = useCallback(() => setSplashDone(true), []);

  useEffect(() => {
    expand();
    const telegramId = user?.id;
    if (!telegramId) {
      if (IS_DEV) {
        // In dev mode allow navigation without Telegram
        setState({
          phase: 'ready',
          screen: 'welcome',
          userStatus: buildDefaultUserStatus(0, 'Гость'),
        });
      }
      // In production without Telegram ID, stay in loading state —
      // the stub page is rendered based on !isReady check below.
      return;
    }

    getStatus(telegramId)
      .then((status) => {
        const initialScreen: Screen = status.registered ? 'leaderboard' : 'welcome';
        setState({ phase: 'ready', screen: initialScreen, userStatus: status });
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Ошибка соединения';
        if (IS_DEV) {
          setState({
            phase: 'ready',
            screen: 'welcome',
            userStatus: buildDefaultUserStatus(telegramId, `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim()),
          });
        } else {
          setState({ phase: 'error', message: msg });
        }
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function navigateTo(screen: Screen) {
    setState((prev) => {
      if (prev.phase !== 'ready') return prev;
      return { ...prev, screen };
    });
  }

  function handleStartRegistration() {
    const seed: Partial<RegistrationData> = {
      displayName: user
        ? `${user.first_name}${user.last_name ? ' ' + user.last_name : ''}`
        : '',
      avatarUrl: user?.photo_url ?? null,
    };
    setRegistrationSeedData(seed);
    navigateTo('registration');
  }

  function handleRegistrationComplete(newStatus: UserStatus) {
    setState({ phase: 'ready', screen: 'leaderboard', userStatus: newStatus });
  }

  function handleDepositSuccess() {
    setState((prev) => {
      if (prev.phase !== 'ready' || !prev.userStatus) return prev;
      return {
        ...prev,
        screen: 'leaderboard',
        userStatus: { ...prev.userStatus, depositUpdatedToday: true },
      };
    });
  }

  function handleProfileUpdated(displayName: string, avatarUrl?: string | null) {
    setState((prev) => {
      if (prev.phase !== 'ready' || !prev.userStatus) return prev;
      const updates: Partial<typeof prev.userStatus> = { displayName };
      if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;
      return { ...prev, userStatus: { ...prev.userStatus, ...updates } };
    });
  }

  // ── Non-Telegram stub ────────────────────────────────────────────────────────
  // Show stub when not in Telegram context (initData is empty) and not in dev mode.
  // Using isReady (based on non-empty initData) is more reliable than checking user,
  // because initDataUnsafe.user could theoretically be null even in Telegram context.
  if (!isReady) {
    return (
      <>
        {!splashDone && <SplashScreen onComplete={handleSplashComplete} />}
        {splashDone && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '100vh',
              background: 'linear-gradient(160deg, #f5a623 0%, #e8920a 40%, #c9730a 100%)',
              padding: '0 32px',
              textAlign: 'center',
              gap: 16,
            }}
          >
            <div
              style={{
                width: 88,
                height: 88,
                borderRadius: '50%',
                overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                marginBottom: 8,
              }}
            >
              <img
                src="/logo.svg"
                alt="Логотип"
                style={{ width: 88, height: 88, display: 'block' }}
              />
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: '#fff',
                letterSpacing: '-0.3px',
                textShadow: '0 2px 8px rgba(0,0,0,0.2)',
                fontFamily: 'var(--font)',
              }}
            >
              Vesperfin&amp;Co.Trading
            </div>
            <div
              style={{
                fontSize: 13,
                color: 'rgba(255,255,255,0.85)',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                fontFamily: 'var(--font)',
              }}
            >
              Торговый Чемпионат
            </div>
            <div
              style={{
                marginTop: 24,
                padding: '20px 24px',
                background: 'rgba(255,255,255,0.15)',
                borderRadius: 20,
                backdropFilter: 'blur(10px)',
              }}
            >
              <p
                style={{
                  fontSize: 16,
                  color: '#fff',
                  lineHeight: 1.6,
                  margin: 0,
                  fontFamily: 'var(--font)',
                }}
              >
                Это приложение доступно только через Telegram
              </p>
              <p
                style={{
                  fontSize: 14,
                  color: 'rgba(255,255,255,0.8)',
                  marginTop: 8,
                  lineHeight: 1.5,
                  fontFamily: 'var(--font)',
                }}
              >
                Откройте бот в Telegram, чтобы участвовать в чемпионате
              </p>
            </div>
            <a
              href="https://t.me/vfleaderbot"
              style={{
                marginTop: 8,
                padding: '16px 32px',
                borderRadius: 16,
                background: 'rgba(255,255,255,0.95)',
                color: 'var(--gold-3)',
                fontSize: 16,
                fontWeight: 700,
                textDecoration: 'none',
                fontFamily: 'var(--font)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
              }}
            >
              Открыть в Telegram
            </a>
          </div>
        )}
      </>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  const readyState = state.phase === 'ready' ? state : null;

  return (
    <>
      {/* Splash overlay — shows on every open, regardless of app phase */}
      {!splashDone && <SplashScreen onComplete={handleSplashComplete} />}

      {/* Loading */}
      {state.phase === 'loading' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: 'var(--gold-grad-h)',
            flexDirection: 'column',
            gap: 20,
          }}
          role="status"
          aria-label="Загрузка"
        >
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div
            style={{
              width: 40,
              height: 40,
              border: '3px solid rgba(255,255,255,0.3)',
              borderTopColor: '#fff',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
        </div>
      )}

      {/* Error */}
      {state.phase === 'error' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: 'var(--bg)',
            flexDirection: 'column',
            gap: 16,
            padding: '0 32px',
            textAlign: 'center',
          }}
          role="alert"
        >
          <span style={{ fontSize: 48 }} aria-hidden="true">⚠️</span>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>
            Ошибка загрузки
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.5 }}>
            {state.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 8,
              padding: '14px 32px',
              borderRadius: 14,
              border: 'none',
              background: 'var(--gold-grad)',
              color: '#fff',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'var(--font)',
              boxShadow: '0 4px 16px rgba(245,166,35,0.35)',
            }}
          >
            Повторить
          </button>
        </div>
      )}

      {/* Ready */}
      {readyState && (
        <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
          {readyState.screen === 'welcome' && (
            <Welcome
              onRegister={handleStartRegistration}
              onViewLeaderboard={() => navigateTo('leaderboard')}
              isRegistered={readyState.userStatus?.registered ?? false}
            />
          )}

          {readyState.screen === 'registration' && (
            <RegistrationContainer
              initialData={registrationSeedData}
              onComplete={handleRegistrationComplete}
              onBack={() => navigateTo('welcome')}
            />
          )}

          {readyState.screen === 'leaderboard' && readyState.userStatus && (
            <Leaderboard
              userStatus={readyState.userStatus}
              onNavigate={navigateTo}
              onUpdateDeposit={() => navigateTo('update-deposit')}
            />
          )}

          {readyState.screen === 'update-deposit' && readyState.userStatus && (
            <UpdateDeposit
              userStatus={readyState.userStatus}
              onBack={() => navigateTo('leaderboard')}
              onSuccess={handleDepositSuccess}
            />
          )}

          {readyState.screen === 'history' && readyState.userStatus && (
            <History
              userStatus={readyState.userStatus}
              onNavigate={navigateTo}
            />
          )}

          {readyState.screen === 'profile' && readyState.userStatus && (
            <Profile
              userStatus={readyState.userStatus}
              onNavigate={navigateTo}
              onProfileUpdated={handleProfileUpdated}
            />
          )}

          {readyState.screen === 'rules' && (
            <Rules onNavigate={navigateTo} />
          )}
        </div>
      )}
    </>
  );
};
