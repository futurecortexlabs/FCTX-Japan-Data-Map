import React, { useState } from 'react';
import { Trophy, Search } from 'lucide-react';
import { type PrefectureData, type MetricType } from '../types/prefecture';
import { METRIC_CONFIGS } from './MetricSelector';

interface RankingTableProps {
  data: PrefectureData[];
  currentMetric: MetricType;
  selectedPrefCode?: number;
  onSelectPrefecture: (prefCode: number) => void;
}

export const RankingTable: React.FC<RankingTableProps> = ({
  data,
  currentMetric,
  selectedPrefCode,
  onSelectPrefecture,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const config = METRIC_CONFIGS[currentMetric];

  // データのソート
  const sortedData = [...data].sort((a, b) => {
    const aVal = a[currentMetric];
    const bVal = b[currentMetric];
    if (aVal === undefined) return 1;
    if (bVal === undefined) return -1;
    return (bVal as number) - (aVal as number);
  });

  // 検索フィルタ
  const filteredData = sortedData.filter((pref) =>
    pref.prefName.includes(searchQuery)
  );

  const formatValue = (val?: number) => {
    if (val === undefined || isNaN(val)) return '-';
    
    // 省スペース表示のため、人口は万人単位を優先
    if (currentMetric === 'population') {
      return `${(val / 10000).toLocaleString(undefined, { maximumFractionDigits: 1 })}万`;
    }
    // 地価は千円単位などを優先
    if (currentMetric === 'landPrice') {
      if (val >= 10000) {
        return `${(val / 10000).toLocaleString(undefined, { maximumFractionDigits: 1 })}万`;
      }
    }
    return val.toLocaleString();
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <span className="flex items-center justify-center w-5.5 h-5.5 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 font-black text-xs shadow-sm">
            <Trophy className="w-3 h-3" />
          </span>
        );
      case 2:
        return (
          <span className="flex items-center justify-center w-5.5 h-5.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 font-black text-xs shadow-sm">
            2
          </span>
        );
      case 3:
        return (
          <span className="flex items-center justify-center w-5.5 h-5.5 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400 font-black text-xs shadow-sm">
            3
          </span>
        );
      default:
        return (
          <span className="flex items-center justify-center w-5.5 h-5.5 text-slate-400 font-bold text-[10px]">
            {rank}
          </span>
        );
    }
  };

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-800/50 flex flex-col h-full overflow-hidden">
      <div className="mb-3.5">
        <div className="flex justify-between items-baseline mb-2">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
            ランキング
          </span>
          <span className="text-[10px] text-slate-400 font-medium">
            単位: {config.unit}
          </span>
        </div>

        {/* 検索バー */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="都道府県で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800/80 border border-transparent rounded-lg focus:outline-none focus:border-indigo-500/50 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-white transition-all duration-300"
          />
        </div>
      </div>

      {/* スリムなリストコンテナ */}
      <div className="flex-1 overflow-y-auto pr-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 font-bold uppercase">
              <th className="py-2 px-1 w-10 text-center">順位</th>
              <th className="py-2 px-2">都道府県</th>
              <th className="py-2 px-2 text-right">値</th>
              <th className="py-2 px-2 text-right w-12">偏差値</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((pref, index) => {
              const rank = index + 1;
              const isSelected = selectedPrefCode === pref.prefCode;
              const value = pref[currentMetric];
              const scoreKey = config.scoreKey;
              const scoreVal = scoreKey ? pref[scoreKey] : undefined;

              return (
                <tr
                  key={pref.prefCode}
                  onClick={() => onSelectPrefecture(pref.prefCode)}
                  className={`border-b border-slate-100/30 dark:border-slate-800/20 text-xs transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50/50 dark:bg-indigo-950/20 font-black text-indigo-600 dark:text-indigo-400'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/20 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <td className="py-2 px-1 flex justify-center">
                    {getRankBadge(rank)}
                  </td>
                  <td className="py-2 px-2 font-semibold">
                    {pref.prefName}
                  </td>
                  <td className="py-2 px-2 text-right tabular-nums font-bold">
                    {formatValue(value as number)}
                  </td>
                  <td className="py-2 px-2 text-right tabular-nums text-[10px] font-black text-slate-400 dark:text-slate-500">
                    {scoreVal !== undefined && !isNaN(scoreVal as number)
                      ? (scoreVal as number).toFixed(0)
                      : '-'}
                  </td>
                </tr>
              );
            })}

            {filteredData.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-slate-400 text-xs">
                  見つかりません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
