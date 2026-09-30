import type { MetricType, PrefectureData } from '../../types/prefecture';
import { computeTrendRange, formatTrendLabel, getTrendMetricValue } from './logic';

interface TrendLineChartProps {
  prefCodes: number[];
  allPrefectures: PrefectureData[];
  currentMetric: MetricType;
}

const SVG_WIDTH = 320;
const SVG_HEIGHT = 110;
const PADDING_LEFT = 35;
const PADDING_RIGHT = 10;
const PADDING_TOP = 10;
const PADDING_BOTTOM = 15;
const CHART_WIDTH = SVG_WIDTH - PADDING_LEFT - PADDING_RIGHT;
const CHART_HEIGHT = SVG_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

const STROKE_COLORS = ['stroke-indigo-500', 'stroke-orange-500', 'stroke-emerald-500'];
const FILL_COLORS = ['fill-indigo-500', 'fill-orange-500', 'fill-emerald-500'];
const BG_COLORS = ['bg-indigo-500', 'bg-orange-500', 'bg-emerald-500'];

/** 選択県の指標を全年度分プロットする軽量 SVG 折れ線グラフ */
export const TrendLineChart: React.FC<TrendLineChartProps> = ({ prefCodes, allPrefectures, currentMetric }) => {
  if (prefCodes.length === 0) return null;

  const years = Array.from(new Set(allPrefectures.map((p) => p.year))).sort((a, b) => a - b);
  if (years.length <= 1) return null;

  const prefDataMap = prefCodes
    .map((code) => {
      const history = allPrefectures.filter((p) => p.prefCode === code).sort((a, b) => a.year - b.year);
      const name = history[0]?.prefName || '不明';
      return { code, name, history };
    })
    // 履歴が1件も無い県は「M 」だけの不正な path になるため描画しない
    .filter((d) => d.history.length > 0);

  const valueOf = (pref: PrefectureData) => getTrendMetricValue(pref, currentMetric);
  const { minVal, maxVal } = computeTrendRange(prefDataMap.flatMap((d) => d.history.map(valueOf)));
  const valRange = maxVal - minVal || 1;

  const getX = (year: number) => {
    const yearIdx = years.indexOf(year);
    if (yearIdx === -1) return PADDING_LEFT;
    return PADDING_LEFT + (yearIdx / (years.length - 1)) * CHART_WIDTH;
  };

  const getY = (val: number) => PADDING_TOP + CHART_HEIGHT - ((val - minVal) / valRange) * CHART_HEIGHT;

  return (
    <div className="bg-slate-50/50 dark:bg-slate-900/40 p-3 border border-slate-200/50 dark:border-slate-800/60 rounded-xl flex flex-col gap-2 mt-2">
      <div className="flex justify-between items-center px-0.5">
        <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
          📈 25年間の歴史的データ推移
        </span>
      </div>

      <div className="relative w-full h-[110px]">
        <svg viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} className="w-full h-full">
          {/* グリッド線 */}
          <line x1={PADDING_LEFT} y1={PADDING_TOP} x2={SVG_WIDTH - PADDING_RIGHT} y2={PADDING_TOP} stroke="currentColor" className="text-slate-100 dark:text-slate-800/30" strokeDasharray="3,3" />
          <line x1={PADDING_LEFT} y1={PADDING_TOP + CHART_HEIGHT / 2} x2={SVG_WIDTH - PADDING_RIGHT} y2={PADDING_TOP + CHART_HEIGHT / 2} stroke="currentColor" className="text-slate-100 dark:text-slate-800/30" strokeDasharray="3,3" />
          <line x1={PADDING_LEFT} y1={PADDING_TOP + CHART_HEIGHT} x2={SVG_WIDTH - PADDING_RIGHT} y2={PADDING_TOP + CHART_HEIGHT} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />

          {/* Y 軸ラベル */}
          <text x={PADDING_LEFT - 5} y={PADDING_TOP + 4} textAnchor="end" className="text-[8px] fill-slate-400 dark:fill-slate-500 font-bold tabular-nums">
            {formatTrendLabel(maxVal)}
          </text>
          <text x={PADDING_LEFT - 5} y={PADDING_TOP + CHART_HEIGHT + 3} textAnchor="end" className="text-[8px] fill-slate-400 dark:fill-slate-500 font-bold tabular-nums">
            {formatTrendLabel(minVal)}
          </text>

          {/* X 軸ラベル (2000, 2012, 2024) */}
          <text x={getX(2000)} y={SVG_HEIGHT - 2} textAnchor="middle" className="text-[8px] fill-slate-400 dark:fill-slate-500 font-bold">2000</text>
          <text x={getX(2012)} y={SVG_HEIGHT - 2} textAnchor="middle" className="text-[8px] fill-slate-400 dark:fill-slate-500 font-bold">2012</text>
          <text x={getX(2024)} y={SVG_HEIGHT - 2} textAnchor="middle" className="text-[8px] fill-slate-400 dark:fill-slate-500 font-bold">2024</text>

          {/* 県ごとの折れ線 */}
          {prefDataMap.map((pref, pIdx) => {
            const points = pref.history.map((h) => `${getX(h.year)},${getY(valueOf(h))}`);
            const last = pref.history[pref.history.length - 1];
            return (
              <g key={pref.code}>
                <path
                  d={`M ${points.join(' L ')}`}
                  fill="none"
                  className={`${STROKE_COLORS[pIdx % STROKE_COLORS.length]} transition-all duration-500`}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* 最新年のドット */}
                <circle
                  cx={getX(last.year)}
                  cy={getY(valueOf(last))}
                  r="3"
                  className={`${FILL_COLORS[pIdx % FILL_COLORS.length]} stroke-white dark:stroke-slate-900`}
                  strokeWidth="1"
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* 凡例 */}
      <div className="flex gap-2.5 justify-center items-center flex-wrap pt-0.5 border-t border-slate-100 dark:border-slate-800/40">
        {prefDataMap.map((pref, pIdx) => (
          <div key={pref.code} className="flex items-center gap-1 text-[9px] font-bold text-slate-500">
            <span className={`w-2 h-2 rounded-full ${BG_COLORS[pIdx % BG_COLORS.length]}`} />
            <span>{pref.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
