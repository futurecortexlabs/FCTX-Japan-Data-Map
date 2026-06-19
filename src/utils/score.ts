import type { PrefectureData, MetricWeights } from '../types/prefecture';
import { calculateZScores } from './normalize';

/**
 * 地価、人口、上場企業数の偏差値から、基礎都市力を計算する (固定ウェイト 30 用)
 */
export function calculateBaseUrbanScore(pref: PrefectureData): number | undefined {
  const scores = [pref.landPriceScore, pref.populationScore, pref.listedCompanyScore];
  const validScores = scores.filter((s): s is number => s !== undefined && !isNaN(s));
  
  if (validScores.length === 0) {
    return undefined;
  }
  
  // 有効な基本偏差値の平均
  const sum = validScores.reduce((acc, val) => acc + val, 0);
  return Math.round((sum / validScores.length) * 100) / 100;
}

/**
 * 基礎都市力 (固定ウェイト30) とカスタムウェイトに基づいて総合スコアを計算する
 */
export function calculateCustomTotalScore(
  pref: PrefectureData,
  weights: MetricWeights
): number | undefined {
  const baseUrban = pref.baseUrbanScore;
  
  // 基礎都市力を固定ウェイト 30 として処理
  let weightedSum = 0;
  let weightTotal = 0;
  
  if (baseUrban !== undefined && !isNaN(baseUrban)) {
    weightedSum += baseUrban * 30;
    weightTotal += 30;
  }

  // ライフスタイル・環境指標のスコア定義
  const scoreMappings: { score?: number; weight: number }[] = [
    { score: pref.starbucksScore, weight: weights.starbucksCount },
    { score: pref.ramenScore, weight: weights.ramenCount },
    { score: pref.attractivenessScore, weight: weights.attractiveness },
    { score: pref.sunshineHoursScore, weight: weights.sunshineHours },
  ];

  for (const item of scoreMappings) {
    if (item.score !== undefined && !isNaN(item.score) && item.weight > 0) {
      weightedSum += item.score * item.weight;
      weightTotal += item.weight;
    }
  }

  if (weightTotal === 0) {
    return undefined;
  }

  return Math.round((weightedSum / weightTotal) * 100) / 100;
}

/**
 * 都道府県の複数年リストを受け取り、年次ごとに偏差値を算出し、
 * 基礎都市力スコア（地価・人口・企業数）およびカスタム総合スコアを適用する
 */
export function processPrefectureData(
  data: PrefectureData[],
  weights: MetricWeights = {
    starbucksCount: 0,
    ramenCount: 0,
    attractiveness: 0,
    sunshineHours: 0,
  }
): PrefectureData[] {
  // 年（year）ごとにグループ化
  const years = Array.from(new Set(data.map((d) => d.year))).sort((a, b) => a - b);
  const processedAllYears: PrefectureData[] = [];

  for (const year of years) {
    const yearData = data.filter((d) => d.year === year);

    // 各指標の配列
    const landPrices = yearData.map((d) => d.landPrice);
    const populations = yearData.map((d) => d.population);
    const listedCompanies = yearData.map((d) => d.listedCompanies);
    const starbucksCounts = yearData.map((d) => d.starbucksCount);
    const ramenCounts = yearData.map((d) => d.ramenCount);
    const attractivenessScores = yearData.map((d) => d.attractiveness);
    const sunshineHours = yearData.map((d) => d.sunshineHours);

    // 偏差値の計算
    const landPriceScores = calculateZScores(landPrices);
    const populationScores = calculateZScores(populations);
    const listedCompanyScores = calculateZScores(listedCompanies);
    const starbucksScores = calculateZScores(starbucksCounts);
    const ramenScores = calculateZScores(ramenCounts);
    const attractivenessZScores = calculateZScores(attractivenessScores);
    const sunshineHoursScores = calculateZScores(sunshineHours);

    // 各都道府県に適用
    const withScores = yearData.map((pref, idx) => {
      // 平均地価の偏差値は低い（安い）ほど「住居費の安さ」の魅力が高いため反転する（100 - score）
      const rawLandPriceScore = landPriceScores[idx];
      const invertedLandPriceScore = rawLandPriceScore !== undefined && !isNaN(rawLandPriceScore)
        ? Math.round((100 - rawLandPriceScore) * 100) / 100
        : undefined;

      let updatedPref: PrefectureData = {
        ...pref,
        landPriceScore: invertedLandPriceScore,
        populationScore: populationScores[idx],
        listedCompanyScore: listedCompanyScores[idx],
        starbucksScore: starbucksScores[idx],
        ramenScore: ramenScores[idx],
        attractivenessScore: attractivenessZScores[idx],
        sunshineHoursScore: sunshineHoursScores[idx],
      };

      // 基礎都市力を計算
      const baseUrban = calculateBaseUrbanScore(updatedPref);
      updatedPref.baseUrbanScore = baseUrban;

      // カスタム総合スコアを計算
      const tScore = calculateCustomTotalScore(updatedPref, weights);
      return {
        ...updatedPref,
        totalScore: tScore,
      };
    });

    processedAllYears.push(...withScores);
  }

  return processedAllYears;
}
