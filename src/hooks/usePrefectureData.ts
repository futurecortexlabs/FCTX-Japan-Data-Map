import { useState, useEffect, useRef } from 'react';
import type { PrefectureData, MetricWeights } from '../types/prefecture';
import DataProcessorWorker from '../workers/dataProcessor.worker?worker';

export function usePrefectureData(sampleCsvUrl: string, initialWeights: MetricWeights) {
  const [rawPrefectures, setRawPrefectures] = useState<PrefectureData[]>([]);
  const [allPrefectures, setAllPrefectures] = useState<PrefectureData[]>([]);
  const [weights, setWeights] = useState<MetricWeights>(initialWeights);

  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const workerRef = useRef<Worker | null>(null);

  // Workerの初期化とリスナー設定
  useEffect(() => {
    workerRef.current = new DataProcessorWorker();
    
    workerRef.current.onmessage = (e: MessageEvent) => {
      const { type, payload } = e.data;
      
      if (type === 'PARSE_SUCCESS') {
        setRawPrefectures(payload);
        // パース成功後、最初のプロセスを開始する
        workerRef.current?.postMessage({
          type: 'PROCESS_DATA',
          payload: { rawData: payload, weights }
        });
      } else if (type === 'PARSE_ERROR') {
        setError(`CSV解析エラー: ${payload}`);
        setLoading(false);
      } else if (type === 'PROCESS_SUCCESS') {
        setAllPrefectures(payload);
        setLoading(false);
      } else if (type === 'PROCESS_ERROR') {
        setError(`データ処理エラー: ${payload}`);
        setLoading(false);
      }
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  // weightsが変わったら再計算
  useEffect(() => {
    if (rawPrefectures.length > 0 && workerRef.current) {
      workerRef.current.postMessage({
        type: 'PROCESS_DATA',
        payload: { rawData: rawPrefectures, weights }
      });
    }
  }, [weights, rawPrefectures]);

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
        
        workerRef.current?.postMessage({
          type: 'PARSE_CSV',
          payload: csvText,
        });

      } catch (err: any) {
        console.error(err);
        setError(err.message || 'データの読み込みに失敗しました。');
        setLoading(false);
      }
    };

    if (workerRef.current) {
      loadInitialData();
    }
  }, [sampleCsvUrl]);

  // 手動で外部データを読み込む関数
  const handleDataLoaded = (newData: PrefectureData[]) => {
    const normalizedData = newData.map((d) => ({
      ...d,
      year: d.year || 2024,
    }));
    
    // rawPrefectures を更新すれば useEffect によって PROCESS_DATA が走る
    setRawPrefectures(normalizedData);
  };

  return {
    rawPrefectures,
    allPrefectures,
    weights,
    setWeights,
    loading,
    error,
    handleDataLoaded
  };
}
