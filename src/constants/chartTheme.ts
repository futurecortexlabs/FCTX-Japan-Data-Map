import type { CSSProperties } from 'react';

/**
 * Recharts ツールチップの共通スタイル (ライト / ダーク共通の濃色パネル)。
 *
 * Recharts は各行の文字色を既定で「系列の色」(棒やレーダーの色) にするため、
 * 濃色背景に濃いインディゴ文字が重なって読めなくなっていた。
 * 行・見出しの文字色を明示し、系列の区別は行頭のマーカー色ではなく系列名で行う。
 */
const contentStyle: CSSProperties = {
  backgroundColor: 'rgba(15, 23, 42, 0.95)', // slate-900
  border: '1px solid rgba(148, 163, 184, 0.3)', // slate-400/30
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgb(0 0 0 / 0.25)',
  color: '#f8fafc', // slate-50
  fontSize: '12px',
};

export const CHART_TOOLTIP_PROPS = {
  contentStyle,
  labelStyle: { color: '#f8fafc', fontWeight: 700, marginBottom: 2 } satisfies CSSProperties,
  itemStyle: { color: '#e2e8f0', fontWeight: 600 } satisfies CSSProperties, // slate-200
  cursor: { fill: 'rgba(148, 163, 184, 0.12)' },
} as const;
