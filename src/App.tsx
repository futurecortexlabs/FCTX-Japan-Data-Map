import { useState } from 'react';
import { Sun, Moon, Map, Upload, X } from 'lucide-react';
import { type MetricType } from './types/prefecture';
import { generatePrefectureCatchphrase } from './utils/catchphrase';
import { MetricSelector } from './components/MetricSelector';
import { JapanMap } from './components/JapanMap';
import { PrefectureDetailPanel } from './components/PrefectureDetailPanel';
import { RankingTable } from './components/RankingTable';
import { TopChart } from './components/TopChart';
import { CsvUploader } from './components/CsvUploader';
import { TimelineControl } from './components/TimelineControl';
import sampleCsvUrl from './data/sample_prefecture_data.csv?url';

import { useDarkMode } from './hooks/useDarkMode';
import { useUrlState } from './hooks/useUrlState';
import { usePrefectureData } from './hooks/usePrefectureData';

function App() {
  const [showUploader, setShowUploader] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // ガチャ状態
  const [showGacha, setShowGacha] = useState<boolean>(false);
  const [gachaRunning, setGachaRunning] = useState<boolean>(false);
  const [gachaDisplayPref, setGachaDisplayPref] = useState<string>('???');
  const [gachaResult, setGachaResult] = useState<any>(null);

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
  });

  const {
    allPrefectures,
    weights,
    setWeights,
    loading,
    error,
    handleDataLoaded
  } = usePrefectureData(sampleCsvUrl, initialUrlWeights);

  const handleSelectPrefecture = (prefCode: number) => {
    setSelectedPrefCodes((prev) => {
      if (prev.includes(prefCode)) {
        return prev.filter((code) => code !== prefCode);
      }
      if (prev.length >= 2) {
        return [prev[1], prefCode];
      }
      return [...prev, prefCode];
    });
  };

  const handleSelectPrefectureSingle = (prefCode: number) => {
    setSelectedPrefCodes([prefCode]);
  };

  const handleRollGacha = () => {
    if (gachaRunning) return;
    setGachaRunning(true);
    setGachaResult(null);

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
        
        setGachaResult({
          pref: finalPref,
          catchphrase: catchphrase
        });
        setGachaRunning(false);
      }
    }, 70);
  };

  const handleSelectGachaPrefecture = (pref: any) => {
    handleSelectPrefectureSingle(pref.prefCode);
    
    const bestWeights = {
      starbucksCount: 10,
      ramenCount: 10,
      attractiveness: 10,
      sunshineHours: 10
    };
    
    const scores = [
      { key: 'starbucksCount', val: pref.starbucksScore || 50 },
      { key: 'ramenCount', val: pref.ramenScore || 50 },
      { key: 'attractiveness', val: pref.attractivenessScore || 50 },
      { key: 'sunshineHours', val: pref.sunshineHoursScore || 50 }
    ];
    scores.sort((a, b) => b.val - a.val);
    
    bestWeights[scores[0].key as keyof typeof bestWeights] = 50;
    bestWeights[scores[1].key as keyof typeof bestWeights] = 30;
    
    scores.slice(2).forEach(s => {
      bestWeights[s.key as keyof typeof bestWeights] = 5;
    });

    handleWeightsChange(bestWeights);
    setShowGacha(false);
  };

  const handleWeightsChange = (newWeights: any) => {
    setWeights(newWeights);
    updateUrlWeights(newWeights);
  };

  const currentYearData = allPrefectures.filter((p) => p.year === selectedYear);
  const selectedPrefectures = currentYearData.filter((p) => selectedPrefCodes.includes(p.prefCode));
  const availableYears = Array.from(new Set(allPrefectures.map((p) => p.year))).sort((a, b) => a - b);

  if (loading) {
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

  return (
    <div className="min-h-screen lg:h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300 flex flex-col lg:overflow-hidden">
      {/* ナビゲーションバー */}
      <header className="sticky top-0 z-[2000] bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 px-6 py-3 flex items-center justify-between shrink-0">
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
          <button
            onClick={() => {
              setShowGacha(true);
              setTimeout(() => {
                handleRollGacha();
              }, 100);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/60 rounded-lg border border-amber-100 dark:border-amber-900/30 cursor-pointer transition-colors shadow-sm"
          >
            <span className="animate-bounce">🎰</span>
            <span>理想郷ガチャ</span>
          </button>

          <button
            onClick={() => setShowUploader(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-950/60 rounded-lg border border-indigo-100 dark:border-indigo-900/30 cursor-pointer transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">インポート</span>
          </button>

          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2.5 rounded-lg border border-slate-200/50 dark:border-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
            aria-label="Toggle Dark Mode"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>
        </div>
      </header>

      {/* メインダッシュボード */}
      <main className="max-w-7xl mx-auto p-4 flex-1 flex flex-col gap-4 w-full lg:min-h-0 lg:overflow-hidden">
        
        {/* プロフェッショナルな3カラムレイアウト */}
        <div className="grid grid-cols-12 gap-4 flex-1 lg:min-h-0 lg:overflow-hidden">
          
          {/* 左カラム: データ選択と一覧 (col-span-12 lg:col-span-3) */}
          <div className="col-span-12 lg:col-span-3 flex flex-col gap-4 lg:h-full lg:min-h-0 lg:overflow-hidden">
            {/* 指標セレクター (コンパクト化) */}
            <MetricSelector
              currentMetric={currentMetric}
              onChange={(m: MetricType) => setCurrentMetric(m)}
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
              />
            </div>

            {/* タイムラインコントロール */}
            {availableYears.length > 1 && (
              <TimelineControl
                years={availableYears}
                selectedYear={selectedYear}
                onYearChange={setSelectedYear}
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
                allPrefectures={currentYearData}
                onSelectPrefecture={handleSelectPrefectureSingle}
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
      {showUploader && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
            onClick={() => setShowUploader(false)}
          />
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full relative z-[5001] overflow-hidden transition-all transform flex flex-col max-h-[90vh]">
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
              <CsvUploader
                onDataLoaded={(data) => {
                  handleDataLoaded(data);
                  setShowUploader(false);
                }}
                sampleCsvUrl={sampleCsvUrl}
              />
            </div>
          </div>
        </div>
      )}

      {/* 理想郷ガチャモーダル */}
      {showGacha && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
            onClick={() => !gachaRunning && setShowGacha(false)}
          />
          
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-sm w-full relative z-[5001] overflow-hidden transition-all transform flex flex-col p-6 items-center text-center gap-4">
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

                  <div className="px-4 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/40 dark:border-slate-800/40 max-w-[280px]">
                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed italic">
                      " {gachaResult.catchphrase.text} "
                    </p>
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
                <button
                  onClick={() => handleSelectGachaPrefecture(gachaResult.pref)}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 hover:scale-[1.01] transition-all cursor-pointer animate-pulse"
                >
                  ここに決める！ (理想郷にジャンプ)
                </button>
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
          </div>
        </div>
      )}

      {/* フッター */}
      <footer className="border-t border-slate-200/50 dark:border-slate-800/50 py-2 text-center text-[10px] text-slate-400 dark:text-slate-600 shrink-0">
        <p>&copy; {new Date().getFullYear()} FCTX Japan Utopia Finder. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
