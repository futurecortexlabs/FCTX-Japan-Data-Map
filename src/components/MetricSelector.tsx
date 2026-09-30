import React, { useState } from 'react';
import { Coins, Users, Building2, Award, Coffee, Soup, Sparkles, Sun, Flame, Activity, Wind, Heart } from 'lucide-react';
import type { MetricType } from '../types/prefecture';
import { METRIC_CONFIGS } from '../constants/metrics';

interface MetricSelectorProps {
  currentMetric: MetricType;
  onChange: (metric: MetricType) => void;
}



export const MetricSelector: React.FC<MetricSelectorProps> = ({
  currentMetric,
  onChange,
}) => {
  const initialCategory = METRIC_CONFIGS[currentMetric]?.category || 'basic';
  const [activeCategory, setActiveCategory] = useState<'basic' | 'lifestyle' | 'environment'>(initialCategory);


  const categories = [
    { key: 'basic' as const, label: '都市利便・雇用・生活' },
    { key: 'lifestyle' as const, label: '食・温泉・カルチャー' },
    { key: 'environment' as const, label: 'レジャー・気候・環境' },
  ];

  const items = [
    { key: 'totalScore' as MetricType, icon: Award, color: 'text-purple-600 dark:text-purple-400', activeBg: 'bg-purple-50 border-purple-200 dark:bg-purple-950/20 dark:border-purple-800' },
    { key: 'landPrice' as MetricType, icon: Coins, color: 'text-amber-600 dark:text-amber-400', activeBg: 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800' },
    { key: 'population' as MetricType, icon: Users, color: 'text-blue-600 dark:text-blue-400', activeBg: 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800' },
    { key: 'listedCompanies' as MetricType, icon: Building2, color: 'text-emerald-600 dark:text-emerald-400', activeBg: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800' },
    { key: 'hospitalCount' as MetricType, icon: Activity, color: 'text-cyan-600 dark:text-cyan-400', activeBg: 'bg-cyan-50 border-cyan-200 dark:bg-cyan-950/20 dark:border-cyan-800' },
    { key: 'childcareScore' as MetricType, icon: Heart, color: 'text-pink-600 dark:text-pink-400', activeBg: 'bg-pink-50 border-pink-200 dark:bg-pink-950/20 dark:border-pink-800' },
    { key: 'starbucksCount' as MetricType, icon: Coffee, color: 'text-green-600 dark:text-green-400', activeBg: 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800' },
    { key: 'ramenCount' as MetricType, icon: Soup, color: 'text-orange-600 dark:text-orange-400', activeBg: 'bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800' },
    { key: 'onsenCount' as MetricType, icon: Flame, color: 'text-red-500 dark:text-red-400', activeBg: 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800' },
    { key: 'attractiveness' as MetricType, icon: Sparkles, color: 'text-rose-600 dark:text-rose-400', activeBg: 'bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-800' },
    { key: 'sunshineHours' as MetricType, icon: Sun, color: 'text-yellow-600 dark:text-yellow-400', activeBg: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800' },
    { key: 'pollenLevel' as MetricType, icon: Wind, color: 'text-teal-600 dark:text-teal-400', activeBg: 'bg-teal-50 border-teal-200 dark:bg-teal-950/20 dark:border-teal-800' },
  ];

  return (
    <div className="glass-neon-border p-4 rounded-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] flex flex-col gap-3.5 transition-all duration-300">
      <div>
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
          可視化指標の選択
        </span>
        
        {/* モバイル/ナロー幅向け カテゴリセレクターのタブ */}
        <div className="flex border-b border-slate-100 dark:border-slate-800/80 pb-0.5 gap-3.5 w-full overflow-x-auto">
          {categories.map((cat) => (
            <button
              type="button"
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              aria-pressed={activeCategory === cat.key}
              className={`pb-1.5 text-xs font-black transition-all duration-300 relative cursor-pointer whitespace-nowrap ${
                activeCategory === cat.key
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              {cat.label}
              {activeCategory === cat.key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 指標ボタンリスト（左カラム幅にスッキリ収まるように1カラム縦積み） */}
      <div className="flex flex-col gap-1.5">
        {items
          .filter((item) => METRIC_CONFIGS[item.key].category === activeCategory)
          .map((item) => {
            const config = METRIC_CONFIGS[item.key];
            const Icon = item.icon;
            const isActive = currentMetric === item.key;

            return (
              <button
                type="button"
                key={item.key}
                onClick={() => onChange(item.key)}
                aria-pressed={currentMetric === item.key}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-xs font-bold transition-all duration-300 cursor-pointer ${
                  isActive
                    ? `${item.activeBg} text-indigo-700 dark:text-indigo-400 shadow-sm border-indigo-200/50 dark:border-indigo-800/50`
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/30'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`p-1.5 rounded shrink-0 ${isActive ? 'bg-white dark:bg-slate-800 shadow-sm' : 'bg-slate-100 dark:bg-slate-800'}`}>
                    <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                  </span>
                  <span className="truncate">{config.label}</span>
                </div>
                {isActive && (
                  <span className="text-[10px] bg-indigo-600 dark:bg-indigo-400 text-white dark:text-slate-900 px-1.5 py-0.5 rounded font-black tracking-wider uppercase scale-90">
                    Active
                  </span>
                )}
              </button>
            );
          })}
      </div>
    </div>
  );
};
