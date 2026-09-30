import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { canonicalizeHeader, normalizeCsvRow, parsePrefectureCsv, toOptionalNumber } from './csv';

describe('toOptionalNumber', () => {
  it.each([
    [42, 42],
    ['42', 42],
    ['1,234,567', 1234567],
    ['', undefined],
    [null, undefined],
    [undefined, undefined],
    ['N/A', undefined],
  ])('%j → %j', (input, expected) => {
    expect(toOptionalNumber(input)).toBe(expected);
  });
});

describe('canonicalizeHeader', () => {
  it('日本語・略称・大文字小文字の揺れを正規カラム名に揃える', () => {
    expect(canonicalizeHeader('都道府県コード')).toBe('prefCode');
    expect(canonicalizeHeader(' 都道府県名 ')).toBe('prefName');
    expect(canonicalizeHeader('Starbucks_Count')).toBe('starbucksCount');
    expect(canonicalizeHeader('日照時間')).toBe('sunshineHours');
  });

  it('未知のヘッダーはトリムのみ行いそのまま返す', () => {
    expect(canonicalizeHeader(' custom ')).toBe('custom');
  });
});

describe('normalizeCsvRow', () => {
  it('年が無ければ 2024 を補完する', () => {
    expect(normalizeCsvRow({ prefCode: 13, prefName: '東京都' })).toMatchObject({ year: 2024, prefCode: 13 });
  });

  it.each([0, 48, 1.5, 'abc', undefined])('不正な都道府県コード %j の行は null', (prefCode) => {
    expect(normalizeCsvRow({ prefCode, prefName: 'x' })).toBeNull();
  });

  it('空セルは undefined (0 扱いにしない)', () => {
    const row = normalizeCsvRow({ prefCode: 1, prefName: '北海道', ramenCount: '', onsenCount: 0 });
    expect(row?.ramenCount).toBeUndefined();
    expect(row?.onsenCount).toBe(0);
  });
});

describe('parsePrefectureCsv', () => {
  it('日本語ヘッダーの CSV を解析し、不正行はスキップ数として報告する', () => {
    const csv = ['都道府県コード,都道府県名,年,ラーメン', '13,東京都,2024,3200', '99,存在しない県,2024,1', '47,沖縄県,2024,150'].join('\n');
    const { data, skippedRows } = parsePrefectureCsv(csv);
    expect(skippedRows).toBe(1);
    expect(data).toHaveLength(2);
    expect(data[0]).toMatchObject({ prefCode: 13, prefName: '東京都', year: 2024, ramenCount: 3200 });
  });

  it('同梱のサンプルデータセットは全行が有効で、各年に 47 都道府県が揃っている', () => {
    const csv = readFileSync(new URL('../data/sample_prefecture_data.csv', import.meta.url), 'utf8');
    const { data, skippedRows } = parsePrefectureCsv(csv);
    expect(skippedRows).toBe(0);

    const prefsByYear = new Map<number, Set<number>>();
    for (const d of data) prefsByYear.set(d.year, (prefsByYear.get(d.year) ?? new Set()).add(d.prefCode));
    expect(prefsByYear.size).toBeGreaterThan(1);
    for (const codes of prefsByYear.values()) expect(codes.size).toBe(47);
  });
});
