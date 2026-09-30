import { useCallback, useMemo, useState, Suspense, lazy, type CSSProperties } from 'react';
import { Sun, Moon, Map as MapIcon, Upload, X, Play, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import type { MetricType, MetricWeights, PrefectureData } from './types/prefecture';
import type { DetailPanelTab, KeepItem } from './types/ui';
import { METRIC_CONFIGS } from './constants/metrics';
import { DEFAULT_WEIGHTS, WEIGHT_KEYS } from './constants/weights';
import { HISTORICAL_MILESTONES } from './data/milestones';
import sampleCsvUrl from './data/sample_prefecture_data.csv?url';

import { MetricSelector } from './components/MetricSelector';
import { JapanMap, type MapFlashEffect } from './components/JapanMap';
import { PrefectureDetailPanel } from './components/PrefectureDetailPanel';
import { RankingTable } from './components/RankingTable';
import { TopChart } from './components/TopChart';
import { TimelineControl } from './components/TimelineControl';
import { NewsTicker } from './components/NewsTicker';
import { WeatherEffects } from './components/WeatherEffects';
import { ParallaxOrbs } from './components/ParallaxOrbs';
import { ErrorBoundary } from './components/ErrorBoundary';

import { useDarkMode } from './hooks/useDarkMode';
import { useUrlState } from './hooks/useUrlState';
import { usePrefectureData } from './hooks/usePrefectureData';
import { useKonamiCode } from './hooks/useKonamiCode';
import { useAchievements } from './hooks/useAchievements';
import { usePersistentState } from './hooks/usePersistentState';
import { useInterval } from './hooks/useInterval';

import { playScanSound, playClickSound, playRetroUnlockSound, startRetroBGM, stopRetroBGM } from './utils/audio';
import { loadRetroFont } from './utils/retroFont';
import { estimateMonthlyCost, isColdRegion, isUrbanRegion, TROPICAL_PREF_CODE } from './utils/region';

// 初期表示に不要な重いコンポーネントは遅延ロードする
const CsvUploader = lazy(() => import('./components/CsvUploader').then((m) => ({ default: m.CsvUploader })));
const GachaModal = lazy(() => import('./components/GachaModal').then((m) => ({ default: m.GachaModal })));

const DEFAULT_YEAR = 2024;
const MAX_COMPARE = 3;
const DEMO_INTERVAL_MS = 4000;
const METRIC_ORDER = Object.keys(METRIC_CONFIGS) as MetricType[];

/** 年ごとの特別演出 (地図の枠が明滅する) */
const FLASH_BY_YEAR: Partial<Record<number, MapFlashEffect>> = { 2008: 'lehman', 2020: 'covid' };

const parseKeepList = (v: unknown): KeepItem[] | null =>
  Array.isArray(v)
    ? v.filter(
        (x): x is KeepItem =>
          !!x && typeof x.prefCode === 'number' && typeof x.prefName === 'string' && typeof x.year === 'number',
      )
    : null;

function getAmbientStyle(pref: PrefectureData | undefined): CSSProperties {
  if (!pref) return {};
  const [a, b] =
    pref.prefCode === TROPICAL_PREF_CODE
      ? ['16, 185, 129', '14, 165, 233']
      : isColdRegion(pref.prefCode)
        ? ['56, 189, 248', '148, 163, 184']
        : isUrbanRegion(pref.prefCode)
          ? ['99, 102, 241', '236, 72, 153']
          : ['34, 197, 94', '245, 158, 11'];
  return {
    background: `radial-gradient(circle at top right, rgba(${a}, 0.15), transparent 60%), radial-gradient(circle at bottom left, rgba(${b}, 0.1), transparent 60%)`,
  };
}

/** 選択された県の偏差値上位 3 指標を重視するウェイトを生成する (ガチャ結果からの遷移用) */
function weightsFavoring(pref: PrefectureData): MetricWeights {
  const scoreByWeightKey: Record<keyof MetricWeights, number | undefined> = {
    starbucksCount: pref.starbucksScore,
    ramenCount: pref.ramenScore,
    attractiveness: pref.attractivenessScore,
    sunshineHours: pref.sunshineHoursScore,
    onsenCount: pref.onsenScore,
    hospitalCount: pref.hospitalScore,
    pollenLevel: pref.pollenScore,
    childcareScore: pref.childcareScoreScore,
  };
  const ranked = [...WEIGHT_KEYS].sort((x, y) => (scoreByWeightKey[y] ?? 50) - (scoreByWeightKey[x] ?? 50));
  const tiers = [50, 30, 20];
  const result = { ...DEFAULT_WEIGHTS };
  ranked.forEach((key, i) => {
    result[key] = tiers[i] ?? 5;
  });
  return result;
}

function App() {
  const [showUploader, setShowUploader] = useState(false);
  const [showGacha, setShowGacha] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRetroMode, setIsRetroMode] = useState(false);
  const [detailPanelActiveTab, setDetailPanelActiveTab] = useState<DetailPanelTab>('details');
  const [keepList, setKeepList] = usePersistentState<KeepItem[]>('fctx_keep_list', [], parseKeepList);

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
  } = useUrlState('totalScore', DEFAULT_YEAR, DEFAULT_WEIGHTS);

  const { allPrefectures, weights, setWeights, loading, error, handleDataLoaded } = usePrefectureData(
    sampleCsvUrl,
    initialUrlWeights,
  );

  // ---- 派生データ (メモ化して React.memo 化された子コンポーネントの再描画を抑える) ----
  const availableYears = useMemo(
    () => Array.from(new Set(allPrefectures.map((p) => p.year))).sort((a, b) => a - b),
    [allPrefectures],
  );
  const currentYearData = useMemo(
    () => allPrefectures.filter((p) => p.year === selectedYear),
    [allPrefectures, selectedYear],
  );
  const selectedPrefectures = useMemo(() => {
    const byCode = new Map(currentYearData.map((p) => [p.prefCode, p]));
    return selectedPrefCodes.map((code) => byCode.get(code)).filter((p): p is PrefectureData => p !== undefined);
  }, [currentYearData, selectedPrefCodes]);

  const primaryPref = selectedPrefectures[0];
  const flashEffect = FLASH_BY_YEAR[selectedYear];

  // ---- 実績: 画面状態から導出できる統計はここで渡し、effect での state 同期を不要にする ----
  const achievements = useAchievements({
    keepCount: keepList.length,
    historyChecked: flashEffect !== undefined,
    maxOnsenScore: primaryPref?.onsenScore,
    maxPollenScore: primaryPref?.pollenScore,
    maxSavings: primaryPref ? estimateMonthlyCost(primaryPref).savingsVsTokyo : undefined,
  });
  const { recordStats, unlock } = achievements;

  // ---- レトロモード (コナミコマンド) ----
  const setRetroMode = useCallback(
    (enabled: boolean) => {
      setIsRetroMode(enabled);
      document.body.classList.toggle('retro-mode', enabled);
      if (enabled) {
        loadRetroFont();
        playRetroUnlockSound();
        startRetroBGM();
        unlock('retro_gamer');
      } else {
        stopRetroBGM();
      }
    },
    [unlock],
  );
  useKonamiCode(() => setRetroMode(!isRetroMode));

  // ---- デモ再生: 指標を順に切り替え、ときどき年も進める ----
  useInterval(
    () => {
      playScanSound();
      setCurrentMetric((prev) => METRIC_ORDER[(METRIC_ORDER.indexOf(prev) + 1) % METRIC_ORDER.length]);
      if (Math.random() > 0.7 && availableYears.length > 0) {
        setSelectedYear((prev) => availableYears[(availableYears.indexOf(prev) + 1) % availableYears.length]);
      }
    },
    isPlaying ? DEMO_INTERVAL_MS : null,
  );

  // ---- ハンドラ ----
  const handleSelectPrefecture = useCallback(
    (prefCode: number) => {
      setSelectedPrefCodes((prev) =>
        prev.includes(prefCode) ? prev.filter((code) => code !== prefCode) : [...prev, prefCode].slice(-MAX_COMPARE),
      );
    },
    [setSelectedPrefCodes],
  );

  const handleSelectPrefectureSingle = useCallback(
    (prefCode: number, year?: number) => {
      setSelectedPrefCodes([prefCode]);
      if (year !== undefined) setSelectedYear(year);
    },
    [setSelectedPrefCodes, setSelectedYear],
  );

  const handleToggleKeep = useCallback(
    (prefCode: number, prefName: string, year: number) => {
      setKeepList((prev) =>
        prev.some((item) => item.prefCode === prefCode && item.year === year)
          ? prev.filter((item) => !(item.prefCode === prefCode && item.year === year))
          : [...prev, { prefCode, prefName, year }],
      );
    },
    [setKeepList],
  );

  const handleWeightsChange = useCallback(
    (newWeights: MetricWeights) => {
      setWeights(newWeights);
      updateUrlWeights(newWeights);
    },
    [setWeights, updateUrlWeights],
  );

  const recordGachaRoll = useCallback(() => recordStats((s) => ({ gachaCount: s.gachaCount + 1 })), [recordStats]);

  const openGacha = () => {
    playClickSound();
    recordGachaRoll();
    setShowGacha(true);
  };

  const handleChooseGachaPrefecture = (pref: PrefectureData, tab: DetailPanelTab) => {
    handleSelectPrefectureSingle(pref.prefCode);
    handleWeightsChange(weightsFavoring(pref));
    setShowGacha(false);
    setDetailPanelActiveTab(tab);
  };

  if (loading && allPrefectures.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center transition-colors duration-300">
        <div className="flex flex-col items-center gap-4" role="status">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600 dark:text-slate-400 font-bold animate-pulse">データを読み込んでいます...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 transition-colors duration-300">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-lg border border-red-200/50 dark:border-red-950/50 max-w-md w-full text-center" role="alert">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-950/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 dark:text-red-400 text-xl font-bold">!</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">エラーが発生しました</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  const milestone = HISTORICAL_MILESTONES[selectedYear];

  return (
    <div className="min-h-screen lg:h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300 flex flex-col lg:overflow-hidden relative overflow-hidden">
      {/* アンビエント・エフェクト */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-1000 ease-in-out z-0 opacity-100 mix-blend-multiply dark:mix-blend-screen"
        style={getAmbientStyle(primaryPref)}
      />
      {/* 動的フローティング・オーブ (パララックス対応) */}
      <ParallaxOrbs />

      {/* ナビゲーションバー (Glassmorphism) */}
      <header className="sticky top-0 z-[2000] glass-neon-border border-b border-white/20 dark:border-indigo-500/20 px-6 py-3 flex items-center justify-between shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-md shadow-indigo-600/20">
            <MapIcon className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight bg-gradient-to-r from-indigo-600 to-rose-500 dark:from-indigo-400 dark:to-rose-400 bg-clip-text text-transparent">
              FCTX Japan Utopia Finder
            </h1>
            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold tracking-wider uppercase">
              移住・2拠点居住 理想郷診断システム
            </p>
          </div>
        </div>

        <nav className="flex items-center gap-3" aria-label="メインメニュー">
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={openGacha}
            disabled={currentYearData.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 dark:hover:bg-amber-500/30 rounded-lg border border-amber-200 dark:border-amber-500/50 cursor-pointer transition-all shadow-sm cyber-glow"
          >
            <span className="animate-bounce" aria-hidden="true">🎰</span>
            <span>理想郷ガチャ</span>
          </motion.button>

          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              playClickSound();
              setShowUploader(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 dark:hover:bg-indigo-500/30 rounded-lg border border-indigo-200 dark:border-indigo-500/50 cursor-pointer transition-all cyber-glow"
            aria-label="CSVデータのインポート"
          >
            <Upload className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">インポート</span>
          </motion.button>

          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              playClickSound();
              setIsPlaying((p) => !p);
            }}
            aria-pressed={isPlaying}
            aria-label={isPlaying ? 'デモ停止' : 'デモ再生'}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border cursor-pointer transition-all cyber-glow ${
              isPlaying
                ? 'bg-rose-500/10 text-rose-600 border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/50'
                : 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/50'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" aria-hidden="true" /> : <Play className="w-3.5 h-3.5" aria-hidden="true" />}
            <span className="hidden sm:inline">{isPlaying ? 'デモ停止' : 'デモ再生'}</span>
          </motion.button>

          <motion.button
            type="button"
            whileHover={{ scale: 1.1, rotate: 15 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              playClickSound();
              setIsDarkMode(!isDarkMode);
            }}
            className="p-2.5 rounded-lg border border-slate-200/50 dark:border-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
            aria-label={isDarkMode ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </motion.button>
        </nav>
      </header>

      {/* メインダッシュボード */}
      <main className="w-full max-w-[2000px] mx-auto px-4 lg:px-6 py-4 flex-1 flex flex-col gap-4 lg:min-h-0 lg:overflow-hidden">
        {/* 3カラムレイアウト */}
        <div className="grid grid-cols-12 gap-4 flex-1 lg:min-h-0 lg:overflow-hidden">
          {/* 左カラム: データ選択と一覧 */}
          <div className="col-span-12 lg:col-span-3 flex flex-col gap-4 lg:h-full lg:min-h-0 lg:overflow-hidden">
            <MetricSelector
              currentMetric={currentMetric}
              onChange={(m: MetricType) => {
                playClickSound();
                setCurrentMetric(m);
              }}
            />
            <div className="flex-1 min-h-[400px] lg:min-h-0 flex flex-col lg:overflow-hidden">
              <ErrorBoundary label="ランキング" resetKey={currentMetric}>
                <RankingTable
                  data={currentYearData}
                  currentMetric={currentMetric}
                  selectedPrefCodes={selectedPrefCodes}
                  onSelectPrefecture={handleSelectPrefecture}
                />
              </ErrorBoundary>
            </div>
          </div>

          {/* 中央カラム: メイン可視化 */}
          <div className="col-span-12 lg:col-span-6 flex flex-col gap-4 lg:h-full lg:min-h-0 lg:overflow-hidden">
            <div className="flex-1 min-h-[500px] lg:min-h-0 flex flex-col lg:overflow-hidden">
              <ErrorBoundary label="日本地図" resetKey={currentMetric}>
                <JapanMap
                  data={currentYearData}
                  currentMetric={currentMetric}
                  selectedPrefCodes={selectedPrefCodes}
                  onSelectPrefecture={handleSelectPrefecture}
                  selectedYear={selectedYear}
                  flashEffect={flashEffect}
                  isRetroMode={isRetroMode}
                />
              </ErrorBoundary>
            </div>

            {/* 歴史イベント解説カード */}
            {milestone && (
              <div className="bg-slate-50/70 dark:bg-slate-900/60 border-l-4 border-indigo-500 p-3.5 rounded-r-xl text-left shadow-sm flex items-start gap-3.5 transition-all duration-300">
                <div className="px-2 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 font-black text-xs shrink-0 mt-0.5 tracking-wider">
                  {selectedYear}年
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-black text-slate-800 dark:text-white leading-none mb-1">{milestone.title}</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                    {milestone.event} <span className="text-indigo-600 dark:text-indigo-400 font-bold">{milestone.impact}</span>
                  </p>
                </div>
              </div>
            )}

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

          {/* 右カラム: 詳細分析・設定 */}
          <div className="col-span-12 lg:col-span-3 flex flex-col gap-4 lg:h-full lg:min-h-0 lg:overflow-hidden">
            <div className="lg:h-[450px] min-h-[450px] flex flex-col lg:overflow-hidden">
              <ErrorBoundary label="詳細パネル" resetKey={selectedPrefCodes}>
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
                  unlockedAchievements={achievements.unlocked}
                  isRetroMode={isRetroMode}
                />
              </ErrorBoundary>
            </div>
            <div className="flex-1 min-h-[300px] lg:min-h-0 flex flex-col lg:overflow-hidden">
              <ErrorBoundary label="上位5都道府県チャート" resetKey={currentMetric}>
                <TopChart data={currentYearData} currentMetric={currentMetric} />
              </ErrorBoundary>
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
            role="dialog"
            aria-modal="true"
            aria-labelledby="uploader-title"
          >
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity" onClick={() => setShowUploader(false)} />
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-xl border border-white/20 dark:border-slate-700/50 shadow-2xl max-w-lg w-full relative z-[5001] overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800/60">
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
                  <h3 id="uploader-title" className="text-sm font-black text-slate-800 dark:text-white">外部データのインポート</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowUploader(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  aria-label="閉じる"
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
            role="status"
          >
            <div className="bg-slate-900/90 backdrop-blur shadow-2xl border border-white/10 text-white px-4 py-2.5 rounded-full flex items-center gap-2.5">
              <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-bold tracking-wider">RECALCULATING...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 理想郷ガチャモーダル */}
      {/* Suspense は AnimatePresence の外側に置く (AnimatePresence が直接の子の退場アニメーションを管理するため) */}
      <Suspense fallback={null}>
        <AnimatePresence>
          {showGacha && (
            <GachaModal
              key="gacha"
              candidates={currentYearData}
              onClose={() => setShowGacha(false)}
              onReroll={recordGachaRoll}
              onChoose={handleChooseGachaPrefecture}
            />
          )}
        </AnimatePresence>
      </Suspense>

      {/* 実績解除トースト通知 */}
      {achievements.toast && (
        <div
          className="fixed top-4 right-4 z-[9999] flex items-center gap-3.5 bg-slate-900/90 dark:bg-slate-950/95 backdrop-blur border border-indigo-500/50 p-4 rounded-2xl shadow-xl shadow-indigo-600/20 max-w-sm w-full animate-slide-in-right"
          role="status"
          aria-live="polite"
        >
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
          <div className="text-3xl shrink-0 select-none animate-bounce" aria-hidden="true">
            {achievements.toast.emoji}
          </div>
          <div className="text-left min-w-0">
            <span className="text-[10px] font-black text-indigo-400 dark:text-indigo-400 uppercase tracking-widest block">
              🏆 実績解除 (Achievement Unlocked!)
            </span>
            <h4 className="text-xs font-black text-white leading-tight mt-0.5">{achievements.toast.name}</h4>
            <p className="text-[9px] text-slate-300 dark:text-slate-400 leading-normal mt-0.5">{achievements.toast.description}</p>
          </div>
        </div>
      )}

      {/* フッター / NewsTicker */}
      <div className="shrink-0 mt-auto relative z-50">
        {isRetroMode && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-4 w-[90%] max-w-2xl bg-black border-4 border-white p-4 rounded-none shadow-[4px_4px_0_#fff]">
            <div className="text-white font-['DotGothic16'] text-lg animate-[pulse_2s_infinite]">
              ▼ FCTX レトロモード に とつにゅうした！<br />
              ▼ コナミコマンド を みつけるとは なかなか やるな！<br />
              ▼ これで きみも りっぱな ゆうしゃだ。
            </div>
            <button
              type="button"
              onClick={() => setRetroMode(false)}
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
