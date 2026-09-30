import { describe, expect, it } from 'vitest';
import { DEFAULT_WEIGHTS } from '../constants/weights';
import { parseUrlState, serializeUrlState, type UrlState } from './useUrlState';

const DEFAULTS: UrlState = { metric: 'totalScore', year: 2024, prefCodes: [], weights: DEFAULT_WEIGHTS };

describe('parseUrlState', () => {
  it('パラメータが無ければ既定値を返す', () => {
    expect(parseUrlState('', DEFAULTS)).toEqual(DEFAULTS);
  });

  it('未知の指標名は既定値にフォールバックする', () => {
    expect(parseUrlState('?metric=__proto__', DEFAULTS).metric).toBe('totalScore');
    expect(parseUrlState('?metric=ramenCount', DEFAULTS).metric).toBe('ramenCount');
  });

  it('都道府県コードは 1〜47 の整数のみ・重複除去・最大 3 件', () => {
    expect(parseUrlState('?prefs=13,13,99,abc,0,47,1,2', DEFAULTS).prefCodes).toEqual([13, 47, 1]);
  });

  it('8 種類すべてのウェイトを復元し、0〜100 にクランプする', () => {
    const state = parseUrlState('?w_sb=200&w_rm=-5&w_on=33.4&w_cc=70&w_pl=abc', DEFAULTS);
    expect(state.weights).toMatchObject({
      starbucksCount: 100,
      ramenCount: 0,
      onsenCount: 33,
      childcareScore: 70,
      pollenLevel: DEFAULT_WEIGHTS.pollenLevel,
    });
  });

  it('年が整数でなければ既定値', () => {
    expect(parseUrlState('?year=abc', DEFAULTS).year).toBe(2024);
    expect(parseUrlState('?year=2008', DEFAULTS).year).toBe(2008);
  });
});

describe('serializeUrlState', () => {
  it('parse と serialize はラウンドトリップする', () => {
    const state: UrlState = {
      metric: 'onsenCount',
      year: 2020,
      prefCodes: [1, 13, 47],
      weights: { ...DEFAULT_WEIGHTS, onsenCount: 80, hospitalCount: 0 },
    };
    expect(parseUrlState(`?${serializeUrlState('', state)}`, DEFAULTS)).toEqual(state);
  });

  it('無関係な既存パラメータは保持し、選択が空なら prefs を削除する', () => {
    const query = serializeUrlState('?utm_source=x&prefs=1', { ...DEFAULTS, prefCodes: [] });
    const params = new URLSearchParams(query);
    expect(params.get('utm_source')).toBe('x');
    expect(params.has('prefs')).toBe(false);
  });
});
