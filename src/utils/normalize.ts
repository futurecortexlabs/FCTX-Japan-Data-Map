/**
 * 配列の数値から平均と標準偏差を計算し、各値に対する偏差値を計算する
 */
export function calculateZScores(
  values: (number | undefined)[]
): (number | undefined)[] {
  // 有効な値のみを抽出
  const validValues = values.filter((v): v is number => typeof v === 'number' && !isNaN(v));

  if (validValues.length === 0) {
    return values.map(() => undefined);
  }

  // 平均 (Mean)
  const mean = validValues.reduce((sum, val) => sum + val, 0) / validValues.length;

  // 分散 (Variance)
  const variance =
    validValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
    validValues.length;

  // 標準偏差 (Standard Deviation)
  const stdDev = Math.sqrt(variance);

  // 各値の偏差値 (T-Score) を計算: 50 + 10 * (x - mean) / stdDev
  return values.map((val) => {
    if (typeof val !== 'number' || isNaN(val)) {
      return undefined;
    }
    if (stdDev === 0) {
      return 50; // 全て同じ値の場合は偏差値50とする
    }
    const score = 50 + (10 * (val - mean)) / stdDev;
    // 小数点第2位で四捨五入
    return Math.round(score * 100) / 100;
  });
}
