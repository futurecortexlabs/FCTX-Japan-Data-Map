export interface PrefectureData {
  year: number;
  prefCode: number;
  prefName: string;
  landPrice?: number;
  population?: number;
  listedCompanies?: number;
  starbucksCount?: number;
  ramenCount?: number;
  attractiveness?: number;
  sunshineHours?: number;
  
  // 偏差値スコア
  landPriceScore?: number;
  populationScore?: number;
  listedCompanyScore?: number;
  starbucksScore?: number;
  ramenScore?: number;
  attractivenessScore?: number;
  sunshineHoursScore?: number;
  
  // 基礎都市力（地価・人口・企業数の偏差値平均）
  baseUrbanScore?: number;
  
  totalScore?: number;
}

export interface RawPrefectureData {
  year: string | number;
  prefCode: string | number;
  prefName: string;
  landPrice?: string | number;
  population?: string | number;
  listedCompanies?: string | number;
  starbucksCount?: string | number;
  ramenCount?: string | number;
  attractiveness?: string | number;
  sunshineHours?: string | number;
}

export type MetricType =
  | 'totalScore'
  | 'landPrice'
  | 'population'
  | 'listedCompanies'
  | 'starbucksCount'
  | 'ramenCount'
  | 'attractiveness'
  | 'sunshineHours';

export interface MetricConfig {
  key: MetricType;
  label: string;
  unit: string;
  scoreKey?: keyof PrefectureData;
  category: 'basic' | 'lifestyle' | 'environment';
}

// ユーザーがカスタマイズ可能なライフスタイル・環境指標の重み (合計100)
export interface MetricWeights {
  starbucksCount: number;
  ramenCount: number;
  attractiveness: number;
  sunshineHours: number;
}
