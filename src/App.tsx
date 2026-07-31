import { useState, useEffect, Suspense, lazy } from 'react';
import { Sun, Moon, Map, Upload, X, Play, Pause } from 'lucide-react';
import { type MetricType, type PrefectureData } from './types/prefecture';
import { generatePrefectureCatchphrase } from './utils/catchphrase';
import { HISTORICAL_MILESTONES } from './data/milestones';
import { MetricSelector, METRIC_CONFIGS } from './components/MetricSelector';
import { JapanMap } from './components/JapanMap';
import { PrefectureDetailPanel } from './components/PrefectureDetailPanel';
import { RankingTable } from './components/RankingTable';
import { TopChart } from './components/TopChart';
const CsvUploader = lazy(() => import('./components/CsvUploader').then(module => ({ default: module.CsvUploader })));
import { TimelineControl } from './components/TimelineControl';
import { NewsTicker } from './components/NewsTicker';
import { WeatherEffects } from './components/WeatherEffects';
import { playScanSound, playGachaSound, playGachaWinSound, playClickSound } from './utils/audio';
import sampleCsvUrl from './data/sample_prefecture_data.csv?url';
import { checkNewAchievements, type UserStats, type Achievement } from './utils/achievements';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

import { useDarkMode } from './hooks/useDarkMode';
import { useUrlState } from './hooks/useUrlState';
import { usePrefectureData } from './hooks/usePrefectureData';
import { useKonamiCode } from './hooks/useKonamiCode';
import { playRetroUnlockSound, startRetroBGM, stopRetroBGM } from './utils/audio';

function App() {
  const [showUploader, setShowUploader] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isRetroMode, setIsRetroMode] = useState<boolean>(false);

  // ガチャ状態
  const [showGacha, setShowGacha] = useState<boolean>(false);
  const [gachaRunning, setGachaRunning] = useState<boolean>(false);
  const [gachaDisplayPref, setGachaDisplayPref] = useState<string>('???');
  const [gachaResult, setGachaResult] = useState<any>(null);
  const [detailPanelActiveTab, setDetailPanelActiveTab] = useState<'details' | 'weights' | 'quiz' | 'keep' | 'ai' | 'multibase' | 'fire' | 'nomad'>('details');
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('fctx_unlocked_achievements');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [userStats, setUserStats] = useState<UserStats>(() => {
    const defaultStats: UserStats = {
      gachaCount: 0,
      keepCount: 0,
      maxSavings: 0,
      maxOnsenScore: 0,
      maxPollenScore: 0,
      historyChecked: false,
    };
    try {
      const saved = localStorage.getItem('fctx_user_stats');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            gachaCount: typeof parsed.gachaCount === 'number' ? parsed.gachaCount : 0,
            keepCount: typeof parsed.keepCount === 'number' ? parsed.keepCount : 0,
            maxSavings: typeof parsed.maxSavings === 'number' ? parsed.maxSavings : 0,
            maxOnsenScore: typeof parsed.maxOnsenScore === 'number' ? parsed.maxOnsenScore : 0,
            maxPollenScore: typeof parsed.maxPollenScore === 'number' ? parsed.maxPollenScore : 0,
            historyChecked: typeof parsed.historyChecked === 'boolean' ? parsed.historyChecked : false,
          };
        }
      }
    } catch (e) {
      console.error(e);
    }
    return defaultStats;
  });

  const [achievementToast, setAchievementToast] = useState<Achievement | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('fctx_unlocked_achievements', JSON.stringify(unlockedAchievements));
    } catch (e) {
      console.error(e);
    }
  }, [unlockedAchievements]);

  useEffect(() => {
    try {
      localStorage.setItem('fctx_user_stats', JSON.stringify(userStats));
    } catch (e) {
      console.error(e);
    }
  }, [userStats]);

  // Achievement unlock side-effect
  useEffect(() => {
    const newlyUnlocked = checkNewAchievements(userStats, unlockedAchievements);
    if (newlyUnlocked.length > 0) {
      const newIds = newlyUnlocked.map(a => a.id);
      setUnlockedAchievements(curr => [...curr, ...newIds]);
      setAchievementToast(newlyUnlocked[0]);
      
      // 実績解除コンフェッティ！
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4f46e5', '#10b981', '#f59e0b']
      });

      const timer = setTimeout(() => { setAchievementToast(null); }, 5000);
      return () => clearTimeout(timer);
    }
  }, [achievementToast]);

  // Retro RPG Mode Konami Code Hook
  useKonamiCode(() => {
    setIsRetroMode(prev => {
      const next = !prev;
      if (next) {
        playRetroUnlockSound();
        // Give an achievement for finding the secret
        setUnlockedAchievements(curr => {
          if (!curr.includes('retro_gamer')) return [...curr, 'retro_gamer'];
          return curr;
        });
      }
      return next;
    });
  });

  // Apply retro mode to body and manage BGM
  useEffect(() => {
    if (isRetroMode) {
      document.body.classList.add('retro-mode');
      startRetroBGM();
    } else {
      document.body.classList.remove('retro-mode');
      stopRetroBGM();
    }
  }, [isRetroMode]);

  const triggerUnlockCheck = (updater: Partial<UserStats> | ((prev: UserStats) => Partial<UserStats>)) => {
    setUserStats(prev => {
      const updates = typeof updater === 'function' ? updater(prev) : updater;
      return { ...prev, ...updates };
    });
  };
  const [keepList, setKeepList] = useState<{ prefCode: number; prefName: string; year: number }[]>(() => {
    try {
      const saved = localStorage.getItem('fctx_keep_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('fctx_keep_list', JSON.stringify(keepList));
    } catch (e) {
      console.error(e);
    }
  }, [keepList]);

  const handleToggleKeep = (prefCode: number, prefName: string, year: number) => {
    setKeepList((prev) => {
      const exists = prev.some((item) => item.prefCode === prefCode && item.year === year);
      const nextList = exists
        ? prev.filter((item) => !(item.prefCode === prefCode && item.year === year))
        : [...prev, { prefCode, prefName, year }];
      triggerUnlockCheck({ keepCount: nextList.length });
      return nextList;
    });
  };

  const { isDarkMode, setIsDarkMode } = useDarkMode();

  const {
    currentMetric,
    setCurrentMetric,
    selectedYear,
    setSelectedYear,
    selectedPrefCodes,
    setSelectedPrefCodes,
    initialUrlWeights,
    updateUrlWeights,
  } = useUrlState('totalScore', 2024, {
    starbucksCount: 10,
    ramenCount: 10,
    attractiveness: 10,
    sunshineHours: 10,
    onsenCount: 10,
    hospitalCount: 10,
    pollenLevel: 10,
    childcareScore: 10,
  });

  const {
    allPrefectures,
    weights,
    setWeights,
    loading,
    error,
    handleDataLoaded
  } = usePrefectureData(sampleCsvUrl, initialUrlWeights);

  const currentYearData = allPrefectures.filter((p) => p.year === selectedYear);
  const selectedPrefectures = selectedPrefCodes
    .map(code => currentYearData.find(p => p.prefCode === code))
    .filter((p): p is PrefectureData => p !== undefined);

  useEffect(() => {
    let interval: number;
    if (isPlaying) {
      interval = window.setInterval(() => {
        setCurrentMetric((prev) => {
          const metrics = Object.keys(METRIC_CONFIGS) as MetricType[];
          const nextIdx = (metrics.indexOf(prev) + 1) % metrics.length;
          playScanSound();
          return metrics[nextIdx];
        });
        
        // Randomly change the year occasionally for more dynamism
        if (Math.random() > 0.7) {
          setSelectedYear(prev => {
            const availableYears = Array.from(new Set(allPrefectures.map((p) => p.year))).sort((a, b) => a - b);
            if (availableYears.length === 0) return prev;
            const nextIdx = (availableYears.indexOf(prev) + 1) % availableYears.length;
            return availableYears[nextIdx];
          });
        }
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, setCurrentMetric, setSelectedYear, allPrefectures]);

  const [mapFlash, setMapFlash] = useState<string>('');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 40;
      const y = (e.clientY / window.innerHeight - 0.5) * 40;
      setMousePosition({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    if (selectedYear === 2008) {
      setMapFlash('flash-lehman');
      const timer = setTimeout(() => setMapFlash(''), 1500);
      triggerUnlockCheck({ historyChecked: true });
      return () => clearTimeout(timer);
    } else if (selectedYear === 2020) {
      setMapFlash('flash-covid');
      const timer = setTimeout(() => setMapFlash(''), 1500);
      triggerUnlockCheck({ historyChecked: true });
      return () => clearTimeout(timer);
    }
  }, [selectedYear]);

  useEffect(() => {
    if (selectedPrefCodes.length > 0) {
      const pref = allPrefectures.find(p => p.year === selectedYear && p.prefCode === selectedPrefCodes[0]);
      if (!pref) return;

      const onsenVal = pref.onsenScore || 0;
      const pollenVal = pref.pollenScore || 0;

      const tokyoBase = 160000;
      const landScore = pref.landPriceScore || 50;
      const rentFactor = 0.35 + 0.65 * ((100 - landScore) / 100);
      const rent = Math.round(80000 * rentFactor / 1000) * 1000;
      const isCold = [1, 2, 3, 4, 5, 6, 7, 15, 20].includes(pref.prefCode);
      const utility = 12000 + (isCold ? 12000 : 0);
      const isUrban = [13, 14, 27].includes(pref.prefCode);
      const transport = isUrban ? 8000 : 22000;
      const popScore = pref.populationScore || 50;
      const foodFactor = 0.88 + 0.12 * (popScore / 100);
      const food = Math.round(60000 * foodFactor / 1000) * 1000;
      const savings = tokyoBase - (rent + utility + transport + food);

      triggerUnlockCheck(prev => ({
        maxOnsenScore: Math.max(prev.maxOnsenScore, onsenVal),
        maxPollenScore: Math.max(prev.maxPollenScore, pollenVal),
        maxSavings: Math.max(prev.maxSavings, savings),
      }));
    }
  }, [selectedPrefCodes, selectedYear, allPrefectures]);

  const handleSelectPrefecture = (prefCode: number) => {
    setSelectedPrefCodes((prev) => {
      if (prev.includes(prefCode)) {
        return prev.filter((code) => code !== prefCode);
      }
      if (prev.length >= 3) {
        return [prev[1], prev[2], prefCode];
      }
      return [...prev, prefCode];
    });
  };

  const handleSelectPrefectureSingle = (prefCode: number, year?: number) => {
    setSelectedPrefCodes([prefCode]);
    if (year !== undefined) {
      setSelectedYear(year);
    }
  };

  const handleRollGacha = () => {
    if (gachaRunning) return;
    setGachaRunning(true);
    setGachaResult(null);
    playGachaSound();
    triggerUnlockCheck({ gachaCount: userStats.gachaCount + 1 });

    const prefList = currentYearData;
    if (prefList.length === 0) {
      setGachaRunning(false);
      return;
    }

    let iterations = 0;
    const interval = setInterval(() => {
      const randomPref = prefList[Math.floor(Math.random() * prefList.length)];
      setGachaDisplayPref(randomPref.prefName);
      iterations++;

      if (iterations > 12) {
        clearInterval(interval);
        const finalPref = prefList[Math.floor(Math.random() * prefList.length)];
        setGachaDisplayPref(finalPref.prefName);
        const catchphrase = generatePrefectureCatchphrase(finalPref);
        
        playGachaWinSound();
        setGachaResult({
          pref: finalPref,
          catchphrase: catchphrase
        });
        setGachaRunning(false);

        // レア度に応じて紙吹雪を飛ばす
        if (catchphrase.rarity === 'SSR' || catchphrase.rarity === 'SR') {
          const duration = 2000;
          const end = Date.now() + duration;
          const frame = () => {
            confetti({
              particleCount: 5,
              angle: 60,
              spread: 55,
              origin: { x: 0 },
              colors: catchphrase.rarity === 'SSR' ? ['#f59e0b', '#fbbf24'] : ['#818cf8', '#c7d2fe']
            });
            confetti({
              particleCount: 5,
              angle: 120,
              spread: 55,
              origin: { x: 1 },
              colors: catchphrase.rarity === 'SSR' ? ['#f59e0b', '#fbbf24'] : ['#818cf8', '#c7d2fe']
            });
            if (Date.now() < end) {
              requestAnimationFrame(frame);
            }
          };
          frame();
        }
      }
    }, 70);
  };

  const handleSelectGachaPrefecture = (pref: any, targetTab?: 'details' | 'weights' | 'quiz' | 'keep' | 'ai' | 'multibase' | 'fire' | 'nomad') => {
    handleSelectPrefectureSingle(pref.prefCode);
    
    const bestWeights = {
      starbucksCount: 10,
      ramenCount: 10,
      attractiveness: 10,
      sunshineHours: 10,
      onsenCount: 10,
      hospitalCount: 10,
      pollenLevel: 10,
      childcareScore: 10,
    };
    
    const scores = [
      { key: 'starbucksCount', val: pref.starbucksScore || 50 },
      { key: 'ramenCount', val: pref.ramenScore || 50 },
      { key: 'attractiveness', val: pref.attractivenessScore || 50 },
      { key: 'sunshineHours', val: pref.sunshineHoursScore || 50 },
      { key: 'onsenCount', val: pref.onsenScore || 50 },
      { key: 'hospitalCount', val: pref.hospitalScore || 50 },
      { key: 'pollenLevel', val: pref.pollenScore || 50 },
      { key: 'childcareScore', val: pref.childcareScoreScore || 50 }
    ];
    scores.sort((a, b) => b.val - a.val);
    
    bestWeights[scores[0].key as keyof typeof bestWeights] = 50;
    bestWeights[scores[1].key as keyof typeof bestWeights] = 30;
    bestWeights[scores[2].key as keyof typeof bestWeights] = 20;
    
    scores.slice(3).forEach(s => {
      bestWeights[s.key as keyof typeof bestWeights] = 5;
    });

    handleWeightsChange(bestWeights);
    setShowGacha(false);
    
    if (targetTab) {
      setDetailPanelActiveTab(targetTab);
    } else {
      setDetailPanelActiveTab('details');
    }
  };

  const handleWeightsChange = (newWeights: any) => {
    setWeights(newWeights);
    updateUrlWeights(newWeights);
  };

  const availableYears = Array.from(new Set(allPrefectures.map((p) => p.year))).sort((a, b) => a - b);

  if (loading && allPrefectures.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center transition-colors duration-300">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600 dark:text-slate-400 font-bold animate-pulse">
            データを読み込んでいます...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 transition-colors duration-300">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-lg border border-red-200/50 dark:border-red-950/50 max-w-md w-full text-center">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-950/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 dark:text-red-400 text-xl font-bold">!</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">エラーが発生しました</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  const getAmbientStyle = () => {
    if (selectedPrefectures.length === 0) return {};
    const pref = selectedPrefectures[0];
    const isCold = [1, 2, 3, 4, 5, 6, 7, 15, 20].includes(pref.prefCode);
    const isTropical = pref.prefCode === 47;
    const isUrban = [13, 14, 27].includes(pref.prefCode);

    if (isTropical) {
      return { background: 'radial-gradient(circle at top right, rgba(16, 185, 129, 0.15), transparent 60%), radial-gradient(circle at bottom left, rgba(14, 165, 233, 0.1), transparent 60%)' };
    }
    if (isCold) {
      return { background: 'radial-gradient(circle at top right, rgba(56, 189, 248, 0.15), transparent 60%), radial-gradient(circle at bottom left, rgba(148, 163, 184, 0.1), transparent 60%)' };
    }
    if (isUrban) {
      return { background: 'radial-gradient(circle at top right, rgba(99, 102, 241, 0.15), transparent 60%), radial-gradient(circle at bottom left, rgba(236, 72, 153, 0.1), transparent 60%)' };
    }
    return { background: 'radial-gradient(circle at top right, rgba(34, 197, 94, 0.15), transparent 60%), radial-gradient(circle at bottom left, rgba(245, 158, 11, 0.1), transparent 60%)' };
  };

  return (
    <div className="min-h-screen lg:h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300 flex flex-col lg:overflow-hidden relative overflow-hidden">
      {/* アンビエント・エフェクト */}
      <div 
        className="absolute inset-0 pointer-events-none transition-all duration-1000 ease-in-out z-0 opacity-100 mix-blend-multiply dark:mix-blend-screen"
        style={getAmbientStyle()}
      />
      {/* 動的フローティング・オーブ (パララックス対応) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div 
          animate={{ x: mousePosition.x * -1, y: mousePosition.y * -1 }}
          transition={{ type: "spring", damping: 15, stiffness: 100 }}
          className="absolute -top-20 -left-20 w-64 h-64 bg-indigo-500/30 dark:bg-indigo-600/20 rounded-full blur-[80px] animate-blob" 
        />
        <motion.div 
          animate={{ x: mousePosition.x * 1.5, y: mousePosition.y * 1.5 }}
          transition={{ type: "spring", damping: 15, stiffness: 80 }}
          className="absolute top-1/4 -right-20 w-80 h-80 bg-rose-500/20 dark:bg-rose-600/15 rounded-full blur-[100px] animate-blob-reverse animation-delay-2000" 
        />
        <motion.div 
          animate={{ x: mousePosition.x * -2, y: mousePosition.y * 2 }}
          transition={{ type: "spring", damping: 10, stiffness: 50 }}
          className="absolute -bottom-32 left-1/3 w-96 h-96 bg-emerald-500/20 dark:bg-emerald-500/15 rounded-full blur-[120px] animate-blob-slow animation-delay-4000" 
        />
      </div>

      {/* ナビゲーションバー (Glassmorphism) */}
      <header className="sticky top-0 z-[2000] glass-neon-border border-b border-white/20 dark:border-indigo-500/20 px-6 py-3 flex items-center justify-between shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-md shadow-indigo-600/20">
            <Map className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight bg-gradient-to-r from-indigo-600 to-rose-500 dark:from-indigo-400 dark:to-rose-450 bg-clip-text text-transparent">
              FCTX Japan Utopia Finder
            </h1>
            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold tracking-wider uppercase">
              移住・2拠点居住 理想郷診断システム
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              playClickSound();
              setShowGacha(true);
              setTimeout(() => {
                handleRollGacha();
              }, 100);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 dark:hover:bg-amber-500/30 rounded-lg border border-amber-200 dark:border-amber-500/50 cursor-pointer transition-all shadow-sm cyber-glow"
          >
            <span className="animate-bounce">🎰</span>
            <span>理想郷ガチャ</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              playClickSound();
              setShowUploader(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 dark:hover:bg-indigo-500/30 rounded-lg border border-indigo-200 dark:border-indigo-500/50 cursor-pointer transition-all cyber-glow"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">インポート</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              playClickSound();
              setIsPlaying(!isPlaying);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border cursor-pointer transition-all cyber-glow ${
              isPlaying 
                ? 'bg-rose-500/10 text-rose-600 border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/50' 
                : 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/50'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isPlaying ? 'デモ停止' : 'デモ再生'}</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1, rotate: 15 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              playClickSound();
              setIsDarkMode(!isDarkMode);
            }}
            className="p-2.5 rounded-lg border border-slate-200/50 dark:border-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
            aria-label="Toggle Dark Mode"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </motion.button>
        </div>
      </header>

      {/* メインダッシュボード */}
      <main className="w-full max-w-[2000px] mx-auto px-4 lg:px-6 py-4 flex-1 flex flex-col gap-4 lg:min-h-0 lg:overflow-hidden">
        
        {/* プロフェッショナルな3カラムレイアウト */}
        <div className="grid grid-cols-12 gap-4 flex-1 lg:min-h-0 lg:overflow-hidden">
          
          {/* 左カラム: データ選択と一覧 (col-span-12 lg:col-span-3) */}
          <div className="col-span-12 lg:col-span-3 flex flex-col gap-4 lg:h-full lg:min-h-0 lg:overflow-hidden">
            {/* 指標セレクター (コンパクト化) */}
            <MetricSelector
              currentMetric={currentMetric}
              onChange={(m: MetricType) => {
                playClickSound();
                setCurrentMetric(m);
              }}
            />

            {/* ランキングテーブル (左カラムに適合) */}
            <div className="flex-1 min-h-[400px] lg:min-h-0 flex flex-col lg:overflow-hidden">
              <RankingTable
                data={currentYearData}
                currentMetric={currentMetric}
                selectedPrefCodes={selectedPrefCodes}
                onSelectPrefecture={handleSelectPrefecture}
              />
            </div>
          </div>

          {/* 中央カラム: メイン可視化 (col-span-12 lg:col-span-6) */}
          <div className="col-span-12 lg:col-span-6 flex flex-col gap-4 lg:h-full lg:min-h-0 lg:overflow-hidden">
            {/* 日本地図 */}
            <div className="flex-1 min-h-[500px] lg:min-h-0 flex flex-col lg:overflow-hidden">
                <JapanMap
                  data={currentYearData}
                  currentMetric={currentMetric}
                  selectedPrefCodes={selectedPrefCodes}
                  onSelectPrefecture={handleSelectPrefecture}
                  selectedYear={selectedYear}
                  flashEffect={mapFlash}
                  isRetroMode={isRetroMode}
                />
            </div>

            {/* 歴史イベント解説カード */}
            {HISTORICAL_MILESTONES[selectedYear] && (
              <div className="bg-slate-50/70 dark:bg-slate-900/60 border-l-4 border-indigo-500 p-3.5 rounded-r-xl text-left shadow-sm flex items-start gap-3.5 transition-all duration-300">
                <div className="px-2 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 font-black text-xs shrink-0 mt-0.5 tracking-wider">
                  {selectedYear}年
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-black text-slate-800 dark:text-white leading-none mb-1">
                    {HISTORICAL_MILESTONES[selectedYear].title}
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                    {HISTORICAL_MILESTONES[selectedYear].event} <span className="text-indigo-600 dark:text-indigo-400 font-bold">{HISTORICAL_MILESTONES[selectedYear].impact}</span>
                  </p>
                </div>
              </div>
            )}

            {/* タイムラインコントロール */}
            {availableYears.length > 1 && (
              <TimelineControl
                years={availableYears}
                selectedYear={selectedYear}
                onYearChange={(y) => {
                  playClickSound();
                  setSelectedYear(y);
                }}
                isPlaying={isPlaying}
                onPlayingChange={setIsPlaying}
              />
            )}
          </div>

          {/* 右カラム: 詳細分析・設定 (col-span-12 lg:col-span-3) */}
          <div className="col-span-12 lg:col-span-3 flex flex-col gap-4 lg:h-full lg:min-h-0 lg:overflow-hidden">
            {/* 都道府県詳細 & ウェイト設定パネル (統合タブ) */}
            <div className="lg:h-[450px] min-h-[450px] flex flex-col lg:overflow-hidden">
              <PrefectureDetailPanel
                prefectures={selectedPrefectures}
                weights={weights}
                onWeightsChange={handleWeightsChange}
                allPrefectures={allPrefectures}
                onSelectPrefecture={handleSelectPrefectureSingle}
                keepList={keepList}
                onToggleKeep={handleToggleKeep}
                currentMetric={currentMetric}
                activeTab={detailPanelActiveTab}
                onActiveTabChange={setDetailPanelActiveTab}
                unlockedAchievements={unlockedAchievements}
                isRetroMode={isRetroMode}
              />
            </div>

            {/* 上位5都道府県グラフ */}
            <div className="flex-1 min-h-[300px] lg:min-h-0 flex flex-col lg:overflow-hidden">
              <TopChart data={currentYearData} currentMetric={currentMetric} />
            </div>
          </div>

        </div>

      </main>

      {/* モーダル CSVアップローダー */}
      <AnimatePresence>
      {showUploader && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[5000] flex items-center justify-center p-4"
        >
          <div 
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
            onClick={() => setShowUploader(false)}
          />
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-xl border border-white/20 dark:border-slate-700/50 shadow-2xl max-w-lg w-full relative z-[5001] overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-850/60">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-black text-slate-800 dark:text-white">
                  外部データのインポート
                </h3>
              </div>
              <button
                onClick={() => setShowUploader(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto">
              <Suspense fallback={<div className="p-8 text-center text-slate-500">読み込み中...</div>}>
                <CsvUploader
                  onDataLoaded={(data) => {
                    handleDataLoaded(data);
                    setShowUploader(false);
                  }}
                />
              </Suspense>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* バックグラウンド計算中のトースト */}
      <AnimatePresence>
        {loading && allPrefectures.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-[9999] pointer-events-none"
          >
            <div className="bg-slate-900/90 backdrop-blur shadow-2xl border border-white/10 text-white px-4 py-2.5 rounded-full flex items-center gap-2.5">
              <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-bold tracking-wider">RECALCULATING...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 理想郷ガチャモーダル */}
      <AnimatePresence>
      {showGacha && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[5000] flex items-center justify-center p-4"
        >
          <div 
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
            onClick={() => !gachaRunning && setShowGacha(false)}
          />
          
          <motion.div 
            initial={{ scale: 0.8, y: 50, rotate: -5 }}
            animate={{ scale: 1, y: 0, rotate: 0 }}
            exit={{ scale: 0.8, y: 50, rotate: 5 }}
            transition={{ type: "spring", damping: 20, stiffness: 200 }}
            className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-700/50 shadow-2xl max-w-sm w-full relative z-[5001] overflow-hidden flex flex-col p-6 items-center text-center gap-4"
          >
            <div className="flex justify-between items-center w-full border-b border-slate-100 dark:border-slate-800/60 pb-3">
              <div className="flex items-center gap-1.5">
                <span className="text-lg">🎰</span>
                <span className="text-sm font-black text-slate-800 dark:text-white">運命の理想郷ガチャ</span>
              </div>
              <button
                onClick={() => !gachaRunning && setShowGacha(false)}
                className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${gachaRunning ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                disabled={gachaRunning}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* スロット表示エリア */}
            <div className="w-full py-8 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 relative shadow-inner overflow-hidden flex flex-col items-center justify-center min-h-[140px]">
              {gachaRunning ? (
                <div className="space-y-2">
                  <div className="text-3xl font-black text-slate-400 dark:text-slate-600 animate-pulse tracking-widest uppercase">
                    {gachaDisplayPref}
                  </div>
                  <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold animate-bounce">
                    理想郷をスキャン中...
                  </div>
                </div>
              ) : gachaResult ? (
                <div className="space-y-3 p-2 animate-fade-in flex flex-col items-center">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-widest border animate-pulse ${
                    gachaResult.catchphrase.rarity === 'SSR'
                      ? 'bg-amber-500/10 text-amber-600 border-amber-500/35 dark:text-amber-400'
                      : gachaResult.catchphrase.rarity === 'SR'
                      ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/35 dark:text-indigo-400'
                      : 'bg-slate-500/10 text-slate-500 border-slate-500/35 dark:text-slate-400'
                  }`}>
                    {gachaResult.catchphrase.rarity}
                  </span>
                  
                  <div className="text-3xl font-black text-indigo-650 dark:text-indigo-400 tracking-tight">
                    {gachaResult.pref.prefName}
                  </div>

                  <div className="px-4 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/40 dark:border-slate-800/40 max-w-[280px] flex flex-col gap-1.5">
                    <p className="text-[10px] font-bold text-slate-550 dark:text-slate-400 leading-relaxed italic">
                      " {gachaResult.catchphrase.text} "
                    </p>
                    <div className="text-[9px] text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800/50 pt-1 text-left flex items-start gap-1 font-semibold leading-relaxed">
                      <span className="shrink-0 text-amber-500">💡</span>
                      <span>{gachaResult.catchphrase.advice}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-3xl font-black text-slate-350 dark:text-slate-700">
                    ???
                  </div>
                  <p className="text-[10px] text-slate-400">ガチャを回して運命の地を見つけよう！</p>
                </div>
              )}
            </div>

            {/* ボタン群 */}
            <div className="w-full flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
              {gachaResult && !gachaRunning && (
                <div className="flex flex-col gap-1.5 w-full">
                  <button
                    onClick={() => handleSelectGachaPrefecture(gachaResult.pref, 'details')}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-750 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 hover:scale-[1.01] transition-all cursor-pointer"
                  >
                    ここに決める！ (詳細を表示)
                  </button>
                  <div className="grid grid-cols-2 gap-1.5 w-full">
                    <button
                      onClick={() => handleSelectGachaPrefecture(gachaResult.pref, 'fire')}
                      className="py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors"
                      title="生活費を試算する"
                    >
                      <span>💰</span> 生活費試算
                    </button>
                    <button
                      onClick={() => handleSelectGachaPrefecture(gachaResult.pref, 'fire')}
                      className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:text-indigo-400 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 border border-indigo-200 dark:border-indigo-800/50 shadow-sm"
                      title="AI相談室を開く"
                    >
                      <span>🤖</span> AI相談室
                    </button>
                  </div>
                </div>
              )}
              
              <button
                onClick={handleRollGacha}
                disabled={gachaRunning}
                className={`w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 ${gachaRunning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span>🎰</span>
                <span>{gachaResult ? 'もう一度引く' : 'ガチャを回す'}</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* 実績解除トースト通知 */}
      {achievementToast && (
        <div className="fixed top-4 right-4 z-[9999] flex items-center gap-3.5 bg-slate-900/90 dark:bg-slate-950/95 backdrop-blur border border-indigo-500/50 p-4 rounded-2xl shadow-xl shadow-indigo-600/20 max-w-sm w-full animate-slide-in-right">
          <style>{`
            @keyframes slideInRight {
              0% { transform: translateX(120%); opacity: 0; }
              10% { transform: translateX(0); opacity: 1; }
              90% { transform: translateX(0); opacity: 1; }
              100% { transform: translateX(120%); opacity: 0; }
            }
            .animate-slide-in-right {
              animation: slideInRight 4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
          `}</style>
          <div className="text-3xl shrink-0 select-none animate-bounce">
            {achievementToast.emoji}
          </div>
          <div className="text-left min-w-0">
            <span className="text-[10px] font-black text-indigo-400 dark:text-indigo-400 uppercase tracking-widest block">
              🏆 実績解除 (Achievement Unlocked!)
            </span>
            <h4 className="text-xs font-black text-white leading-tight mt-0.5">
              {achievementToast.name}
            </h4>
            <p className="text-[9px] text-slate-300 dark:text-slate-400 leading-normal mt-0.5">
              {achievementToast.description}
            </p>
          </div>
        </div>
      )}

      {/* フッター / NewsTicker */}
      <div className="shrink-0 mt-auto relative z-50">
        {isRetroMode && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-4 w-[90%] max-w-2xl bg-black border-4 border-white p-4 rounded-none shadow-[4px_4px_0_#fff]">
            <div className="text-white font-['DotGothic16'] text-lg animate-[pulse_2s_infinite]">
              ▼ FCTX レトロモード に とつにゅうした！<br/>
              ▼ コナミコマンド を みつけるとは なかなか やるな！<br/>
              ▼ これで きみも りっぱな ゆうしゃだ。
            </div>
            <button 
              onClick={() => setIsRetroMode(false)}
              className="mt-4 bg-white text-black px-4 py-1 text-sm font-bold border-2 border-transparent hover:border-white hover:bg-black hover:text-white transition-colors cursor-pointer"
            >
              ＞ にげる
            </button>
          </div>
        )}
        <NewsTicker allPrefectures={allPrefectures} selectedYear={selectedYear} />
      </div>

      <WeatherEffects currentMetric={currentMetric} />
    </div>
  );
}

export default App;
