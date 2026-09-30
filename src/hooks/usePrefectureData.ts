import { useCallback, useEffect, useRef, useState } from 'react';
import type { MetricWeights, PrefectureData } from '../types/prefecture';
import type { WorkerRequest, WorkerResponse } from '../workers/protocol';
import { weightsCacheKey } from '../constants/weights';
import { DEFAULT_YEAR } from '../utils/csv';
import DataProcessorWorker from '../workers/dataProcessor.worker?worker';

/**
 * 1 つのデータセット (生データ) と、それに対するウェイト別の計算結果キャッシュ。
 * 生データが差し替わるとキャッシュごと入れ替わるため、古い結果が混ざることはない。
 */
interface Dataset {
  raw: PrefectureData[];
  results: ReadonlyMap<string, PrefectureData[]>;
}

/** ユニオン型の各メンバーから `id` を取り除く (Omit はユニオンを潰してしまうため分配させる) */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
type Request = DistributiveOmit<WorkerRequest, 'id'>;

const EMPTY_DATASET: Dataset = { raw: [], results: new Map() };

/**
 * 都道府県データの読み込みとスコア計算を Web Worker にオフロードするフック。
 *
 * - Worker はコンポーネントのライフサイクルで 1 つだけ生成する
 * - リクエスト ID で応答を突き合わせ、古い応答による上書きを防ぐ
 * - ウェイト別の計算結果をデータセット単位でメモ化する
 */
export function usePrefectureData(sampleCsvUrl: string, initialWeights: MetricWeights) {
  const [dataset, setDataset] = useState<Dataset>(EMPTY_DATASET);
  const [weights, setWeights] = useState<MetricWeights>(initialWeights);
  const [lastResult, setLastResult] = useState<PrefectureData[]>([]);
  const [error, setError] = useState<string | null>(null);

  const workerRef = useRef<Worker | null>(null);
  const nextIdRef = useRef(0);
  /** 送信済みリクエスト ID → 対象データセットとキャッシュキー */
  const inflightRef = useRef(new Map<number, { raw: PrefectureData[]; key: string }>());

  const post = useCallback((request: Request): number | null => {
    const worker = workerRef.current;
    if (!worker) return null;
    const id = ++nextIdRef.current;
    worker.postMessage({ ...request, id } as WorkerRequest);
    return id;
  }, []);

  // Worker のライフサイクル管理
  useEffect(() => {
    const worker = new DataProcessorWorker();
    const inflight = inflightRef.current;
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const response = e.data;
      switch (response.type) {
        case 'PARSE_SUCCESS':
          setDataset({ raw: response.payload, results: new Map() });
          break;
        case 'PROCESS_SUCCESS': {
          const target = inflight.get(response.id);
          inflight.delete(response.id);
          if (!target) break;
          setDataset((prev) =>
            prev.raw === target.raw
              ? { raw: prev.raw, results: new Map(prev.results).set(target.key, response.payload) }
              : prev,
          );
          setLastResult(response.payload);
          break;
        }
        case 'ERROR':
          inflight.delete(response.id);
          setError(`データ処理エラー: ${response.payload}`);
          break;
      }
    };
    worker.onerror = (e) => setError(`Worker エラー: ${e.message}`);

    return () => {
      worker.terminate();
      inflight.clear();
      workerRef.current = null;
    };
  }, []);

  // 初期 CSV の取得 (StrictMode の二重実行でも二重に解析しないよう AbortController で中断)
  useEffect(() => {
    const controller = new AbortController();
    fetch(sampleCsvUrl, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`サンプルCSVファイルの取得に失敗しました (HTTP ${res.status})`);
        return res.text();
      })
      .then((csvText) => post({ type: 'PARSE_CSV', payload: csvText }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'データの読み込みに失敗しました。');
      });
    return () => controller.abort();
  }, [sampleCsvUrl, post]);

  const key = weightsCacheKey(weights);
  const cached = dataset.results.get(key);

  // 未計算のウェイトであれば Worker に計算を依頼 (同一リクエストの重複送信はしない)
  useEffect(() => {
    if (dataset.raw.length === 0 || dataset.results.has(key)) return;
    const inflight = inflightRef.current;
    for (const req of inflight.values()) {
      if (req.raw === dataset.raw && req.key === key) return;
    }
    const id = post({ type: 'PROCESS_DATA', payload: { rawData: dataset.raw, weights } });
    if (id !== null) inflight.set(id, { raw: dataset.raw, key });
  }, [dataset, key, weights, post]);

  /** CSV インポートなど外部からデータセットを差し替える */
  const handleDataLoaded = useCallback((newData: PrefectureData[]) => {
    setError(null);
    setDataset({
      raw: newData.map((d) => ({ ...d, year: d.year || DEFAULT_YEAR })),
      results: new Map(),
    });
  }, []);

  return {
    rawPrefectures: dataset.raw,
    /** 現在のウェイトの計算結果。再計算中は直前の結果を返し、画面のちらつきを防ぐ */
    allPrefectures: cached ?? lastResult,
    weights,
    setWeights,
    loading: error === null && cached === undefined,
    error,
    handleDataLoaded,
  };
}
