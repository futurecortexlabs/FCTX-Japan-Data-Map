import { MapPin, Coins, Users, Building2, Award, Coffee, Soup, Sparkles, Sun, Globe, Heart, Flame, Bookmark, Wind, Activity, type LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import type { MetricType, MetricWeights, PrefectureData } from '../../types/prefecture';
import type { KeepItem } from '../../types/ui';
import { generatePrefectureCatchphrase } from '../../utils/catchphrase';
import { classifyPersonality } from '../../utils/personality';
import { confetti } from '../../utils/confetti';
import { ComparisonDetails, type ComparisonSubTab } from './ComparisonDetails';
import { TrendLineChart } from './TrendLineChart';
import { downloadUtopiaCertificate } from './certificate';
import { formatDetailValue, scoreToProgressWidth } from './logic';

interface MetricRowDef {
  label: string;
  valueKey: keyof PrefectureData;
  unit: string;
  isPopulation?: boolean;
  scoreKey: keyof PrefectureData;
  icon: LucideIcon;
  color: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
}

/** 1. 都市基礎スペック (固定ウェイト計算対象) */
const BASIC_METRICS: readonly MetricRowDef[] = [
  {
    label: '住居費の安さ',
    valueKey: 'landPrice',
    unit: '円/㎡',
    scoreKey: 'landPriceScore',
    icon: Coins,
    color: 'bg-amber-500',
    textColor: 'text-amber-500',
    bgColor: 'bg-amber-50 dark:bg-amber-950/10',
    borderColor: 'border-amber-100 dark:border-amber-900/20',
  },
  {
    label: '生活利便性',
    valueKey: 'population',
    unit: '人',
    isPopulation: true,
    scoreKey: 'populationScore',
    icon: Users,
    color: 'bg-blue-500',
    textColor: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950/10',
    borderColor: 'border-blue-100 dark:border-blue-900/20',
  },
  {
    label: '雇用の豊富さ',
    valueKey: 'listedCompanies',
    unit: '社',
    scoreKey: 'listedCompanyScore',
    icon: Building2,
    color: 'bg-emerald-500',
    textColor: 'text-emerald-500',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/10',
    borderColor: 'border-emerald-100 dark:border-emerald-900/20',
  },
  {
    label: '医療充実度',
    valueKey: 'hospitalCount',
    unit: '施設',
    scoreKey: 'hospitalScore',
    icon: Activity,
    color: 'bg-cyan-500',
    textColor: 'text-cyan-600',
    bgColor: 'bg-cyan-50 dark:bg-cyan-950/10',
    borderColor: 'border-cyan-100 dark:border-cyan-900/20',
  },
  {
    label: '子育て環境',
    valueKey: 'childcareScore',
    unit: '点',
    scoreKey: 'childcareScoreScore',
    icon: Heart,
    color: 'bg-pink-500',
    textColor: 'text-pink-600 dark:text-pink-400',
    bgColor: 'bg-pink-50 dark:bg-pink-950/10',
    borderColor: 'border-pink-100 dark:border-pink-900/20',
  },
];

/** 2. ライフスタイル・環境個性 (ユーザーウェイト可変) */
const LIFESTYLE_METRICS: readonly MetricRowDef[] = [
  {
    label: 'カフェ充実度',
    valueKey: 'starbucksCount',
    unit: '店舗',
    scoreKey: 'starbucksScore',
    icon: Coffee,
    color: 'bg-green-600',
    textColor: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/10',
    borderColor: 'border-green-100 dark:border-green-900/20',
  },
  {
    label: 'グルメ充実度',
    valueKey: 'ramenCount',
    unit: '店舗',
    scoreKey: 'ramenScore',
    icon: Soup,
    color: 'bg-orange-500',
    textColor: 'text-orange-500',
    bgColor: 'bg-orange-50 dark:bg-orange-950/10',
    borderColor: 'border-orange-100 dark:border-orange-900/20',
  },
  {
    label: '温泉の多さ',
    valueKey: 'onsenCount',
    unit: '箇所',
    scoreKey: 'onsenScore',
    icon: Flame,
    color: 'bg-red-500',
    textColor: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/10',
    borderColor: 'border-red-100 dark:border-red-900/20',
  },
  {
    label: '観光・レジャー魅力度',
    valueKey: 'attractiveness',
    unit: '点',
    scoreKey: 'attractivenessScore',
    icon: Sparkles,
    color: 'bg-rose-500',
    textColor: 'text-rose-500',
    bgColor: 'bg-rose-50 dark:bg-rose-950/10',
    borderColor: 'border-rose-100 dark:border-rose-900/20',
  },
  {
    label: '気候の快適さ',
    valueKey: 'sunshineHours',
    unit: '時間',
    scoreKey: 'sunshineHoursScore',
    icon: Sun,
    color: 'bg-yellow-500',
    textColor: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/10',
    borderColor: 'border-yellow-100 dark:border-yellow-900/20',
  },
  {
    label: '花粉の少なさ',
    valueKey: 'pollenLevel',
    unit: 'クラス',
    scoreKey: 'pollenScore',
    icon: Wind,
    color: 'bg-teal-500',
    textColor: 'text-teal-700',
    bgColor: 'bg-teal-50 dark:bg-teal-950/10',
    borderColor: 'border-teal-100 dark:border-teal-900/20',
  },
];

const numericField = (pref: PrefectureData, key: keyof PrefectureData): number | undefined => {
  const v = pref[key];
  return typeof v === 'number' ? v : undefined;
};

const isValidScore = (score: number | undefined): score is number => score !== undefined && !isNaN(score);

interface DetailsTabProps {
  prefectures: PrefectureData[];
  allPrefectures: PrefectureData[];
  currentMetric: MetricType;
  weights: MetricWeights;
  keepList: KeepItem[];
  onToggleKeep: (prefCode: number, prefName: string, year: number) => void;
  compTab: ComparisonSubTab;
  onCompTabChange: (tab: ComparisonSubTab) => void;
  onStartBattle: () => void;
}

/** 「詳細」タブ: 2県選択時は比較ビュー、1県以上なら先頭県の詳細、未選択時は案内を表示 */
export const DetailsTab: React.FC<DetailsTabProps> = ({
  prefectures,
  allPrefectures,
  currentMetric,
  weights,
  keepList,
  onToggleKeep,
  compTab,
  onCompTabChange,
  onStartBattle,
}) => {
  if (prefectures.length === 2) {
    return (
      <ComparisonDetails
        pref1={prefectures[0]}
        pref2={prefectures[1]}
        allPrefectures={allPrefectures}
        currentMetric={currentMetric}
        compTab={compTab}
        onCompTabChange={onCompTabChange}
        onStartBattle={onStartBattle}
      />
    );
  }

  const prefecture = prefectures[0];
  if (!prefecture) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center">
        <MapPin className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-2 animate-bounce" />
        <h3 className="text-slate-700 dark:text-slate-300 font-bold mb-1">都道府県を選択してください</h3>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 max-w-[200px]">
          地図上をクリックするか、ランキングから選択すると詳細が表示されます。
        </p>
      </div>
    );
  }

  const catchphrase = generatePrefectureCatchphrase(prefecture);
  const isKept = keepList.some((item) => item.prefCode === prefecture.prefCode && item.year === prefecture.year);
  const style = classifyPersonality(weights, prefecture);

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* ヘッダー部分 */}
      <div className="flex flex-col border-b border-slate-100 dark:border-slate-800/80 pb-3 gap-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                CODE: {String(prefecture.prefCode).padStart(2, '0')} | {prefecture.year}年
              </span>
              <span className={`px-1 py-0.5 rounded text-[8px] font-black tracking-wider ${
                catchphrase.rarity === 'SSR'
                  ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20 dark:text-amber-400'
                  : catchphrase.rarity === 'SR'
                  ? 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 dark:text-indigo-400'
                  : 'bg-slate-500/10 text-slate-500 border border-slate-500/20 dark:text-slate-400'
              }`}>
                {catchphrase.rarity}
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-1.5 mt-0.5">
              <MapPin className="w-5 h-5 text-rose-500" />
              {prefecture.prefName}
              <motion.button
                whileHover={{ scale: 1.15, rotate: 10 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  onToggleKeep(prefecture.prefCode, prefecture.prefName, prefecture.year);
                  if (!isKept) {
                    confetti({
                      particleCount: 30,
                      spread: 40,
                      origin: { y: 0.5 },
                      colors: ['#f59e0b', '#fbbf24', '#fef3c7'],
                      ticks: 50,
                    });
                  }
                }}
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800/40 text-slate-400 hover:text-amber-500 transition-all cursor-pointer flex items-center justify-center"
                title={isKept ? 'キープリストから削除' : 'キープリストに追加'}
              >
                <Bookmark className={`w-4 h-4 transition-all duration-300 ${isKept ? 'fill-amber-500 text-amber-500 scale-110' : 'text-slate-400 dark:text-slate-500'}`} />
              </motion.button>

              <button
                onClick={() => downloadUtopiaCertificate(prefecture, weights)}
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800/40 text-slate-400 hover:text-indigo-500 transition-all cursor-pointer flex items-center justify-center ml-0.5"
                title="移住認定証（PNG画像）を保存"
              >
                <Sparkles className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
              </button>
            </h2>
          </div>

          <div className="text-right">
            <div className="flex items-center gap-1 justify-end text-[10px] font-bold text-purple-600 dark:text-purple-400">
              <Award className="w-3.5 h-3.5" />
              <span>総合スコア</span>
            </div>
            <div className="text-2xl font-black text-purple-700 dark:text-purple-400 tracking-tight leading-none mt-1">
              {prefecture.totalScore !== undefined && !isNaN(prefecture.totalScore)
                ? prefecture.totalScore.toFixed(1)
                : '-'}
              <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 ml-0.5">点</span>
            </div>
          </div>
        </div>

        <div className="px-2.5 py-1.5 bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200/40 dark:border-slate-800/40 rounded-xl flex flex-col gap-1.5">
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-normal italic text-left">
            " {catchphrase.text} "
          </p>
          <div className="text-[9px] text-slate-400 dark:text-slate-600 border-t border-slate-200/30 dark:border-slate-800/40 pt-1 text-left flex items-start gap-1 font-semibold leading-relaxed">
            <span className="shrink-0 text-amber-500">💡</span>
            <span>{catchphrase.advice}</span>
          </div>
        </div>

        {/* 移住スタイルバッジ */}
        <div className="flex items-center gap-1.5 bg-indigo-50/30 dark:bg-indigo-950/15 border border-indigo-100/20 dark:border-indigo-900/20 px-2.5 py-1.5 rounded-xl w-fit shrink-0 mt-1">
          <span className="text-sm select-none">{style.emoji}</span>
          <span className="text-[10px] font-black text-indigo-700 dark:text-indigo-400">
            移住スタイル: {style.name}
          </span>
        </div>
      </div>

      {/* グループ分けリスト（スクロール可能） */}
      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-5">
        {/* A. 都市の基礎スペック */}
        <div className="space-y-2">
          <div className="flex justify-between items-center px-1">
            <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Globe className="w-3 h-3 text-slate-400" />
              基本生活スペック (固定割合ベース)
            </span>
            {prefecture.baseUrbanScore !== undefined && (
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 px-1.5 py-0.5 rounded">
                基本生活力: {prefecture.baseUrbanScore.toFixed(1)}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {BASIC_METRICS.map((m) => {
              const Icon = m.icon;
              const score = numericField(prefecture, m.scoreKey);
              return (
                <div key={m.label} className={`p-2.5 rounded-lg border ${m.bgColor} ${m.borderColor} flex flex-col gap-1.5`}>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className={`p-0.5 rounded ${m.textColor}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{m.label}</span>
                    </div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {formatDetailValue(numericField(prefecture, m.valueKey), m.unit, m.isPopulation)}
                    </span>
                  </div>
                  {isValidScore(score) && (
                    <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full ${m.color} rounded-full`} style={{ width: `${scoreToProgressWidth(score)}%` }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* B. ライフスタイル・環境個性 */}
        <div className="space-y-2">
          <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block px-1">
            食・レジャー・気候個性 (ウェイト可変)
          </span>

          <div className="flex flex-col gap-2.5">
            {LIFESTYLE_METRICS.map((m) => {
              const Icon = m.icon;
              const score = numericField(prefecture, m.scoreKey);
              return (
                <div
                  key={m.label}
                  className={`p-3 rounded-lg border ${m.bgColor} ${m.borderColor} flex flex-col gap-2 transition-all duration-200 hover:shadow-sm`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`p-1 rounded bg-white dark:bg-slate-900 shadow-sm ${m.textColor}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {m.label}
                      </span>
                    </div>
                    {isValidScore(score) && (
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-white/80 dark:bg-slate-900/60 px-1.5 py-0.5 rounded shadow-sm">
                        偏差値: {score.toFixed(1)}
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-baseline min-w-0">
                    <p className="text-base font-black text-slate-800 dark:text-white leading-tight truncate">
                      {formatDetailValue(numericField(prefecture, m.valueKey), m.unit, m.isPopulation)}
                    </p>
                  </div>

                  {isValidScore(score) && (
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden relative">
                      <div className={`h-full ${m.color} rounded-full`} style={{ width: `${scoreToProgressWidth(score)}%` }} />
                      <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-400 dark:bg-slate-500 opacity-40" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 25年時系列推移折れ線グラフ */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/40">
          <TrendLineChart
            prefCodes={prefectures.map((p) => p.prefCode)}
            allPrefectures={allPrefectures}
            currentMetric={currentMetric}
          />
        </div>
      </div>
    </div>
  );
};
