import type { PrefectureData } from '../types/prefecture';

/** 豪雪・寒冷地 (北海道・東北・新潟・長野) の都道府県コード */
export const COLD_PREF_CODES: ReadonlySet<number> = new Set([1, 2, 3, 4, 5, 6, 7, 15, 20]);

/** 三大都市圏の中核 (東京・神奈川・大阪) の都道府県コード */
export const URBAN_PREF_CODES: ReadonlySet<number> = new Set([13, 14, 27]);

/** 沖縄県 */
export const TROPICAL_PREF_CODE = 47;

export const isColdRegion = (prefCode: number): boolean => COLD_PREF_CODES.has(prefCode);
export const isUrbanRegion = (prefCode: number): boolean => URBAN_PREF_CODES.has(prefCode);

/** 東京での標準的な月間生活費 (円) */
export const TOKYO_MONTHLY_COST = 160_000;

export interface MonthlyCostBreakdown {
  rent: number;
  utility: number;
  transport: number;
  food: number;
  total: number;
  /** 東京で暮らす場合と比較した月間の節約額 (正なら安い) */
  savingsVsTokyo: number;
}

const roundToThousand = (value: number) => Math.round(value / 1000) * 1000;

/**
 * 偏差値から移住先の月間生活費を概算する。
 * 地価偏差値 (反転済み: 高いほど安い) が家賃に、人口偏差値 (都会度) が食費に効く簡易モデル。
 */
export function estimateMonthlyCost(pref: PrefectureData): MonthlyCostBreakdown {
  const landScore = pref.landPriceScore ?? 50;
  const popScore = pref.populationScore ?? 50;

  const rent = roundToThousand(80_000 * (0.35 + 0.65 * ((100 - landScore) / 100)));
  const utility = 12_000 + (isColdRegion(pref.prefCode) ? 12_000 : 0);
  const transport = isUrbanRegion(pref.prefCode) ? 8_000 : 22_000;
  const food = roundToThousand(60_000 * (0.88 + 0.12 * (popScore / 100)));
  const total = rent + utility + transport + food;

  return { rent, utility, transport, food, total, savingsVsTokyo: TOKYO_MONTHLY_COST - total };
}
