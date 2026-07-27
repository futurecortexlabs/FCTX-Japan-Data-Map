import React, { useState, useEffect } from 'react';
import { MapPin, Coins, Users, Building2, Award, Coffee, Soup, Sparkles, Sun, Sliders, Globe, HelpCircle, RotateCcw, Heart, Flame, Bookmark, Brain, Calendar, Wind, Activity } from 'lucide-react';
import { type PrefectureData, type MetricWeights, type MetricType } from '../types/prefecture';
import { WeightConfigPanel } from './WeightConfigPanel';
import { ComparisonRadarChart } from './ComparisonRadarChart';
import { generatePrefectureCatchphrase } from '../utils/catchphrase';
import { generateAIConciergeAdvice } from '../utils/aiConcierge';
import { classifyPersonality } from '../utils/personality';
import { ACHIEVEMENTS } from '../utils/achievements';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { simulateFire } from '../utils/fireSimulation';
import { generateNomadRoute } from '../utils/nomadPlanner';
import { UtopiaBoardingPass } from './UtopiaBoardingPass';
import { motion } from 'framer-motion';

interface PrefectureDetailPanelProps {
  prefectures: PrefectureData[];
  weights: MetricWeights;
  onWeightsChange: (weights: MetricWeights) => void;
  allPrefectures: PrefectureData[];
  onSelectPrefecture: (prefCode: number, year?: number) => void;
  keepList: { prefCode: number; prefName: string; year: number }[];
  onToggleKeep: (prefCode: number, prefName: string, year: number) => void;
  currentMetric: MetricType;
  activeTab: 'details' | 'weights' | 'quiz' | 'keep' | 'ai' | 'multibase' | 'fire' | 'nomad';
  onActiveTabChange: (tab: 'details' | 'weights' | 'quiz' | 'keep' | 'ai' | 'multibase' | 'fire' | 'nomad') => void;
  unlockedAchievements: string[];
}

export const PrefectureDetailPanel: React.FC<PrefectureDetailPanelProps> = ({
  prefectures,
  weights,
  onWeightsChange,
  allPrefectures,
  onSelectPrefecture,
  keepList,
  onToggleKeep,
  currentMetric,
  activeTab,
  onActiveTabChange,
  unlockedAchievements,
}) => {
  const [compTab, setCompTab] = useState<'radar' | 'duel' | 'dual'>('radar');
  const prefecture = prefectures.length > 0 ? prefectures[0] : undefined;
  const [showBoardingPass, setShowBoardingPass] = useState(false);

  // Tab guard
  useEffect(() => {
    if (prefectures.length >= 2 && (activeTab === 'quiz' || activeTab === 'fire')) {
      onActiveTabChange('multibase');
    } else if (prefectures.length === 1 && (activeTab === 'multibase' || activeTab === 'nomad')) {
      onActiveTabChange('details');
    } else if (prefectures.length < 3 && activeTab === 'nomad') {
      onActiveTabChange('multibase');
    }
  }, [prefectures.length, activeTab]);

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

  const handleGenerateCertificate = (prefParam?: PrefectureData) => {
    const targetPref = prefParam || prefecture;
    if (!targetPref) return;
    const style = classifyPersonality(weights, targetPref);
    const catchphrase = generatePrefectureCatchphrase(targetPref);

    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw Background Gradient
    const gradient = ctx.createLinearGradient(0, 0, 600, 400);
    gradient.addColorStop(0, '#1e1b4b');
    gradient.addColorStop(0.5, '#311042');
    gradient.addColorStop(1, '#0f172a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 600, 400);

    // Decorative Borders
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 15;
    ctx.strokeRect(20, 20, 560, 360);

    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 2;
    ctx.strokeRect(28, 28, 544, 344);

    // Gold Corner Accents
    ctx.fillStyle = '#fbbf24';
    const cornerSize = 10;
    ctx.fillRect(28, 28, cornerSize, cornerSize);
    ctx.fillRect(572 - cornerSize, 28, cornerSize, cornerSize);
    ctx.fillRect(28, 372 - cornerSize, cornerSize, cornerSize);
    ctx.fillRect(572 - cornerSize, 372 - cornerSize, cornerSize, cornerSize);

    // Header Text
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FCTX 理想郷移住認定証', 300, 75);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText('FUTURE CORTEX UTOPIA FINDER CERTIFICATE', 300, 95);

    // Divider Line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(80, 115);
    ctx.lineTo(520, 115);
    ctx.stroke();

    // Body texts
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('移住認定先 (Utopia):', 80, 150);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 26px sans-serif';
    ctx.fillText(`${targetPref.prefName} (${targetPref.year}年)`, 80, 185);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('あなたの移住スタイル (Personality Style):', 80, 225);

    ctx.fillStyle = '#67e8f9';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(`${style.emoji} ${style.name}`, 80, 250);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = 'italic 11px sans-serif';
    ctx.fillText(`"${catchphrase.text}"`, 80, 285);

    // Gold Stamp
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(485, 235, 42, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(251, 191, 36, 0.1)';
    ctx.beginPath();
    ctx.arc(485, 235, 40, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fbbf24';
    ctx.font = '900 10px sans-serif';
    ctx.fillText('FCTX', 485, 224);
    ctx.font = 'bold 8px sans-serif';
    ctx.fillText('APPROVED', 485, 238);
    ctx.font = '900 9px sans-serif';
    ctx.fillText('理想郷査証', 485, 252);

    // Footer Info
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = '7px monospace';
    ctx.fillText(`SERIAL: FCTX-${targetPref.prefCode}-${targetPref.year}-${Math.floor(Math.random() * 9000 + 1000)}`, 80, 345);
    ctx.fillText('ISSUED BY FUTURE CORTEX UTOPIA FINDER', 80, 360);

    // Download trigger
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `fctx_utopia_certificate_${targetPref.prefName}.png`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [loadingAI, setLoadingAI] = useState<boolean>(false);
  const [aiYear, setAiYear] = useState<number>(0);
  const [aiPrefCode, setAiPrefCode] = useState<number>(0);

  // Trigger simulated typing load when AI tab is clicked or prefecture/weights change
  useEffect(() => {
    if (activeTab === 'ai' && prefecture) {
      if (aiPrefCode !== prefecture.prefCode || aiYear !== prefecture.year) {
        setLoadingAI(true);
        const timer = setTimeout(() => {
          setLoadingAI(false);
          setAiPrefCode(prefecture.prefCode);
          setAiYear(prefecture.year);
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [activeTab, prefecture?.prefCode, prefecture?.year]);

  const renderAIConsultation = () => {
    if (!prefecture) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-center py-10">
          <Brain className="w-8 h-8 text-slate-350 dark:text-slate-700 mb-2" />
          <p className="text-xs text-slate-400">都道府県を選択した状態で相談してください。</p>
        </div>
      );
    }

    if (loadingAI) {
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

    return (
      <div className="flex flex-col gap-4 h-full min-h-0 overflow-y-auto pr-1 text-left">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
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

  const renderMultiBasePlanner = () => {
    if (prefectures.length < 2) return null;

    const timelineSlots = [
      { season: '春 (3〜5月)', icon: '🌸', desc: '花粉を避け快適に過ごす時期' },
      { season: '夏 (6〜8月)', icon: '☀️', desc: '避暑地でのアウトドアや自然体験' },
      { season: '秋 (9〜11月)', icon: '🍁', desc: '収穫の秋と美しい景観を楽しむ時期' },
      { season: '冬 (12〜2月)', icon: '❄️', desc: '避寒地・リゾートまたは都市生活' }
    ];

    const p1 = prefectures[0];
    const p2 = prefectures[1];
    const p3 = prefectures.length >= 3 ? prefectures[2] : undefined;

    const assignSeason = (season: string): PrefectureData => {
      if (season.includes('夏')) {
        const targets = [p1, p2, p3].filter((p): p is PrefectureData => p !== undefined);
        const best = targets.find(p => p.prefCode === 1 || p.prefCode === 20 || p.prefCode === 19);
        if (best) return best;
        return p2;
      }
      if (season.includes('冬')) {
        const targets = [p1, p2, p3].filter((p): p is PrefectureData => p !== undefined);
        const best = targets.find(p => p.prefCode === 47 || p.prefCode === 46);
        if (best) return best;
        if (p3) return p3;
        return p2;
      }
      if (season.includes('春')) {
        const targets = [p1, p2, p3].filter((p): p is PrefectureData => p !== undefined);
        const best = targets.find(p => p.prefCode === 47 || p.prefCode === 1);
        if (best) return best;
        return p1;
      }
      return p1;
    };

    const avgScore = (
      prefectures.reduce((acc, p) => acc + (p.totalScore || 50), 0) / prefectures.length
    ).toFixed(1);

    return (
      <div className="flex flex-col gap-4 h-full min-h-0 overflow-y-auto pr-1 text-left">
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
          <div>
            <h4 className="text-xs font-black text-slate-800 dark:text-white leading-none">
              シーズンローテーションカレンダー
            </h4>
            <span className="text-[9px] text-indigo-500 dark:text-indigo-400 font-bold">
              Multi-base Seasonal Plan
            </span>
          </div>
          
          <div className="text-right">
            <span className="text-[9px] text-slate-400 block">統合満足度</span>
            <span className="text-sm font-black text-indigo-655 dark:text-indigo-400 tabular-nums">
              {avgScore} <span className="text-[9px] font-normal text-slate-400">点</span>
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          {timelineSlots.map((slot, idx) => {
            const assigned = assignSeason(slot.season);
            const catchphrase = generatePrefectureCatchphrase(assigned);
            
            let reason = slot.desc;
            if (slot.season.includes('春') && (assigned.prefCode === 47 || assigned.prefCode === 1)) {
              reason = '🌲 花粉飛散が非常に少ない避粉ユートピア生活';
            } else if (slot.season.includes('夏') && (assigned.prefCode === 1 || assigned.prefCode === 20)) {
              reason = '🏕️ 涼しく爽やかな本格派のアウトドア・スローライフ';
            } else if (slot.season.includes('冬') && assigned.prefCode === 47) {
              reason = '🌺 本州の凍える冬を避けて過ごす暖かな南国リゾート生活';
            } else if (assigned.prefCode === 13) {
              reason = '💼 大都市の最新トレンド、利便性、仕事を楽しむ滞在';
            }

            return (
              <div
                key={idx}
                className="flex items-center gap-3.5 p-3 bg-slate-50/50 dark:bg-slate-850/40 border border-slate-200/50 dark:border-slate-800/60 rounded-xl hover:shadow-sm transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800/60 flex flex-col items-center justify-center shadow-inner shrink-0 text-center">
                  <span className="text-lg leading-none">{slot.icon}</span>
                  <span className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter leading-none mt-0.5">
                    {slot.season.slice(0, 1)}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-slate-800 dark:text-white">
                      {assigned.prefName}
                    </span>
                    <span className={`px-1 py-0.5 rounded text-[7px] font-black tracking-wider ${
                      catchphrase.rarity === 'SSR'
                        ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                        : catchphrase.rarity === 'SR'
                        ? 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20'
                        : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                    }`}>
                      {catchphrase.rarity}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-450 font-bold truncate mt-0.5">
                    {reason}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };



  const renderKeepList = () => {
    const achievementsBoard = (
      <div className="mt-5 border-t border-slate-200/50 dark:border-slate-800/60 pt-4 flex flex-col gap-2.5">
        <div className="flex justify-between items-center text-left">
          <span className="text-xs font-black text-indigo-650 dark:text-indigo-400 uppercase tracking-wider block">
            🏆 獲得実績 ({unlockedAchievements.length} / {ACHIEVEMENTS.length})
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-left">
          {ACHIEVEMENTS.map((ach) => {
            const isUnlocked = unlockedAchievements.includes(ach.id);
            return (
              <div
                key={ach.id}
                className={`p-2 rounded-xl border flex gap-1.5 transition-all duration-300 ${
                  isUnlocked
                    ? 'bg-indigo-50/15 border-indigo-200/40 dark:bg-indigo-950/10 dark:border-indigo-900/30 text-slate-850 dark:text-white'
                    : 'bg-slate-50/40 border-slate-200/20 dark:bg-slate-900/10 dark:border-slate-900/40 text-slate-400 opacity-60'
                }`}
                title={ach.description}
              >
                <div className="text-xl shrink-0 select-none flex items-center justify-center">
                  {isUnlocked ? ach.emoji : '🔒'}
                </div>
                <div className="min-w-0 flex flex-col justify-center">
                  <span className="text-[9px] font-black leading-snug truncate">
                    {ach.name}
                  </span>
                  <span className="text-[7.5px] leading-tight text-slate-400 dark:text-slate-500 font-bold truncate mt-0.5">
                    {ach.description}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );

    if (keepList.length === 0) {
      return (
        <div className="flex flex-col h-full min-h-0 overflow-y-auto pr-1">
          <div className="flex flex-col items-center justify-center py-6 text-center gap-2">
            <Bookmark className="w-6 h-6 text-slate-350 dark:text-slate-655" />
            <p className="text-[10px] text-slate-450 dark:text-slate-500 max-w-[200px] leading-relaxed font-bold">
              キープしている理想郷はありません。詳細タブのしおりマークをクリックしてお気に入り登録しましょう！
            </p>
          </div>
          {achievementsBoard}
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-2 h-full min-h-0 overflow-y-auto pr-1">
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/80 pb-2 mb-1">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            キープリスト ({keepList.length}件)
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          {keepList.map((item, idx) => {
            return (
              <div
                key={idx}
                className="flex items-center justify-between p-2 bg-slate-50/50 hover:bg-indigo-50/30 dark:bg-slate-800/40 dark:hover:bg-indigo-950/10 border border-slate-200/50 hover:border-indigo-500/30 dark:border-slate-800/60 dark:hover:border-indigo-900/40 rounded-xl transition-all duration-300 shadow-sm"
              >
                <button
                  onClick={() => {
                    onSelectPrefecture(item.prefCode, item.year);
                  }}
                  className="flex-1 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-white">
                      {item.prefName}
                    </span>
                    <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500">
                      {item.year}年
                    </span>
                  </div>
                </button>
                <button
                  onClick={() => onToggleKeep(item.prefCode, item.prefName, item.year)}
                  className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                  title="削除"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
        {achievementsBoard}
      </div>
    );
  };

  const calculateWeightsFromAnswers = (ans: number[]): MetricWeights => {
    const newWeights: MetricWeights = {
      starbucksCount: 10,
      ramenCount: 10,
      attractiveness: 10,
      sunshineHours: 10,
      onsenCount: 10,
      hospitalCount: 10,
      pollenLevel: 10,
      childcareScore: 10,
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
          {quizResultPref && (
            <div className="flex flex-col gap-1.5 w-full">
              <div className="grid grid-cols-2 gap-1.5 w-full">
                <button
                  onClick={() => onToggleKeep(quizResultPref.prefCode, quizResultPref.prefName, quizResultPref.year)}
                  className={`py-2 text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors border ${
                    keepList.some(item => item.prefCode === quizResultPref.prefCode && item.year === quizResultPref.year)
                      ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/20 dark:border-amber-900 dark:text-amber-400'
                      : 'bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-350'
                  }`}
                >
                  <Bookmark className="w-3 h-3" />
                  {keepList.some(item => item.prefCode === quizResultPref.prefCode && item.year === quizResultPref.year) ? 'キープ中' : 'キープ登録'}
                </button>
                <button
                  onClick={() => handleGenerateCertificate(quizResultPref)}
                  className="py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-750 dark:bg-indigo-950 dark:hover:bg-indigo-900 dark:border-indigo-900 dark:text-indigo-400 text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <Sparkles className="w-3 h-3" />
                  認定証保存
                </button>
              </div>
            </div>
          )}

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
        {
          label: '医療充実度',
          value: formatValue(prefecture.hospitalCount, '施設'),
          score: prefecture.hospitalScore,
          icon: Activity,
          color: 'bg-cyan-500',
          textColor: 'text-cyan-550',
          bgColor: 'bg-cyan-50 dark:bg-cyan-950/10',
          borderColor: 'border-cyan-100 dark:border-cyan-900/20',
        },
        {
          label: '子育て環境',
          value: formatValue(prefecture.childcareScore, '点'),
          score: prefecture.childcareScoreScore,
          icon: Heart,
          color: 'bg-pink-500',
          textColor: 'text-pink-550 dark:text-pink-400',
          bgColor: 'bg-pink-50 dark:bg-pink-950/10',
          borderColor: 'border-pink-100 dark:border-pink-900/20',
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
          label: '温泉の多さ',
          value: formatValue(prefecture.onsenCount, '箇所'),
          score: prefecture.onsenScore,
          icon: Flame,
          color: 'bg-red-500',
          textColor: 'text-red-550 dark:text-red-400',
          bgColor: 'bg-red-50 dark:bg-red-950/10',
          borderColor: 'border-red-100 dark:border-red-900/20',
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
          textColor: 'text-yellow-550 dark:text-yellow-400',
          bgColor: 'bg-yellow-50 dark:bg-yellow-950/10',
          borderColor: 'border-yellow-100 dark:border-yellow-900/20',
        },
        {
          label: '花粉の少なさ',
          value: formatValue(prefecture.pollenLevel, 'クラス'),
          score: prefecture.pollenScore,
          icon: Wind,
          color: 'bg-teal-500',
          textColor: 'text-teal-650',
          bgColor: 'bg-teal-50 dark:bg-teal-950/10',
          borderColor: 'border-teal-100 dark:border-teal-900/20',
        },
      ]
    : [];

  return (
    <div className="glass-neon-border rounded-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] h-full flex flex-col overflow-hidden transition-all duration-300">
      {/* タブヘッダー */}
      <div className="flex bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm border-b border-white/20 dark:border-indigo-500/20 px-4 pt-3 overflow-x-auto gap-1">
        <button
          onClick={() => onActiveTabChange('details')}
          className={`pb-2.5 px-2 text-xs font-bold transition-all duration-300 relative flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
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

        {prefectures.length === 1 && (
          <button
            onClick={() => onActiveTabChange('fire')}
            className={`pb-2.5 px-2 text-xs font-bold transition-all duration-300 relative flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'fire'
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <Coins className="w-3.5 h-3.5 text-amber-500" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-rose-500">FIRE試算</span>
            {activeTab === 'fire' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
            )}
          </button>
        )}

        {prefectures.length >= 2 && (
          <button
            onClick={() => onActiveTabChange('multibase')}
            className={`pb-2.5 px-2 text-xs font-bold transition-all duration-300 relative flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'multibase'
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>多拠点設計</span>
            {activeTab === 'multibase' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
            )}
          </button>
        )}

        {prefectures.length === 3 && (
          <button
            onClick={() => onActiveTabChange('nomad')}
            className={`pb-2.5 px-2 text-xs font-bold transition-all duration-300 relative flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'nomad'
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-emerald-500" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-cyan-500">ノマドルート</span>
            {activeTab === 'nomad' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
            )}
          </button>
        )}

        <button
          onClick={() => onActiveTabChange('weights')}
          className={`pb-2.5 px-2 text-xs font-bold transition-all duration-300 relative flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
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

        {prefectures.length === 1 && (
          <button
            onClick={() => onActiveTabChange('quiz')}
            className={`pb-2.5 px-2 text-xs font-bold transition-all duration-300 relative flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
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
        )}

        <button
          onClick={() => onActiveTabChange('ai')}
          className={`pb-2.5 px-2 text-xs font-bold transition-all duration-300 relative flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'ai'
              ? 'text-indigo-600 dark:text-indigo-400'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <Brain className="w-3.5 h-3.5" />
          <span>AI相談</span>
          {activeTab === 'ai' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
          )}
        </button>

        <button
          onClick={() => onActiveTabChange('keep')}
          className={`pb-2.5 px-2 text-xs font-bold transition-all duration-300 relative flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'keep'
              ? 'text-indigo-600 dark:text-indigo-400'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>キープ</span>
          {activeTab === 'keep' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
          )}
        </button>
      </div>

      {/* タブコンテンツ */}
      <div className="flex-1 p-5 overflow-hidden">
        {activeTab === 'details' ? (
          prefectures.length === 2 ? (
            (() => {
              const pref1 = prefectures[0];
              const pref2 = prefectures[1];

              // Duel stats
              const duelCategories = [
                { name: '住居費安さ', p1: pref1.landPriceScore || 50, p2: pref2.landPriceScore || 50 },
                { name: '生活利便', p1: pref1.populationScore || 50, p2: pref2.populationScore || 50 },
                { name: 'カフェ充実', p1: pref1.starbucksScore || 50, p2: pref2.starbucksScore || 50 },
                { name: 'グルメ充実', p1: pref1.ramenScore || 50, p2: pref2.ramenScore || 50 },
                { name: '気候快適さ', p1: pref1.sunshineHoursScore || 50, p2: pref2.sunshineHoursScore || 50 },
              ];

              let p1Wins = 0;
              let p2Wins = 0;
              duelCategories.forEach(cat => {
                if (cat.p1 > cat.p2) p1Wins++;
                else if (cat.p2 > cat.p1) p2Wins++;
              });

              const winner = p1Wins > p2Wins ? pref1 : p2Wins > p1Wins ? pref2 : null;

              let battleCommentary = '';
              if (winner) {
                const isP1Winner = winner.prefCode === pref1.prefCode;
                const winnerName = winner.prefName;
                const loserName = isP1Winner ? pref2.prefName : pref1.prefName;
                const winDiff = Math.abs(p1Wins - p2Wins);
                
                if (winDiff >= 3) {
                  battleCommentary = `🏆 【${winnerName}】の圧倒的勝利！ 【${loserName}】の追随を許さない特化スペックでねじ伏せました。`;
                } else {
                  battleCommentary = `⚔️ 接戦の末、【${winnerName}】の勝利！ お互いの強みがぶつかり合う見事なスペックバトルでした。`;
                }
              } else {
                battleCommentary = `🤝 引き分け！ 互角の実力を持つ、非常にバランスの良いライバル関係です。`;
              }

              // Synergy Compatibility
              const urban1 = ((pref1.populationScore || 50) + (pref1.listedCompanyScore || 50)) / 2;
              const chill1 = ((pref1.landPriceScore || 50) + (pref1.attractivenessScore || 50) + (pref1.sunshineHoursScore || 50)) / 3;
              const urban2 = ((pref2.populationScore || 50) + (pref2.listedCompanyScore || 50)) / 2;
              const chill2 = ((pref2.landPriceScore || 50) + (pref2.attractivenessScore || 50) + (pref2.sunshineHoursScore || 50)) / 3;

              const contrast = Math.abs(urban1 - urban2) + Math.abs(chill1 - chill2);
              const rawCompat = 65 + Math.min(contrast * 0.7, 34);
              const compatibility = Math.min(Math.round(rawCompat), 99);

              let rank: 'SSS' | 'SS' | 'S' | 'A' | 'B' | 'C' = 'C';
              if (compatibility >= 95) rank = 'SSS';
              else if (compatibility >= 90) rank = 'SS';
              else if (compatibility >= 80) rank = 'S';
              else if (compatibility >= 70) rank = 'A';
              else if (compatibility >= 60) rank = 'B';

              let dualComment = '';
              if (rank === 'SSS' || rank === 'SS') {
                dualComment = `🌟 完璧な補完関係！ 平日は大都市の刺激的な環境でキャリアを積み、週末は豊かな自然と穏やかな気候のもう一つの拠点で完全にリフレッシュする、究極のオンオフ切り替え型デュアルライフが実現できます。`;
              } else if (rank === 'S' || rank === 'A') {
                dualComment = `🏡 バランスの取れた組み合わせ！ 双方に独自の良さがあり、ほどよく生活圏を分けることで、それぞれの都市のカルチャーや自然の恵みをいいとこ取りした心地よい2拠点生活を送れるでしょう。`;
              } else {
                dualComment = `🎒 同系統のペア！ 両者のスペックや生活環境が似ているため、2拠点生活としてのメリハリは少なめかもしれません。移動コストを考慮しつつ、ローカルカルチャーの違いを楽しむ旅行型滞在がおすすめです。`;
              }

              return (
                <div className="flex flex-col h-full min-h-0">
                  {/* サブタブ */}
                  <div className="flex bg-slate-100/60 dark:bg-slate-950/40 p-1 rounded-lg gap-1 mb-3 shrink-0">
                    <button
                      onClick={() => setCompTab('radar')}
                      className={`flex-1 py-1 text-[10px] font-extrabold rounded transition-all cursor-pointer ${compTab === 'radar' ? 'bg-white dark:bg-slate-800 text-indigo-650 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'}`}
                    >
                      レーダー
                    </button>
                    <button
                      onClick={() => setCompTab('duel')}
                      className={`flex-1 py-1 text-[10px] font-extrabold rounded transition-all cursor-pointer ${compTab === 'duel' ? 'bg-white dark:bg-slate-800 text-indigo-650 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'}`}
                    >
                      VSデュエル ⚔️
                    </button>
                    <button
                      onClick={() => setCompTab('dual')}
                      className={`flex-1 py-1 text-[10px] font-extrabold rounded transition-all cursor-pointer ${compTab === 'dual' ? 'bg-white dark:bg-slate-800 text-indigo-650 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'}`}
                    >
                      2拠点相性 🏡
                    </button>
                  </div>

                  <div className="flex-1 min-h-0 overflow-y-auto pr-1 flex flex-col gap-4">
                    {compTab === 'radar' ? (
                      <div className="shrink-0 h-[220px]">
                        <ComparisonRadarChart prefecture1={pref1} prefecture2={pref2} />
                      </div>
                    ) : compTab === 'duel' ? (
                      <div className="flex flex-col gap-3 h-full min-h-0 overflow-y-auto pr-1">
                        {/* VS ヘッダー */}
                        <div className="flex items-center justify-between px-2 py-3 bg-gradient-to-r from-red-50/50 via-slate-50/50 to-blue-50/50 dark:from-red-950/10 dark:via-slate-900/10 dark:to-blue-950/10 border border-slate-200/40 dark:border-slate-800/40 rounded-xl relative overflow-hidden shrink-0">
                          <div className="flex-1 flex flex-col items-center">
                            <span className="text-[8px] font-black text-rose-500 dark:text-rose-400 uppercase tracking-widest">1P</span>
                            <span className="text-sm font-black text-slate-800 dark:text-white truncate max-w-[80px]">{pref1.prefName}</span>
                          </div>
                          <div className="px-3 py-1 bg-slate-900 text-amber-500 text-xs font-black rounded-lg border border-slate-700 shadow animate-pulse italic shrink-0">
                            VS
                          </div>
                          <div className="flex-1 flex flex-col items-center">
                            <span className="text-[8px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">2P</span>
                            <span className="text-sm font-black text-slate-800 dark:text-white truncate max-w-[80px]">{pref2.prefName}</span>
                          </div>
                        </div>

                        {/* 対戦内容 */}
                        <div className="flex flex-col gap-3 my-1">
                          {duelCategories.map((cat, idx) => {
                            const p1Percent = Math.max(Math.min((cat.p1 / 100) * 100, 100), 5);
                            const p2Percent = Math.max(Math.min((cat.p2 / 100) * 100, 100), 5);
                            return (
                              <div key={idx} className="space-y-1">
                                <div className="flex justify-between items-center text-[10px] px-1 font-bold text-slate-500 dark:text-slate-400">
                                  <span className={cat.p1 > cat.p2 ? "text-rose-550 dark:text-rose-400" : ""}>{cat.p1.toFixed(0)}点</span>
                                  <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded text-[9px] text-slate-600 dark:text-slate-350">{cat.name}</span>
                                  <span className={cat.p2 > cat.p1 ? "text-indigo-550 dark:text-indigo-400" : ""}>{cat.p2.toFixed(0)}点</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {/* Left HP Bar */}
                                  <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-l overflow-hidden flex justify-end">
                                    <div 
                                      className={`h-full bg-gradient-to-l from-rose-500 to-rose-400 transition-all duration-500 ${cat.p1 > cat.p2 ? 'brightness-110' : 'opacity-60'}`} 
                                      style={{ width: `${p1Percent}%` }} 
                                    />
                                  </div>
                                  {/* Divider / Win Indicator */}
                                  <div className="w-10 text-center text-[8px] font-black shrink-0">
                                    {cat.p1 > cat.p2 ? (
                                      <span className="text-rose-500 animate-pulse bg-rose-50 dark:bg-rose-950/20 px-1 rounded">◀ WIN</span>
                                    ) : cat.p2 > cat.p1 ? (
                                      <span className="text-indigo-500 animate-pulse bg-indigo-50 dark:bg-indigo-950/20 px-1 rounded">WIN ▶</span>
                                    ) : (
                                      <span className="text-slate-400 font-normal">DRAW</span>
                                    )}
                                  </div>
                                  {/* Right HP Bar */}
                                  <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-r overflow-hidden flex justify-start">
                                    <div 
                                      className={`h-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-500 ${cat.p2 > cat.p1 ? 'brightness-110' : 'opacity-60'}`} 
                                      style={{ width: `${p2Percent}%` }} 
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* バトルコメンタリー */}
                        <div className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-850/60 rounded-xl mt-1 space-y-1 text-left shrink-0">
                          <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-450 dark:text-slate-500">
                            <Flame className="w-3 h-3 text-amber-500" />
                            <span>BATTLE RESULT</span>
                          </div>
                          <p className="text-[10px] font-bold text-slate-650 dark:text-slate-350 leading-relaxed">
                            {battleCommentary}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4 h-full min-h-0 overflow-y-auto pr-1 justify-center py-2 items-center">
                        {/* 相性パーセント */}
                        <div className="flex flex-col items-center gap-1 text-center">
                          <div className="relative flex items-center justify-center">
                            <svg className="w-20 h-20 transform -rotate-90">
                              <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="5" fill="transparent" className="text-slate-100 dark:text-slate-800" />
                              <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="5" fill="transparent" strokeDasharray={`${2 * Math.PI * 34}`} strokeDashoffset={`${2 * Math.PI * 34 * (1 - compatibility / 100)}`} className="text-rose-500 dark:text-rose-450 transition-all duration-1000" />
                            </svg>
                            <div className="absolute flex flex-col items-center">
                              <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest">MATCH</span>
                              <span className="text-lg font-black text-slate-800 dark:text-white leading-none mt-0.5">{compatibility}%</span>
                              <span className="text-[9px] font-black text-rose-500 dark:text-rose-400 mt-0.5">{rank}</span>
                            </div>
                          </div>
                          <div className="space-y-0.5 mt-1">
                            <h4 className="text-xs font-black text-slate-850 dark:text-white">
                              {pref1.prefName} &times; {pref2.prefName}
                            </h4>
                            <p className="text-[9px] text-slate-400">多拠点ライフ相性診断</p>
                          </div>
                        </div>

                        {/* コメンタリー */}
                        <div className="p-3 bg-gradient-to-br from-indigo-50/20 to-purple-50/10 dark:from-indigo-950/10 dark:to-purple-950/5 border border-indigo-150/30 dark:border-indigo-900/20 rounded-xl space-y-1 text-left w-full">
                          <div className="flex items-center gap-1.5 text-[9px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                            <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                            <span>診断分析</span>
                          </div>
                          <p className="text-[10px] font-bold text-slate-650 dark:text-slate-350 leading-relaxed">
                            {dualComment}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* 25年時系列推移折れ線グラフ */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/40">
                      <TrendLineChart
                        prefCodes={prefectures.map(p => p.prefCode)}
                        allPrefectures={allPrefectures}
                        currentMetric={currentMetric}
                      />
                    </div>
                  </div>
                </div>
              );
            })()
          ) : prefecture ? (
            <div className="flex flex-col gap-4 h-full">
              {/* ヘッダー部分 */}
              {(() => {
                const catchphrase = generatePrefectureCatchphrase(prefecture);
                const isKeeped = keepList.some(item => item.prefCode === prefecture.prefCode && item.year === prefecture.year);
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
                          <motion.button
                            whileHover={{ scale: 1.15, rotate: 10 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              onToggleKeep(prefecture.prefCode, prefecture.prefName, prefecture.year);
                              if (!isKeeped) {
                                const rect = e.currentTarget.getBoundingClientRect();
                                import('canvas-confetti').then((confetti) => {
                                  confetti.default({
                                    particleCount: 30,
                                    spread: 40,
                                    origin: { 
                                      x: (rect.left + rect.width / 2) / window.innerWidth,
                                      y: (rect.top + rect.height / 2) / window.innerHeight
                                    },
                                    colors: ['#f59e0b', '#fbbf24', '#fef3c7'],
                                    ticks: 50
                                  });
                                });
                              }
                            }}
                            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800/40 text-slate-400 hover:text-amber-500 transition-all cursor-pointer flex items-center justify-center"
                            title={isKeeped ? 'キープリストから削除' : 'キープリストに追加'}
                          >
                            <Bookmark className={`w-4 h-4 transition-all duration-300 ${isKeeped ? 'fill-amber-500 text-amber-500 scale-110' : 'text-slate-400 dark:text-slate-500'}`} />
                          </motion.button>
                          
                          <button
                            onClick={() => handleGenerateCertificate()}
                            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800/40 text-slate-400 hover:text-indigo-500 transition-all cursor-pointer flex items-center justify-center ml-0.5"
                            title="移住認定証（PNG画像）を保存"
                          >
                            <Sparkles className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                          </button>
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

                    <div className="px-2.5 py-1.5 bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200/40 dark:border-slate-800/40 rounded-xl flex flex-col gap-1.5">
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-normal italic text-left">
                        " {catchphrase.text} "
                      </p>
                      <div className="text-[9px] text-slate-400 dark:text-slate-550 border-t border-slate-200/30 dark:border-slate-850/40 pt-1 text-left flex items-start gap-1 font-semibold leading-relaxed">
                        <span className="shrink-0 text-amber-500">💡</span>
                        <span>{catchphrase.advice}</span>
                      </div>
                    </div>

                    {/* 移住スタイルバッジ */}
                    {weights && (() => {
                      const style = classifyPersonality(weights, prefecture);
                      return (
                        <div className="flex items-center gap-1.5 bg-indigo-50/30 dark:bg-indigo-950/15 border border-indigo-150/20 dark:border-indigo-900/20 px-2.5 py-1.5 rounded-xl w-fit shrink-0 mt-1">
                          <span className="text-sm select-none">{style.emoji}</span>
                          <span className="text-[10px] font-black text-indigo-650 dark:text-indigo-400">
                            移住スタイル: {style.name}
                          </span>
                        </div>
                      );
                    })()}
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

                {/* 25年時系列推移折れ線グラフ */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/40">
                  <TrendLineChart
                    prefCodes={prefectures.map(p => p.prefCode)}
                    allPrefectures={allPrefectures}
                    currentMetric={currentMetric}
                  />
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
        ) : activeTab === 'quiz' ? (
          renderQuiz()
        ) : activeTab === 'keep' ? (
          renderKeepList()
        ) : activeTab === 'ai' ? (
          renderAIConsultation()
        ) : activeTab === 'fire' && prefecture ? (
          <div className="flex flex-col gap-4 h-full min-h-0 overflow-y-auto pr-1">
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
              <h3 className="text-sm font-black text-indigo-900 dark:text-indigo-200 mb-2 flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-500" />
                UTOPIA FIRE SIMULATOR
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-350 mb-4 leading-relaxed">
                現在の東京圏での生活を続ける場合と、{prefecture.prefName}へ移住した場合の35年間の資産推移シミュレーションです。
              </p>
              
              {(() => {
                const sim = simulateFire(30, 600, 500, 5000, prefecture);
                return (
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
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={sim.trajectory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorTokyo" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorUtopia" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.5}/>
                              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                          <XAxis dataKey="age" tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                          <YAxis 
                            tick={{fontSize: 10}} 
                            tickLine={false} 
                            axisLine={false} 
                            width={50}
                            tickFormatter={(v) => Number(v) >= 10000 ? `${(Number(v) / 10000).toFixed(1).replace('.0', '')}億` : `${v}万`} 
                          />
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                            itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                            formatter={(value: any, name: any) => [
                              Number(value) >= 10000 
                                ? `${(Number(value) / 10000).toFixed(1).replace('.0', '')}億円` 
                                : `${Number(value).toLocaleString()}万円`,
                              name
                            ]}
                          />
                          <Area type="monotone" dataKey="tokyoAssets" name="東京での資産" stroke="#94a3b8" fillOpacity={1} fill="url(#colorTokyo)" />
                          <Area type="monotone" dataKey="utopiaAssets" name={`${prefecture.prefName}での資産`} stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorUtopia)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                );
              })()}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setShowBoardingPass(true);
                import('canvas-confetti').then((confetti) => {
                  confetti.default({
                    particleCount: 150,
                    spread: 80,
                    origin: { y: 0.6 },
                    colors: ['#4f46e5', '#ec4899', '#f59e0b']
                  });
                });
              }}
              className="w-full py-4 mt-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-sm rounded-2xl shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5 animate-pulse" />
              {prefecture.prefName}への移住を決断する
            </motion.button>
          </div>
        ) : activeTab === 'nomad' && prefectures.length === 3 ? (
          <div className="flex flex-col gap-4 h-full min-h-0 overflow-y-auto pr-1">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-500" />
                NOMAD SEASONAL ROUTE
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                選択された3拠点の気候データから、最も快適に過ごせる「季節ごとの周遊ルート」を生成しました。
              </p>
              
              <div className="flex flex-col gap-3 relative before:absolute before:inset-y-2 before:left-[19px] before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                {generateNomadRoute(prefectures).map((route, i) => (
                  <div key={i} className="flex gap-3 relative z-10">
                    <div className="w-10 h-10 shrink-0 bg-white dark:bg-slate-800 rounded-full border-4 border-slate-50 dark:border-slate-900 flex items-center justify-center text-lg shadow-sm">
                      {route.icon}
                    </div>
                    <div className="flex-1 bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                      <div className="flex justify-between items-end mb-1">
                        <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">{route.season}</span>
                        <span className="font-black text-slate-800 dark:text-slate-200">{route.pref.prefName}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed mt-2">{route.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          renderMultiBasePlanner()
        )}
      </div>

      {showBoardingPass && prefecture && (
        <UtopiaBoardingPass prefecture={prefecture} onClose={() => setShowBoardingPass(false)} />
      )}
    </div>
  );
};

interface TrendLineChartProps {
  prefCodes: number[];
  allPrefectures: PrefectureData[];
  currentMetric: MetricType;
}

export const TrendLineChart: React.FC<TrendLineChartProps> = ({
  prefCodes,
  allPrefectures,
  currentMetric,
}) => {
  if (prefCodes.length === 0) return null;

  const years = Array.from(new Set(allPrefectures.map((p) => p.year))).sort((a, b) => a - b);
  if (years.length <= 1) return null;

  const prefDataMap = prefCodes.map((code) => {
    const history = allPrefectures
      .filter((p) => p.prefCode === code)
      .sort((a, b) => a.year - b.year);
    const name = history[0]?.prefName || '不明';
    return { code, name, history };
  });

  const getMetricValue = (pref: PrefectureData): number => {
    const val = (pref as any)[currentMetric];
    if (val === undefined || isNaN(val)) {
      const scoreKey = (pref as any)[currentMetric + 'Score'];
      return scoreKey !== undefined ? scoreKey : 50;
    }
    return val;
  };

  const allValues = prefDataMap.flatMap((d) => d.history.map(getMetricValue));
  const dataMin = allValues.length > 0 ? Math.min(...allValues) : 0;
  const dataMax = allValues.length > 0 ? Math.max(...allValues) : 100;
  const diff = dataMax - dataMin;
  const minVal = dataMin === dataMax ? Math.max(0, dataMin - 10) : Math.max(0, dataMin - diff * 0.15);
  const maxVal = dataMin === dataMax ? dataMax + 10 : dataMax + diff * 0.15;
  const valRange = maxVal - minVal || 1;

  const svgWidth = 320;
  const svgHeight = 110;
  const paddingLeft = 35;
  const paddingRight = 10;
  const paddingTop = 10;
  const paddingBottom = 15;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const getX = (year: number) => {
    const yearIdx = years.indexOf(year);
    if (yearIdx === -1) return paddingLeft;
    return paddingLeft + (yearIdx / (years.length - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    return paddingTop + chartHeight - ((val - minVal) / valRange) * chartHeight;
  };

  const colors = [
    'stroke-indigo-500',
    'stroke-orange-500',
    'stroke-emerald-500',
  ];

  const fillColors = [
    'fill-indigo-500',
    'fill-orange-500',
    'fill-emerald-500',
  ];

  // Helper to format values elegantly
  const formatLabel = (val: number) => {
    if (val >= 10000) return `${(val / 10000).toFixed(0)}万`;
    if (val > 1000) return `${(val / 1000).toFixed(1)}k`;
    return val.toLocaleString(undefined, { maximumFractionDigits: 0 });
  };

  return (
    <div className="bg-slate-50/50 dark:bg-slate-900/40 p-3 border border-slate-200/50 dark:border-slate-800/60 rounded-xl flex flex-col gap-2 mt-2">
      <div className="flex justify-between items-center px-0.5">
        <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
          📈 25年間の歴史的データ推移
        </span>
      </div>

      <div className="relative w-full h-[110px]">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
          {/* Grid lines */}
          <line x1={paddingLeft} y1={paddingTop} x2={svgWidth - paddingRight} y2={paddingTop} stroke="currentColor" className="text-slate-100 dark:text-slate-800/30" strokeDasharray="3,3" />
          <line x1={paddingLeft} y1={paddingTop + chartHeight / 2} x2={svgWidth - paddingRight} y2={paddingTop + chartHeight / 2} stroke="currentColor" className="text-slate-100 dark:text-slate-800/30" strokeDasharray="3,3" />
          <line x1={paddingLeft} y1={paddingTop + chartHeight} x2={svgWidth - paddingRight} y2={paddingTop + chartHeight} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />

          {/* Y Axis labels */}
          <text x={paddingLeft - 5} y={paddingTop + 4} textAnchor="end" className="text-[8px] fill-slate-400 dark:fill-slate-500 font-bold tabular-nums">
            {formatLabel(maxVal)}
          </text>
          <text x={paddingLeft - 5} y={paddingTop + chartHeight + 3} textAnchor="end" className="text-[8px] fill-slate-400 dark:fill-slate-500 font-bold tabular-nums">
            {formatLabel(minVal)}
          </text>

          {/* X Axis labels (2000, 2012, 2024) */}
          <text x={getX(2000)} y={svgHeight - 2} textAnchor="middle" className="text-[8px] fill-slate-400 dark:fill-slate-500 font-bold">2000</text>
          <text x={getX(2012)} y={svgHeight - 2} textAnchor="middle" className="text-[8px] fill-slate-400 dark:fill-slate-500 font-bold">2012</text>
          <text x={getX(2024)} y={svgHeight - 2} textAnchor="middle" className="text-[8px] fill-slate-400 dark:fill-slate-500 font-bold">2024</text>

          {/* Paths for each prefecture */}
          {prefDataMap.map((pref, pIdx) => {
            const points = pref.history.map((h) => {
              const x = getX(h.year);
              const y = getY(getMetricValue(h));
              return `${x},${y}`;
            });
            const pathData = `M ${points.join(' L ')}`;
            const colorClass = colors[pIdx % colors.length];
            const fillColorClass = fillColors[pIdx % fillColors.length];

            return (
              <g key={pref.code}>
                <path
                  d={pathData}
                  fill="none"
                  className={`${colorClass} transition-all duration-500`}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Last point dot */}
                {pref.history.length > 0 && (
                  <circle
                    cx={getX(pref.history[pref.history.length - 1].year)}
                    cy={getY(getMetricValue(pref.history[pref.history.length - 1]))}
                    r="3"
                    className={`${fillColorClass} stroke-white dark:stroke-slate-900`}
                    strokeWidth="1"
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex gap-2.5 justify-center items-center flex-wrap pt-0.5 border-t border-slate-100 dark:border-slate-800/40">
        {prefDataMap.map((pref, pIdx) => {
          const bgColors = [
            'bg-indigo-500',
            'bg-orange-500',
            'bg-emerald-500',
          ];
          const colorClass = bgColors[pIdx % bgColors.length];
          return (
            <div key={pref.code} className="flex items-center gap-1 text-[9px] font-bold text-slate-500">
              <span className={`w-2 h-2 rounded-full ${colorClass}`} />
              <span>{pref.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
