import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts';
import type { PrefectureData } from '../types/prefecture';

interface ComparisonRadarChartProps {
  prefecture1: PrefectureData;
  prefecture2: PrefectureData;
}

export const ComparisonRadarChart: React.FC<ComparisonRadarChartProps> = ({
  prefecture1,
  prefecture2,
}) => {
  const data = [
    {
      subject: '基本生活力',
      A: prefecture1.baseUrbanScore || 50,
      B: prefecture2.baseUrbanScore || 50,
      fullMark: 100,
    },
    {
      subject: 'カフェ(スタバ)',
      A: prefecture1.starbucksScore || 50,
      B: prefecture2.starbucksScore || 50,
      fullMark: 100,
    },
    {
      subject: 'グルメ(ラーメン)',
      A: prefecture1.ramenScore || 50,
      B: prefecture2.ramenScore || 50,
      fullMark: 100,
    },
    {
      subject: '観光魅力度',
      A: prefecture1.attractivenessScore || 50,
      B: prefecture2.attractivenessScore || 50,
      fullMark: 100,
    },
    {
      subject: '気候快適さ',
      A: prefecture1.sunshineHoursScore || 50,
      B: prefecture2.sunshineHoursScore || 50,
      fullMark: 100,
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
          都道府県 偏差値比較
        </h3>
      </div>
      
      <div className="flex-1 min-h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
            <PolarGrid stroke="#cbd5e1" />
            <PolarAngleAxis 
              dataKey="subject" 
              tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} 
            />
            <PolarRadiusAxis 
              angle={30} 
              domain={[0, 100]} 
              tick={{ fill: '#94a3b8', fontSize: 10 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '8px',
                border: 'none',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                fontSize: '12px',
                color: '#1e293b'
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }}
              iconType="circle"
            />
            <Radar
              name={prefecture1.prefName}
              dataKey="A"
              stroke="#4f46e5"
              fill="#4f46e5"
              fillOpacity={0.4}
            />
            <Radar
              name={prefecture2.prefName}
              dataKey="B"
              stroke="#e11d48"
              fill="#e11d48"
              fillOpacity={0.4}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
