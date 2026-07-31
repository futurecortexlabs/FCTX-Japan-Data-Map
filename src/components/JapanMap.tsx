import React, { useRef, useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import type { LeafletMouseEvent, PathOptions, GeoJSON as LGeoJSON } from 'leaflet';
import type { PrefectureData, MetricType } from '../types/prefecture';
import { METRIC_CONFIGS } from './MetricSelector';
import { getColorForScore } from '../utils/colorScale';
import geoJsonUrl from '../data/prefectures.json?url';
import { motion } from 'framer-motion';

interface JapanMapProps {
  data: PrefectureData[];
  currentMetric: MetricType;
  selectedPrefCodes: number[];
  onSelectPrefecture: (prefCode: number) => void;
  selectedYear: number;
  flashEffect?: string;
  isRetroMode?: boolean;
}

const MapController: React.FC = () => {
  const map = useMap();
  return (
    <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-[1000]">
      <button
        onClick={() => map.zoomIn()}
        className="w-7 h-7 rounded-lg bg-white/95 dark:bg-slate-900/95 border border-slate-200/50 dark:border-slate-800/50 shadow flex items-center justify-center font-black text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        title="拡大"
      >
        ＋
      </button>
      <button
        onClick={() => map.zoomOut()}
        className="w-7 h-7 rounded-lg bg-white/95 dark:bg-slate-900/95 border border-slate-200/50 dark:border-slate-800/50 shadow flex items-center justify-center font-black text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        title="縮小"
      >
        －
      </button>
      <button
        onClick={() => map.setView([37.5, 137.5], 5)}
        className="w-7 h-7 rounded-lg bg-white/95 dark:bg-slate-900/95 border border-slate-200/50 dark:border-slate-800/50 shadow flex items-center justify-center text-[8px] font-black text-slate-750 dark:text-slate-300 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        title="日本全図表示にリセット"
      >
        全図
      </button>
    </div>
  );
};

export const JapanMap: React.FC<JapanMapProps> = React.memo(({
  data,
  currentMetric,
  selectedPrefCodes,
  onSelectPrefecture,
  selectedYear,
  flashEffect,
  isRetroMode,
}) => {
  const geoJsonLayerRef = useRef<LGeoJSON>(null);
  const position: [number, number] = [38.0, 137.5];
  const zoomLevel = 5;

  const config = METRIC_CONFIGS[currentMetric];

  // GeoJSON data fetching
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  useEffect(() => {
    fetch(geoJsonUrl)
      .then(res => res.json())
      .then(data => setGeoJsonData(data))
      .catch(err => console.error("Failed to load geojson:", err));
  }, []);

  // Scanner Effect State
  const [isScanning, setIsScanning] = useState(false);
  useEffect(() => {
    setIsScanning(true);
    const timer = setTimeout(() => setIsScanning(false), 1500);
    return () => clearTimeout(timer);
  }, [currentMetric, selectedYear]);

  const formatValue = (val?: number) => {
    if (val === undefined || isNaN(val)) return 'データ未登録';
    if (currentMetric === 'population') {
      if (val >= 10000) {
        return `${(val / 10000).toLocaleString(undefined, { maximumFractionDigits: 1 })} 万人`;
      }
      return `${val.toLocaleString()} 人`;
    }
    return `${val.toLocaleString()} ${config.unit}`;
  };

  // 各都道府県ポリゴンのスタイル設定
  const getFeatureStyle = (feature: any): PathOptions => {
    const prefCode = feature.properties.id;
    const prefData = data.find((d) => d.prefCode === prefCode);

    // 指標に対応するスコア（偏差値）を取得
    const scoreKey = config.scoreKey;
    const score = prefData && scoreKey ? (prefData[scoreKey] as number) : undefined;

    const fillColor = getColorForScore(score);
    const isSelected = selectedPrefCodes.includes(prefCode);

    return {
      fillColor: fillColor,
      fillOpacity: isSelected ? 0.85 : 0.7,
      color: isSelected ? '#4f46e5' : '#94a3b8', // 選択されている都道府県は太いインディゴで囲む
      weight: isSelected ? 2.5 : 0.8,
      dashArray: isSelected ? '' : '3',
    };
  };

  // tooltipのコンテンツを生成
  const generateTooltipContent = (prefCode: number, prefName: string) => {
    const prefData = data.find((d) => d.prefCode === prefCode);
    const val = prefData ? prefData[currentMetric] : undefined;
    const scoreKey = config.scoreKey;
    const scoreVal = prefData && scoreKey ? prefData[scoreKey] : undefined;

    return `
      <div class="p-1 text-slate-800 dark:text-slate-800 font-sans">
        <strong class="text-sm font-bold block mb-1 border-b pb-0.5 border-slate-200">${prefName}</strong>
        <span class="text-xs text-slate-500 block">${config.label}</span>
        <span class="text-sm font-black text-indigo-600 block">${formatValue(val as number)}</span>
        ${
          scoreVal !== undefined && !isNaN(scoreVal as number)
            ? `<span class="text-[10px] text-slate-400 font-semibold block mt-0.5">偏差値: ${(scoreVal as number).toFixed(1)}</span>`
            : ''
        }
      </div>
    `;
  };

  // 依存配列が変わったときにスタイルとツールチップを再計算して直接更新する
  useEffect(() => {
    if (geoJsonLayerRef.current) {
      geoJsonLayerRef.current.eachLayer((layer: any) => {
        const feature = layer.feature;
        if (feature) {
          // スタイルの更新
          layer.setStyle(getFeatureStyle(feature));
          
          // ツールチップの更新
          const prefCode = feature.properties.id;
          const prefName = feature.properties.nam_ja || feature.properties.name || '不明';
          const newTooltipContent = generateTooltipContent(prefCode, prefName);
          
          if (layer.getTooltip()) {
            layer.setTooltipContent(newTooltipContent);
          }
        }
      });
    }
  }, [data, currentMetric, selectedPrefCodes, selectedYear]);

  // 各都道府県ポリゴンのイベントとポップアップの初期設定
  const onEachFeature = (feature: any, layer: any) => {
    const prefCode = feature.properties.id;
    const prefName = feature.properties.nam_ja || feature.properties.name || '不明';

    const tooltipContent = generateTooltipContent(prefCode, prefName);

    layer.bindTooltip(tooltipContent, {
      sticky: true,
      direction: 'top',
      opacity: 0.95,
      className: 'rounded-lg border-none shadow-md bg-white dark:bg-white',
    });

    // イベントリスナー
    layer.on({
      mouseover: (e: LeafletMouseEvent) => {
        const targetLayer = e.target;
        const isSelected = selectedPrefCodes.includes(prefCode);
        targetLayer.setStyle({
          fillOpacity: 0.95,
          weight: isSelected ? 3.0 : 2.5,
          color: isSelected ? '#a855f7' : '#38bdf8',
        });
      },
      mouseout: (e: LeafletMouseEvent) => {
        const targetLayer = e.target;
        // 元のスタイルに戻す
        targetLayer.setStyle(getFeatureStyle(feature));
      },
      click: () => {
        onSelectPrefecture(prefCode);
      },
    });
  };

  return (
    <motion.div
      className={`h-full w-full relative group rounded-2xl overflow-hidden shadow-inner border-[6px] ${
        isRetroMode ? 'border-transparent' : 'border-slate-200/50 dark:border-slate-800/50'
      } ${
        flashEffect === 'lehman' ? 'flash-lehman' : flashEffect === 'covid' ? 'flash-covid' : ''
      }`}
      style={{ perspective: 1200 }}
    >
      <motion.div 
        className="w-full h-full relative"
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
      <style>{`
        @keyframes flashRed {
          0%, 100% { border-color: rgba(226, 232, 240, 0.5); box-shadow: inset 0 2px 4px 0 rgba(0,0,0,0.06); }
          50% { border-color: rgb(239, 68, 68); box-shadow: 0 0 25px 8px rgba(239, 68, 68, 0.45); }
        }
        @keyframes flashCyan {
          0%, 100% { border-color: rgba(226, 232, 240, 0.5); box-shadow: inset 0 2px 4px 0 rgba(0,0,0,0.06); }
          50% { border-color: rgb(6, 182, 212); box-shadow: 0 0 25px 8px rgba(6, 182, 212, 0.45); }
        }
        .flash-lehman {
          animation: flashRed 1.5s ease-in-out;
        }
        .flash-covid {
          animation: flashCyan 1.5s ease-in-out;
        }
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(300%); }
        }
        .animate-scanline {
          animation: scanline 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          height: 30%;
        }
      `}</style>
          <MapContainer
            center={position}
            zoom={zoomLevel}
            zoomControl={false}
            scrollWheelZoom={true}
            doubleClickZoom={true}
            dragging={true}
            className="w-full h-full bg-slate-50/50 dark:bg-slate-900/50"
            style={{ minHeight: '100%', minWidth: '100%' }}
            attributionControl={false}
          >
            {/* Base tile layer (carto light/dark without labels) */}
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://carto.com/">carto.com</a>'
              className="opacity-40 grayscale"
            />
            {geoJsonData && (
              <GeoJSON
                ref={geoJsonLayerRef}
                data={geoJsonData as any}
                style={getFeatureStyle}
                onEachFeature={onEachFeature}
              />
            )}
            <MapController />
          </MapContainer>

          {/* Initial Loading Skeleton */}
          {!geoJsonData && (
            <div className="absolute inset-0 z-[400] flex flex-col items-center justify-center bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm">
              <div className="w-12 h-12 border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin mb-4" />
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 animate-pulse">
                日本地図データを読み込み中...
              </p>
            </div>
          )}

      {/* スキャナー（データアート効果） */}
      {isScanning && (
        <div className="absolute inset-0 pointer-events-none z-[2000] overflow-hidden rounded-xl mix-blend-overlay">
          <div className="w-full bg-gradient-to-b from-transparent via-indigo-500/80 to-transparent animate-scanline border-b-2 border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.5)]" />
        </div>
      )}

      {/* 右上 年次オーバーレイ表示 */}
      <div className="absolute top-4 right-4 bg-slate-900/10 dark:bg-white/5 backdrop-blur-[1px] px-4 py-2 rounded-xl pointer-events-none select-none z-[1000]">
        <span className="text-5xl font-black tracking-tighter text-slate-800/20 dark:text-white/10 tabular-nums">
          {selectedYear}
        </span>
      </div>

      {/* カラー凡例 (Legend) */}
      <div className="absolute bottom-4 left-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3.5 rounded-lg shadow-md border border-slate-200/50 dark:border-slate-800/50 z-[1000] flex flex-col gap-2.5 max-w-[200px]">
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          凡例: {config.label}
        </span>
        <div className="space-y-1.5">
          <div className="h-2.5 w-full rounded-full bg-gradient-to-r from-blue-500 via-yellow-200 to-red-500" />
          <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
            <span>低 (偏差値 35)</span>
            <span>高 (偏差値 65)</span>
          </div>
        </div>
      </div>
      </motion.div>
    </motion.div>
  );
});
