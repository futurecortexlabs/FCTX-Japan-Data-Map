import { describe, expect, it } from 'vitest';
import type { PrefectureData } from '../types/prefecture';
import { getColorForScore } from './colorScale';
import { escapeHtml, formatMetricValue } from './format';
import { estimateMonthlyCost, TOKYO_MONTHLY_COST } from './region';
import { checkNewAchievements, DEFAULT_USER_STATS, mergeUserStats, parseUserStats } from './achievements';
import { simulateFire } from './fireSimulation';
import { generateNomadRoute } from './nomadPlanner';
import { advanceKonamiSequence, KONAMI_CODE } from '../hooks/useKonamiCode';
import { weightsCacheKey, DEFAULT_WEIGHTS } from '../constants/weights';

const pref = (overrides: Partial<PrefectureData>): PrefectureData => ({
  year: 2024,
  prefCode: 30,
  prefName: 'テスト県',
  ...overrides,
});

describe('getColorForScore', () => {
  it('低=青 / 中=黄 / 高=赤 のグラデーション', () => {
    expect(getColorForScore(35)).toBe('rgb(59, 130, 246)');
    expect(getColorForScore(50)).toBe('rgb(254, 240, 138)');
    expect(getColorForScore(65)).toBe('rgb(239, 68, 68)');
  });

  it('範囲外はクランプし、欠損はグレー', () => {
    expect(getColorForScore(0)).toBe(getColorForScore(35));
    expect(getColorForScore(100)).toBe(getColorForScore(65));
    expect(getColorForScore(undefined)).toBe('#e5e7eb');
    expect(getColorForScore(NaN)).toBe('#e5e7eb');
  });
});

describe('escapeHtml / formatMetricValue', () => {
  it('tooltip に埋め込む文字列の HTML 特殊文字をエスケープする', () => {
    expect(escapeHtml('<img src=x onerror="alert(1)">&\'')).toBe('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;&amp;&#39;');
  });

  it('人口は万人単位、欠損は「データ未登録」', () => {
    expect(formatMetricValue(13_960_000, 'population', '人')).toBe('1,396 万人');
    expect(formatMetricValue(9_000, 'population', '人')).toBe('9,000 人');
    expect(formatMetricValue(1234, 'ramenCount', '店')).toBe('1,234 店');
    expect(formatMetricValue(undefined, 'ramenCount', '店')).toBe('データ未登録');
  });
});

describe('estimateMonthlyCost', () => {
  it('内訳の合計と東京比の節約額が整合する', () => {
    const cost = estimateMonthlyCost(pref({ landPriceScore: 60, populationScore: 45 }));
    expect(cost.total).toBe(cost.rent + cost.utility + cost.transport + cost.food);
    expect(cost.savingsVsTokyo).toBe(TOKYO_MONTHLY_COST - cost.total);
  });

  it('寒冷地は光熱費が高く、大都市は交通費が安い', () => {
    expect(estimateMonthlyCost(pref({ prefCode: 1 })).utility).toBeGreaterThan(estimateMonthlyCost(pref({ prefCode: 30 })).utility);
    expect(estimateMonthlyCost(pref({ prefCode: 13 })).transport).toBeLessThan(estimateMonthlyCost(pref({ prefCode: 30 })).transport);
  });

  it('地価偏差値 (反転済み) が高いほど家賃が安い', () => {
    expect(estimateMonthlyCost(pref({ landPriceScore: 70 })).rent).toBeLessThan(estimateMonthlyCost(pref({ landPriceScore: 30 })).rent);
  });
});

describe('achievements', () => {
  it('条件を満たし、未解除のものだけを返す', () => {
    const stats = { ...DEFAULT_USER_STATS, gachaCount: 5, historyChecked: true };
    expect(checkNewAchievements(stats, []).map((a) => a.id)).toEqual(['gacha_5', 'history_buff']);
    expect(checkNewAchievements(stats, ['gacha_5']).map((a) => a.id)).toEqual(['history_buff']);
  });

  it('mergeUserStats は単調増加で、変化がなければ同一参照を返す', () => {
    const stored = { ...DEFAULT_USER_STATS, maxOnsenScore: 70 };
    expect(mergeUserStats(stored, { maxOnsenScore: 60 })).toBe(stored);
    expect(mergeUserStats(stored, { maxOnsenScore: 80 }).maxOnsenScore).toBe(80);
    expect(mergeUserStats(stored, { historyChecked: true }).historyChecked).toBe(true);
  });

  it('parseUserStats は壊れた localStorage 値を安全に補正する', () => {
    expect(parseUserStats('garbage')).toBeNull();
    expect(parseUserStats({ gachaCount: '3', keepCount: 2, historyChecked: 'yes' })).toEqual({
      ...DEFAULT_USER_STATS,
      keepCount: 2,
    });
  });
});

describe('simulateFire', () => {
  it('生活費の安い県に移住すると、東京より早く (または同時に) FIRE に到達する', () => {
    const result = simulateFire(30, 600, 500, 5000, pref({ landPriceScore: 65, populationScore: 40 }));
    expect(result.monthlySavingsDiff).toBeGreaterThan(0);
    expect(result.utopiaFireAge).not.toBeNull();
    if (result.tokyoFireAge !== null) {
      expect(result.utopiaFireAge!).toBeLessThanOrEqual(result.tokyoFireAge);
    }
    expect(result.trajectory).toHaveLength(36);
  });

  it('資産推移は単調非減少 (年利 5% ・貯蓄額 >= 0)', () => {
    const { trajectory } = simulateFire(40, 300, 0, 5000, pref({}));
    for (let i = 1; i < trajectory.length; i++) {
      expect(trajectory[i].utopiaAssets).toBeGreaterThanOrEqual(trajectory[i - 1].utopiaAssets);
    }
  });
});

describe('generateNomadRoute', () => {
  it('3 県を春・夏・秋冬に重複なく割り当てる', () => {
    const prefs = [
      pref({ prefCode: 13, prefName: '東京都', pollenScore: 30, populationScore: 80 }),
      pref({ prefCode: 1, prefName: '北海道', pollenScore: 60, populationScore: 55 }),
      pref({ prefCode: 47, prefName: '沖縄県', pollenScore: 75, populationScore: 45 }),
    ];
    const route = generateNomadRoute(prefs);
    expect(route.map((r) => r.season)).toEqual(['春 (Spring)', '夏 (Summer)', '秋・冬 (Autumn/Winter)']);
    expect(route[0].pref.prefName).toBe('沖縄県'); // 花粉が最も少ない
    expect(route[1].pref.prefName).toBe('北海道'); // 寒冷地を避暑地に
    expect(new Set(route.map((r) => r.pref.prefCode)).size).toBe(3);
  });

  it('3 県以外では空配列', () => {
    expect(generateNomadRoute([pref({})])).toEqual([]);
  });
});

describe('advanceKonamiSequence', () => {
  const type = (keys: string[]) => {
    let sequence: string[] = [];
    let matched = false;
    for (const key of keys) ({ sequence, matched } = advanceKonamiSequence(sequence, key));
    return matched;
  };

  it('正しい順序で入力すると一致する (大文字 B/A も許容)', () => {
    expect(type([...KONAMI_CODE])).toBe(true);
    expect(type(['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'B', 'A'])).toBe(true);
  });

  it('前に余計な入力があっても末尾が一致すれば発動する', () => {
    expect(type(['x', 'ArrowUp', ...KONAMI_CODE])).toBe(true);
  });

  it('途中で間違えると発動しない', () => {
    expect(type(['ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'])).toBe(false);
  });
});

describe('weightsCacheKey', () => {
  it('オブジェクトのキー順序に依存しない', () => {
    const reordered = Object.fromEntries(Object.entries(DEFAULT_WEIGHTS).reverse()) as typeof DEFAULT_WEIGHTS;
    expect(weightsCacheKey(reordered)).toBe(weightsCacheKey(DEFAULT_WEIGHTS));
  });
});
