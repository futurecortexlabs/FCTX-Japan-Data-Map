import { useState, useEffect, Suspense, lazy } from 'react';
import { MapPin, Coins, Sliders, Globe, HelpCircle, Bookmark, Brain, Calendar, type LucideIcon } from 'lucide-react';
import type { PrefectureData, MetricWeights, MetricType } from '../../types/prefecture';
import type { DetailPanelTab, KeepItem } from '../../types/ui';
import { WeightConfigPanel } from '../WeightConfigPanel';
import { AiTab, type AiAnsweredKey } from './AiTab';
import type { ComparisonSubTab } from './ComparisonDetails';
import { DetailsTab } from './DetailsTab';
import { KeepTab } from './KeepTab';
import { MultibaseTab } from './MultibaseTab';
import { NomadTab } from './NomadTab';
import { QuizTab } from './QuizTab';
import { INITIAL_QUIZ_STATE, isDetailTabAvailable, resolveDetailTab, type QuizState } from './logic';

// recharts を含む FIRE タブと全画面モーダルは、開いたときだけ読み込む
const FireTab = lazy(() => import('./FireTab').then((m) => ({ default: m.FireTab })));
const UtopiaBoardingPass = lazy(() => import('../UtopiaBoardingPass').then((m) => ({ default: m.UtopiaBoardingPass })));
const VSBattleScreen = lazy(() => import('../VSBattleScreen').then((m) => ({ default: m.VSBattleScreen })));
const RetroBattleScreen = lazy(() => import('../RetroBattleScreen').then((m) => ({ default: m.RetroBattleScreen })));

interface PrefectureDetailPanelProps {
  prefectures: PrefectureData[];
  weights: MetricWeights;
  onWeightsChange: (weights: MetricWeights) => void;
  allPrefectures: PrefectureData[];
  onSelectPrefecture: (prefCode: number, year?: number) => void;
  keepList: KeepItem[];
  onToggleKeep: (prefCode: number, prefName: string, year: number) => void;
  currentMetric: MetricType;
  activeTab: DetailPanelTab;
  onActiveTabChange: (tab: DetailPanelTab) => void;
  unlockedAchievements: string[];
  isRetroMode?: boolean;
}

interface TabDef {
  id: DetailPanelTab;
  label: string;
  icon: LucideIcon;
  iconClassName?: string;
  /** ラベルをグラデーション文字にする場合の from/to クラス */
  gradient?: string;
}

/** タブバーの並び順（表示可否は isDetailTabAvailable で判定） */
const TABS: readonly TabDef[] = [
  { id: 'details', label: '詳細', icon: MapPin },
  { id: 'fire', label: 'FIRE試算', icon: Coins, iconClassName: 'text-amber-500', gradient: 'from-amber-500 to-rose-500' },
  { id: 'multibase', label: '多拠点設計', icon: Calendar },
  { id: 'nomad', label: 'ノマドルート', icon: Globe, iconClassName: 'text-emerald-500', gradient: 'from-emerald-500 to-cyan-500' },
  { id: 'weights', label: '調整', icon: Sliders },
  { id: 'quiz', label: '診断', icon: HelpCircle },
  { id: 'ai', label: 'AI相談', icon: Brain },
  { id: 'keep', label: 'キープ', icon: Bookmark },
];

const TabFallback = () => (
  <div className="h-full flex items-center justify-center text-[10px] font-bold text-slate-400 dark:text-slate-500 animate-pulse">
    読み込み中...
  </div>
);

export const PrefectureDetailPanel: React.FC<PrefectureDetailPanelProps> = ({
  prefectures,
  weights,
  onWeightsChange,
  allPrefectures,
  onSelectPrefecture,
  keepList,
  onToggleKeep,
  currentMetric,
  activeTab,
  onActiveTabChange,
  unlockedAchievements,
  isRetroMode,
}) => {
  const prefecture = prefectures.length > 0 ? prefectures[0] : undefined;

  // タブを切り替えても保持したい状態はパネル本体が持つ
  const [quiz, setQuiz] = useState<QuizState>(INITIAL_QUIZ_STATE);
  const [compTab, setCompTab] = useState<ComparisonSubTab>('radar');
  const [aiAnswered, setAiAnswered] = useState<AiAnsweredKey | null>(null);
  // モーダルはタブ切替後も開いたままにするため本体で管理
  const [showBoardingPass, setShowBoardingPass] = useState(false);
  const [showBattleScreen, setShowBattleScreen] = useState(false);

  // タブガード: 選択県数に合わないタブを開いていたら移動する。
  // 親の state 更新は effect で行い、描画は同じ規則で解決したタブを即座に使う（空パネルのちらつき防止）
  const visibleTab = resolveDetailTab(activeTab, prefectures.length);
  useEffect(() => {
    if (visibleTab !== activeTab) onActiveTabChange(visibleTab);
  }, [visibleTab, activeTab, onActiveTabChange]);

  const renderActiveTab = () => {
    switch (visibleTab) {
      case 'details':
        return (
          <DetailsTab
            prefectures={prefectures}
            allPrefectures={allPrefectures}
            currentMetric={currentMetric}
            weights={weights}
            keepList={keepList}
            onToggleKeep={onToggleKeep}
            compTab={compTab}
            onCompTabChange={setCompTab}
            onStartBattle={() => setShowBattleScreen(true)}
          />
        );
      case 'weights':
        return <WeightConfigPanel weights={weights} onChange={onWeightsChange} />;
      case 'quiz':
        return (
          <QuizTab
            quiz={quiz}
            onQuizChange={setQuiz}
            allPrefectures={allPrefectures}
            weights={weights}
            onWeightsChange={onWeightsChange}
            onSelectPrefecture={onSelectPrefecture}
            keepList={keepList}
            onToggleKeep={onToggleKeep}
          />
        );
      case 'keep':
        return (
          <KeepTab
            keepList={keepList}
            onSelectPrefecture={onSelectPrefecture}
            onToggleKeep={onToggleKeep}
            unlockedAchievements={unlockedAchievements}
          />
        );
      case 'ai':
        return <AiTab prefecture={prefecture} weights={weights} answered={aiAnswered} onAnswered={setAiAnswered} />;
      case 'fire':
        return prefecture ? (
          <Suspense fallback={<TabFallback />}>
            <FireTab prefecture={prefecture} onDecide={() => setShowBoardingPass(true)} />
          </Suspense>
        ) : null;
      case 'nomad':
        return <NomadTab prefectures={prefectures} />;
      case 'multibase':
        return <MultibaseTab prefectures={prefectures} />;
    }
  };

  return (
    <div className="glass-neon-border rounded-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] h-full flex flex-col overflow-hidden transition-all duration-300">
      {/* タブヘッダー */}
      <div className="flex bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm border-b border-white/20 dark:border-indigo-500/20 px-4 pt-3 overflow-x-auto gap-1">
        {TABS.filter((tab) => isDetailTabAvailable(tab.id, prefectures.length)).map((tab) => {
          const Icon = tab.icon;
          const isActive = visibleTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onActiveTabChange(tab.id)}
              className={`pb-2.5 px-2 text-xs font-bold transition-all duration-300 relative flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <Icon className={tab.iconClassName ? `w-3.5 h-3.5 ${tab.iconClassName}` : 'w-3.5 h-3.5'} />
              <span className={tab.gradient ? `bg-clip-text text-transparent bg-gradient-to-r ${tab.gradient}` : undefined}>
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* タブコンテンツ */}
      <div className="flex-1 p-5 overflow-hidden">{renderActiveTab()}</div>

      {showBoardingPass && prefecture && (
        <Suspense fallback={<div />}>
          <UtopiaBoardingPass prefecture={prefecture} onClose={() => setShowBoardingPass(false)} />
        </Suspense>
      )}

      {showBattleScreen && prefectures.length >= 2 && (
        <Suspense fallback={<div />}>
          {isRetroMode ? (
            <RetroBattleScreen
              pref1={prefectures[0]}
              pref2={prefectures[1]}
              onClose={() => setShowBattleScreen(false)}
            />
          ) : (
            <VSBattleScreen
              pref1={prefectures[0]}
              pref2={prefectures[1]}
              onClose={() => setShowBattleScreen(false)}
            />
          )}
        </Suspense>
      )}
    </div>
  );
};
