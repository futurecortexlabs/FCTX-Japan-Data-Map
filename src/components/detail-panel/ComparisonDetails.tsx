import { Flame, Heart } from 'lucide-react';
import type { MetricType, PrefectureData } from '../../types/prefecture';
import { ComparisonRadarChart } from '../ComparisonRadarChart';
import { TrendLineChart } from './TrendLineChart';
import { computeDualCompatibility, computeDuel, duelBarPercent } from './logic';

export type ComparisonSubTab = 'radar' | 'duel' | 'dual';

const SUB_TABS: readonly { id: ComparisonSubTab; label: string }[] = [
  { id: 'radar', label: 'レーダー' },
  { id: 'duel', label: 'VSデュエル ⚔️' },
  { id: 'dual', label: '2拠点相性 🏡' },
];

const RING_RADIUS = 34;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

interface ComparisonDetailsProps {
  pref1: PrefectureData;
  pref2: PrefectureData;
  allPrefectures: PrefectureData[];
  currentMetric: MetricType;
  compTab: ComparisonSubTab;
  onCompTabChange: (tab: ComparisonSubTab) => void;
  onStartBattle: () => void;
}

/** 2県選択時の「詳細」タブ: レーダー / VSデュエル / 2拠点相性 のサブタブ */
export const ComparisonDetails: React.FC<ComparisonDetailsProps> = ({
  pref1,
  pref2,
  allPrefectures,
  currentMetric,
  compTab,
  onCompTabChange,
  onStartBattle,
}) => {
  const duel = computeDuel(pref1, pref2);
  const { compatibility, rank, comment: dualComment } = computeDualCompatibility(pref1, pref2);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* サブタブ */}
      <div className="flex bg-slate-100/60 dark:bg-slate-950/40 p-1 rounded-lg gap-1 mb-3 shrink-0">
        {SUB_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onCompTabChange(tab.id)}
            className={`flex-1 py-1 text-[10px] font-extrabold rounded transition-all cursor-pointer ${compTab === tab.id ? 'bg-white dark:bg-slate-800 text-indigo-650 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pr-1 flex flex-col gap-4">
        {compTab === 'radar' ? (
          <div className="shrink-0 h-[220px]">
            <ComparisonRadarChart prefecture1={pref1} prefecture2={pref2} />
          </div>
        ) : compTab === 'duel' ? (
          <div className="flex flex-col gap-3 h-full min-h-0 overflow-y-auto pr-1">
            {/* VS ヘッダー */}
            <div className="flex items-center justify-between px-2 py-3 bg-gradient-to-r from-red-50/50 via-slate-50/50 to-blue-50/50 dark:from-red-950/10 dark:via-slate-900/10 dark:to-blue-950/10 border border-slate-200/40 dark:border-slate-800/40 rounded-xl relative overflow-hidden shrink-0">
              <div className="flex-1 flex flex-col items-center">
                <span className="text-[8px] font-black text-rose-500 dark:text-rose-400 uppercase tracking-widest">1P</span>
                <span className="text-sm font-black text-slate-800 dark:text-white truncate max-w-[80px]">{pref1.prefName}</span>
              </div>
              <div className="px-3 py-1 bg-slate-900 text-amber-500 text-xs font-black rounded-lg border border-slate-700 shadow animate-pulse italic shrink-0">
                VS
              </div>
              <div className="flex-1 flex flex-col items-center">
                <span className="text-[8px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">2P</span>
                <span className="text-sm font-black text-slate-800 dark:text-white truncate max-w-[80px]">{pref2.prefName}</span>
              </div>
            </div>

            <button
              onClick={onStartBattle}
              className="w-full py-2 bg-gradient-to-r from-rose-500 to-blue-500 hover:from-rose-600 hover:to-blue-600 text-white font-black rounded-lg text-xs shadow-lg transform transition-transform hover:scale-105 active:scale-95 shrink-0 mt-1"
            >
              ⚔️ フルスクリーン・バトル開始！ ⚔️
            </button>

            {/* 対戦内容 */}
            <div className="flex flex-col gap-3 my-1">
              {duel.categories.map((cat) => (
                <div key={cat.name} className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] px-1 font-bold text-slate-500 dark:text-slate-400">
                    <span className={cat.p1 > cat.p2 ? 'text-rose-550 dark:text-rose-400' : ''}>{cat.p1.toFixed(0)}点</span>
                    <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded text-[9px] text-slate-600 dark:text-slate-350">{cat.name}</span>
                    <span className={cat.p2 > cat.p1 ? 'text-indigo-550 dark:text-indigo-400' : ''}>{cat.p2.toFixed(0)}点</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* 左 HP バー */}
                    <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-l overflow-hidden flex justify-end">
                      <div
                        className={`h-full bg-gradient-to-l from-rose-500 to-rose-400 transition-all duration-500 ${cat.p1 > cat.p2 ? 'brightness-110' : 'opacity-60'}`}
                        style={{ width: `${duelBarPercent(cat.p1)}%` }}
                      />
                    </div>
                    {/* 勝敗表示 */}
                    <div className="w-10 text-center text-[8px] font-black shrink-0">
                      {cat.p1 > cat.p2 ? (
                        <span className="text-rose-500 animate-pulse bg-rose-50 dark:bg-rose-950/20 px-1 rounded">◀ WIN</span>
                      ) : cat.p2 > cat.p1 ? (
                        <span className="text-indigo-500 animate-pulse bg-indigo-50 dark:bg-indigo-950/20 px-1 rounded">WIN ▶</span>
                      ) : (
                        <span className="text-slate-400 font-normal">DRAW</span>
                      )}
                    </div>
                    {/* 右 HP バー */}
                    <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-r overflow-hidden flex justify-start">
                      <div
                        className={`h-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-500 ${cat.p2 > cat.p1 ? 'brightness-110' : 'opacity-60'}`}
                        style={{ width: `${duelBarPercent(cat.p2)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* バトルコメンタリー */}
            <div className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-850/60 rounded-xl mt-1 space-y-1 text-left shrink-0">
              <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-450 dark:text-slate-500">
                <Flame className="w-3 h-3 text-amber-500" />
                <span>BATTLE RESULT</span>
              </div>
              <p className="text-[10px] font-bold text-slate-650 dark:text-slate-350 leading-relaxed">
                {duel.commentary}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 h-full min-h-0 overflow-y-auto pr-1 justify-center py-2 items-center">
            {/* 相性パーセント */}
            <div className="flex flex-col items-center gap-1 text-center">
              <div className="relative flex items-center justify-center">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle cx="40" cy="40" r={RING_RADIUS} stroke="currentColor" strokeWidth="5" fill="transparent" className="text-slate-100 dark:text-slate-800" />
                  <circle cx="40" cy="40" r={RING_RADIUS} stroke="currentColor" strokeWidth="5" fill="transparent" strokeDasharray={`${RING_CIRCUMFERENCE}`} strokeDashoffset={`${RING_CIRCUMFERENCE * (1 - compatibility / 100)}`} className="text-rose-500 dark:text-rose-450 transition-all duration-1000" />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest">MATCH</span>
                  <span className="text-lg font-black text-slate-800 dark:text-white leading-none mt-0.5">{compatibility}%</span>
                  <span className="text-[9px] font-black text-rose-500 dark:text-rose-400 mt-0.5">{rank}</span>
                </div>
              </div>
              <div className="space-y-0.5 mt-1">
                <h4 className="text-xs font-black text-slate-850 dark:text-white">
                  {pref1.prefName} &times; {pref2.prefName}
                </h4>
                <p className="text-[9px] text-slate-400">多拠点ライフ相性診断</p>
              </div>
            </div>

            {/* コメンタリー */}
            <div className="p-3 bg-gradient-to-br from-indigo-50/20 to-purple-50/10 dark:from-indigo-950/10 dark:to-purple-950/5 border border-indigo-150/30 dark:border-indigo-900/20 rounded-xl space-y-1 text-left w-full">
              <div className="flex items-center gap-1.5 text-[9px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                <span>診断分析</span>
              </div>
              <p className="text-[10px] font-bold text-slate-650 dark:text-slate-350 leading-relaxed">
                {dualComment}
              </p>
            </div>
          </div>
        )}

        {/* 25年時系列推移折れ線グラフ */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/40">
          <TrendLineChart
            prefCodes={[pref1.prefCode, pref2.prefCode]}
            allPrefectures={allPrefectures}
            currentMetric={currentMetric}
          />
        </div>
      </div>
    </div>
  );
};
