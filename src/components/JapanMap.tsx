import React, { useRef, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import type { LeafletMouseEvent, PathOptions, GeoJSON as LGeoJSON } from 'leaflet';
import type { PrefectureData, MetricType } from '../types/prefecture';
import { METRIC_CONFIGS } from './MetricSelector';
import { getColorForScore } from '../utils/colorScale';
import geoJsonData from '../data/prefectures.json';

interface JapanMapProps {
  data: PrefectureData[];
  currentMetric: MetricType;
  selectedPrefCodes: number[];
  onSelectPrefecture: (prefCode: number) => void;
  selectedYear: number;
}

export const JapanMap: React.FC<JapanMapProps> = ({
  data,
  currentMetric,
  selectedPrefCodes,
  onSelectPrefecture,
  selectedYear,
}) => {
  const config = METRIC_CONFIGS[currentMetric];
  const geoJsonLayerRef = useRef<LGeoJSON>(null);

  // 日本の中心座標 (Leaflet初期位置)
  const position: [number, number] = [37.5, 137.5];
  const zoomLevel = 5;

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
          fillOpacity: 0.9,
          weight: isSelected ? 2.5 : 1.5,
          color: isSelected ? '#4f46e5' : '#64748b',
        });
        targetLayer.bringToFront();
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
    <div className="w-full h-full min-h-0 bg-slate-100 dark:bg-slate-950 rounded-xl overflow-hidden shadow-inner border border-slate-200/50 dark:border-slate-800/50 relative flex flex-col">
      <MapContainer
        center={position}
        zoom={zoomLevel}
        minZoom={4}
        maxZoom={8}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        <GeoJSON
          ref={geoJsonLayerRef}
          data={geoJsonData as any}
          style={getFeatureStyle}
          onEachFeature={onEachFeature}
        />
      </MapContainer>

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
        <div className="flex items-center gap-2 border-t border-slate-100 dark:border-slate-800 pt-2 text-[10px] text-slate-500 dark:text-slate-400">
          <div className="w-3.5 h-3.5 bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded" />
          <span>データ未登録</span>
        </div>
      </div>
    </div>
  );
};

