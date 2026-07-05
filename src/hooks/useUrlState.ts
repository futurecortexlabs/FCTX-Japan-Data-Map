import { useState, useEffect } from 'react';
import type { MetricType, MetricWeights } from '../types/prefecture';

interface UrlState {
  metric: MetricType;
  year: number;
  prefCodes: number[];
  weights: MetricWeights;
}

export function useUrlState(
  initialMetric: MetricType,
  initialYear: number,
  initialWeights: MetricWeights
) {
  // URLから初期状態を取得する関数
  const getInitialStateFromUrl = (): UrlState => {
    const params = new URLSearchParams(window.location.search);
    
    // weightsの解析
    const parsedWeights = { ...initialWeights };
    if (params.has('w_sb')) parsedWeights.starbucksCount = Number(params.get('w_sb'));
    if (params.has('w_rm')) parsedWeights.ramenCount = Number(params.get('w_rm'));
    if (params.has('w_at')) parsedWeights.attractiveness = Number(params.get('w_at'));
    if (params.has('w_sn')) parsedWeights.sunshineHours = Number(params.get('w_sn'));

    // prefCodesの解析
    let prefCodes: number[] = [];
    if (params.has('prefs')) {
      const prefsStr = params.get('prefs');
      if (prefsStr) {
        prefCodes = prefsStr.split(',').map(Number).filter(n => !isNaN(n));
      }
    }

    return {
      metric: (params.get('metric') as MetricType) || initialMetric,
      year: params.has('year') ? Number(params.get('year')) : initialYear,
      weights: parsedWeights,
      prefCodes: prefCodes,
    };
  };

  const initialState = getInitialStateFromUrl();

  const [currentMetric, setCurrentMetric] = useState<MetricType>(initialState.metric);
  const [selectedYear, setSelectedYear] = useState<number>(initialState.year);
  const [selectedPrefCodes, setSelectedPrefCodes] = useState<number[]>(initialState.prefCodes);

  // usePrefectureData側でweightsを管理するため、ここでは初期値を返すだけ
  const initialUrlWeights = initialState.weights;

  // 状態が変わるたびにURLを更新する
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    params.set('metric', currentMetric);
    params.set('year', selectedYear.toString());
    
    if (selectedPrefCodes.length > 0) {
      params.set('prefs', selectedPrefCodes.join(','));
    } else {
      params.delete('prefs');
    }

    // URL更新
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
  }, [currentMetric, selectedYear, selectedPrefCodes]);

  // weights は外部から渡してURLを更新する関数を提供する
  const updateUrlWeights = (weights: MetricWeights) => {
    const params = new URLSearchParams(window.location.search);
    params.set('w_sb', weights.starbucksCount.toString());
    params.set('w_rm', weights.ramenCount.toString());
    params.set('w_at', weights.attractiveness.toString());
    params.set('w_sn', weights.sunshineHours.toString());
    
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
  };

  return {
    currentMetric,
    setCurrentMetric,
    selectedYear,
    setSelectedYear,
    selectedPrefCodes,
    setSelectedPrefCodes,
    initialUrlWeights,
    updateUrlWeights,
  };
}
