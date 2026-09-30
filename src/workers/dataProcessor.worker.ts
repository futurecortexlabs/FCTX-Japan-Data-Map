/// <reference lib="webworker" />
import { parsePrefectureCsv } from '../utils/csv';
import { processPrefectureData } from '../utils/score';
import type { WorkerRequest, WorkerResponse } from './protocol';

declare const self: DedicatedWorkerGlobalScope;

const reply = (message: WorkerResponse) => self.postMessage(message);

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const request = e.data;
  try {
    switch (request.type) {
      case 'PARSE_CSV': {
        const { data, skippedRows } = parsePrefectureCsv(request.payload);
        if (skippedRows > 0) {
          console.warn(`[worker] 不正な都道府県コードの行を ${skippedRows} 件スキップしました`);
        }
        reply({ id: request.id, type: 'PARSE_SUCCESS', payload: data });
        break;
      }
      case 'PROCESS_DATA': {
        const processed = processPrefectureData(request.payload.rawData, request.payload.weights);
        reply({ id: request.id, type: 'PROCESS_SUCCESS', payload: processed });
        break;
      }
    }
  } catch (err) {
    reply({ id: request.id, type: 'ERROR', payload: err instanceof Error ? err.message : String(err) });
  }
};
