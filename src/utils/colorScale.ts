/**
 * 数値を [min, max] の範囲で 0〜1 に正規化し、
 * 青 (低) -> 黄 (中) -> 赤 (高) の 3色グラデーションカラーを返す。
 * 値が未登録 (undefined/NaN) の場合はグレーを返す。
 */
export function getColorForScore(
  score?: number,
  minScore: number = 35,
  maxScore: number = 65
): string {
  if (typeof score !== 'number' || isNaN(score)) {
    return '#e5e7eb'; // データ未登録時のグレー (tailwindcss gray-200)
  }

  // スコアを 0〜1 の範囲にクランプ
  const clamped = Math.max(minScore, Math.min(maxScore, score));
  const t = (clamped - minScore) / (maxScore - minScore);

  // RGBの3点補間 (青 #3b82f6 -> 黄 #fef08a -> 赤 #ef4444)
  // 青: R=59, G=130, B=246
  // 黄: R=254, G=240, B=138
  // 赤: R=239, G=68, B=68

  let r, g, b;

  if (t < 0.5) {
    // 青から黄への補間 (tが0〜0.5の間)
    const factor = t * 2; // 0〜1に正規化
    r = Math.round(59 + (254 - 59) * factor);
    g = Math.round(130 + (240 - 130) * factor);
    b = Math.round(246 + (138 - 246) * factor);
  } else {
    // 黄から赤への補間 (tが0.5〜1の間)
    const factor = (t - 0.5) * 2; // 0〜1に正規化
    r = Math.round(254 + (239 - 254) * factor);
    g = Math.round(240 + (68 - 240) * factor);
    b = Math.round(138 + (68 - 138) * factor);
  }

  return `rgb(${r}, ${g}, ${b})`;
}
