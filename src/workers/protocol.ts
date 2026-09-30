import type { MetricWeights, PrefectureData } from '../types/prefecture';

/**
 * メインスレッド ⇔ Web Worker 間のメッセージ定義。
 * すべてのリクエストに単調増加の `id` を付与し、レスポンス側でも同じ `id` を返すことで
 * ウェイトを連続変更した際に「古い計算結果が新しい結果を上書きする」競合を防ぐ。
 */
export type WorkerRequest =
  | { id: number; type: 'PARSE_CSV'; payload: string }
  | { id: number; type: 'PROCESS_DATA'; payload: { rawData: PrefectureData[]; weights: MetricWeights } };

export type WorkerResponse =
  | { id: number; type: 'PARSE_SUCCESS'; payload: PrefectureData[] }
  | { id: number; type: 'PROCESS_SUCCESS'; payload: PrefectureData[] }
  | { id: number; type: 'ERROR'; payload: string };
