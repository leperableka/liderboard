import React, { useEffect, useState } from 'react';
import type { Screen } from '../types/index';
import { BottomNav } from '../components/BottomNav';

interface RulesProps {
  onNavigate: (screen: Screen) => void;
}

// ─── Roadmap ──────────────────────────────────────────────────────────────────

interface Milestone {
  label: string;
  date: string;
  deadline: Date;
  status: 'done' | 'active' | 'upcoming';
}

function buildRoadmap(): Milestone[] {
  const now = new Date();
  const milestones = [
    { label: 'Приём заявок',        date: 'до 5 марта 2026',  deadline: new Date('2026-03-05T23:59:59') },
    { label: 'Закрытие лидерборда', date: '29 марта 2026',    deadline: new Date('2026-03-29T23:59:59') },
    { label: 'Финиш',               date: '5 апреля 2026',    deadline: new Date('2026-04-05T23:59:59') },
  ];

  let activeSet = false;
  return milestones.map((m) => {
    if (now > m.deadline) {
      return { ...m, status: 'done' as const };
    }
    if (!activeSet) {
      activeSet = true;
      return { ...m, status: 'active' as const };
    }
    return { ...m, status: 'upcoming' as const };
  });
}

// ─── Small helpers ────────────────────────────────────────────────────────────

const bodyText: React.CSSProperties = {
  margin: '0 0 10px',
  fontSize: 14,
  lineHeight: 1.65,
  color: 'var(--text-2)',
  fontFamily: 'var(--font)',
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ marginBottom: 20 }}>
    <div style={{
      fontSize: 11,
      fontWeight: 700,
      color: 'var(--text-3)',
      textTransform: 'uppercase',
      letterSpacing: '0.8px',
      marginBottom: 10,
      fontFamily: 'var(--font)',
    }}>
      {title}
    </div>
    <div style={{ background: 'var(--card)', borderRadius: 16, padding: '16px' }}>
      {children}
    </div>
  </div>
);

// ─── Roadmap component ────────────────────────────────────────────────────────

const Roadmap: React.FC = () => {
  const [milestones] = useState(buildRoadmap);
  const [pulse, setPulse] = useState(false);

  // Pulse animation toggle for active dot
  useEffect(() => {
    const id = setInterval(() => setPulse((p) => !p), 900);
    return () => clearInterval(id);
  }, []);

  // Calculate progress % along the timeline
  const now = new Date();
  const start = new Date('2026-03-05T00:00:00');
  const end   = new Date('2026-04-05T23:59:59');
  const rawProgress = (now.getTime() - start.getTime()) / (end.getTime() - start.getTime());
  const progress = Math.min(1, Math.max(0, rawProgress));

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        fontSize: 11,
        fontWeight: 700,
        color: 'var(--text-3)',
        textTransform: 'uppercase',
        letterSpacing: '0.8px',
        marginBottom: 10,
        fontFamily: 'var(--font)',
      }}>
        Расписание
      </div>

      <div style={{ background: 'var(--card)', borderRadius: 16, padding: '20px 20px 16px' }}>
        {/* ── Progress bar track ── */}
        <div style={{ position: 'relative', marginBottom: 20 }}>
          {/* Track */}
          <div style={{
            height: 4,
            background: 'var(--border)',
            borderRadius: 4,
            overflow: 'hidden',
          }}>
            {/* Fill */}
            <div style={{
              height: '100%',
              width: `${progress * 100}%`,
              background: 'linear-gradient(90deg, var(--gold-3), var(--gold-2))',
              borderRadius: 4,
              transition: 'width 1s ease',
            }} />
          </div>

          {/* Dots on the bar at 0%, 50%, 100% */}
          {[0, 50, 100].map((pct, i) => {
            const m = milestones[i]!;
            const isDone   = m.status === 'done';
            const isActive = m.status === 'active';
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: `${pct}%`,
                  transform: 'translate(-50%, -50%)',
                  width: isActive ? 16 : 12,
                  height: isActive ? 16 : 12,
                  borderRadius: '50%',
                  background: isDone || isActive ? 'var(--gold-2)' : 'var(--border)',
                  border: isActive ? `3px solid var(--card)` : `2px solid ${isDone ? 'var(--gold-2)' : 'var(--border)'}`,
                  boxShadow: isActive
                    ? `0 0 0 ${pulse ? '6px' : '3px'} rgba(245,166,35,0.25)`
                    : 'none',
                  transition: 'box-shadow 0.9s ease, width 0.3s, height 0.3s',
                  zIndex: 2,
                }}
              />
            );
          })}
        </div>

        {/* ── Labels below ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          {milestones.map((m, i) => {
            const isActive = m.status === 'active';
            const isDone   = m.status === 'done';
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  textAlign: i === 0 ? 'left' : i === 2 ? 'right' : 'center',
                  paddingLeft: i === 1 ? 8 : 0,
                  paddingRight: i === 1 ? 8 : 0,
                }}
              >
                <div style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: isActive ? 'var(--gold-2)' : isDone ? 'var(--text-2)' : 'var(--text-3)',
                  fontFamily: 'var(--font)',
                  lineHeight: 1.3,
                }}>
                  {m.label}
                </div>
                <div style={{
                  fontSize: 11,
                  color: 'var(--text-3)',
                  marginTop: 2,
                  fontFamily: 'var(--font)',
                }}>
                  {m.date}
                </div>
                {isActive && (
                  <div style={{
                    display: 'inline-block',
                    marginTop: 4,
                    fontSize: 10,
                    fontWeight: 700,
                    color: 'var(--gold-2)',
                    background: 'rgba(245,166,35,0.12)',
                    borderRadius: 6,
                    padding: '2px 6px',
                    fontFamily: 'var(--font)',
                  }}>
                    Сейчас
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────

export const Rules: React.FC<RulesProps> = ({ onNavigate }) => (
  <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>

    {/* Header */}
    <div style={{
      paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)',
      paddingBottom: 12,
      paddingLeft: 20,
      paddingRight: 20,
      background: 'var(--white)',
      borderBottom: '1px solid var(--border)',
    }}>
      <h1 style={{
        margin: 0,
        fontSize: 18,
        fontWeight: 700,
        color: 'var(--text)',
        fontFamily: 'var(--font)',
      }}>
        Правила
      </h1>
    </div>

    {/* Scrollable body */}
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px 100px' }}>

      <Roadmap />

      {/* Цель */}
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

      {/* Как это работает */}
      <Section title="Как это работает">
        {[
          'Один раз указываете стартовый депозит.',
          'Каждый день вводите текущее значение депозита.',
          'P&L рассчитывается автоматически как прирост относительно старта.',
        ].map((text, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, marginBottom: i < 2 ? 10 : 0, alignItems: 'flex-start' }}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%',
              background: 'var(--gold-2)', color: '#fff',
              fontSize: 12, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, marginTop: 1, fontFamily: 'var(--font)',
            }}>
              {i + 1}
            </div>
            <p style={{ ...bodyText, margin: 0, paddingTop: 2 }}>{text}</p>
          </div>
        ))}
      </Section>

      {/* Формула */}
      <Section title="Формула расчёта P&L">
        <div style={{
          background: 'var(--bg)',
          borderRadius: 12,
          padding: '12px 14px',
          borderLeft: '3px solid var(--gold-2)',
          marginBottom: 14,
        }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4, fontWeight: 600, fontFamily: 'var(--font)' }}>
            P&L (%)
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font)', lineHeight: 1.5 }}>
            = (Текущий депозит − Стартовый депозит) / Стартовый депозит × 100
          </div>
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8, fontFamily: 'var(--font)' }}>
          Пример — прибыль:
        </div>
        <div style={{ background: 'var(--bg)', borderRadius: 12, padding: '12px 14px' }}>
          {[
            { text: 'Стартовый депозит: 100 000 ₽', bold: false },
            { text: 'На конец дня участник вводит: 112 000 ₽', bold: false },
            { text: '', bold: false },
            { text: '112 000 − 100 000 = 12 000 ₽ прибыли', bold: false },
            { text: '12 000 / 100 000 × 100 = +12%', bold: true },
          ].map((line, i) =>
            line.text === '' ? (
              <div key={i} style={{ height: 8 }} />
            ) : (
              <div key={i} style={{
                fontSize: 13,
                color: line.bold ? 'var(--gold-2)' : 'var(--text-2)',
                fontWeight: line.bold ? 700 : 400,
                lineHeight: 1.7,
                fontFamily: 'var(--font)',
              }}>
                {line.text}
              </div>
            )
          )}
        </div>
      </Section>

      {/* Важно */}
      <Section title="Важно">
        {[
          'Учитывается полный депозит, а не отдельные сделки.',
          'Нереализованные позиции входят в расчёт — берётся фактический баланс счёта.',
          'Пополнение и вывод средств запрещены.',
        ].map((text, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, marginBottom: i < 2 ? 10 : 0, alignItems: 'flex-start' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold-2)', flexShrink: 0, marginTop: 7 }} />
            <p style={{ ...bodyText, margin: 0 }}>{text}</p>
          </div>
        ))}
      </Section>

      {/* Подведение итогов */}
      <Section title="Подведение итогов">
        {[
          'Итоговый рейтинг публикуется после проверки данных всех участников.',
          'Победители объявляются до 23:59 в последний день соревнования.',
          'Vesperfin&Co.Trading оставляет за собой право проводить дополнительные проверки и корректировать результаты при выявлении несоответствий.',
        ].map((text, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, marginBottom: i < 2 ? 10 : 0, alignItems: 'flex-start' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--border)', flexShrink: 0, marginTop: 7 }} />
            <p style={{ ...bodyText, margin: 0 }}>{text}</p>
          </div>
        ))}
      </Section>

    </div>

    {/* Bottom nav — same structure as Leaderboard/History */}
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 20,
      background: 'var(--white)',
      borderTop: '1px solid var(--border)',
      padding: '4px 20px 0',
    }}>
      <BottomNav current="rules" onNavigate={onNavigate} />
    </div>
  </div>
);
