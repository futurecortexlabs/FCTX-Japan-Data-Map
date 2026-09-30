import { describe, expect, it } from 'vitest';
import type { MetricWeights, PrefectureData } from '../../types/prefecture';
import {
  answerQuiz,
  backQuiz,
  buildMultiBasePlan,
  calculateWeightsFromAnswers,
  compatibilityRank,
  computeDualCompatibility,
  computeDuel,
  computeTrendRange,
  duelBarPercent,
  formatDetailValue,
  formatManAxisLabel,
  formatManYen,
  formatTrendLabel,
  getTrendMetricValue,
  INITIAL_QUIZ_STATE,
  isDetailTabAvailable,
  pickRandom,
  QUIZ_CANDIDATE_COUNT,
  QUIZ_QUESTIONS,
  rankQuizCandidates,
  resolveDetailTab,
  scoreToProgressWidth,
  toDisplayPoints,
} from './logic';

const pref = (overrides: Partial<PrefectureData>): PrefectureData => ({
  year: 2024,
  prefCode: 30,
  prefName: 'テスト県',
  ...overrides,
});

const sumWeights = (w: MetricWeights) => Object.values(w).reduce((a, b) => a + b, 0);

describe('isDetailTabAvailable / resolveDetailTab', () => {
  it('FIRE・診断は1県選択時のみ、多拠点は2県以上、ノマドは3県のみ表示できる', () => {
    expect(isDetailTabAvailable('fire', 1)).toBe(true);
    expect(isDetailTabAvailable('fire', 2)).toBe(false);
    expect(isDetailTabAvailable('quiz', 0)).toBe(false);
    expect(isDetailTabAvailable('multibase', 1)).toBe(false);
    expect(isDetailTabAvailable('multibase', 3)).toBe(true);
    expect(isDetailTabAvailable('nomad', 2)).toBe(false);
    expect(isDetailTabAvailable('nomad', 3)).toBe(true);
    for (const tab of ['details', 'weights', 'ai', 'keep'] as const) {
      expect(isDetailTabAvailable(tab, 0)).toBe(true);
    }
  });

  it('複数選択中に単県専用タブを開いていたら多拠点設計へ移動する', () => {
    expect(resolveDetailTab('quiz', 2)).toBe('multibase');
    expect(resolveDetailTab('fire', 3)).toBe('multibase');
    expect(resolveDetailTab('nomad', 2)).toBe('multibase');
  });

  it('1県以下で複数県用タブを開いていたら詳細へ戻す（未選択時に空パネルにならない）', () => {
    expect(resolveDetailTab('multibase', 1)).toBe('details');
    expect(resolveDetailTab('nomad', 1)).toBe('details');
    expect(resolveDetailTab('nomad', 0)).toBe('details');
    expect(resolveDetailTab('fire', 0)).toBe('details');
    expect(resolveDetailTab('multibase', 0)).toBe('details');
  });

  it('表示可能なタブはそのまま', () => {
    expect(resolveDetailTab('weights', 3)).toBe('weights');
    expect(resolveDetailTab('fire', 1)).toBe('fire');
    expect(resolveDetailTab('nomad', 3)).toBe('nomad');
  });
});

describe('クイズ進行 (answerQuiz / backQuiz)', () => {
  it('最終設問まで回答すると finished になり、回答が設問順に記録される', () => {
    let state = INITIAL_QUIZ_STATE;
    for (let i = 0; i < QUIZ_QUESTIONS.length - 1; i++) {
      state = answerQuiz(state, i % 2);
      expect(state.finished).toBe(false);
      expect(state.step).toBe(i + 1);
    }
    state = answerQuiz(state, 1);
    expect(state.finished).toBe(true);
    expect(state.step).toBe(QUIZ_QUESTIONS.length - 1);
    expect(state.answers).toEqual([0, 1, 0, 1]);
  });

  it('戻ると直前の回答を取り消し、先頭では何もしない', () => {
    const s1 = answerQuiz(answerQuiz(INITIAL_QUIZ_STATE, 0), 1);
    const back = backQuiz(s1);
    expect(back.step).toBe(1);
    expect(back.answers).toEqual([0]);
    expect(backQuiz(INITIAL_QUIZ_STATE)).toBe(INITIAL_QUIZ_STATE);
  });

  it('元の状態を破壊しない', () => {
    const s = answerQuiz(INITIAL_QUIZ_STATE, 0);
    answerQuiz(s, 1);
    expect(s.answers).toEqual([0]);
    expect(INITIAL_QUIZ_STATE.answers).toEqual([]);
  });
});

describe('calculateWeightsFromAnswers', () => {
  it('カフェ・グルメ・晴天重視ならカフェ/ラーメン/日照が 45、花粉は 5', () => {
    const w = calculateWeightsFromAnswers([0, 0, 0, 0]);
    expect(w).toEqual({
      starbucksCount: 45,
      ramenCount: 45,
      attractiveness: 20,
      sunshineHours: 45,
      onsenCount: 10,
      hospitalCount: 10,
      pollenLevel: 5,
      childcareScore: 10,
    });
  });

  it('自然・自炊・天気にこだわらないなら温泉 45、医療/子育て 20、花粉 30', () => {
    const w = calculateWeightsFromAnswers([1, 1, 1, 1]);
    expect(w).toEqual({
      starbucksCount: 10,
      ramenCount: 10,
      attractiveness: 20,
      sunshineHours: 10,
      onsenCount: 45,
      hospitalCount: 20,
      pollenLevel: 30,
      childcareScore: 20,
    });
  });

  it('Q1（コスト/利便性）は重みに影響しない', () => {
    expect(calculateWeightsFromAnswers([0, 1, 0, 1])).toEqual(calculateWeightsFromAnswers([1, 1, 0, 1]));
  });

  it('どの回答でも全重みが正の値', () => {
    for (const ans of [[0, 0, 0, 0], [1, 1, 1, 1], [0, 1, 0, 1], []]) {
      const w = calculateWeightsFromAnswers(ans);
      expect(Object.values(w).every((v) => v > 0)).toBe(true);
      expect(sumWeights(w)).toBeGreaterThan(0);
    }
  });
});

describe('pickRandom', () => {
  it('空配列なら undefined', () => {
    expect(pickRandom([])).toBeUndefined();
  });

  it('乱数値に応じた要素を返し、1 未満の乱数で範囲外にならない', () => {
    const items = ['a', 'b', 'c'];
    expect(pickRandom(items, () => 0)).toBe('a');
    expect(pickRandom(items, () => 0.5)).toBe('b');
    expect(pickRandom(items, () => 0.9999)).toBe('c');
  });
});

describe('rankQuizCandidates', () => {
  const weights = calculateWeightsFromAnswers([1, 0, 0, 0]);

  it('データが無ければ空配列', () => {
    expect(rankQuizCandidates([], weights)).toEqual([]);
  });

  it('最新年のデータのみを対象にし、上位 15 件に絞る', () => {
    const data: PrefectureData[] = [];
    for (let code = 1; code <= 20; code++) {
      data.push(pref({ prefCode: code, year: 2023, baseUrbanScore: 99 }));
      data.push(pref({ prefCode: code, year: 2024, baseUrbanScore: 30 + code }));
    }
    const result = rankQuizCandidates(data, weights, [1, 0, 0, 0]);
    expect(result).toHaveLength(QUIZ_CANDIDATE_COUNT);
    expect(result.every((p) => p.year === 2024)).toBe(true);
    // 利便性重視なので基礎都市力が高い順
    expect(result[0].prefCode).toBe(20);
    expect(result[QUIZ_CANDIDATE_COUNT - 1].prefCode).toBe(6);
  });

  it('コスト重視(Q1=0)なら地価偏差値が低い県が上位', () => {
    const cheap = pref({ prefCode: 1, landPriceScore: 35, baseUrbanScore: 45 });
    const pricey = pref({ prefCode: 2, landPriceScore: 70, baseUrbanScore: 60 });
    expect(rankQuizCandidates([pricey, cheap], weights, [0, 0, 0, 0])[0]).toBe(cheap);
    expect(rankQuizCandidates([pricey, cheap], weights, [1, 0, 0, 0])[0]).toBe(pricey);
  });

  it('重みの大きい指標の偏差値が高い県が上位（欠損スコアは無視）', () => {
    const cafe = pref({ prefCode: 1, starbucksScore: 70 });
    const onsen = pref({ prefCode: 2, onsenScore: 70, starbucksScore: NaN });
    const cafeWeights = calculateWeightsFromAnswers([1, 0, 1, 1]);
    const natureWeights = calculateWeightsFromAnswers([1, 1, 1, 1]);
    expect(rankQuizCandidates([onsen, cafe], cafeWeights, [1])[0]).toBe(cafe);
    expect(rankQuizCandidates([cafe, onsen], natureWeights, [1])[0]).toBe(onsen);
  });
});

describe('formatDetailValue / scoreToProgressWidth', () => {
  it('欠損・NaN は「データ未登録」', () => {
    expect(formatDetailValue(undefined, '店舗')).toBe('データ未登録');
    expect(formatDetailValue(NaN, '店舗')).toBe('データ未登録');
  });

  it('単位を付けて表示し、人口は 1 万以上で万人を併記する', () => {
    expect(formatDetailValue(12, '店舗')).toBe('12 店舗');
    expect(formatDetailValue(0, '箇所')).toBe('0 箇所');
    expect(formatDetailValue(9999, '人', true)).toBe(`${(9999).toLocaleString()} 人`);
    expect(formatDetailValue(13_960_000, '人', true)).toBe(
      `${(1396).toLocaleString()} 万人 (${(13_960_000).toLocaleString()} 人)`,
    );
  });

  it('偏差値 30〜70 を 0〜100% に写像し、範囲外はクランプ', () => {
    expect(scoreToProgressWidth(30)).toBe(0);
    expect(scoreToProgressWidth(50)).toBe(50);
    expect(scoreToProgressWidth(70)).toBe(100);
    expect(scoreToProgressWidth(10)).toBe(0);
    expect(scoreToProgressWidth(90)).toBe(100);
    expect(scoreToProgressWidth(undefined)).toBe(0);
    expect(scoreToProgressWidth(NaN)).toBe(0);
  });
});

describe('computeDuel', () => {
  const a = pref({ prefCode: 1, prefName: '北海道', landPriceScore: 60, populationScore: 60, starbucksScore: 60, ramenScore: 60, sunshineHoursScore: 40 });
  const b = pref({ prefCode: 13, prefName: '東京都', landPriceScore: 40, populationScore: 40, starbucksScore: 40, ramenScore: 40, sunshineHoursScore: 60 });

  it('カテゴリごとの勝敗を数え、3 差以上なら圧倒的勝利', () => {
    const r = computeDuel(a, b);
    expect(r.categories).toHaveLength(5);
    expect(r.p1Wins).toBe(4);
    expect(r.p2Wins).toBe(1);
    expect(r.winner).toBe(a);
    expect(r.commentary).toContain('【北海道】の圧倒的勝利');
    expect(r.commentary).toContain('【東京都】');
  });

  it('差が 2 以下なら接戦、同数なら引き分け', () => {
    const close = computeDuel(a, pref({ ...b, starbucksScore: 70, ramenScore: 70 }));
    expect(close.p1Wins).toBe(2);
    expect(close.p2Wins).toBe(3);
    expect(close.commentary).toContain('接戦の末、【東京都】の勝利');

    const draw = computeDuel(pref({ prefCode: 1 }), pref({ prefCode: 2 }));
    expect(draw.winner).toBeNull();
    expect(draw.p1Wins + draw.p2Wins).toBe(0);
    expect(draw.commentary).toContain('引き分け');
  });

  it('欠損スコアは 50 として扱う', () => {
    const r = computeDuel(pref({ prefCode: 1 }), pref({ prefCode: 2 }));
    expect(r.categories.every((c) => c.p1 === 50 && c.p2 === 50)).toBe(true);
  });

  it('HP バー幅は 5〜100% にクランプ', () => {
    expect(duelBarPercent(0)).toBe(5);
    expect(duelBarPercent(62)).toBe(62);
    expect(duelBarPercent(150)).toBe(100);
  });
});

describe('computeDualCompatibility / compatibilityRank', () => {
  it('ランクの境界', () => {
    expect(compatibilityRank(99)).toBe('SSS');
    expect(compatibilityRank(95)).toBe('SSS');
    expect(compatibilityRank(94)).toBe('SS');
    expect(compatibilityRank(90)).toBe('SS');
    expect(compatibilityRank(80)).toBe('S');
    expect(compatibilityRank(70)).toBe('A');
    expect(compatibilityRank(69)).toBe('B');
    expect(compatibilityRank(59)).toBe('C');
  });

  it('同じスペック同士は最低の 65%（B）', () => {
    const r = computeDualCompatibility(pref({ prefCode: 1 }), pref({ prefCode: 2 }));
    expect(r.compatibility).toBe(65);
    expect(r.rank).toBe('B');
    expect(r.comment).toContain('同系統のペア');
  });

  it('都会とのんびり地方の組み合わせほど高く、上限は 99%', () => {
    const city = pref({ prefCode: 13, populationScore: 80, listedCompanyScore: 80, landPriceScore: 20, attractivenessScore: 50, sunshineHoursScore: 40 });
    const rural = pref({ prefCode: 47, populationScore: 30, listedCompanyScore: 30, landPriceScore: 70, attractivenessScore: 80, sunshineHoursScore: 70 });
    const r = computeDualCompatibility(city, rural);
    expect(r.compatibility).toBe(99);
    expect(r.rank).toBe('SSS');
    expect(r.comment).toContain('完璧な補完関係');
    // 対称性
    expect(computeDualCompatibility(rural, city)).toEqual(r);
  });
});

describe('buildMultiBasePlan', () => {
  it('1県以下なら null', () => {
    expect(buildMultiBasePlan([])).toBeNull();
    expect(buildMultiBasePlan([pref({})])).toBeNull();
  });

  it('春夏秋冬の4枠を返し、北海道は春・夏、沖縄は冬に割り当てる', () => {
    const tokyo = pref({ prefCode: 13, prefName: '東京都', totalScore: 60 });
    const hokkaido = pref({ prefCode: 1, prefName: '北海道', totalScore: 55 });
    const okinawa = pref({ prefCode: 47, prefName: '沖縄県', totalScore: 50 });
    const plan = buildMultiBasePlan([tokyo, hokkaido, okinawa]);
    expect(plan).not.toBeNull();
    const [spring, summer, autumn, winter] = plan!.slots;
    expect(plan!.slots.map((s) => s.icon)).toEqual(['🌸', '☀️', '🍁', '❄️']);
    // 春は沖縄/北海道のうち先に選ばれた方
    expect(spring.pref).toBe(hokkaido);
    expect(spring.reason).toContain('避粉');
    expect(summer.pref).toBe(hokkaido);
    expect(summer.reason).toContain('アウトドア');
    expect(winter.pref).toBe(okinawa);
    expect(winter.reason).toContain('南国');
    // 秋は先頭県（東京）で都市生活の理由
    expect(autumn.pref).toBe(tokyo);
    expect(autumn.reason).toContain('大都市');
    expect(plan!.avgScore).toBe('55.0');
  });

  it('該当県が無い場合は 夏=2県目・冬=3県目(無ければ2県目)・春秋=1県目', () => {
    const p1 = pref({ prefCode: 30 });
    const p2 = pref({ prefCode: 31 });
    const two = buildMultiBasePlan([p1, p2])!;
    expect(two.slots.map((s) => s.pref)).toEqual([p1, p2, p1, p2]);
    expect(two.slots[0].reason).toBe('花粉を避け快適に過ごす時期');

    const p3 = pref({ prefCode: 32 });
    const three = buildMultiBasePlan([p1, p2, p3])!;
    expect(three.slots.map((s) => s.pref)).toEqual([p1, p2, p1, p3]);
  });

  it('総合スコア欠損は 50 として平均する', () => {
    expect(buildMultiBasePlan([pref({ totalScore: 70 }), pref({})])!.avgScore).toBe('60.0');
  });
});

describe('FIRE 金額表記 (万円単位)', () => {
  it('1億以上は「億」、小数1桁で .0 は省略', () => {
    expect(formatManAxisLabel(10000)).toBe('1億');
    expect(formatManAxisLabel(15000)).toBe('1.5億');
    expect(formatManAxisLabel(100000)).toBe('10億');
    expect(formatManAxisLabel(9999)).toBe('9999万');
    expect(formatManYen(25000)).toBe('2.5億円');
    expect(formatManYen(500)).toBe('500万円');
    expect(formatManYen(9999)).toBe(`${(9999).toLocaleString()}万円`);
  });
});

describe('25年推移グラフの補助関数', () => {
  it('実数値 → 偏差値 → 50 の順でフォールバックする', () => {
    expect(getTrendMetricValue(pref({ ramenCount: 120, ramenScore: 60 }), 'ramenCount')).toBe(120);
    expect(getTrendMetricValue(pref({ ramenCount: NaN, ramenScore: 60 }), 'ramenCount')).toBe(60);
    expect(getTrendMetricValue(pref({}), 'ramenCount')).toBe(50);
  });

  it('Y 軸範囲は上下 15% の余白、値が一定なら ±10、下限は 0 未満にしない', () => {
    expect(computeTrendRange([100, 200])).toEqual({ minVal: 85, maxVal: 215 });
    expect(computeTrendRange([50, 50])).toEqual({ minVal: 40, maxVal: 60 });
    expect(computeTrendRange([5, 5])).toEqual({ minVal: 0, maxVal: 15 });
    expect(computeTrendRange([0, 100]).minVal).toBe(0);
    expect(computeTrendRange([])).toEqual({ minVal: 0, maxVal: 115 });
  });

  it('軸ラベルは 1万以上で「万」、1000 超で「k」', () => {
    expect(formatTrendLabel(25000)).toBe('3万');
    expect(formatTrendLabel(1500)).toBe('1.5k');
    expect(formatTrendLabel(1000)).toBe((1000).toLocaleString(undefined, { maximumFractionDigits: 0 }));
    expect(formatTrendLabel(42.4)).toBe('42');
  });
});

describe('toDisplayPoints', () => {
  it('偏差値の外れ値を 0〜100 点に収めて整数化する', () => {
    expect(toDisplayPoints(-13.4)).toBe(0);
    expect(toDisplayPoints(112.6)).toBe(100);
    expect(toDisplayPoints(57.5)).toBe(58);
  });
});

describe('computeDuel (欠損値の扱い)', () => {
  it('偏差値 0 は欠損扱いせず、そのまま比較に使う', () => {
    const base = { year: 2024, prefName: 'x' };
    const result = computeDuel({ ...base, prefCode: 1, landPriceScore: 0 }, { ...base, prefCode: 2, landPriceScore: 40 });
    expect(result.categories[0]).toMatchObject({ p1: 0, p2: 40 });
  });
});
