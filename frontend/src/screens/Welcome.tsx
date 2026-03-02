import React from 'react';

// 6 марта 00:00 МСК = 5 марта 21:00:00 UTC
const REGISTRATION_DEADLINE = new Date('2026-03-05T21:00:00Z');

interface WelcomeProps {
  onRegister: () => void;
  onViewLeaderboard: () => void;
  isRegistered: boolean;
}

export const Welcome: React.FC<WelcomeProps> = ({
  onRegister,
  onViewLeaderboard,
  isRegistered,
}) => {
  const isDeadlinePassed = new Date() > REGISTRATION_DEADLINE;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--gold-grad-h)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 32px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative circles */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: -60,
          right: -60,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: -40,
          left: -40,
          width: 160,
          height: 160,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
          pointerEvents: 'none',
        }}
      />

      <span
        role="img"
        aria-label="Трофей"
        style={{
          fontSize: 72,
          marginBottom: 16,
          display: 'block',
          filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))',
          animation: 'float 3s ease-in-out infinite',
        }}
      >
        🏆
      </span>

      <h1
        style={{
          fontSize: 'clamp(22px, 7vw, 30px)',
          fontWeight: 800,
          color: '#fff',
          letterSpacing: '-0.5px',
          lineHeight: 1.2,
          whiteSpace: 'nowrap',
          textShadow: '0 2px 8px rgba(0,0,0,0.1)',
          animation: 'fadeUp 0.5s ease both',
          animationDelay: '0.1s',
        }}
      >
        Торговый Турнир
      </h1>

      <p
        style={{
          fontSize: 30,
          fontWeight: 800,
          color: '#fff',
          marginTop: 4,
          letterSpacing: '-0.5px',
          lineHeight: 1.2,
          fontFamily: 'var(--font)',
          animation: 'fadeUp 0.5s ease both',
          animationDelay: '0.15s',
        }}
      >
        Vesperfin&amp;Co.Trading
      </p>

      <p
        style={{
          fontSize: 15,
          color: 'rgba(255,255,255,0.85)',
          marginTop: 12,
          lineHeight: 1.5,
          maxWidth: 300,
          animation: 'fadeUp 0.5s ease both',
          animationDelay: '0.2s',
        }}
      >
        Покажи свои результаты в&nbsp;трейдинге. Соревнуйся с&nbsp;лучшими трейдерами и&nbsp;выиграй главный приз.
      </p>

      <div
        style={{
          width: '100%',
          maxWidth: 300,
          marginTop: 32,
          animation: 'fadeUp 0.5s ease both',
          animationDelay: '0.3s',
        }}
      >
        {isDeadlinePassed || isRegistered ? (
          <div>
            {!isRegistered && (
              <p
                style={{
                  fontSize: 14,
                  color: 'rgba(255,255,255,0.9)',
                  marginBottom: 16,
                  background: 'rgba(0,0,0,0.15)',
                  padding: '12px 16px',
                  borderRadius: 12,
                  lineHeight: 1.4,
                }}
              >
                Регистрация закрыта, турнир начался. Вы&nbsp;можете следить за&nbsp;лидербордом.
              </p>
            )}
            <button
              onClick={onViewLeaderboard}
              style={{
                width: '100%',
                height: 52,
                borderRadius: 14,
                border: 'none',
                background: 'rgba(255,255,255,0.95)',
                color: 'var(--gold-3)',
                fontSize: 16,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                fontFamily: 'var(--font)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onPointerDown={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.97)';
              }}
              onPointerUp={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = '';
              }}
            >
              Смотреть лидерборд
            </button>
          </div>
        ) : (
          <button
            onClick={onRegister}
            style={{
              width: '100%',
              height: 52,
              borderRadius: 14,
              border: 'none',
              background: 'rgba(255,255,255,0.95)',
              color: 'var(--gold-3)',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              fontFamily: 'var(--font)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onPointerDown={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.97)';
            }}
            onPointerUp={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = '';
            }}
          >
            Зарегистрироваться
          </button>
        )}
      </div>

      {!isDeadlinePassed && !isRegistered && (
        <a
          href="https://vesperfin.com/upload/iblock/1f8/m8mz16zvynkrwodl9o2brzdkkkeb7717/pravila_konkursa.pdf"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            marginTop: 16,
            fontSize: 14,
            color: 'rgba(255,255,255,0.75)',
            textDecoration: 'underline',
            cursor: 'pointer',
            fontFamily: 'var(--font)',
            animation: 'fadeUp 0.5s ease both',
            animationDelay: '0.4s',
            minHeight: 44,
            lineHeight: '44px',
          }}
        >
          Подробнее о правилах
        </a>
      )}
    </div>
  );
};
