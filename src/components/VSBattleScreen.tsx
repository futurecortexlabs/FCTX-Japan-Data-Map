import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type PrefectureData } from '../types/prefecture';
import { playBattleStartSound, playHitSound, playKOSound, playGachaWinSound } from '../utils/audio';
import { X, Trophy, Swords } from 'lucide-react';
import { confetti } from '../utils/confetti';

interface VSBattleScreenProps {
  pref1: PrefectureData;
  pref2: PrefectureData;
  onClose: () => void;
}

type BattlePhase = 'intro' | 'fighting' | 'ko' | 'result';

type BattleScoreKey =
  | 'starbucksScore'
  | 'ramenScore'
  | 'attractivenessScore'
  | 'landPriceScore'
  | 'childcareScoreScore';

interface BattleMetric {
  key: BattleScoreKey;
  label: string;
  weight: number;
}

const metricsToCompare: readonly BattleMetric[] = [
  { key: 'starbucksScore', label: 'スタバ充実度', weight: 15 },
  { key: 'ramenScore', label: 'ラーメン充実度', weight: 15 },
  { key: 'attractivenessScore', label: '魅力度', weight: 20 },
  { key: 'landPriceScore', label: '地価の安さ', weight: 20 },
  { key: 'childcareScoreScore', label: '子育て環境', weight: 30 }
];

/** 偏差値スコアが未設定（または 0）の場合は平均値 50 として扱う */
const getBattleValue = (pref: PrefectureData, key: BattleScoreKey): number => pref[key] || 50;

export const VSBattleScreen: React.FC<VSBattleScreenProps> = ({ pref1, pref2, onClose }) => {
  const [phase, setPhase] = useState<BattlePhase>('intro');
  const [hp1, setHp1] = useState(100);
  const [hp2, setHp2] = useState(100);
  const [currentMetricIndex, setCurrentMetricIndex] = useState(-1);

  // 勝者は結果フェーズでの残り HP から導出する
  const winner: number | null = phase === 'result' ? (hp1 > hp2 ? 1 : hp2 > hp1 ? 2 : 0) : null;
  const currentMetric: BattleMetric | undefined =
    phase === 'fighting' ? metricsToCompare[currentMetricIndex] : undefined;
  const currentVal1 = currentMetric ? getBattleValue(pref1, currentMetric.key) : 0;
  const currentVal2 = currentMetric ? getBattleValue(pref2, currentMetric.key) : 0;

  useEffect(() => {
    // Intro sequence
    playBattleStartSound();
    const timer = setTimeout(() => {
      setPhase('fighting');
      setCurrentMetricIndex(0);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (phase !== 'fighting') return;

    if (currentMetricIndex >= metricsToCompare.length || hp1 <= 0 || hp2 <= 0) {
      // Battle over
      const koTimer = setTimeout(() => {
        setPhase('ko');
        playKOSound();
      }, 1000);
      return () => clearTimeout(koTimer);
    }

    // Process current attack
    const timer = setTimeout(() => {
      const metric = metricsToCompare[currentMetricIndex];
      const val1 = getBattleValue(pref1, metric.key);
      const val2 = getBattleValue(pref2, metric.key);

      playHitSound();

      if (val1 > val2) {
        // P1 wins this round
        const damage = Math.min(metric.weight + (val1 - val2) * 0.5, hp2);
        setHp2(prev => Math.max(0, prev - damage));
      } else if (val2 > val1) {
        // P2 wins this round
        const damage = Math.min(metric.weight + (val2 - val1) * 0.5, hp1);
        setHp1(prev => Math.max(0, prev - damage));
      } else {
        // Tie
        playHitSound();
        setHp1(prev => Math.max(0, prev - 5));
        setHp2(prev => Math.max(0, prev - 5));
      }

      setCurrentMetricIndex(prev => prev + 1);
    }, 1500);

    return () => clearTimeout(timer);
  }, [phase, currentMetricIndex, hp1, hp2, pref1, pref2]);

  useEffect(() => {
    if (phase !== 'ko') return;

    const resultTimer = setTimeout(() => {
      setPhase('result');
      playGachaWinSound();
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#ef4444', '#3b82f6', '#f59e0b']
      });
    }, 2000);
    return () => clearTimeout(resultTimer);
  }, [phase]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[6000] flex items-center justify-center bg-slate-950/90 backdrop-blur-md overflow-hidden font-mono"
    >
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-rose-600/40 to-transparent skew-x-12 transform -translate-x-20" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-600/40 to-transparent -skew-x-12 transform translate-x-20" />
      </div>

      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white/50 hover:text-white transition-colors z-50 cursor-pointer"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="w-full max-w-5xl px-8 flex flex-col items-center justify-center relative z-10 h-full py-12">
        {/* HP Bars */}
        <div className="w-full flex items-center justify-between gap-8 mb-16 relative">
          {/* P1 HP */}
          <div className="flex-1">
            <div className="flex justify-between text-white font-black text-xl mb-2 italic px-2">
              <span className="text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]">{pref1.prefName}</span>
              <span>1P</span>
            </div>
            <div className="h-8 bg-slate-900 border-2 border-rose-500/50 rounded-lg overflow-hidden relative shadow-[0_0_15px_rgba(244,63,94,0.3)] flex justify-end">
              <motion.div
                className="h-full bg-gradient-to-l from-rose-400 to-rose-600"
                initial={{ width: '100%' }}
                animate={{ width: `${hp1}%` }}
                transition={{ type: 'spring', damping: 20 }}
              />
            </div>
          </div>

          <div className="w-16 h-16 flex items-center justify-center shrink-0 text-white font-black text-2xl italic opacity-50">
            VS
          </div>

          {/* P2 HP */}
          <div className="flex-1">
            <div className="flex justify-between text-white font-black text-xl mb-2 italic px-2">
              <span>2P</span>
              <span className="text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]">{pref2.prefName}</span>
            </div>
            <div className="h-8 bg-slate-900 border-2 border-blue-500/50 rounded-lg overflow-hidden relative shadow-[0_0_15px_rgba(59,130,246,0.3)]">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-600 to-blue-400"
                initial={{ width: '100%' }}
                animate={{ width: `${hp2}%` }}
                transition={{ type: 'spring', damping: 20 }}
              />
            </div>
          </div>
        </div>

        {/* Action Area */}
        <div className="flex-1 w-full flex items-center justify-center relative perspective-1000">
          
          <AnimatePresence mode="wait">
            {phase === 'intro' && (
              <motion.div
                key="intro"
                initial={{ scale: 3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', damping: 12, stiffness: 100 }}
                className="text-8xl md:text-9xl font-black text-white italic tracking-tighter flex items-center justify-center"
                style={{ textShadow: '0 0 40px rgba(255,255,255,0.5), 4px 4px 0 #ef4444, -4px -4px 0 #3b82f6' }}
              >
                FIGHT!
              </motion.div>
            )}

            {currentMetric && (
              <motion.div
                key={`metric-${currentMetricIndex}`}
                initial={{ y: 50, opacity: 0, rotateX: 45 }}
                animate={{ y: 0, opacity: 1, rotateX: 0 }}
                exit={{ y: -50, opacity: 0, rotateX: -45 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center bg-slate-900/60 border border-white/10 p-8 rounded-3xl backdrop-blur-xl shadow-2xl w-full max-w-2xl"
              >
                <div className="text-slate-400 font-bold mb-2 tracking-widest text-sm uppercase">Round {currentMetricIndex + 1}</div>
                <div className="text-4xl md:text-5xl font-black text-white mb-8 bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
                  {currentMetric.label}
                </div>

                <div className="flex items-center gap-12 w-full justify-between">
                  <motion.div
                    className="text-5xl font-black text-rose-500 w-1/3 text-center"
                    animate={currentVal1 > currentVal2 ? { scale: [1, 1.5, 1] } : {}}
                  >
                    {Math.round(currentVal1)}
                  </motion.div>

                  <Swords className="w-12 h-12 text-slate-500 opacity-50 shrink-0" />

                  <motion.div
                    className="text-5xl font-black text-blue-500 w-1/3 text-center"
                    animate={currentVal2 > currentVal1 ? { scale: [1, 1.5, 1] } : {}}
                  >
                    {Math.round(currentVal2)}
                  </motion.div>
                </div>
              </motion.div>
            )}

            {phase === 'ko' && (
              <motion.div
                key="ko"
                initial={{ scale: 4, opacity: 0, rotate: -15 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', damping: 10, stiffness: 80 }}
                className="text-8xl md:text-[150px] font-black text-yellow-500 italic tracking-tighter"
                style={{ textShadow: '0 0 60px rgba(234,179,8,0.6), 8px 8px 0 rgba(220,38,38,1)' }}
              >
                K.O.
              </motion.div>
            )}

            {phase === 'result' && (
              <motion.div
                key="result"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex flex-col items-center justify-center gap-6"
              >
                <div className="text-3xl font-black text-yellow-400 flex items-center gap-3">
                  <Trophy className="w-10 h-10" /> WINNER!
                </div>
                <div 
                  className={`text-6xl md:text-8xl font-black italic tracking-tighter ${winner === 1 ? 'text-rose-500' : winner === 2 ? 'text-blue-500' : 'text-slate-400'}`}
                  style={{ textShadow: '0 0 40px currentColor' }}
                >
                  {winner === 1 ? pref1.prefName : winner === 2 ? pref2.prefName : 'DRAW'}
                </div>
                <button
                  onClick={onClose}
                  className="mt-8 px-8 py-4 bg-white text-slate-950 font-black text-xl rounded-full hover:scale-105 transition-transform hover:shadow-[0_0_20px_rgba(255,255,255,0.5)] cursor-pointer"
                >
                  バトル終了
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};
