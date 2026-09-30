import { Globe } from 'lucide-react';
import type { PrefectureData } from '../../types/prefecture';
import { generateNomadRoute } from '../../utils/nomadPlanner';

interface NomadTabProps {
  prefectures: PrefectureData[];
}

/** 「ノマドルート」タブ: 3拠点の気候データから季節ごとの周遊ルートを表示 */
export const NomadTab: React.FC<NomadTabProps> = ({ prefectures }) => (
  <div className="flex flex-col gap-4 h-full min-h-0 overflow-y-auto pr-1">
    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
      <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
        <Globe className="w-4 h-4 text-emerald-500" />
        NOMAD SEASONAL ROUTE
      </h3>
      <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
        選択された3拠点の気候データから、最も快適に過ごせる「季節ごとの周遊ルート」を生成しました。
      </p>

      <div className="flex flex-col gap-3 relative before:absolute before:inset-y-2 before:left-[19px] before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
        {generateNomadRoute(prefectures).map((route) => (
          <div key={route.season} className="flex gap-3 relative z-10">
            <div className="w-10 h-10 shrink-0 bg-white dark:bg-slate-800 rounded-full border-4 border-slate-50 dark:border-slate-900 flex items-center justify-center text-lg shadow-sm">
              {route.icon}
            </div>
            <div className="flex-1 bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
              <div className="flex justify-between items-end mb-1">
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">{route.season}</span>
                <span className="font-black text-slate-800 dark:text-slate-200">{route.pref.prefName}</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed mt-2">{route.reason}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);
