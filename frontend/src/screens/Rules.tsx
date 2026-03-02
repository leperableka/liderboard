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
    { label: 'Приём заявок', date: '2–5 марта',     deadline: new Date('2026-03-05T23:59:59+03:00') },
    { label: 'Турнир',       date: '6–29 марта',    deadline: new Date('2026-03-29T23:59:59+03:00') },
    { label: 'Итоги',        date: '30–31 марта',   deadline: new Date('2026-03-31T23:59:59+03:00') },
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

  useEffect(() => {
    const id = setInterval(() => setPulse((p) => !p), 900);
    return () => clearInterval(id);
  }, []);

  const now = new Date();
  const start = new Date('2026-03-02T00:00:00+03:00');
  const end   = new Date('2026-03-31T23:59:59+03:00');
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
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <div style={{
            height: 4,
            background: 'var(--border)',
            borderRadius: 4,
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${progress * 100}%`,
              background: 'linear-gradient(90deg, var(--gold-3), var(--gold-2))',
              borderRadius: 4,
              transition: 'width 1s ease',
            }} />
          </div>

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
                  paddingLeft: i === 1 ? 4 : 0,
                  paddingRight: i === 1 ? 4 : 0,
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

// ─── Table helpers ─────────────────────────────────────────────────────────────

const TableHeader: React.FC<{ cols: string[] }> = ({ cols }) => (
  <div style={{
    display: 'flex',
    borderBottom: '1px solid var(--border)',
    paddingBottom: 8,
    marginBottom: 4,
  }}>
    {cols.map((col, i) => (
      <div key={i} style={{
        flex: i === 0 ? '0 0 90px' : 1,
        fontSize: 11,
        fontWeight: 700,
        color: 'var(--text-3)',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        fontFamily: 'var(--font)',
        textAlign: i === cols.length - 1 ? 'right' : 'left',
      }}>
        {col}
      </div>
    ))}
  </div>
);

const TableRow: React.FC<{ cells: React.ReactNode[]; last?: boolean }> = ({ cells, last }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: last ? 'none' : '1px solid var(--border)',
  }}>
    {cells.map((cell, i) => (
      <div key={i} style={{
        flex: i === 0 ? '0 0 90px' : 1,
        fontSize: 14,
        color: 'var(--text)',
        fontFamily: 'var(--font)',
        lineHeight: 1.4,
        textAlign: i === cells.length - 1 ? 'right' : 'left',
      }}>
        {cell}
      </div>
    ))}
  </div>
);

// ─── Main screen ──────────────────────────────────────────────────────────────

const PDF_RULES_URL =
  'https://vesperfin.com/upload/iblock/1f8/m8mz16zvynkrwodl9o2brzdkkkeb7717/pravila_konkursa.pdf';

export const Rules: React.FC<RulesProps> = ({ onNavigate }) => (
  <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>

    {/* Header */}
    <header style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 48px)', paddingLeft: 20, paddingRight: 20, paddingBottom: 8, textAlign: 'center' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.3px', margin: 0, fontFamily: 'var(--font)' }}>
        Правила
      </h1>
    </header>

    {/* Scrollable body */}
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px 100px' }}>

      <Roadmap />

      {/* Цель */}
      <Section title="Цель">
        <p style={bodyText}>
          Это не&nbsp;погоня за&nbsp;быстрым заработком, а&nbsp;тренажёр, который прокачивает
          ключевые навыки трейдера&nbsp;— чувство рынка, риск-менеджмент и&nbsp;дисциплину.
          Именно они дают стабильный результат, а&nbsp;не разовые удачные сделки.
        </p>
        <p style={{ ...bodyText, marginBottom: 0 }}>
          Главная метрика соревнования&nbsp;— P&amp;L (Profit&nbsp;&&nbsp;Loss). Побеждает тот,
          кто&nbsp;покажет максимальную доходность за&nbsp;ограниченный период.
        </p>
      </Section>

      {/* Как это работает */}
      <Section title="Как это работает">
        {[
          'Один раз указываете стартовый депозит.',
          'Каждый день вводите текущее значение депозита через бот (ссылка в\u00A0сообществе).',
          'P&L рассчитывается автоматически как\u00A0прирост относительно старта.',
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
            { text: 'Стартовый депозит: 100\u00A0000\u00A0₽', bold: false },
            { text: 'На\u00A0конец дня участник вводит: 112\u00A0000\u00A0₽', bold: false },
            { text: '', bold: false },
            { text: '112\u00A0000 − 100\u00A0000 = 12\u00A0000\u00A0₽ прибыли', bold: false },
            { text: '12\u00A0000 / 100\u00A0000 × 100 = +12%', bold: true },
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
          'Учитывается полный депозит, а\u00A0не отдельные сделки.',
          'Нереализованные позиции входят в\u00A0расчёт\u00A0— берётся фактический баланс счёта.',
          'Пополнение и\u00A0вывод средств запрещены.',
          'Использование биржевых роботов запрещено.',
          'Торговля ведётся только на\u00A0одном счёте.',
          'На\u00A0момент подачи заявки и\u00A0окончания турнира открытых позиций быть не\u00A0должно.',
          'Допускается не\u00A0более 3\u00A0пропусков ежедневного ввода данных за\u00A0весь период.',
        ].map((text, i, arr) => (
          <div key={i} style={{ display: 'flex', gap: 10, marginBottom: i < arr.length - 1 ? 10 : 0, alignItems: 'flex-start' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold-2)', flexShrink: 0, marginTop: 7 }} />
            <p style={{ ...bodyText, margin: 0 }}>{text}</p>
          </div>
        ))}
      </Section>

      {/* Категории участников */}
      <Section title="Категории участников">
        <p style={{ ...bodyText, marginBottom: 12 }}>
          Соревнование проходит в&nbsp;трёх категориях в&nbsp;зависимости от&nbsp;размера депозита:
        </p>
        <TableHeader cols={['Категория', 'Размер депозита']} />
        <TableRow cells={['1', 'до 69\u00A0999\u00A0₽']} />
        <TableRow cells={['2', '70\u00A0000 — 249\u00A0999\u00A0₽']} />
        <TableRow cells={['3', 'от\u00A0250\u00A0000\u00A0₽']} last />
        <p style={{ ...bodyText, margin: '12px 0 0', fontSize: 13 }}>
          Стартовый депозит подтверждается скриншотом брокерского счёта с&nbsp;закрытыми позициями.
          Нерублёвые депозиты фиксируются по&nbsp;курсу ЦБ&nbsp;РФ на&nbsp;день подачи заявки.
        </p>
      </Section>

      {/* Кто может участвовать */}
      <Section title="Кто может участвовать">
        <p style={{ ...bodyText, marginBottom: 0 }}>
          Дееспособные граждане РФ старше 18&nbsp;лет, являющиеся участниками сообщества
          Vesperfin&amp;Co.Trading в&nbsp;Telegram, принявшие настоящие Правила.
        </p>
      </Section>

      {/* Призовой фонд */}
      <Section title="Призовой фонд">
        <TableHeader cols={['Место', 'Приз']} />
        <TableRow cells={[<span key="1" style={{ fontSize: 16 }}>🥇 1 место</span>, <strong key="p1" style={{ color: 'var(--text)' }}>{'25\u00A0000\u00A0₽'}</strong>]} />
        <TableRow cells={[<span key="2" style={{ fontSize: 16 }}>🥈 2 место</span>, <strong key="p2" style={{ color: 'var(--text)' }}>{'10\u00A0000\u00A0₽'}</strong>]} />
        <TableRow cells={[<span key="3" style={{ fontSize: 16 }}>🥉 3 место</span>, 'Набор книг']} last />
        <p style={{ ...bodyText, margin: '12px 0 0', fontSize: 13 }}>
          Призы вручаются в&nbsp;каждой категории. Организатор выступает налоговым агентом
          и&nbsp;уплачивает НДФЛ за&nbsp;победителей 1–2&nbsp;мест. Призы выдаются в&nbsp;течение
          30&nbsp;дней после предоставления победителями необходимых документов.
        </p>
      </Section>

      {/* Подведение итогов */}
      <Section title="Подведение итогов">
        {[
          'Победители определяются по\u00A0максимальному % прибыли с\u00A0учётом официальной выписки с\u00A0брокерского счёта.',
          'Итоговый рейтинг публикуется после проверки данных всех участников\u00A0— не\u00A0позднее 23:59 последнего дня соревнования.',
          'Организатор вправе запросить дополнительные подтверждения: записи экрана, историю сделок и\u00A0иные материалы.',
        ].map((text, i, arr) => (
          <div key={i} style={{ display: 'flex', gap: 10, marginBottom: i < arr.length - 1 ? 10 : 0, alignItems: 'flex-start' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--border)', flexShrink: 0, marginTop: 7 }} />
            <p style={{ ...bodyText, margin: 0 }}>{text}</p>
          </div>
        ))}
      </Section>

      {/* Нарушение правил */}
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
          Нарушение правил
        </div>
        <div style={{
          background: 'rgba(239,68,68,0.06)',
          border: '1.5px solid rgba(239,68,68,0.2)',
          borderRadius: 16,
          padding: '16px',
        }}>
          {[
            'Нарушение правил и\u00A0махинации ведут к\u00A0немедленной дисквалификации.',
            'Vesperfin&Co.Trading оставляет за\u00A0собой право дисквалифицировать участника без\u00A0объяснения причин.',
          ].map((text, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: i < 1 ? 10 : 0, alignItems: 'flex-start' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(239,68,68,0.7)', flexShrink: 0, marginTop: 7 }} />
              <p style={{ ...bodyText, margin: 0, color: 'var(--text-2)' }}>{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Организатор */}
      <Section title="Организатор">
        <p style={{ ...bodyText, marginBottom: 14 }}>
          Конкурс проводится ИП Кундий Игорь Александрович (ОГРНИП&nbsp;320784700143907).
          Конкурс не&nbsp;является азартной игрой или лотереей. Участие бесплатное.
        </p>
        <a
          href={PDF_RULES_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            background: 'var(--bg)',
            borderRadius: 12,
            padding: '12px 14px',
            textDecoration: 'none',
            border: '1px solid var(--border)',
            marginBottom: 14,
          }}
        >
          <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>📄</span>
          <span>
            <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--gold-3)', lineHeight: 1.4 }}>
              Правила проведения конкурса «Трейдинг-турнир»
            </span>
            <span style={{ display: 'block', fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
              редакция от 01.03.2026
            </span>
          </span>
        </a>
        <p style={{ ...bodyText, margin: 0, fontSize: 13 }}>
          Участие в&nbsp;конкурсе означает полное согласие с&nbsp;официальными Правилами.
        </p>
      </Section>

    </div>

    {/* Bottom nav */}
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
