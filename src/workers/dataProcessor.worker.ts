import Papa from 'papaparse';
import type { PrefectureData, MetricWeights } from '../types/prefecture';
import { processPrefectureData } from '../utils/score';

export type WorkerMessage = 
  | { type: 'PARSE_CSV'; payload: string }
  | { type: 'PROCESS_DATA'; payload: { rawData: PrefectureData[]; weights: MetricWeights } };

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const { type, payload } = e.data;

  if (type === 'PARSE_CSV') {
    try {
      Papa.parse<Record<string, any>>(payload, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            console.warn('Worker PapaParse warnings:', results.errors);
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
            onsenCount: row.onsenCount !== undefined && row.onsenCount !== '' ? Number(row.onsenCount) : undefined,
            hospitalCount: row.hospitalCount !== undefined && row.hospitalCount !== '' ? Number(row.hospitalCount) : undefined,
            pollenLevel: row.pollenLevel !== undefined && row.pollenLevel !== '' ? Number(row.pollenLevel) : undefined,
            childcareScore: row.childcareScore !== undefined && row.childcareScore !== '' ? Number(row.childcareScore) : undefined,
          }));

          self.postMessage({ type: 'PARSE_SUCCESS', payload: parsedData });
        },
        error: (err: any) => {
          self.postMessage({ type: 'PARSE_ERROR', payload: err.message });
        },
      });
    } catch (err: any) {
      self.postMessage({ type: 'PARSE_ERROR', payload: err.message });
    }
  }

  if (type === 'PROCESS_DATA') {
    try {
      const processed = processPrefectureData(payload.rawData, payload.weights);
      self.postMessage({ type: 'PROCESS_SUCCESS', payload: processed });
    } catch (err: any) {
      self.postMessage({ type: 'PROCESS_ERROR', payload: err.message });
    }
  }
};
