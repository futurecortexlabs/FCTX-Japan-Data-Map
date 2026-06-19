import React, { useState } from 'react';
import { MapPin, Coins, Users, Building2, Award, Coffee, Soup, Sparkles, Sun, Sliders, Globe } from 'lucide-react';
import { type PrefectureData, type MetricWeights } from '../types/prefecture';
import { WeightConfigPanel } from './WeightConfigPanel';

interface PrefectureDetailPanelProps {
  prefecture?: PrefectureData;
  weights: MetricWeights;
  onWeightsChange: (weights: MetricWeights) => void;
}

export const PrefectureDetailPanel: React.FC<PrefectureDetailPanelProps> = ({
  prefecture,
  weights,
  onWeightsChange,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'weights'>('details');

  const formatValue = (val?: number, unit?: string, isPopulation = false) => {
    if (val === undefined || isNaN(val)) return 'データ未登録';
    if (isPopulation) {
      if (val >= 10000) {
        return `${(val / 10000).toLocaleString(undefined, { maximumFractionDigits: 1 })} 万人 (${val.toLocaleString()} 人)`;
      }
      return `${val.toLocaleString()} 人`;
    }
    return `${val.toLocaleString()} ${unit}`;
  };

  const getProgressWidth = (score?: number) => {
    if (score === undefined || isNaN(score)) return 0;
    const min = 30;
    const max = 70;
    const clamped = Math.max(min, Math.min(max, score));
    return ((clamped - min) / (max - min)) * 100;
  };

  // 1. 都市基礎スペック (固定ウェイト計算対象)
  const basicMetrics = prefecture
    ? [
        {
          label: '住居費の安さ',
          value: formatValue(prefecture.landPrice, '円/㎡'),
          score: prefecture.landPriceScore,
          icon: Coins,
          color: 'bg-amber-500',
          textColor: 'text-amber-500',
          bgColor: 'bg-amber-50 dark:bg-amber-950/10',
          borderColor: 'border-amber-100 dark:border-amber-900/20',
        },
        {
          label: '生活利便性',
          value: formatValue(prefecture.population, '人', true),
          score: prefecture.populationScore,
          icon: Users,
          color: 'bg-blue-500',
          textColor: 'text-blue-500',
          bgColor: 'bg-blue-50 dark:bg-blue-950/10',
          borderColor: 'border-blue-100 dark:border-blue-900/20',
        },
        {
          label: '雇用の豊富さ',
          value: formatValue(prefecture.listedCompanies, '社'),
          score: prefecture.listedCompanyScore,
          icon: Building2,
          color: 'bg-emerald-500',
          textColor: 'text-emerald-500',
          bgColor: 'bg-emerald-50 dark:bg-emerald-950/10',
          borderColor: 'border-emerald-100 dark:border-emerald-900/20',
        },
      ]
    : [];

  // 2. ライフスタイル・環境個性 (ユーザーウェイト可変)
  const lifestyleMetrics = prefecture
    ? [
        {
          label: 'カフェ充実度',
          value: formatValue(prefecture.starbucksCount, '店舗'),
          score: prefecture.starbucksScore,
          icon: Coffee,
          color: 'bg-green-600',
          textColor: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-50 dark:bg-green-950/10',
          borderColor: 'border-green-100 dark:border-green-900/20',
        },
        {
          label: 'グルメ充実度',
          value: formatValue(prefecture.ramenCount, '店舗'),
          score: prefecture.ramenScore,
          icon: Soup,
          color: 'bg-orange-500',
          textColor: 'text-orange-500',
          bgColor: 'bg-orange-50 dark:bg-orange-950/10',
          borderColor: 'border-orange-100 dark:border-orange-900/20',
        },
        {
          label: '観光・レジャー魅力度',
          value: formatValue(prefecture.attractiveness, '点'),
          score: prefecture.attractivenessScore,
          icon: Sparkles,
          color: 'bg-rose-500',
          textColor: 'text-rose-500',
          bgColor: 'bg-rose-50 dark:bg-rose-950/10',
          borderColor: 'border-rose-100 dark:border-rose-900/20',
        },
        {
          label: '気候の快適さ',
          value: formatValue(prefecture.sunshineHours, '時間'),
          score: prefecture.sunshineHoursScore,
          icon: Sun,
          color: 'bg-yellow-500',
          textColor: 'text-yellow-500',
          bgColor: 'bg-yellow-50 dark:bg-yellow-950/10',
          borderColor: 'border-yellow-100 dark:border-yellow-900/20',
        },
      ]
    : [];

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-800/50 h-full flex flex-col overflow-hidden">
      {/* タブヘッダー */}
      <div className="flex bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200/40 dark:border-slate-800/40 px-4 pt-3">
        <button
          onClick={() => setActiveTab('details')}
          className={`flex-1 pb-2.5 text-xs font-bold transition-all duration-300 relative flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'details'
              ? 'text-indigo-600 dark:text-indigo-400'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>都道府県詳細</span>
          {activeTab === 'details' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('weights')}
          className={`flex-1 pb-2.5 text-xs font-bold transition-all duration-300 relative flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'weights'
              ? 'text-indigo-600 dark:text-indigo-400'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>重み設定 (個性)</span>
          {activeTab === 'weights' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
          )}
        </button>
      </div>

      {/* タブコンテンツ */}
      <div className="flex-1 p-5 overflow-hidden">
        {activeTab === 'details' ? (
          prefecture ? (
            <div className="flex flex-col gap-4 h-full">
              {/* ヘッダー部分 */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                    CODE: {String(prefecture.prefCode).padStart(2, '0')} | {prefecture.year}年
                  </span>
                  <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-5 h-5 text-rose-500" />
                    {prefecture.prefName}
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
                    {basicMetrics.map((m, idx) => {
                      const Icon = m.icon;
                      const scorePercent = getProgressWidth(m.score);
                      return (
                        <div key={idx} className={`p-2.5 rounded-lg border ${m.bgColor} ${m.borderColor} flex flex-col gap-1.5`}>
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5">
                              <span className={`p-0.5 rounded ${m.textColor}`}>
                                <Icon className="w-3.5 h-3.5" />
                              </span>
                              <span className="font-semibold text-slate-700 dark:text-slate-300">{m.label}</span>
                            </div>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{m.value}</span>
                          </div>
                          {m.score !== undefined && !isNaN(m.score) && (
                            <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div className={`h-full ${m.color} rounded-full`} style={{ width: `${scorePercent}%` }} />
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
                    {lifestyleMetrics.map((m, idx) => {
                      const Icon = m.icon;
                      const scorePercent = getProgressWidth(m.score);

                      return (
                        <div
                          key={idx}
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
                            {m.score !== undefined && !isNaN(m.score) && (
                              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-white/80 dark:bg-slate-900/60 px-1.5 py-0.5 rounded shadow-sm">
                                偏差値: {m.score.toFixed(1)}
                              </span>
                            )}
                          </div>

                          <div className="flex justify-between items-baseline min-w-0">
                            <p className="text-base font-black text-slate-800 dark:text-white leading-tight truncate">
                              {m.value}
                            </p>
                          </div>

                          {m.score !== undefined && !isNaN(m.score) && (
                            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden relative">
                              <div
                                className={`h-full ${m.color} rounded-full`}
                                style={{ width: `${scorePercent}%` }}
                              />
                              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-400 dark:bg-slate-500 opacity-40" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <MapPin className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-2 animate-bounce" />
              <h3 className="text-slate-700 dark:text-slate-300 font-bold mb-1">都道府県を選択してください</h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 max-w-[200px]">
                地図上をクリックするか、ランキングから選択すると詳細が表示されます。
              </p>
            </div>
          )
        ) : (
          <WeightConfigPanel weights={weights} onChange={onWeightsChange} />
        )}
      </div>
    </div>
  );
};
