import React from 'react';
import type { Screen } from '../types/index';
import { BottomNav } from '../components/BottomNav';

interface RulesProps {
  onNavigate: (screen: Screen) => void;
}

// ─── Roadmap data ─────────────────────────────────────────────────────────────

const ROADMAP = [
  { label: 'Приём заявок', date: 'до 5 марта 2026' },
  { label: 'Закрытие лидерборда', date: '29 марта 2026' },
  { label: 'Финиш', date: '5 апреля 2026' },
];

// ─── Small layout helpers ─────────────────────────────────────────────────────

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ marginBottom: 20 }}>
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: 'var(--text-3)',
        textTransform: 'uppercase',
        letterSpacing: '0.8px',
        marginBottom: 10,
        fontFamily: 'var(--font)',
      }}
    >
      {title}
    </div>
    <div
      style={{
        background: 'var(--card)',
        borderRadius: 16,
        padding: '16px',
      }}
    >
      {children}
    </div>
  </div>
);

const bodyText: React.CSSProperties = {
  margin: '0 0 10px',
  fontSize: 14,
  lineHeight: 1.65,
  color: 'var(--text-2)',
  fontFamily: 'var(--font)',
};

// ─── Component ────────────────────────────────────────────────────────────────

export const Rules: React.FC<RulesProps> = ({ onNavigate }) => (
  <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>

    {/* Header */}
    <div
      style={{
        padding: '16px 20px 12px',
        background: 'var(--bg-2)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <h1
        style={{
          margin: 0,
          fontSize: 18,
          fontWeight: 700,
          color: 'var(--text)',
          fontFamily: 'var(--font)',
        }}
      >
        Правила
      </h1>
    </div>

    {/* Scrollable body */}
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px 100px' }}>

      {/* ── Roadmap ── */}
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--text-3)',
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            marginBottom: 10,
            fontFamily: 'var(--font)',
          }}
        >
          Расписание
        </div>
        <div
          style={{
            background: 'var(--card)',
            borderRadius: 16,
            padding: '8px 20px 12px',
          }}
        >
          {ROADMAP.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'stretch' }}>
              {/* Timeline spine */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: 18,
                  marginRight: 14,
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: i === 0 ? 'var(--gold-2)' : 'var(--border)',
                    flexShrink: 0,
                    marginTop: 18,
                  }}
                />
                {i < ROADMAP.length - 1 && (
                  <div
                    style={{
                      flex: 1,
                      width: 2,
                      background: 'var(--border)',
                      minHeight: 20,
                    }}
                  />
                )}
              </div>
              {/* Label */}
              <div style={{ paddingTop: 12, paddingBottom: 12 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'var(--text)',
                    fontFamily: 'var(--font)',
                  }}
                >
                  {item.label}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--text-3)',
                    marginTop: 2,
                    fontFamily: 'var(--font)',
                  }}
                >
                  {item.date}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Цель ── */}
      <Section title="Цель">
        <p style={bodyText}>
          Это не погоня за быстрым заработком, а тренажёр, который прокачивает ключевые
          навыки трейдера — чувство рынка, риск-менеджмент и дисциплину. Именно они дают
          стабильный результат, а не разовые удачные сделки.
        </p>
        <p style={{ ...bodyText, marginBottom: 0 }}>
          Главная метрика соревнования — P&L (Profit & Loss). Побеждает тот, кто покажет
          максимальную доходность за ограниченный период.
        </p>
      </Section>

      {/* ── Как это работает ── */}
      <Section title="Как это работает">
        {[
          'Один раз указываете стартовый депозит.',
          'Каждый день вводите текущее значение депозита.',
          'P&L рассчитывается автоматически как прирост относительно старта.',
        ].map((text, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              gap: 12,
              marginBottom: i < 2 ? 10 : 0,
              alignItems: 'flex-start',
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: 'var(--gold-2)',
                color: '#fff',
                fontSize: 12,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: 1,
                fontFamily: 'var(--font)',
              }}
            >
              {i + 1}
            </div>
            <p style={{ ...bodyText, margin: 0, paddingTop: 2 }}>{text}</p>
          </div>
        ))}
      </Section>

      {/* ── Формула ── */}
      <Section title="Формула расчёта P&L">
        {/* Formula box */}
        <div
          style={{
            background: 'var(--bg)',
            borderRadius: 12,
            padding: '12px 14px',
            borderLeft: '3px solid var(--gold-2)',
            marginBottom: 14,
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: 'var(--text-3)',
              marginBottom: 4,
              fontWeight: 600,
              fontFamily: 'var(--font)',
            }}
          >
            P&L (%)
          </div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--text)',
              fontFamily: 'var(--font)',
              lineHeight: 1.5,
            }}
          >
            = (Текущий депозит − Стартовый депозит) / Стартовый депозит × 100
          </div>
        </div>

        {/* Example */}
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--text-2)',
            marginBottom: 8,
            fontFamily: 'var(--font)',
          }}
        >
          Пример — прибыль:
        </div>
        <div
          style={{
            background: 'var(--bg)',
            borderRadius: 12,
            padding: '12px 14px',
          }}
        >
          {[
            'Стартовый депозит: 100 000 ₽',
            'На конец дня участник вводит: 112 000 ₽',
            '',
            '112 000 − 100 000 = 12 000 ₽ прибыли',
            '12 000 / 100 000 × 100 = +12%',
          ].map((line, i) =>
            line === '' ? (
              <div key={i} style={{ height: 8 }} />
            ) : (
              <div
                key={i}
                style={{
                  fontSize: 13,
                  color: i >= 3 ? 'var(--text)' : 'var(--text-2)',
                  fontWeight: i === 4 ? 700 : 400,
                  lineHeight: 1.7,
                  fontFamily: 'var(--font)',
                }}
              >
                {line}
              </div>
            )
          )}
        </div>
      </Section>

      {/* ── Важно ── */}
      <Section title="Важно">
        {[
          'Учитывается полный депозит, а не отдельные сделки.',
          'Нереализованные позиции входят в расчёт — берётся фактический баланс счёта.',
          'Пополнение и вывод средств запрещены.',
        ].map((text, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              gap: 10,
              marginBottom: i < 2 ? 10 : 0,
              alignItems: 'flex-start',
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--gold-2)',
                flexShrink: 0,
                marginTop: 7,
              }}
            />
            <p style={{ ...bodyText, margin: 0 }}>{text}</p>
          </div>
        ))}
      </Section>

      {/* ── Подведение итогов ── */}
      <Section title="Подведение итогов">
        {[
          'Итоговый рейтинг публикуется после проверки данных всех участников.',
          'Победители объявляются до 23:59 в последний день соревнования.',
          'Vesperfin&Co.Trading оставляет за собой право проводить дополнительные проверки и корректировать результаты при выявлении несоответствий.',
        ].map((text, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              gap: 10,
              marginBottom: i < 2 ? 10 : 0,
              alignItems: 'flex-start',
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--border)',
                flexShrink: 0,
                marginTop: 7,
              }}
            />
            <p style={{ ...bodyText, margin: 0 }}>{text}</p>
          </div>
        ))}
      </Section>

    </div>

    {/* Bottom nav */}
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'var(--bg-2)',
        borderTop: '1px solid var(--border)',
      }}
    >
      <BottomNav current="rules" onNavigate={onNavigate} />
    </div>
  </div>
);
