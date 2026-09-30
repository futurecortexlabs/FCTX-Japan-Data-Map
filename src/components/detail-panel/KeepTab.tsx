import { Bookmark } from 'lucide-react';
import type { KeepItem } from '../../types/ui';
import { ACHIEVEMENTS } from '../../utils/achievements';

interface KeepTabProps {
  keepList: KeepItem[];
  onSelectPrefecture: (prefCode: number, year?: number) => void;
  onToggleKeep: (prefCode: number, prefName: string, year: number) => void;
  unlockedAchievements: string[];
}

const AchievementsBoard: React.FC<{ unlockedAchievements: string[] }> = ({ unlockedAchievements }) => (
  <div className="mt-5 border-t border-slate-200/50 dark:border-slate-800/60 pt-4 flex flex-col gap-2.5">
    <div className="flex justify-between items-center text-left">
      <span className="text-xs font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-wider block">
        🏆 獲得実績 ({unlockedAchievements.length} / {ACHIEVEMENTS.length})
      </span>
    </div>
    <div className="grid grid-cols-2 gap-2 text-left">
      {ACHIEVEMENTS.map((ach) => {
        const isUnlocked = unlockedAchievements.includes(ach.id);
        return (
          <div
            key={ach.id}
            className={`p-2 rounded-xl border flex gap-1.5 transition-all duration-300 ${
              isUnlocked
                ? 'bg-indigo-50/15 border-indigo-200/40 dark:bg-indigo-950/10 dark:border-indigo-900/30 text-slate-900 dark:text-white'
                : 'bg-slate-50/40 border-slate-200/20 dark:bg-slate-900/10 dark:border-slate-900/40 text-slate-400 opacity-60'
            }`}
            title={ach.description}
          >
            <div className="text-xl shrink-0 select-none flex items-center justify-center">
              {isUnlocked ? ach.emoji : '🔒'}
            </div>
            <div className="min-w-0 flex flex-col justify-center">
              <span className="text-[9px] font-black leading-snug truncate">
                {ach.name}
              </span>
              <span className="text-[7.5px] leading-tight text-slate-400 dark:text-slate-500 font-bold truncate mt-0.5">
                {ach.description}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

/** 「キープ」タブ: お気に入り一覧と獲得実績ボード */
export const KeepTab: React.FC<KeepTabProps> = ({ keepList, onSelectPrefecture, onToggleKeep, unlockedAchievements }) => {
  if (keepList.length === 0) {
    return (
      <div className="flex flex-col h-full min-h-0 overflow-y-auto pr-1">
        <div className="flex flex-col items-center justify-center py-6 text-center gap-2">
          <Bookmark className="w-6 h-6 text-slate-400 dark:text-slate-700" />
          <p className="text-[10px] text-slate-500 dark:text-slate-500 max-w-[200px] leading-relaxed font-bold">
            キープしている理想郷はありません。詳細タブのしおりマークをクリックしてお気に入り登録しましょう！
          </p>
        </div>
        <AchievementsBoard unlockedAchievements={unlockedAchievements} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 h-full min-h-0 overflow-y-auto pr-1">
      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/80 pb-2 mb-1">
        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          キープリスト ({keepList.length}件)
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        {keepList.map((item) => (
          <div
            key={`${item.prefCode}-${item.year}`}
            className="flex items-center justify-between p-2 bg-slate-50/50 hover:bg-indigo-50/30 dark:bg-slate-800/40 dark:hover:bg-indigo-950/10 border border-slate-200/50 hover:border-indigo-500/30 dark:border-slate-800/60 dark:hover:border-indigo-900/40 rounded-xl transition-all duration-300 shadow-sm"
          >
            <button
              onClick={() => onSelectPrefecture(item.prefCode, item.year)}
              className="flex-1 text-left cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-white">
                  {item.prefName}
                </span>
                <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500">
                  {item.year}年
                </span>
              </div>
            </button>
            <button
              onClick={() => onToggleKeep(item.prefCode, item.prefName, item.year)}
              className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
              title="削除"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
      </div>
      <AchievementsBoard unlockedAchievements={unlockedAchievements} />
    </div>
  );
};
