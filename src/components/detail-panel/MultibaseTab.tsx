import type { PrefectureData } from '../../types/prefecture';
import { generatePrefectureCatchphrase } from '../../utils/catchphrase';
import { buildMultiBasePlan } from './logic';

interface MultibaseTabProps {
  prefectures: PrefectureData[];
}

/** 「多拠点設計」タブ: 2〜3県を四季に割り当てたローテーションカレンダー */
export const MultibaseTab: React.FC<MultibaseTabProps> = ({ prefectures }) => {
  const plan = buildMultiBasePlan(prefectures);
  if (!plan) return null;

  return (
    <div className="flex flex-col gap-4 h-full min-h-0 overflow-y-auto pr-1 text-left">
      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
        <div>
          <h4 className="text-xs font-black text-slate-800 dark:text-white leading-none">
            シーズンローテーションカレンダー
          </h4>
          <span className="text-[9px] text-indigo-500 dark:text-indigo-400 font-bold">
            Multi-base Seasonal Plan
          </span>
        </div>

        <div className="text-right">
          <span className="text-[9px] text-slate-400 block">統合満足度</span>
          <span className="text-sm font-black text-indigo-700 dark:text-indigo-400 tabular-nums">
            {plan.avgScore} <span className="text-[9px] font-normal text-slate-400">点</span>
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {plan.slots.map((slot) => {
          const catchphrase = generatePrefectureCatchphrase(slot.pref);
          return (
            <div
              key={slot.season}
              className="flex items-center gap-3.5 p-3 bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800/60 rounded-xl hover:shadow-sm transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800/60 flex flex-col items-center justify-center shadow-inner shrink-0 text-center">
                <span className="text-lg leading-none">{slot.icon}</span>
                <span className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter leading-none mt-0.5">
                  {slot.season.slice(0, 1)}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-slate-800 dark:text-white">
                    {slot.pref.prefName}
                  </span>
                  <span className={`px-1 py-0.5 rounded text-[7px] font-black tracking-wider ${
                    catchphrase.rarity === 'SSR'
                      ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                      : catchphrase.rarity === 'SR'
                      ? 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20'
                      : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                  }`}>
                    {catchphrase.rarity}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-500 font-bold truncate mt-0.5">
                  {slot.reason}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
