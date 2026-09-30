import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import { confetti } from '../utils/confetti';
import type { PrefectureData } from '../types/prefecture';
import type { DetailPanelTab } from '../types/ui';
import { generatePrefectureCatchphrase, type Catchphrase, type GachaRarity } from '../utils/catchphrase';
import { playGachaSound, playGachaWinSound } from '../utils/audio';

export interface GachaResult {
  pref: PrefectureData;
  catchphrase: Catchphrase;
}

interface GachaModalProps {
  candidates: PrefectureData[];
  onClose: () => void;
  /** 「もう一度引く」押下時 (統計の記録用) */
  onReroll: () => void;
  onChoose: (pref: PrefectureData, tab: DetailPanelTab) => void;
}

const SPIN_INTERVAL_MS = 70;
const SPIN_TICKS = 12;

const RARITY_BADGE: Record<GachaRarity, string> = {
  SSR: 'bg-amber-500/10 text-amber-600 border-amber-500/35 dark:text-amber-400',
  SR: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/35 dark:text-indigo-400',
  R: 'bg-slate-500/10 text-slate-500 border-slate-500/35 dark:text-slate-400',
};

const pickRandom = <T,>(list: readonly T[]): T => list[Math.floor(Math.random() * list.length)];

/** SR 以上で左右から紙吹雪を 2 秒間噴射する */
function celebrate(rarity: GachaRarity) {
  if (rarity === 'R') return;
  const colors = rarity === 'SSR' ? ['#f59e0b', '#fbbf24'] : ['#818cf8', '#c7d2fe'];
  const end = Date.now() + 2000;
  const frame = () => {
    confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors });
    confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
}

/**
 * 理想郷ガチャ。マウント時に 1 回目の抽選を自動で開始する。
 * 抽選アニメーションは effect 内の interval で進行し、アンマウント時には確実に停止する。
 */
export const GachaModal: React.FC<GachaModalProps> = ({ candidates, onClose, onReroll, onChoose }) => {
  const [spinning, setSpinning] = useState(() => candidates.length > 0);
  const [displayName, setDisplayName] = useState('???');
  const [result, setResult] = useState<GachaResult | null>(null);

  useEffect(() => {
    if (!spinning || candidates.length === 0) return;
    playGachaSound();
    let ticks = 0;
    const timer = window.setInterval(() => {
      ticks++;
      if (ticks <= SPIN_TICKS) {
        setDisplayName(pickRandom(candidates).prefName);
        return;
      }
      window.clearInterval(timer);
      const pref = pickRandom(candidates);
      const catchphrase = generatePrefectureCatchphrase(pref);
      setDisplayName(pref.prefName);
      setResult({ pref, catchphrase });
      setSpinning(false);
      playGachaWinSound();
      celebrate(catchphrase.rarity);
    }, SPIN_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [spinning, candidates]);

  const reroll = () => {
    if (spinning || candidates.length === 0) return;
    onReroll();
    setResult(null);
    setSpinning(true);
  };

  const close = () => {
    if (!spinning) onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[5000] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gacha-title"
    >
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity" onClick={close} />

      <motion.div
        initial={{ scale: 0.8, y: 50, rotate: -5 }}
        animate={{ scale: 1, y: 0, rotate: 0 }}
        exit={{ scale: 0.8, y: 50, rotate: 5 }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-700/50 shadow-2xl max-w-sm w-full relative z-[5001] overflow-hidden flex flex-col p-6 items-center text-center gap-4"
      >
        <div className="flex justify-between items-center w-full border-b border-slate-100 dark:border-slate-800/60 pb-3">
          <div className="flex items-center gap-1.5">
            <span className="text-lg" aria-hidden="true">🎰</span>
            <span id="gacha-title" className="text-sm font-black text-slate-800 dark:text-white">運命の理想郷ガチャ</span>
          </div>
          <button
            type="button"
            onClick={close}
            className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${spinning ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
            disabled={spinning}
            aria-label="閉じる"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* スロット表示エリア */}
        <div
          className="w-full py-8 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 relative shadow-inner overflow-hidden flex flex-col items-center justify-center min-h-[140px]"
          aria-live="polite"
        >
          {spinning ? (
            <div className="space-y-2">
              <div className="text-3xl font-black text-slate-400 dark:text-slate-600 animate-pulse tracking-widest uppercase">
                {displayName}
              </div>
              <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold animate-bounce">理想郷をスキャン中...</div>
            </div>
          ) : result ? (
            <div className="space-y-3 p-2 animate-fade-in flex flex-col items-center">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-widest border animate-pulse ${RARITY_BADGE[result.catchphrase.rarity]}`}>
                {result.catchphrase.rarity}
              </span>
              <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">{result.pref.prefName}</div>
              <div className="px-4 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/40 dark:border-slate-800/40 max-w-[280px] flex flex-col gap-1.5">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed italic">" {result.catchphrase.text} "</p>
                <div className="text-[9px] text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800/50 pt-1 text-left flex items-start gap-1 font-semibold leading-relaxed">
                  <span className="shrink-0 text-amber-500" aria-hidden="true">💡</span>
                  <span>{result.catchphrase.advice}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-3xl font-black text-slate-300 dark:text-slate-700">???</div>
              <p className="text-[10px] text-slate-400">ガチャを回して運命の地を見つけよう！</p>
            </div>
          )}
        </div>

        {/* ボタン群 */}
        <div className="w-full flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
          {result && !spinning && (
            <div className="flex flex-col gap-1.5 w-full">
              <button
                type="button"
                onClick={() => onChoose(result.pref, 'details')}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 hover:scale-[1.01] transition-all cursor-pointer"
              >
                ここに決める！ (詳細を表示)
              </button>
              <div className="grid grid-cols-2 gap-1.5 w-full">
                <button
                  type="button"
                  onClick={() => onChoose(result.pref, 'fire')}
                  className="py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  title="生活費を試算する"
                >
                  <span aria-hidden="true">💰</span> 生活費試算
                </button>
                <button
                  type="button"
                  onClick={() => onChoose(result.pref, 'ai')}
                  className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:text-indigo-400 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 border border-indigo-200 dark:border-indigo-800/50 shadow-sm cursor-pointer"
                  title="AI相談室を開く"
                >
                  <span aria-hidden="true">🤖</span> AI相談室
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={reroll}
            disabled={spinning || candidates.length === 0}
            className={`w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 ${spinning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span aria-hidden="true">🎰</span>
            <span>{result ? 'もう一度引く' : 'ガチャを回す'}</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
