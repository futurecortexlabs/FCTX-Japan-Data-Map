import type { MetricType } from '../types/prefecture';

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Leaflet の tooltip は innerHTML で描画されるため、ユーザー由来の文字列は必ずエスケープする */
export const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);

/** 指標値を単位付きの表示用文字列に整形する */
export function formatMetricValue(value: number | undefined, metric: MetricType, unit: string): string {
  if (value === undefined || !Number.isFinite(value)) return 'データ未登録';
  if (metric === 'population') {
    return value >= 10_000
      ? `${(value / 10_000).toLocaleString('ja-JP', { maximumFractionDigits: 1 })} 万人`
      : `${value.toLocaleString('ja-JP')} 人`;
  }
  return `${value.toLocaleString('ja-JP')} ${unit}`;
}
