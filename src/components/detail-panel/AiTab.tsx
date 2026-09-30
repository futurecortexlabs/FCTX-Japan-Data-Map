import { useEffect, useState } from 'react';
import { Brain } from 'lucide-react';
import type { MetricWeights, PrefectureData } from '../../types/prefecture';
import { generateAIConciergeAdvice } from '../../utils/aiConcierge';
import { speakText, stopSpeech } from '../../utils/speech';

/** 最後に回答を表示し終えた都道府県・年 */
export interface AiAnsweredKey {
  prefCode: number;
  year: number;
}

/** 「考え中」演出の長さ (ms) */
const THINKING_DELAY_MS = 800;

interface AiTabProps {
  prefecture: PrefectureData | undefined;
  weights: MetricWeights;
  /** タブ切替後も「同じ県なら考え中演出を繰り返さない」ため、パネル本体が保持する */
  answered: AiAnsweredKey | null;
  onAnswered: (key: AiAnsweredKey) => void;
}

/** 「AI相談」タブ: 選択県と重み設定に応じた移住アドバイス（読み上げ対応） */
export const AiTab: React.FC<AiTabProps> = ({ prefecture, weights, answered, onAnswered }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  // タブを離れた（アンマウント）・県が変わったら読み上げを止める
  useEffect(() => {
    return () => {
      stopSpeech();
      setIsSpeaking(false);
    };
  }, [prefecture]);

  // 最後に回答を表示した県・年と現在の選択が異なる間はローディング扱い
  const selectedPrefCode = prefecture?.prefCode;
  const selectedYear = prefecture?.year;
  const loading =
    selectedPrefCode !== undefined && (answered?.prefCode !== selectedPrefCode || answered?.year !== selectedYear);

  useEffect(() => {
    if (!loading || selectedPrefCode === undefined || selectedYear === undefined) return;
    const timer = setTimeout(() => {
      onAnswered({ prefCode: selectedPrefCode, year: selectedYear });
    }, THINKING_DELAY_MS);
    return () => clearTimeout(timer);
  }, [loading, selectedPrefCode, selectedYear, onAnswered]);

  if (!prefecture) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center py-10">
        <Brain className="w-8 h-8 text-slate-350 dark:text-slate-700 mb-2" />
        <p className="text-xs text-slate-400">都道府県を選択した状態で相談してください。</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-650 dark:bg-indigo-400 animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-650 dark:bg-indigo-400 animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-650 dark:bg-indigo-400 animate-bounce" />
        </div>
        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 animate-pulse">
          AI移住エージェントがスライダー設定とデータを分析中...
        </p>
      </div>
    );
  }

  const advice = generateAIConciergeAdvice(weights, prefecture);

  const toggleSpeech = () => {
    if (isSpeaking) {
      stopSpeech();
      setIsSpeaking(false);
    } else {
      const fullText = `${advice.diagnosis}。おすすめのステップは、${advice.steps.join('。')}。${advice.warning}`;
      speakText(
        fullText,
        () => setIsSpeaking(false),
        () => setIsSpeaking(true),
      );
    }
  };

  return (
    <div className="flex flex-col gap-4 h-full min-h-0 overflow-y-auto pr-1 text-left">
      <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2 justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-indigo-655 text-white flex items-center justify-center text-xs font-black shadow-md">
            AI
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-800 dark:text-white leading-none">
              移住コンシェルジュ
            </h4>
            <span className="text-[9px] text-indigo-500 dark:text-indigo-400 font-bold">
              Utopia AI Agent
            </span>
          </div>
        </div>
        <button
          onClick={toggleSpeech}
          className={`px-3 py-1.5 rounded-full text-[10px] font-bold shadow-sm transition-colors border ${
            isSpeaking
              ? 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-800'
              : 'bg-indigo-50 text-indigo-650 border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-800 dark:hover:bg-indigo-900/60'
          }`}
        >
          {isSpeaking ? '⏹️ 音声停止' : '🗣️ フルボイス再生'}
        </button>
      </div>

      {/* 診断文 */}
      <div className="p-3.5 bg-gradient-to-br from-indigo-50/20 to-purple-50/10 dark:from-indigo-950/10 dark:to-purple-950/5 border border-indigo-150/30 dark:border-indigo-900/20 rounded-xl space-y-2">
        <span className="text-[9px] font-black text-indigo-655 dark:text-indigo-400 tracking-wider uppercase block">
          診断レポート
        </span>
        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-relaxed">
          {advice.diagnosis}
        </p>
      </div>

      {/* アクションステップ */}
      <div className="space-y-2">
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
          推奨する移住準備ステップ
        </span>
        <div className="flex flex-col gap-2">
          {advice.steps.map((step, idx) => (
            <div
              key={idx}
              className="flex gap-2.5 items-start bg-slate-50/50 dark:bg-slate-850/40 p-2.5 border border-slate-100 dark:border-slate-800/60 rounded-xl"
            >
              <span className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-655 dark:text-indigo-400 text-xs font-black flex items-center justify-center shrink-0">
                {idx + 1}
              </span>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-semibold">
                {step}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 留意点・警告 */}
      <div className="p-3 bg-red-50/30 dark:bg-red-950/10 border border-red-200/40 dark:border-red-950/30 rounded-xl flex gap-2.5 items-start">
        <span className="text-lg shrink-0 select-none">⚠️</span>
        <div>
          <span className="text-[9px] font-black text-red-600 dark:text-red-400 tracking-wider block mb-0.5">
            現地での留意点・リスク
          </span>
          <p className="text-[10px] text-slate-550 dark:text-slate-400 leading-relaxed font-semibold">
            {advice.warning}
          </p>
        </div>
      </div>
    </div>
  );
};
