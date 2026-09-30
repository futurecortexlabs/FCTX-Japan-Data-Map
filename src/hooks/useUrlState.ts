import { useCallback, useEffect, useState } from 'react';
import type { MetricType, MetricWeights } from '../types/prefecture';
import { METRIC_CONFIGS } from '../constants/metrics';
import { WEIGHT_KEYS, WEIGHT_MAX, WEIGHT_MIN, WEIGHT_URL_PARAMS } from '../constants/weights';

export interface UrlState {
  metric: MetricType;
  year: number;
  prefCodes: number[];
  weights: MetricWeights;
}

const MAX_SELECTED_PREFS = 3;

const isMetricType = (value: string | null): value is MetricType =>
  value !== null && Object.prototype.hasOwnProperty.call(METRIC_CONFIGS, value);

/**
 * クエリ文字列から画面状態を復元する。
 * 共有リンクは外部入力なので、未知の指標・範囲外の値・重複コードはすべて破棄/補正する。
 */
export function parseUrlState(search: string, defaults: UrlState): UrlState {
  const params = new URLSearchParams(search);

  const weights = { ...defaults.weights };
  for (const key of WEIGHT_KEYS) {
    const raw = params.get(WEIGHT_URL_PARAMS[key]);
    const n = raw === null || raw === '' ? NaN : Number(raw);
    if (Number.isFinite(n)) {
      weights[key] = Math.min(WEIGHT_MAX, Math.max(WEIGHT_MIN, Math.round(n)));
    }
  }

  const prefCodes = [
    ...new Set(
      (params.get('prefs') ?? '')
        .split(',')
        .filter(Boolean)
        .map(Number)
        .filter((n) => Number.isInteger(n) && n >= 1 && n <= 47),
    ),
  ].slice(0, MAX_SELECTED_PREFS);

  const metric = params.get('metric');
  const year = Number(params.get('year'));

  return {
    metric: isMetricType(metric) ? metric : defaults.metric,
    year: params.has('year') && Number.isInteger(year) ? year : defaults.year,
    prefCodes,
    weights,
  };
}

/** 画面状態をクエリ文字列へ書き戻す (無関係な既存パラメータは保持する) */
export function serializeUrlState(search: string, state: UrlState): string {
  const params = new URLSearchParams(search);
  params.set('metric', state.metric);
  params.set('year', String(state.year));
  if (state.prefCodes.length > 0) params.set('prefs', state.prefCodes.join(','));
  else params.delete('prefs');
  for (const key of WEIGHT_KEYS) {
    params.set(WEIGHT_URL_PARAMS[key], String(state.weights[key]));
  }
  return params.toString();
}

export function useUrlState(initialMetric: MetricType, initialYear: number, initialWeights: MetricWeights) {
  const [initialState] = useState(() =>
    parseUrlState(window.location.search, {
      metric: initialMetric,
      year: initialYear,
      prefCodes: [],
      weights: initialWeights,
    }),
  );

  const [currentMetric, setCurrentMetric] = useState<MetricType>(initialState.metric);
  const [selectedYear, setSelectedYear] = useState<number>(initialState.year);
  const [selectedPrefCodes, setSelectedPrefCodes] = useState<number[]>(initialState.prefCodes);
  const [urlWeights, setUrlWeights] = useState<MetricWeights>(initialState.weights);

  // 状態が変わるたびに URL を更新する (履歴は汚さない)
  useEffect(() => {
    const query = serializeUrlState(window.location.search, {
      metric: currentMetric,
      year: selectedYear,
      prefCodes: selectedPrefCodes,
      weights: urlWeights,
    });
    window.history.replaceState(window.history.state, '', `${window.location.pathname}?${query}`);
  }, [currentMetric, selectedYear, selectedPrefCodes, urlWeights]);

  const updateUrlWeights = useCallback((weights: MetricWeights) => setUrlWeights(weights), []);

  return {
    currentMetric,
    setCurrentMetric,
    selectedYear,
    setSelectedYear,
    selectedPrefCodes,
    setSelectedPrefCodes,
    initialUrlWeights: initialState.weights,
    updateUrlWeights,
  };
}
