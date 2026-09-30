import { describe, expect, it } from 'vitest';
import type { MetricWeights, PrefectureData } from '../types/prefecture';
import { DEFAULT_WEIGHTS } from '../constants/weights';
import { generateAIConciergeAdvice } from './aiConcierge';
import { generatePrefectureCatchphrase } from './catchphrase';
import { classifyPersonality } from './personality';

const pref = (overrides: Partial<PrefectureData>): PrefectureData => ({
  year: 2024,
  prefCode: 30,
  prefName: 'テスト県',
  ...overrides,
});

const weights = (overrides: Partial<MetricWeights>): MetricWeights => ({
  starbucksCount: 0,
  ramenCount: 0,
  attractiveness: 0,
  sunshineHours: 0,
  onsenCount: 0,
  hospitalCount: 0,
  pollenLevel: 0,
  childcareScore: 0,
  ...overrides,
});

describe('generateAIConciergeAdvice (ルールベース診断)', () => {
  it.each([
    [weights({ hospitalCount: 50, childcareScore: 50 }), 'ファミリー'],
    [weights({ attractiveness: 40, sunshineHours: 30, pollenLevel: 30 }), 'スローライフ'],
    [weights({ ramenCount: 50, onsenCount: 50 }), 'カルチャー'],
    [DEFAULT_WEIGHTS, 'スマートライフ'],
  ])('ウェイトの傾向から志向タイプを判定する (%#)', (w, keyword) => {
    const result = generateAIConciergeAdvice(w, pref({}));
    expect(result.diagnosis).toContain(keyword);
    expect(result.steps).toHaveLength(3);
  });

  it.each([
    [1, '降雪'],
    [13, '固定費'],
    [47, '台風'],
    [20, '標高'],
    [30, '自家用車'],
  ])('都道府県コード %i の地域特性に応じた注意点を返す', (prefCode, keyword) => {
    expect(generateAIConciergeAdvice(DEFAULT_WEIGHTS, pref({ prefCode })).warning).toContain(keyword);
  });

  it('全ウェイトが 0 でもゼロ除算しない', () => {
    expect(() => generateAIConciergeAdvice(weights({}), pref({}))).not.toThrow();
  });
});

describe('generatePrefectureCatchphrase', () => {
  it('三大都市圏は SSR、主要観光県は SR、それ以外は R', () => {
    expect(generatePrefectureCatchphrase(pref({ prefCode: 13 })).rarity).toBe('SSR');
    expect(generatePrefectureCatchphrase(pref({ prefCode: 40 })).rarity).toBe('SR');
    expect(generatePrefectureCatchphrase(pref({ prefCode: 30 })).rarity).toBe('R');
  });

  it('汎用県では偏差値が最も高い指標をキャッチコピーに使う', () => {
    const result = generatePrefectureCatchphrase(pref({ onsenScore: 80, sunshineHoursScore: 70 }));
    expect(result.text).toContain('【温泉の多さ】');
    expect(result.text).toContain('【気候の快適さ】');
    expect(result.advice).toContain('温泉');
  });

  it('全県で空でない文言を返す', () => {
    for (let code = 1; code <= 47; code++) {
      const { text, advice } = generatePrefectureCatchphrase(pref({ prefCode: code }));
      expect(text.length).toBeGreaterThan(0);
      expect(advice.length).toBeGreaterThan(0);
    }
  });
});

describe('classifyPersonality', () => {
  it('最も重いウェイトからタイプを判定する', () => {
    expect(classifyPersonality(weights({ onsenCount: 90 }), pref({})).name).toContain('温泉');
    expect(classifyPersonality(weights({ pollenLevel: 90 }), pref({})).name).toContain('花粉');
    expect(classifyPersonality(weights({ childcareScore: 90 }), pref({})).name).toContain('ファミリー');
  });

  it('あらゆるウェイト配分で必ずタイプが決まる', () => {
    for (const key of Object.keys(DEFAULT_WEIGHTS) as (keyof MetricWeights)[]) {
      const result = classifyPersonality(weights({ [key]: 100 }), pref({}));
      expect(result.name).toBeTruthy();
      expect(result.emoji).toBeTruthy();
    }
  });
});
