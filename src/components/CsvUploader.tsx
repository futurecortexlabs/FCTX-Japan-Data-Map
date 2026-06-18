import React, { useRef, useState } from 'react';
import Papa from 'papaparse';
import { Upload, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import type { PrefectureData } from '../types/prefecture';

interface CsvUploaderProps {
  onDataLoaded: (data: PrefectureData[]) => void;
  sampleCsvUrl: string;
}

export const CsvUploader: React.FC<CsvUploaderProps> = ({
  onDataLoaded,
  sampleCsvUrl,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');

  const normalizeKey = (key: string): string => {
    const cleaned = key.trim().toLowerCase();
    if (['prefcode', 'code', 'id', '都道府県コード', 'コード', '都道府県id'].includes(cleaned)) return 'prefCode';
    if (['prefname', 'name', 'prefecture', '都道府県名', '都道府県', '名前'].includes(cleaned)) return 'prefName';
    if (['landprice', 'price', '地価', '平均地価', '公示地価'].includes(cleaned)) return 'landPrice';
    if (['population', 'pop', '人口', '住民数', '世帯数'].includes(cleaned)) return 'population';
    if (['listedcompanies', 'companies', 'listed_companies', 'listedcompany', 'uppercompanies', 'upper_companies', '上場企業数', '企業数', '上場会社数'].includes(cleaned)) return 'listedCompanies';
    if (['year', '年', '年度', '西暦'].includes(cleaned)) return 'year';
    if (['starbucks', 'starbuckscount', 'starbucks_count', 'スタバ', 'スターバックス', 'スタバ店舗数'].includes(cleaned)) return 'starbucksCount';
    if (['ramen', 'ramencount', 'ramen_count', 'ラーメン', 'ラーメン店舗数', 'らーめん'].includes(cleaned)) return 'ramenCount';
    if (['attractiveness', 'attractivenessscore', 'charm', '魅力度', '魅力度スコア', '魅力'].includes(cleaned)) return 'attractiveness';
    if (['sunshinehours', 'sunshine', 'sunshine_hours', '日照時間', '年間日照時間', '日照'].includes(cleaned)) return 'sunshineHours';
    return key;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setStatus('idle');
    setMessage('');

    Papa.parse<Record<string, any>>(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          if (results.errors.length > 0) {
            console.warn('PapaParse warnings:', results.errors);
          }
          if (results.data.length === 0) {
            throw new Error('CSVファイル内にデータが見つかりません。');
          }

          const parsedData: PrefectureData[] = results.data.map((row, index) => {
            const normalizedRow: Record<string, any> = {};
            Object.keys(row).forEach((key) => {
              normalizedRow[normalizeKey(key)] = row[key];
            });

            const prefCode = Number(normalizedRow.prefCode);
            const prefName = String(normalizedRow.prefName || '').trim();

            if (isNaN(prefCode) || !prefCode) {
              throw new Error(`行 ${index + 2}: 都道府県コードが正しくありません。`);
            }
            if (!prefName) {
              throw new Error(`行 ${index + 2}: 都道府県名がありません。`);
            }

            return {
              year: normalizedRow.year !== undefined && normalizedRow.year !== '' && normalizedRow.year !== null ? Number(normalizedRow.year) : 2024,
              prefCode,
              prefName,
              landPrice: normalizedRow.landPrice !== undefined && normalizedRow.landPrice !== '' && normalizedRow.landPrice !== null ? Number(normalizedRow.landPrice) : undefined,
              population: normalizedRow.population !== undefined && normalizedRow.population !== '' && normalizedRow.population !== null ? Number(normalizedRow.population) : undefined,
              listedCompanies: normalizedRow.listedCompanies !== undefined && normalizedRow.listedCompanies !== '' && normalizedRow.listedCompanies !== null ? Number(normalizedRow.listedCompanies) : undefined,
              starbucksCount: normalizedRow.starbucksCount !== undefined && normalizedRow.starbucksCount !== '' && normalizedRow.starbucksCount !== null ? Number(normalizedRow.starbucksCount) : undefined,
              ramenCount: normalizedRow.ramenCount !== undefined && normalizedRow.ramenCount !== '' && normalizedRow.ramenCount !== null ? Number(normalizedRow.ramenCount) : undefined,
              attractiveness: normalizedRow.attractiveness !== undefined && normalizedRow.attractiveness !== '' && normalizedRow.attractiveness !== null ? Number(normalizedRow.attractiveness) : undefined,
              sunshineHours: normalizedRow.sunshineHours !== undefined && normalizedRow.sunshineHours !== '' && normalizedRow.sunshineHours !== null ? Number(normalizedRow.sunshineHours) : undefined,
            };
          });

          parsedData.sort((a, b) => a.prefCode - b.prefCode);
          onDataLoaded(parsedData);
          setStatus('success');
          setMessage(`${parsedData.length} 件のデータを正常に読み込みました。`);
        } catch (err: any) {
          setStatus('error');
          setMessage(err.message || 'CSVの解析中にエラーが発生しました。');
        }
      },
      error: (error) => {
        setStatus('error');
        setMessage(`ファイルの読み込みに失敗しました: ${error.message}`);
      },
    });
  };

  const onDragOver = (e: React.DragEvent) => e.preventDefault();

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && fileInputRef.current) {
      fileInputRef.current.files = e.dataTransfer.files;
      const event = { target: { files: e.dataTransfer.files } } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleFileUpload(event);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
          CSVデータインポート
        </p>
        <a
          href={sampleCsvUrl}
          download="sample_prefecture_data.csv"
          className="flex items-center gap-1 text-[10px] text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-bold cursor-pointer"
        >
          <Download className="w-3 h-3" />
          テンプレートCSVをダウンロード
        </a>
      </div>

      <div
        onDragOver={onDragOver}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border border-dashed rounded-lg p-4 flex items-center justify-center gap-3 cursor-pointer transition-all duration-300 ${
          status === 'success'
            ? 'border-emerald-500/50 bg-emerald-50/10 dark:bg-emerald-950/5'
            : status === 'error'
            ? 'border-rose-500/50 bg-rose-50/10 dark:bg-rose-950/5'
            : 'border-slate-300 dark:border-slate-800 hover:border-indigo-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/10'
        }`}
      >
        <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden" />

        {status === 'success' ? (
          <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
        ) : status === 'error' ? (
          <AlertCircle className="w-6 h-6 text-rose-500 shrink-0" />
        ) : (
          <Upload className="w-6 h-6 text-slate-400 dark:text-slate-600 shrink-0" />
        )}

        <div className="text-left min-w-0">
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
            {fileName ? fileName : 'CSVファイルをドラッグ、またはクリックして選択'}
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
            47都道府県の年次データCSVに対応しています。
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`flex items-start gap-2 p-2 rounded-lg text-[10px] font-bold border ${
            status === 'success'
              ? 'bg-emerald-500/5 text-emerald-700 border-emerald-500/10 dark:text-emerald-400'
              : 'bg-rose-500/5 text-rose-700 border-rose-500/10 dark:text-rose-400'
          }`}
        >
          {status === 'success' ? <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />}
          <span>{message}</span>
        </div>
      )}
    </div>
  );
};
