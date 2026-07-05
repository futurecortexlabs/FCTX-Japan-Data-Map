import React, { useState } from 'react';
import { MapPin, Coins, Users, Building2, Award, Coffee, Soup, Sparkles, Sun, Sliders, Globe, HelpCircle, RotateCcw } from 'lucide-react';
import { type PrefectureData, type MetricWeights } from '../types/prefecture';
import { WeightConfigPanel } from './WeightConfigPanel';
import { ComparisonRadarChart } from './ComparisonRadarChart';
import { generatePrefectureCatchphrase } from '../utils/catchphrase';

interface PrefectureDetailPanelProps {
  prefectures: PrefectureData[];
  weights: MetricWeights;
  onWeightsChange: (weights: MetricWeights) => void;
  allPrefectures: PrefectureData[];
  onSelectPrefecture: (prefCode: number) => void;
}

export const PrefectureDetailPanel: React.FC<PrefectureDetailPanelProps> = ({
  prefectures,
  weights,
  onWeightsChange,
  allPrefectures,
  onSelectPrefecture,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'weights' | 'quiz'>('details');
  const prefecture = prefectures.length > 0 ? prefectures[0] : undefined;

  // クイズ状態管理
  const [quizStep, setQuizStep] = useState<number>(0);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizResultPref, setQuizResultPref] = useState<PrefectureData | undefined>(undefined);
  const [quizFinished, setQuizFinished] = useState<boolean>(false);

  const handleStartQuiz = () => {
    setQuizStep(0);
    setQuizAnswers([]);
    setQuizFinished(false);
    setQuizResultPref(undefined);
  };

  const calculateWeightsFromAnswers = (ans: number[]) => {
    const newWeights = {
      starbucksCount: 10,
      ramenCount: 10,
      attractiveness: 10,
      sunshineHours: 10
    };

    // Q2: Cafe (0) vs Nature (1)
    if (ans[1] === 0) {
      newWeights.starbucksCount = 40;
      newWeights.attractiveness = 10;
    } else {
      newWeights.starbucksCount = 10;
      newWeights.attractiveness = 40;
    }

    // Q3: Gourmet (0) vs Simple (1)
    if (ans[2] === 0) {
      newWeights.ramenCount = 45;
    } else {
      newWeights.ramenCount = 5;
    }

    // Q4: Climate (0) vs No Pref (1)
    if (ans[3] === 0) {
      newWeights.sunshineHours = 45;
    } else {
      newWeights.sunshineHours = 5;
    }

    return newWeights;
  };

  const calculateBestPrefecture = (tempWeights: MetricWeights) => {
    if (!allPrefectures || allPrefectures.length === 0) return undefined;
    
    let bestPref: PrefectureData | undefined = undefined;
    let highestScore = -1;

    for (const pref of allPrefectures) {
      const baseUrban = pref.baseUrbanScore;
      
      let weightedSum = 0;
      let weightTotal = 0;
      
      if (baseUrban !== undefined && !isNaN(baseUrban)) {
        weightedSum += baseUrban * 30;
        weightTotal += 30;
      }

      const scoreMappings = [
        { score: pref.starbucksScore, weight: tempWeights.starbucksCount },
        { score: pref.ramenScore, weight: tempWeights.ramenCount },
        { score: pref.attractivenessScore, weight: tempWeights.attractiveness },
        { score: pref.sunshineHoursScore, weight: tempWeights.sunshineHours },
      ];

      for (const item of scoreMappings) {
        if (item.score !== undefined && !isNaN(item.score) && item.weight > 0) {
          weightedSum += item.score * item.weight;
          weightTotal += item.weight;
        }
      }

      const totalScore = weightTotal > 0 ? weightedSum / weightTotal : 0;
      if (totalScore > highestScore) {
        highestScore = totalScore;
        bestPref = pref;
      }
    }

    return bestPref;
  };

  const questions = [
    {
      title: "Q1: 住宅コストと利便性の希望は？",
      desc: "家賃や地価を極力安く抑えたいか、多少高めでも都会の便利さを優先したいか。",
      options: [
        { label: "固定費（家賃や地価）は安く抑えたい！", value: 0 },
        { label: "利便性重視！お店や職場が近くにほしい", value: 1 }
      ]
    },
    {
      title: "Q2: 休日のリフレッシュ方法は？",
      desc: "サードプレイスとしてのカフェでおしゃれに過ごすか、自然や観光地で過ごすか。",
      options: [
        { label: "カフェや静かなコミュニティでゆったり過ごす", value: 0 },
        { label: "豊かな温泉やキャンプ場、観光地に繰り出す", value: 1 }
      ]
    },
    {
      title: "Q3: 毎日の食事へのこだわりは？",
      desc: "外食のラーメン店などのグルメを積極的に開拓したいか。",
      options: [
        { label: "ご当地ラーメンや外食巡りが大好き！", value: 0 },
        { label: "自炊中心で、食費は抑えめにしたい", value: 1 }
      ]
    },
    {
      title: "Q4: お天気や日照時間の優先度は？",
      desc: "晴れの日が多くからっとした天気を望むか、特に気にしないか。",
      options: [
        { label: "とにかく晴れの日が多く、気持ち良い環境がいい！", value: 0 },
        { label: "曇りや雨、雪国の情景も好きなので気にしない", value: 1 }
      ]
    }
  ];

  const handleAnswerSelect = (optionValue: number) => {
    const updatedAnswers = [...quizAnswers, optionValue];
    setQuizAnswers(updatedAnswers);

    if (quizStep < questions.length - 1) {
      setQuizStep(quizStep + 1);
    } else {
      const finalWeights = calculateWeightsFromAnswers(updatedAnswers);
      const best = calculateBestPrefecture(finalWeights);
      
      setQuizResultPref(best);
      setQuizFinished(true);

      onWeightsChange(finalWeights);
      if (best) {
        onSelectPrefecture(best.prefCode);
      }
    }
  };

  const renderQuiz = () => {
    if (!quizFinished) {
      return (
        <div className="flex flex-col gap-4 h-full min-h-0 justify-between">
          <div className="space-y-1 shrink-0">
            <div className="flex justify-between text-[10px] text-slate-400 font-bold">
              <span>ステップ {quizStep + 1} / {questions.length}</span>
              <span>{Math.round(((quizStep + 1) / questions.length) * 100)}%</span>
            </div>
            <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-650 dark:bg-indigo-400 transition-all duration-300" style={{ width: `${((quizStep + 1) / questions.length) * 100}%` }} />
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center gap-3 py-2 min-h-0 overflow-y-auto">
            <h4 className="text-sm font-black text-slate-800 dark:text-white leading-snug">
              {questions[quizStep].title}
            </h4>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
              {questions[quizStep].desc}
            </p>

            <div className="flex flex-col gap-2 mt-1">
              {questions[quizStep].options.map((opt, oIdx) => (
                <button
                  key={oIdx}
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
              onClick={() => {
                if (quizStep > 0) {
                  setQuizStep(quizStep - 1);
                  setQuizAnswers(quizAnswers.slice(0, -1));
                }
              }}
              disabled={quizStep === 0}
              className={`text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors ${quizStep === 0 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              前の質問に戻る
            </button>
            <span className="text-[9px] text-slate-300 dark:text-slate-650">Utopia Match Quiz</span>
          </div>
        </div>
      );
    }

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

        {quizResultPref ? (
          <div className="flex-1 flex flex-col items-center justify-center p-3 bg-gradient-to-br from-indigo-50/35 to-purple-50/15 dark:from-indigo-950/10 dark:to-purple-950/5 border border-indigo-150/40 dark:border-indigo-900/20 rounded-xl shadow-inner gap-2.5 my-1 min-h-0 overflow-y-auto">
            <div className="p-2 bg-indigo-650 text-white rounded-full shadow-lg shadow-indigo-650/30">
              <Award className="w-5 h-5 animate-pulse" />
            </div>
            <div className="text-center">
              <span className="text-[9px] font-bold text-slate-400">CODE: {String(quizResultPref.prefCode).padStart(2, '0')}</span>
              <h2 className="text-xl font-black text-indigo-750 dark:text-indigo-400 tracking-tight mt-0.5 animate-bounce">
                {quizResultPref.prefName}
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
          <button
            onClick={handleStartQuiz}
            className="w-full py-2 bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-md shadow-indigo-650/10 hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            もう一度診断する
          </button>
        </div>
      </div>
    );
  };

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
          <span>詳細</span>
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
          <span>調整</span>
          {activeTab === 'weights' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('quiz')}
          className={`flex-1 pb-2.5 text-xs font-bold transition-all duration-300 relative flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'quiz'
              ? 'text-indigo-600 dark:text-indigo-400'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>診断</span>
          {activeTab === 'quiz' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
          )}
        </button>
      </div>

      {/* タブコンテンツ */}
      <div className="flex-1 p-5 overflow-hidden">
        {activeTab === 'details' ? (
          prefectures.length === 2 ? (
            <ComparisonRadarChart prefecture1={prefectures[0]} prefecture2={prefectures[1]} />
          ) : prefecture ? (
            <div className="flex flex-col gap-4 h-full">
              {/* ヘッダー部分 */}
              {(() => {
                const catchphrase = generatePrefectureCatchphrase(prefecture);
                return (
                  <div className="flex flex-col border-b border-slate-100 dark:border-slate-800/80 pb-3 gap-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                            CODE: {String(prefecture.prefCode).padStart(2, '0')} | {prefecture.year}年
                          </span>
                          <span className={`px-1 py-0.5 rounded text-[8px] font-black tracking-wider ${
                            catchphrase.rarity === 'SSR'
                              ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20 dark:text-amber-400'
                              : catchphrase.rarity === 'SR'
                              ? 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 dark:text-indigo-400'
                              : 'bg-slate-500/10 text-slate-500 border border-slate-500/20 dark:text-slate-400'
                          }`}>
                            {catchphrase.rarity}
                          </span>
                        </div>
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

                    <div className="px-2.5 py-1.5 bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200/40 dark:border-slate-800/40 rounded-xl">
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-normal italic text-left">
                        " {catchphrase.text} "
                      </p>
                    </div>
                  </div>
                );
              })()}

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
        ) : activeTab === 'weights' ? (
          <WeightConfigPanel weights={weights} onChange={onWeightsChange} />
        ) : (
          renderQuiz()
        )}
      </div>
    </div>
  );
};
