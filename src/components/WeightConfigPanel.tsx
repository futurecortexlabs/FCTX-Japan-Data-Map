import React from 'react';
import { RefreshCw, Zap, Building, Heart, Sun, type LucideIcon } from 'lucide-react';
import type { MetricWeights } from '../types/prefecture';

interface WeightConfigPanelProps {
  weights: MetricWeights;
  onChange: (weights: MetricWeights) => void;
}

interface WeightPreset {
  label: string;
  icon: LucideIcon;
  desc: string;
  weights: MetricWeights;
}

const PRESETS: WeightPreset[] = [
  {
    label: '都会利便性＆仕事重視',
    icon: Building,
    desc: '生活利便性や医療環境の多さを最優先し、カルチャー・レジャー指標のウェイトを0にした都市型移住プラン',
    weights: {
      starbucksCount: 0,
      ramenCount: 0,
      attractiveness: 0,
      sunshineHours: 0,
      onsenCount: 0,
      hospitalCount: 50,
      pollenLevel: 0,
      childcareScore: 50,
    },
  },
  {
    label: 'カルチャー＆グルメ移住',
    icon: Zap,
    desc: 'カフェやラーメン、名物温泉など、ローカルでの豊かな暮らしと食文化を最優先するライフスタイルプラン',
    weights: {
      starbucksCount: 40,
      ramenCount: 40,
      attractiveness: 0,
      sunshineHours: 0,
      onsenCount: 20,
      hospitalCount: 0,
      pollenLevel: 0,
      childcareScore: 0,
    },
  },
  {
    label: 'リゾート＆スローライフ',
    icon: Sun,
    desc: '年間を通した晴天率（日照時間）や花粉の少なさ、観光地としての楽しさを重視した快適なスローライフプラン',
    weights: {
      starbucksCount: 0,
      ramenCount: 0,
      attractiveness: 30,
      sunshineHours: 35,
      onsenCount: 0,
      hospitalCount: 0,
      pollenLevel: 35,
      childcareScore: 0,
    },
  },
  {
    label: '理想のライフバランス',
    icon: Heart,
    desc: '都市スペック（仕事・医療・子育て）を確保しつつ、食・レジャー・環境も均等に楽しむ欲張りプラン',
    weights: {
      starbucksCount: 15,
      ramenCount: 15,
      attractiveness: 15,
      sunshineHours: 15,
      onsenCount: 10,
      hospitalCount: 10,
      pollenLevel: 10,
      childcareScore: 10,
    },
  },
];

export const WeightConfigPanel: React.FC<WeightConfigPanelProps> = ({
  weights,
  onChange,
}) => {
  // 基礎都市力のウェイト 30 をベースに含める
  const totalWeight = 30 + Object.values(weights).reduce((sum, val) => sum + val, 0);

  const handleSliderChange = (key: keyof MetricWeights, val: number) => {
    onChange({
      ...weights,
      [key]: val,
    });
  };

  const handleReset = () => {
    onChange({
      starbucksCount: 0,
      ramenCount: 0,
      attractiveness: 0,
      sunshineHours: 0,
      onsenCount: 0,
      hospitalCount: 0,
      pollenLevel: 0,
      childcareScore: 0,
    });
  };

  // 各指標の％シェアを計算 (基礎都市力 30% も含めた合計から算出)
  const getSharePercent = (weight: number) => {
    if (totalWeight === 0) return 0;
    return Math.round((weight / totalWeight) * 100);
  };

  const sliders: { key: keyof MetricWeights; label: string; color: string }[] = [
    { key: 'starbucksCount', label: 'カフェ充実度', color: 'accent-green-600' },
    { key: 'ramenCount', label: 'グルメ充実度', color: 'accent-orange-500' },
    { key: 'onsenCount', label: '温泉の多さ', color: 'accent-red-500' },
    { key: 'attractiveness', label: '観光・レジャー魅力度', color: 'accent-rose-500' },
    { key: 'sunshineHours', label: '気候の快適さ', color: 'accent-yellow-500' },
    { key: 'pollenLevel', label: '花粉の少なさ', color: 'accent-teal-600' },
    { key: 'hospitalCount', label: '医療機関数', color: 'accent-cyan-600' },
    { key: 'childcareScore', label: '子育てしやすさ', color: 'accent-pink-600' },
  ];

  return (
    <div className="flex flex-col gap-5 h-full text-slate-800 dark:text-slate-200">
      {/* プリセット選択 */}
      <div>
        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 block mb-2 uppercase tracking-wider">
          おすすめプリセット
        </span>
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((preset, idx) => {
            const Icon = preset.icon;
            return (
              <button
                key={idx}
                onClick={() => onChange(preset.weights)}
                className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/10 hover:border-indigo-500/30 text-left transition-all duration-300 cursor-pointer"
                title={preset.desc}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 dark:text-white">
                  <Icon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>{preset.label}</span>
                </div>
                <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 line-clamp-1">
                  {preset.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* スライダーグループ */}
      <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1">
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/80 pb-2">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            個性・ライフスタイル重み調整
          </span>
          <button
            onClick={handleReset}
            className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            リセット
          </button>
        </div>

        {/* 固定基礎都市力のインフォカード */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800/60 rounded-lg flex justify-between items-center text-xs">
          <div className="space-y-0.5">
            <span className="font-bold text-slate-700 dark:text-slate-300 block">基本生活スペック (固定ベース)</span>
            <span className="text-[10px] text-slate-400">住居費安さ・利便性・求人</span>
          </div>
          <span className="font-bold text-slate-700 dark:text-slate-300 tabular-nums">
            30 <span className="text-[10px] text-slate-400 font-normal">({getSharePercent(30)}%)</span>
          </span>
        </div>

        {/* カスタムスライダー */}
        {sliders.map((s) => {
          const wValue = weights[s.key];
          const share = getSharePercent(wValue);

          return (
            <div key={s.key} className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>{s.label}</span>
                <span className="tabular-nums font-bold">
                  {wValue} <span className="text-[10px] text-slate-400 font-normal">({share}%)</span>
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={wValue}
                  onChange={(e) => handleSliderChange(s.key, Number(e.target.value))}
                  className={`w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer ${s.color}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
