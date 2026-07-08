import { type PrefectureData } from '../types/prefecture';

export interface FireTrajectoryPoint {
  age: number;
  tokyoAssets: number;
  utopiaAssets: number;
  tokyoFireReached: boolean;
  utopiaFireReached: boolean;
}

export interface FireSimulationResult {
  trajectory: FireTrajectoryPoint[];
  tokyoFireAge: number | null;
  utopiaFireAge: number | null;
  yearsSaved: number;
  monthlySavingsDiff: number;
}

/**
 * 簡易的なFIRE（セミリタイア）シミュレーション
 * @param currentAge 現在の年齢
 * @param annualIncome 世帯年収 (万円)
 * @param currentAssets 現在の資産 (万円)
 * @param targetFireAssets 目標リタイア資産 (万円) - デフォルト 5000万円
 * @param pref 移住先の都道府県データ
 */
export function simulateFire(
  currentAge: number,
  annualIncome: number,
  currentAssets: number,
  targetFireAssets: number = 5000,
  pref: PrefectureData
): FireSimulationResult {
  
  // 1. 基本生活費の算出 (月額)
  const tokyoRent = 120000; // 東京の平均的家賃
  const tokyoOther = 150000; // 東京のその他生活費

  const landScore = pref.landPriceScore || 50;
  const popScore = pref.populationScore || 50;
  
  // 地価偏差値が低い(安い)ほど家賃ファクターが下がる
  const rentFactor = 0.35 + 0.65 * ((100 - landScore) / 100);
  const utopiaRent = Math.round((tokyoRent * rentFactor) / 1000) * 1000;
  
  // 人口偏差値(都会度)に依存するその他生活費
  const foodFactor = 0.88 + 0.12 * (popScore / 100);
  
  const isCold = [1, 2, 3, 4, 5, 6, 7, 15, 20].includes(pref.prefCode);
  const utilityCost = isCold ? 25000 : 15000;
  
  const isUrban = [13, 14, 27].includes(pref.prefCode);
  const transportCost = isUrban ? 10000 : 35000; // 車社会は維持費が高い

  const utopiaOther = Math.round((100000 * foodFactor) + utilityCost + transportCost);

  // 2. 毎月の貯蓄額の算出
  const monthlyTakeHome = (annualIncome * 10000 * 0.78) / 12; // 手取りを78%と仮定
  
  const tokyoMonthlySavings = Math.max(0, monthlyTakeHome - (tokyoRent + tokyoOther));
  const utopiaMonthlySavings = Math.max(0, monthlyTakeHome - (utopiaRent + utopiaOther));
  
  const monthlySavingsDiff = utopiaMonthlySavings - tokyoMonthlySavings;

  // 3. 資産推移シミュレーション (年利5%の投資運用を仮定)
  const annualReturn = 1.05;
  const trajectory: FireTrajectoryPoint[] = [];
  
  let tokyoAssets = currentAssets * 10000;
  let utopiaAssets = currentAssets * 10000;
  
  let tokyoFireAge: number | null = null;
  let utopiaFireAge: number | null = null;

  const targetAssetsBase = targetFireAssets * 10000;

  for (let year = 0; year <= 35; year++) {
    const age = currentAge + year;
    
    // 記録
    trajectory.push({
      age,
      tokyoAssets: Math.round(tokyoAssets / 10000), // 万円単位
      utopiaAssets: Math.round(utopiaAssets / 10000),
      tokyoFireReached: tokyoAssets >= targetAssetsBase,
      utopiaFireReached: utopiaAssets >= targetAssetsBase,
    });

    // 目標到達判定
    if (tokyoAssets >= targetAssetsBase && tokyoFireAge === null) {
      tokyoFireAge = age;
    }
    if (utopiaAssets >= targetAssetsBase && utopiaFireAge === null) {
      utopiaFireAge = age;
    }

    // 運用と追加投資 (年1回の複利計算)
    tokyoAssets = (tokyoAssets + (tokyoMonthlySavings * 12)) * annualReturn;
    utopiaAssets = (utopiaAssets + (utopiaMonthlySavings * 12)) * annualReturn;
  }

  const yearsSaved = (tokyoFireAge !== null && utopiaFireAge !== null)
    ? tokyoFireAge - utopiaFireAge
    : (utopiaFireAge !== null ? 99 : 0); // 99 means Tokyo never reaches it in 35 years

  return {
    trajectory,
    tokyoFireAge,
    utopiaFireAge,
    yearsSaved,
    monthlySavingsDiff
  };
}
