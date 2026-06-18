import React from 'react';
import { RefreshCw, Zap, Building, Heart, Sun } from 'lucide-react';
import type { MetricWeights } from '../types/prefecture';

interface WeightConfigPanelProps {
  weights: MetricWeights;
  onChange: (weights: MetricWeights) => void;
}

export const PRESETS: { label: string; icon: any; desc: string; weights: MetricWeights }[] = [
  {
    label: '都会スペック重視',
    icon: Building,
    desc: 'スタバなどのユニーク指標を0にし、基礎都市力（地価・人口・企業数）100%のランキングを表示',
    weights: {
      starbucksCount: 0,
      ramenCount: 0,
      attractiveness: 0,
      sunshineHours: 0,
    },
  },
  {
    label: 'カルチャー・食重視',
    icon: Zap,
    desc: 'スターバックスやラーメン店舗数の比重を最大化し、ライフスタイルに特化したランキングを表示',
    weights: {
      starbucksCount: 50,
      ramenCount: 50,
      attractiveness: 0,
      sunshineHours: 0,
    },
  },
  {
    label: '観光・環境重視',
    icon: Sun,
    desc: '地域の魅力度と日照時間（晴れやすさ）を重視した、観光・移住検討ランキング',
    weights: {
      starbucksCount: 0,
      ramenCount: 0,
      attractiveness: 60,
      sunshineHours: 40,
    },
  },
  {
    label: 'ライフバランス',
    icon: Heart,
    desc: '基礎都市力をベースにしつつ、カルチャー・気候などの個性も均等に配分したランキング',
    weights: {
      starbucksCount: 25,
      ramenCount: 25,
      attractiveness: 25,
      sunshineHours: 25,
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
    });
  };

  // 各指標の％シェアを計算 (基礎都市力 30% も含めた合計から算出)
  const getSharePercent = (weight: number) => {
    if (totalWeight === 0) return 0;
    return Math.round((weight / totalWeight) * 100);
  };

  const sliders: { key: keyof MetricWeights; label: string; color: string }[] = [
    { key: 'starbucksCount', label: 'スタバ店舗数', color: 'accent-green-600' },
    { key: 'ramenCount', label: 'ラーメン店舗数', color: 'accent-orange-500' },
    { key: 'attractiveness', label: '魅力度スコア', color: 'accent-rose-500' },
    { key: 'sunshineHours', label: '年間日照時間', color: 'accent-yellow-500' },
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
            <span className="font-bold text-slate-700 dark:text-slate-300 block">基礎都市力 (固定ベース)</span>
            <span className="text-[10px] text-slate-400">平均地価・人口・上場企業数</span>
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
