import { describe, expect, it } from 'vitest';
import type { MetricWeights, PrefectureData } from '../types/prefecture';
import { calculateBaseUrbanScore, calculateCustomTotalScore, processPrefectureData } from './score';

const ZERO_WEIGHTS: MetricWeights = {
  starbucksCount: 0,
  ramenCount: 0,
  attractiveness: 0,
  sunshineHours: 0,
  onsenCount: 0,
  hospitalCount: 0,
  pollenLevel: 0,
  childcareScore: 0,
};

const pref = (overrides: Partial<PrefectureData>): PrefectureData => ({
  year: 2024,
  prefCode: 1,
  prefName: 'テスト県',
  ...overrides,
});

describe('calculateBaseUrbanScore', () => {
  it('地価・人口・企業数の偏差値の平均を返す', () => {
    expect(calculateBaseUrbanScore(pref({ landPriceScore: 40, populationScore: 50, listedCompanyScore: 60 }))).toBe(50);
  });

  it('欠損している偏差値は平均から除外する', () => {
    expect(calculateBaseUrbanScore(pref({ landPriceScore: 40, populationScore: 60 }))).toBe(50);
  });

  it('すべて欠損なら undefined', () => {
    expect(calculateBaseUrbanScore(pref({}))).toBeUndefined();
  });
});

describe('calculateCustomTotalScore', () => {
  it('ウェイトが全て 0 なら基礎都市力のみで決まる', () => {
    expect(calculateCustomTotalScore(pref({ baseUrbanScore: 55, ramenScore: 90 }), ZERO_WEIGHTS)).toBe(55);
  });

  it('基礎都市力 (固定ウェイト 30) とカスタムウェイトの加重平均になる', () => {
    const result = calculateCustomTotalScore(pref({ baseUrbanScore: 50, ramenScore: 80 }), {
      ...ZERO_WEIGHTS,
      ramenCount: 30,
    });
    expect(result).toBe(65); // (50*30 + 80*30) / 60
  });

  it('スコアが欠損している指標のウェイトは分母にも含めない', () => {
    const result = calculateCustomTotalScore(pref({ baseUrbanScore: 50 }), { ...ZERO_WEIGHTS, onsenCount: 100 });
    expect(result).toBe(50);
  });

  it('計算可能なスコアが 1 つもなければ undefined', () => {
    expect(calculateCustomTotalScore(pref({}), ZERO_WEIGHTS)).toBeUndefined();
  });
});

describe('processPrefectureData', () => {
  const data: PrefectureData[] = [
    pref({ year: 2024, prefCode: 13, prefName: '東京都', landPrice: 300, population: 1400, pollenLevel: 5 }),
    pref({ year: 2024, prefCode: 47, prefName: '沖縄県', landPrice: 100, population: 140, pollenLevel: 1 }),
    pref({ year: 2000, prefCode: 13, prefName: '東京都', landPrice: 999, population: 1200 }),
    pref({ year: 2000, prefCode: 47, prefName: '沖縄県', landPrice: 1, population: 130 }),
  ];

  it('年ごとに独立して偏差値を計算する (他の年の値に影響されない)', () => {
    const result = processPrefectureData(data);
    const tokyo2024 = result.find((p) => p.year === 2024 && p.prefCode === 13)!;
    const tokyo2000 = result.find((p) => p.year === 2000 && p.prefCode === 13)!;
    // 2 点しかない年はどちらも ±1σ になる
    expect(tokyo2024.populationScore).toBe(60);
    expect(tokyo2000.populationScore).toBe(60);
  });

  it('地価と花粉は「低いほど良い」ので偏差値を反転する', () => {
    const result = processPrefectureData(data);
    const tokyo = result.find((p) => p.year === 2024 && p.prefCode === 13)!;
    const okinawa = result.find((p) => p.year === 2024 && p.prefCode === 47)!;
    expect(tokyo.landPriceScore).toBe(40);
    expect(okinawa.landPriceScore).toBe(60);
    expect(okinawa.pollenScore).toBeGreaterThan(tokyo.pollenScore!);
  });

  it('入力配列を破壊しない', () => {
    const snapshot = structuredClone(data);
    processPrefectureData(data);
    expect(data).toEqual(snapshot);
  });

  it('全行に totalScore が付与され、年の昇順で返る', () => {
    const result = processPrefectureData(data);
    expect(result.map((p) => p.year)).toEqual([2000, 2000, 2024, 2024]);
    expect(result.every((p) => typeof p.totalScore === 'number')).toBe(true);
  });
});
