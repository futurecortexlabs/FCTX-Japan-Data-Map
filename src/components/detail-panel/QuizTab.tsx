import { Award, Bookmark, RotateCcw, Sparkles } from 'lucide-react';
import type { MetricWeights, PrefectureData } from '../../types/prefecture';
import type { KeepItem } from '../../types/ui';
import { downloadUtopiaCertificate } from './certificate';
import {
  answerQuiz,
  backQuiz,
  calculateWeightsFromAnswers,
  INITIAL_QUIZ_STATE,
  pickRandom,
  QUIZ_QUESTIONS,
  rankQuizCandidates,
  type QuizState,
} from './logic';

interface QuizTabProps {
  quiz: QuizState;
  onQuizChange: (quiz: QuizState) => void;
  allPrefectures: PrefectureData[];
  weights: MetricWeights;
  onWeightsChange: (weights: MetricWeights) => void;
  onSelectPrefecture: (prefCode: number, year?: number) => void;
  keepList: KeepItem[];
  onToggleKeep: (prefCode: number, prefName: string, year: number) => void;
}

/** 「診断」タブ: 4問のクイズから重みを算出し、上位候補からルーレットで理想郷を選ぶ */
export const QuizTab: React.FC<QuizTabProps> = ({
  quiz,
  onQuizChange,
  allPrefectures,
  weights,
  onWeightsChange,
  onSelectPrefecture,
  keepList,
  onToggleKeep,
}) => {
  const handleAnswerSelect = (optionValue: number) => {
    const next = answerQuiz(quiz, optionValue);
    if (!next.finished) {
      onQuizChange(next);
      return;
    }

    const finalWeights = calculateWeightsFromAnswers(next.answers);
    // 上位候補の中からランダムに1件を選ぶ（回答クリック時のみ実行）
    const best = pickRandom(rankQuizCandidates(allPrefectures, finalWeights, next.answers));

    onQuizChange({ ...next, result: best });
    onWeightsChange(finalWeights);
    if (best) {
      onSelectPrefecture(best.prefCode);
    }
  };

  if (!quiz.finished) {
    const question = QUIZ_QUESTIONS[quiz.step];
    const progress = ((quiz.step + 1) / QUIZ_QUESTIONS.length) * 100;
    return (
      <div className="flex flex-col gap-4 h-full min-h-0 justify-between">
        <div className="space-y-1 shrink-0">
          <div className="flex justify-between text-[10px] text-slate-400 font-bold">
            <span>ステップ {quiz.step + 1} / {QUIZ_QUESTIONS.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-650 dark:bg-indigo-400 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center gap-3 py-2 min-h-0 overflow-y-auto">
          <h4 className="text-sm font-black text-slate-800 dark:text-white leading-snug">
            {question.title}
          </h4>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
            {question.desc}
          </p>

          <div className="flex flex-col gap-2 mt-1">
            {question.options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleAnswerSelect(opt.value)}
                className="w-full p-2.5 text-xs text-left font-bold text-slate-700 hover:text-indigo-600 dark:text-slate-350 dark:hover:text-indigo-400 bg-slate-50/50 hover:bg-indigo-50/50 dark:bg-slate-800/40 dark:hover:bg-indigo-950/20 border border-slate-200/50 hover:border-indigo-500/30 dark:border-slate-800/60 dark:hover:border-indigo-900/40 rounded-xl transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800/40 shrink-0">
          <button
            onClick={() => onQuizChange(backQuiz(quiz))}
            disabled={quiz.step === 0}
            className={`text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors ${quiz.step === 0 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            前の質問に戻る
          </button>
          <span className="text-[9px] text-slate-300 dark:text-slate-650">Utopia Match Quiz</span>
        </div>
      </div>
    );
  }

  const result = quiz.result;
  const isResultKept =
    result !== undefined && keepList.some((item) => item.prefCode === result.prefCode && item.year === result.year);

  return (
    <div className="flex flex-col gap-4 h-full min-h-0 justify-between">
      <div className="text-center space-y-1 shrink-0">
        <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block">
          🎉 診断完了
        </span>
        <h4 className="text-sm font-black text-slate-800 dark:text-white">
          あなたにピッタリの理想郷は...
        </h4>
      </div>

      {result ? (
        <div className="flex-1 flex flex-col items-center justify-center p-3 bg-gradient-to-br from-indigo-50/35 to-purple-50/15 dark:from-indigo-950/10 dark:to-purple-950/5 border border-indigo-150/40 dark:border-indigo-900/20 rounded-xl shadow-inner gap-2.5 my-1 min-h-0 overflow-y-auto">
          <div className="p-2 bg-indigo-650 text-white rounded-full shadow-lg shadow-indigo-650/30">
            <Award className="w-5 h-5 animate-pulse" />
          </div>
          <div className="text-center">
            <span className="text-[9px] font-bold text-slate-400">CODE: {String(result.prefCode).padStart(2, '0')}</span>
            <h2 className="text-xl font-black text-indigo-750 dark:text-indigo-400 tracking-tight mt-0.5 animate-bounce">
              {result.prefName}
            </h2>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center max-w-[200px] leading-relaxed">
            ご希望の条件から理想の重みを算出・適用しました。マップとランキングから詳細スペックをご覧いただけます！
          </p>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
          診断エラーが発生しました
        </div>
      )}

      <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/40 shrink-0">
        {result && (
          <div className="flex flex-col gap-1.5 w-full">
            <div className="grid grid-cols-2 gap-1.5 w-full">
              <button
                onClick={() => onToggleKeep(result.prefCode, result.prefName, result.year)}
                className={`py-2 text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors border ${
                  isResultKept
                    ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/20 dark:border-amber-900 dark:text-amber-400'
                    : 'bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-350'
                }`}
              >
                <Bookmark className="w-3 h-3" />
                {isResultKept ? 'キープ中' : 'キープ登録'}
              </button>
              <button
                onClick={() => downloadUtopiaCertificate(result, weights)}
                className="py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-750 dark:bg-indigo-950 dark:hover:bg-indigo-900 dark:border-indigo-900 dark:text-indigo-400 text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <Sparkles className="w-3 h-3" />
                認定証保存
              </button>
            </div>
          </div>
        )}

        <button
          onClick={() => onQuizChange(INITIAL_QUIZ_STATE)}
          className="w-full py-2 bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-md shadow-indigo-650/10 hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          もう一度診断する
        </button>
      </div>
    </div>
  );
};
