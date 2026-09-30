import type { MetricWeights } from '../types/prefecture';

/** ウェイトのキー (順序固定: キャッシュキー生成や URL シリアライズで使用) */
export const WEIGHT_KEYS = [
  'starbucksCount',
  'ramenCount',
  'attractiveness',
  'sunshineHours',
  'onsenCount',
  'hospitalCount',
  'pollenLevel',
  'childcareScore',
] as const satisfies readonly (keyof MetricWeights)[];

/** URL クエリパラメータ名 (共有リンクを短く保つための略称) */
export const WEIGHT_URL_PARAMS: Record<keyof MetricWeights, string> = {
  starbucksCount: 'w_sb',
  ramenCount: 'w_rm',
  attractiveness: 'w_at',
  sunshineHours: 'w_sn',
  onsenCount: 'w_on',
  hospitalCount: 'w_hp',
  pollenLevel: 'w_pl',
  childcareScore: 'w_cc',
};

export const WEIGHT_MIN = 0;
export const WEIGHT_MAX = 100;

export const DEFAULT_WEIGHTS: MetricWeights = {
  starbucksCount: 10,
  ramenCount: 10,
  attractiveness: 10,
  sunshineHours: 10,
  onsenCount: 10,
  hospitalCount: 10,
  pollenLevel: 10,
  childcareScore: 10,
};

/** キー順序に依存しない安定したキャッシュキー */
export const weightsCacheKey = (weights: MetricWeights): string =>
  WEIGHT_KEYS.map((k) => weights[k]).join(',');
