import Papa from 'papaparse';
import type { PrefectureData } from '../types/prefecture';

type CsvCell = string | number | boolean | null | undefined;
export type CsvRow = Record<string, CsvCell>;

const NUMERIC_FIELDS = [
  'landPrice',
  'population',
  'listedCompanies',
  'starbucksCount',
  'ramenCount',
  'attractiveness',
  'sunshineHours',
  'onsenCount',
  'hospitalCount',
  'pollenLevel',
  'childcareScore',
] as const satisfies readonly (keyof PrefectureData)[];

export const DEFAULT_YEAR = 2024;

/** 正規化後のカラム名 → 受け付ける別名 (小文字・前後空白除去後に比較) */
const HEADER_ALIASES: Record<string, readonly string[]> = {
  prefCode: ['prefcode', 'code', 'id', '都道府県コード', 'コード', '都道府県id'],
  prefName: ['prefname', 'name', 'prefecture', '都道府県名', '都道府県', '名前'],
  year: ['year', '年', '年度', '西暦'],
  landPrice: ['landprice', 'price', '地価', '平均地価', '公示地価'],
  population: ['population', 'pop', '人口', '住民数', '世帯数'],
  listedCompanies: ['listedcompanies', 'companies', 'listed_companies', 'listedcompany', 'uppercompanies', 'upper_companies', '上場企業数', '企業数', '上場会社数'],
  starbucksCount: ['starbucks', 'starbuckscount', 'starbucks_count', 'スタバ', 'スターバックス', 'スタバ店舗数'],
  ramenCount: ['ramen', 'ramencount', 'ramen_count', 'ラーメン', 'ラーメン店舗数', 'らーめん'],
  attractiveness: ['attractiveness', 'attractivenessscore', 'charm', '魅力度', '魅力度スコア', '魅力'],
  sunshineHours: ['sunshinehours', 'sunshine', 'sunshine_hours', '日照時間', '年間日照時間', '日照'],
  onsenCount: ['onsen', 'onsencount', 'onsen_count', '温泉', '温泉数', '温泉の数', '温泉箇所数'],
  hospitalCount: ['hospital', 'hospitalcount', 'hospital_count', 'hospitals', '医療機関数', '病院数', '病院'],
  pollenLevel: ['pollen', 'pollenlevel', 'pollen_level', '花粉', '花粉量', '花粉の少なさ'],
  childcareScore: ['childcare', 'childcarescore', 'childcare_score', '子育て', '子育てしやすさ', '育児'],
};

const ALIAS_TO_HEADER = new Map(
  Object.entries(HEADER_ALIASES).flatMap(([canonical, aliases]) => aliases.map((a) => [a, canonical] as const)),
);

/** 日本語・略称・スネークケースなどのヘッダー表記ゆれを正規のカラム名に揃える */
export const canonicalizeHeader = (header: string): string =>
  ALIAS_TO_HEADER.get(header.trim().toLowerCase()) ?? header.trim();

/** 空文字・null・非数値を undefined に落とし、それ以外を number にする */
export function toOptionalNumber(value: CsvCell): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const n = typeof value === 'number' ? value : Number(String(value).replace(/,/g, ''));
  return Number.isFinite(n) ? n : undefined;
}

/**
 * CSV の 1 行 (ヘッダーは canonicalizeHeader 済み) を PrefectureData に正規化する。
 * 都道府県コードが 1〜47 の整数でない行は null を返す。
 */
export function normalizeCsvRow(row: CsvRow): PrefectureData | null {
  const prefCode = toOptionalNumber(row.prefCode);
  if (prefCode === undefined || !Number.isInteger(prefCode) || prefCode < 1 || prefCode > 47) {
    return null;
  }

  const rawName = row.prefName;
  const data: PrefectureData = {
    year: toOptionalNumber(row.year) ?? DEFAULT_YEAR,
    prefCode,
    prefName: rawName == null ? '' : String(rawName).trim(),
  };

  for (const field of NUMERIC_FIELDS) {
    data[field] = toOptionalNumber(row[field]);
  }
  return data;
}

export interface CsvParseResult {
  data: PrefectureData[];
  /** 不正な都道府県コードなどでスキップした行数 */
  skippedRows: number;
}

/** CSV テキスト全体を解析する (Web Worker 内から同期的に呼ばれる想定) */
export function parsePrefectureCsv(csvText: string): CsvParseResult {
  const result = Papa.parse<CsvRow>(csvText, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    transformHeader: canonicalizeHeader,
  });

  const data: PrefectureData[] = [];
  let skippedRows = 0;
  for (const row of result.data) {
    const normalized = normalizeCsvRow(row);
    if (normalized) data.push(normalized);
    else skippedRows++;
  }
  return { data, skippedRows };
}
