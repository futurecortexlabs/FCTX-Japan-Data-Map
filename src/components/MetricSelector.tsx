import React, { useState } from 'react';
import { Coins, Users, Building2, Award, Coffee, Soup, Sparkles, Sun } from 'lucide-react';
import { type MetricType, type MetricConfig } from '../types/prefecture';

interface MetricSelectorProps {
  currentMetric: MetricType;
  onChange: (metric: MetricType) => void;
}

export const METRIC_CONFIGS: Record<MetricType, MetricConfig> = {
  totalScore: {
    key: 'totalScore',
    label: '総合スコア (移住ポテンシャル)',
    unit: '点',
    scoreKey: 'totalScore',
    category: 'basic',
  },
  landPrice: {
    key: 'landPrice',
    label: '住居費の安さ (平均地価)',
    unit: '円/㎡',
    scoreKey: 'landPriceScore',
    category: 'basic',
  },
  population: {
    key: 'population',
    label: '生活利便性 (人口規模)',
    unit: '人',
    scoreKey: 'populationScore',
    category: 'basic',
  },
  listedCompanies: {
    key: 'listedCompanies',
    label: '雇用の豊富さ (上場企業数)',
    unit: '社',
    scoreKey: 'listedCompanyScore',
    category: 'basic',
  },
  starbucksCount: {
    key: 'starbucksCount',
    label: 'カフェ充実度 (スタバ店舗数)',
    unit: '店舗',
    scoreKey: 'starbucksScore',
    category: 'lifestyle',
  },
  ramenCount: {
    key: 'ramenCount',
    label: 'グルメ充実度 (ラーメン店舗数)',
    unit: '店舗',
    scoreKey: 'ramenScore',
    category: 'lifestyle',
  },
  attractiveness: {
    key: 'attractiveness',
    label: '観光・レジャー魅力度',
    unit: '点',
    scoreKey: 'attractivenessScore',
    category: 'environment',
  },
  sunshineHours: {
    key: 'sunshineHours',
    label: '気候の快適さ (年間日照時間)',
    unit: '時間',
    scoreKey: 'sunshineHoursScore',
    category: 'environment',
  },
};

export const MetricSelector: React.FC<MetricSelectorProps> = ({
  currentMetric,
  onChange,
}) => {
  const initialCategory = METRIC_CONFIGS[currentMetric]?.category || 'basic';
  const [activeCategory, setActiveCategory] = useState<'basic' | 'lifestyle' | 'environment'>(initialCategory);


  const categories = [
    { key: 'basic' as const, label: '都市利便・雇用' },
    { key: 'lifestyle' as const, label: '食・カルチャー' },
    { key: 'environment' as const, label: 'レジャー・気候' },
  ];

  const items = [
    { key: 'totalScore' as MetricType, icon: Award, color: 'text-purple-600 dark:text-purple-400', activeBg: 'bg-purple-50 border-purple-200 dark:bg-purple-950/20 dark:border-purple-800' },
    { key: 'landPrice' as MetricType, icon: Coins, color: 'text-amber-600 dark:text-amber-400', activeBg: 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800' },
    { key: 'population' as MetricType, icon: Users, color: 'text-blue-600 dark:text-blue-400', activeBg: 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800' },
    { key: 'listedCompanies' as MetricType, icon: Building2, color: 'text-emerald-600 dark:text-emerald-400', activeBg: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800' },
    { key: 'starbucksCount' as MetricType, icon: Coffee, color: 'text-green-600 dark:text-green-400', activeBg: 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800' },
    { key: 'ramenCount' as MetricType, icon: Soup, color: 'text-orange-600 dark:text-orange-400', activeBg: 'bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800' },
    { key: 'attractiveness' as MetricType, icon: Sparkles, color: 'text-rose-600 dark:text-rose-400', activeBg: 'bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-800' },
    { key: 'sunshineHours' as MetricType, icon: Sun, color: 'text-yellow-600 dark:text-yellow-400', activeBg: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800' },
  ];

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-800/50 flex flex-col gap-3.5">
      <div>
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
          可視化指標の選択
        </span>
        
        {/* モバイル/ナロー幅向け カテゴリセレクターのタブ */}
        <div className="flex border-b border-slate-100 dark:border-slate-800/80 pb-0.5 gap-3.5 w-full overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
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
                key={item.key}
                onClick={() => onChange(item.key)}
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
