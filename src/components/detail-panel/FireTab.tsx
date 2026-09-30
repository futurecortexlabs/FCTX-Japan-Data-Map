import { Flame, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import type { PrefectureData } from '../../types/prefecture';
import { simulateFire } from '../../utils/fireSimulation';
import { confetti } from '../../utils/confetti';
import { formatManAxisLabel, formatManYen } from './logic';

/** シミュレーション前提（年齢・世帯年収[万円]・現在の資産[万円]・目標リタイア資産[万円]） */
const FIRE_START_AGE = 30;
const FIRE_ANNUAL_INCOME = 600;
const FIRE_CURRENT_ASSETS = 500;
const FIRE_TARGET_ASSETS = 5000;

interface FireTabProps {
  prefecture: PrefectureData;
  /** 「移住を決断する」押下時（搭乗券モーダルを開く） */
  onDecide: () => void;
}

/**
 * 「FIRE試算」タブ: 東京に住み続けた場合と移住した場合の資産推移を比較する。
 * recharts を含むため、パネル本体から React.lazy で遅延読み込みされる。
 */
export const FireTab: React.FC<FireTabProps> = ({ prefecture, onDecide }) => {
  const sim = simulateFire(FIRE_START_AGE, FIRE_ANNUAL_INCOME, FIRE_CURRENT_ASSETS, FIRE_TARGET_ASSETS, prefecture);

  return (
    <div className="flex flex-col gap-4 h-full min-h-0 overflow-y-auto pr-1">
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
        <h3 className="text-sm font-black text-indigo-900 dark:text-indigo-200 mb-2 flex items-center gap-2">
          <Flame className="w-4 h-4 text-rose-500" />
          UTOPIA FIRE SIMULATOR
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-350 mb-4 leading-relaxed">
          現在の東京圏での生活を続ける場合と、{prefecture.prefName}へ移住した場合の35年間の資産推移シミュレーションです。
        </p>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
              <p className="text-[10px] text-slate-400 font-bold mb-1">毎月の貯蓄額（差額）</p>
              <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                +{sim.monthlySavingsDiff.toLocaleString()}円
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
              <p className="text-[10px] text-slate-400 font-bold mb-1">FIRE達成の短縮年数</p>
              <p className="text-lg font-black text-rose-500 dark:text-rose-400">
                {sim.yearsSaved > 0 ? `${sim.yearsSaved}年 短縮!` : 'データ不足'}
              </p>
            </div>
          </div>

          <div className="h-48 w-full mt-2">
            {/* 初回計測前の width/height = -1 警告を避けるため、コンテナ (h-48 = 192px) 相当の初期サイズを与える */}
            <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 320, height: 192 }}>
              <AreaChart data={sim.trajectory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTokyo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorUtopia" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="age" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  width={50}
                  tickFormatter={(v) => formatManAxisLabel(Number(v))}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                  formatter={(value, name) => [formatManYen(Number(value)), name]}
                />
                <Area type="monotone" dataKey="tokyoAssets" name="東京での資産" stroke="#94a3b8" fillOpacity={1} fill="url(#colorTokyo)" />
                <Area type="monotone" dataKey="utopiaAssets" name={`${prefecture.prefName}での資産`} stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorUtopia)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          onDecide();
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#4f46e5', '#ec4899', '#f59e0b'],
          });
        }}
        className="w-full py-4 mt-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-sm rounded-2xl shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
      >
        <Sparkles className="w-5 h-5 animate-pulse" />
        {prefecture.prefName}への移住を決断する
      </motion.button>
    </div>
  );
};
