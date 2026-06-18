import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Sun, Moon, Map, Upload, X } from 'lucide-react';
import { type PrefectureData, type MetricType, type MetricWeights } from './types/prefecture';
import { processPrefectureData } from './utils/score';
import { MetricSelector } from './components/MetricSelector';
import { JapanMap } from './components/JapanMap';
import { PrefectureDetailPanel } from './components/PrefectureDetailPanel';
import { RankingTable } from './components/RankingTable';
import { TopChart } from './components/TopChart';
import { CsvUploader } from './components/CsvUploader';
import { TimelineControl } from './components/TimelineControl';
import sampleCsvUrl from './data/sample_prefecture_data.csv?url';

function App() {
  const [rawPrefectures, setRawPrefectures] = useState<PrefectureData[]>([]);
  const [allPrefectures, setAllPrefectures] = useState<PrefectureData[]>([]);
  
  const [currentMetric, setCurrentMetric] = useState<MetricType>('totalScore');
  const [selectedPrefCode, setSelectedPrefCode] = useState<number | undefined>(undefined);
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // CSVアップローダーの展開状態
  const [showUploader, setShowUploader] = useState<boolean>(false);

  // 初期ウェイト設定
  const [weights, setWeights] = useState<MetricWeights>({
    starbucksCount: 10,
    ramenCount: 10,
    attractiveness: 10,
    sunshineHours: 10,
  });

  // ダークモードの切り替え
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // 初期データのロード
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const response = await fetch(sampleCsvUrl);
        if (!response.ok) {
          throw new Error('サンプルCSVファイルの取得に失敗しました。');
        }
        const csvText = await response.text();

        Papa.parse<Record<string, any>>(csvText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.errors.length > 0) {
              console.warn('Initial load PapaParse warnings:', results.errors);
            }

            const rawData = results.data;
            const parsedData: PrefectureData[] = rawData.map((row) => ({
              year: row.year !== undefined && row.year !== '' ? Number(row.year) : 2024,
              prefCode: Number(row.prefCode || row['都道府県コード']),
              prefName: String(row.prefName || row['都道府県'] || row['都道府県名']).trim(),
              landPrice: row.landPrice !== undefined && row.landPrice !== '' ? Number(row.landPrice) : undefined,
              population: row.population !== undefined && row.population !== '' ? Number(row.population) : undefined,
              listedCompanies: row.listedCompanies !== undefined && row.listedCompanies !== '' ? Number(row.listedCompanies) : undefined,
              starbucksCount: row.starbucksCount !== undefined && row.starbucksCount !== '' ? Number(row.starbucksCount) : undefined,
              ramenCount: row.ramenCount !== undefined && row.ramenCount !== '' ? Number(row.ramenCount) : undefined,
              attractiveness: row.attractiveness !== undefined && row.attractiveness !== '' ? Number(row.attractiveness) : undefined,
              sunshineHours: row.sunshineHours !== undefined && row.sunshineHours !== '' ? Number(row.sunshineHours) : undefined,
            }));

            setRawPrefectures(parsedData);
            setLoading(false);
          },
          error: (err: any) => {
            throw new Error(`CSV解析エラー: ${err.message}`);
          },
        });
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'データの読み込みに失敗しました。');
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // 計算の適用
  useEffect(() => {
    if (rawPrefectures.length > 0) {
      const processed = processPrefectureData(rawPrefectures, weights);
      setAllPrefectures(processed);
    }
  }, [rawPrefectures, weights]);

  // 新しいCSVデータロード時
  const handleDataLoaded = (newData: PrefectureData[]) => {
    const normalizedData = newData.map((d) => ({
      ...d,
      year: d.year || 2024,
    }));
    
    setRawPrefectures(normalizedData);
    
    const availableYears = Array.from(new Set(normalizedData.map((d) => d.year)));
    if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0]);
    }

    if (selectedPrefCode) {
      const exists = normalizedData.some((p) => p.prefCode === selectedPrefCode);
      if (!exists) {
        setSelectedPrefCode(undefined);
      }
    }
  };

  const handleSelectPrefecture = (prefCode: number) => {
    setSelectedPrefCode(prefCode);
  };

  const handleWeightsChange = (newWeights: MetricWeights) => {
    setWeights(newWeights);
  };

  const currentYearData = allPrefectures.filter((p) => p.year === selectedYear);
  const selectedPrefecture = currentYearData.find((p) => p.prefCode === selectedPrefCode);
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
    <div className="h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300 flex flex-col overflow-hidden">
      {/* ナビゲーションバー */}
      <header className="sticky top-0 z-[2000] bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-md shadow-indigo-600/20">
            <Map className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
              FCTX Japan Data Map
            </h1>
            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold tracking-wider uppercase">
              都道府県別データ可見化ダッシュボード
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowUploader(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-950/60 rounded-lg border border-indigo-100 dark:border-indigo-900/30 cursor-pointer transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>インポート</span>
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
      <main className="max-w-7xl mx-auto p-4 flex-1 flex flex-col gap-4 w-full min-h-0 overflow-hidden">
        
        {/* プロフェッショナルな3カラムレイアウト */}
        <div className="grid grid-cols-12 gap-4 flex-1 min-h-0 overflow-hidden">
          
          {/* 左カラム: データ選択と一覧 (col-span-3) */}
          <div className="col-span-12 lg:col-span-3 flex flex-col gap-4 h-full min-h-0 overflow-hidden">
            {/* 指標セレクター (コンパクト化) */}
            <MetricSelector
              currentMetric={currentMetric}
              onChange={setCurrentMetric}
            />

            {/* ランキングテーブル (左カラムに適合) */}
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              <RankingTable
                data={currentYearData}
                currentMetric={currentMetric}
                selectedPrefCode={selectedPrefCode}
                onSelectPrefecture={handleSelectPrefecture}
              />
            </div>
          </div>

          {/* 中央カラム: メイン可視化 (col-span-6) */}
          <div className="col-span-12 lg:col-span-6 flex flex-col gap-4 h-full min-h-0 overflow-hidden">
            {/* 日本地図 */}
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              <JapanMap
                data={currentYearData}
                currentMetric={currentMetric}
                selectedPrefCode={selectedPrefCode}
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

          {/* 右カラム: 詳細分析・設定 (col-span-3) */}
          <div className="col-span-12 lg:col-span-3 flex flex-col gap-4 h-full min-h-0 overflow-hidden">
            {/* 都道府県詳細 & ウェイト設定パネル (統合タブ) */}
            <div className="h-[380px] min-h-[300px] flex flex-col overflow-hidden">
              <PrefectureDetailPanel
                prefecture={selectedPrefecture}
                weights={weights}
                onWeightsChange={handleWeightsChange}
              />
            </div>

            {/* 上位5都道府県グラフ */}
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              <TopChart data={currentYearData} currentMetric={currentMetric} />
            </div>
          </div>

        </div>

      </main>

      {/* モーダル CSVアップローダー */}
      {showUploader && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4">
          {/* バックドロップ */}
          <div 
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
            onClick={() => setShowUploader(false)}
          />
          
          {/* モーダルコンテンツ */}
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
                }}
                sampleCsvUrl={sampleCsvUrl}
              />
            </div>
          </div>
        </div>
      )}

      {/* フッター */}
      <footer className="border-t border-slate-200/50 dark:border-slate-800/50 py-2 text-center text-[10px] text-slate-400 dark:text-slate-600 shrink-0">
        <p>&copy; {new Date().getFullYear()} FCTX Japan Data Map. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
