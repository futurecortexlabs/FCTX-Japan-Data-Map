import { describe, expect, it } from 'vitest';
import { calculateZScores } from './normalize';

describe('calculateZScores (偏差値)', () => {
  it('平均値は偏差値 50、+1σ は 60、-1σ は 40 になる', () => {
    // 平均 50, 母標準偏差 10
    expect(calculateZScores([40, 50, 60])).toEqual([37.75, 50, 62.25]);
    expect(calculateZScores([30, 70])).toEqual([40, 60]);
  });

  it('欠損値 (undefined / NaN) は計算から除外し、位置を保ったまま undefined を返す', () => {
    expect(calculateZScores([30, undefined, 70, NaN])).toEqual([40, undefined, 60, undefined]);
  });

  it('全て同じ値 (標準偏差 0) の場合はゼロ除算せず 50 を返す', () => {
    expect(calculateZScores([5, 5, 5])).toEqual([50, 50, 50]);
  });

  it('有効値が 1 つもなければ全て undefined', () => {
    expect(calculateZScores([undefined, NaN])).toEqual([undefined, undefined]);
    expect(calculateZScores([])).toEqual([]);
  });

  it('偏差値の平均は 50 になる (正規化の不変条件)', () => {
    const scores = calculateZScores([12, 7, 99, 43, 3, 58]) as number[];
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    expect(mean).toBeCloseTo(50, 1);
  });
});
