import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { PrefectureData, MetricType } from '../types/prefecture';
import { METRIC_CONFIGS } from '../constants/metrics';

interface TopChartProps {
  data: PrefectureData[];
  currentMetric: MetricType;
}

export const TopChart: React.FC<TopChartProps> = React.memo(({ data, currentMetric }) => {
  const config = METRIC_CONFIGS[currentMetric];

  // 指標の値が存在するデータのみを抽出し、降順でソートして上位5つを取得
  const chartData = [...data]
    .filter((d) => d[currentMetric] !== undefined && !isNaN(d[currentMetric] as number))
    .sort((a, b) => (b[currentMetric] as number) - (a[currentMetric] as number))
    .slice(0, 5)
    .map((d) => ({
      name: d.prefName,
      value: d[currentMetric] as number,
    }));

  // 指標に応じた色
  const getBarColor = () => {
    switch (currentMetric) {
      case 'totalScore':
        return '#8b5cf6'; // purple-500
      case 'landPrice':
        return '#f59e0b'; // amber-500
      case 'population':
        return '#3b82f6'; // blue-500
      case 'listedCompanies':
        return '#10b981'; // emerald-500
      default:
        return '#6366f1'; // indigo-500
    }
  };

  const barColor = getBarColor();

  const formatValue = (val: number) => {
    if (currentMetric === 'population') {
      if (val >= 10000) {
        return `${(val / 10000).toLocaleString(undefined, { maximumFractionDigits: 1 })} 万人`;
      }
      return `${val.toLocaleString()} 人`;
    }
    return `${val.toLocaleString()} ${config.unit}`;
  };

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-5 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-800/50 h-full flex flex-col">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          上位5都道府県
        </h3>
        <p className="text-lg font-bold text-slate-800 dark:text-white">
          {config.label} ランキング
        </p>
      </div>

      {chartData.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-slate-400">
          データがありません
        </div>
      ) : (
        <div className="flex-1 min-h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 320, height: 220 }}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
            >
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                width={60}
              />
              <Tooltip
                formatter={(value) => [formatValue(Number(value)), config.label]}
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
                {chartData.map((_, index) => {
                  // 1位は少し濃く、グラデーションのような効果を作るための透明度調整
                  const opacity = 1 - index * 0.12;
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={barColor}
                      fillOpacity={opacity}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
});
