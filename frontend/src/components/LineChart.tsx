import React, { useCallback, useRef, useState } from 'react';
import type { DepositEntry } from '../types';

interface LineChartProps {
  entries: DepositEntry[];
  currency: string;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  entry: DepositEntry | null;
  pointX: number;
  pointY: number;
}

const W = 320;
const H = 110;
const PAD_TOP = 10;
const PAD_BOT = 22;
const PAD_L = 8;
const PAD_R = 8;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_TOP - PAD_BOT;

function toPercent(value: number, min: number, max: number): number {
  const range = max - min || 1;
  return (value - min) / range;
}

function px(index: number, count: number): number {
  return PAD_L + (index / (count - 1)) * PLOT_W;
}

function py(value: number, min: number, max: number): number {
  return PAD_TOP + PLOT_H - toPercent(value, min, max) * PLOT_H;
}

function buildSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return '';
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const cur = points[i];
    const cpX = (prev.x + cur.x) / 2;
    d += ` C ${cpX.toFixed(1)} ${prev.y.toFixed(1)}, ${cpX.toFixed(1)} ${cur.y.toFixed(1)}, ${cur.x.toFixed(1)} ${cur.y.toFixed(1)}`;
  }
  return d;
}

function formatAmount(amount: number, currency: string): string {
  return `${amount.toLocaleString('ru-RU')} ${currency}`;
}

const LABEL_INDICES_MAX = 5;

function pickLabelIndices(count: number): number[] {
  if (count <= LABEL_INDICES_MAX) return Array.from({ length: count }, (_, i) => i);
  const step = (count - 1) / (LABEL_INDICES_MAX - 1);
  return Array.from({ length: LABEL_INDICES_MAX }, (_, i) => Math.round(i * step));
}

export const LineChart: React.FC<LineChartProps> = ({ entries, currency }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    entry: null,
    pointX: 0,
    pointY: 0,
  });
  const [hintHidden, setHintHidden] = useState(false);

  const count = entries.length;

  if (count === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-3)' }}>
        Нет данных
      </div>
    );
  }

  const vals = entries.map((e) => e.amount);
  const minV = Math.min(...vals) * 0.98;
  const maxV = Math.max(...vals) * 1.02;

  const points = entries.map((e, i) => ({
    x: count === 1 ? W / 2 : px(i, count),
    y: py(e.amount, minV, maxV),
  }));

  const linePath = count === 1
    ? `M ${points[0].x} ${points[0].y}`
    : buildSmoothPath(points);

  const fillPath =
    count >= 2
      ? `${linePath} L ${points[count - 1].x.toFixed(1)} ${(H - PAD_BOT).toFixed(1)} L ${points[0].x.toFixed(1)} ${(H - PAD_BOT).toFixed(1)} Z`
      : '';

  const labelIndices = pickLabelIndices(count);

  const gridYValues = [0.25, 0.5, 0.75].map((ratio) =>
    PAD_TOP + PLOT_H - ratio * PLOT_H
  );

  const findClosestIndex = useCallback(
    (svgX: number): number => {
      if (count === 0) return -1;
      let closest = 0;
      let minDist = Infinity;
      points.forEach((p, i) => {
        const dist = Math.abs(p.x - svgX);
        if (dist < minDist) {
          minDist = dist;
          closest = i;
        }
      });
      return closest;
    },
    [points, count]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const scaleX = W / rect.width;
      const svgX = (e.clientX - rect.left) * scaleX;
      const idx = findClosestIndex(svgX);
      if (idx < 0) return;
      setHintHidden(true);
      setTooltip({
        visible: true,
        x: points[idx].x,
        y: points[idx].y,
        entry: entries[idx],
        pointX: points[idx].x,
        pointY: points[idx].y,
      });
    },
    [entries, findClosestIndex, points]
  );

  const handlePointerLeave = useCallback(() => {
    setTooltip((prev) => ({ ...prev, visible: false }));
  }, []);

  const activeIdx = tooltip.visible
    ? entries.findIndex((e) => e === tooltip.entry)
    : -1;

  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: `${W} / ${H}` }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height="100%"
        style={{ display: 'block', touchAction: 'none', cursor: 'crosshair' }}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        aria-label="График динамики депозита"
        role="img"
      >
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F5A623" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#F5A623" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {gridYValues.map((yVal, i) => (
          <line
            key={i}
            x1={PAD_L}
            y1={yVal.toFixed(1)}
            x2={W - PAD_R}
            y2={yVal.toFixed(1)}
            stroke="#E5E7EB"
            strokeWidth="0.5"
          />
        ))}

        {/* Fill area */}
        {fillPath && (
          <path d={fillPath} fill="url(#chartGrad)" />
        )}

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke="#F5A623"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dots */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x.toFixed(1)}
            cy={p.y.toFixed(1)}
            r={i === activeIdx ? 5 : 3}
            fill={i === activeIdx ? '#F5A623' : '#fff'}
            stroke="#F5A623"
            strokeWidth="2"
          />
        ))}

        {/* Vertical indicator */}
        {tooltip.visible && (
          <line
            x1={tooltip.pointX.toFixed(1)}
            y1={PAD_TOP}
            x2={tooltip.pointX.toFixed(1)}
            y2={H - PAD_BOT}
            stroke="var(--gold-2)"
            strokeWidth="1"
            strokeDasharray="4 3"
          />
        )}

        {/* X axis labels */}
        {labelIndices.map((idx, pos) => {
          const entry = entries[idx];
          const xPos = count === 1 ? W / 2 : px(idx, count);
          const anchor =
            pos === 0 ? 'start' : pos === labelIndices.length - 1 ? 'end' : 'middle';
          return (
            <text
              key={idx}
              x={xPos.toFixed(1)}
              y={(H - PAD_BOT + 14).toFixed(1)}
              textAnchor={anchor}
              fontSize="9"
              fill="#9CA3AF"
            >
              {entry.dateLabel}
            </text>
          );
        })}
      </svg>

      {/* Tooltip */}
      {tooltip.visible && tooltip.entry && (() => {
        const entry = tooltip.entry;
        const svgEl = svgRef.current;
        const svgWidth = svgEl?.getBoundingClientRect().width ?? W;
        const scale = svgWidth / W;
        const tipWidth = 140;
        const rawLeft = tooltip.pointX * scale - tipWidth / 2;
        const clampedLeft = Math.max(0, Math.min(rawLeft, svgWidth - tipWidth));
        const rawTop = (tooltip.pointY * scale) - 90;
        const topOffset = rawTop < 0 ? 4 : rawTop;

        return (
          <div
            style={{
              position: 'absolute',
              left: clampedLeft,
              top: topOffset,
              background: 'rgba(20, 22, 40, 0.93)',
              backdropFilter: 'blur(8px)',
              color: '#fff',
              padding: '10px 14px',
              borderRadius: 12,
              fontSize: 12,
              pointerEvents: 'none',
              zIndex: 10,
              whiteSpace: 'nowrap',
              boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
              minWidth: tipWidth,
              border: '1px solid rgba(255,255,255,0.08)',
            }}
            role="tooltip"
          >
            <p style={{ fontWeight: 600, fontSize: 11, margin: '0 0 3px', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {entry.dateLabel}
            </p>
            <p style={{ fontSize: 16, fontWeight: 800, margin: '0 0 4px', color: '#fff' }}>
              {formatAmount(entry.amount, currency)}
            </p>
            {entry.dailyChange !== null ? (
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  margin: 0,
                  color: entry.dailyChange >= 0 ? '#34d399' : '#f87171',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                <span>{entry.dailyChange >= 0 ? '▲' : '▼'}</span>
                <span>{entry.dailyChange >= 0 ? '+' : ''}{entry.dailyChange.toFixed(2)}% за день</span>
              </p>
            ) : (
              <p style={{ fontSize: 11, margin: 0, color: 'rgba(255,255,255,0.4)' }}>
                Стартовый депозит
              </p>
            )}
          </div>
        );
      })()}

      {/* Hint */}
      <p
        style={{
          textAlign: 'center',
          fontSize: 11,
          color: 'var(--text-3)',
          paddingTop: 6,
          margin: 0,
          opacity: hintHidden ? 0 : 1,
          transition: 'opacity 0.3s',
        }}
        aria-hidden="true"
      >
        Проведите пальцем по графику
      </p>
    </div>
  );
};
