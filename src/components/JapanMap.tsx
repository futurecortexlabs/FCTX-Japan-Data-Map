import React, { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import type { Layer, PathOptions, Polygon, GeoJSON as LGeoJSON } from 'leaflet';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import type { PrefectureData, MetricType } from '../types/prefecture';
import { METRIC_CONFIGS } from '../constants/metrics';
import { getColorForScore } from '../utils/colorScale';
import { escapeHtml, formatMetricValue } from '../utils/format';
import geoJsonUrl from '../data/prefectures.json?url';
import { motion } from 'framer-motion';

interface PrefFeatureProps {
  id: number;
  nam?: string;
  nam_ja?: string;
}
type PrefFeature = Feature<Geometry, PrefFeatureProps>;
type PrefFeatureCollection = FeatureCollection<Geometry, PrefFeatureProps>;
type PrefLayer = Polygon<PrefFeatureProps>;

export type MapFlashEffect = 'lehman' | 'covid';

interface JapanMapProps {
  data: PrefectureData[];
  currentMetric: MetricType;
  selectedPrefCodes: number[];
  onSelectPrefecture: (prefCode: number) => void;
  selectedYear: number;
  flashEffect?: MapFlashEffect;
  isRetroMode?: boolean;
}

const INITIAL_CENTER: [number, number] = [38.0, 137.5];
const INITIAL_ZOOM = 5;

// GeoJSON はアプリ全体で 1 度だけ取得し、再マウント時は同じ Promise を再利用する
let geoJsonPromise: Promise<PrefFeatureCollection> | null = null;
const loadGeoJson = (): Promise<PrefFeatureCollection> => {
  geoJsonPromise ??= fetch(geoJsonUrl).then((res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<PrefFeatureCollection>;
  });
  return geoJsonPromise;
};

const MAP_BUTTON_CLASS =
  'w-7 h-7 rounded-lg bg-white/95 dark:bg-slate-900/95 border border-slate-200/50 dark:border-slate-800/50 shadow flex items-center justify-center font-black text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors';

const MapController: React.FC = () => {
  const map = useMap();
  return (
    <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-[1000]">
      <button type="button" onClick={() => map.zoomIn()} className={`${MAP_BUTTON_CLASS} text-xs`} title="拡大" aria-label="拡大">
        ＋
      </button>
      <button type="button" onClick={() => map.zoomOut()} className={`${MAP_BUTTON_CLASS} text-xs`} title="縮小" aria-label="縮小">
        －
      </button>
      <button
        type="button"
        onClick={() => map.setView([37.5, 137.5], INITIAL_ZOOM)}
        className={`${MAP_BUTTON_CLASS} text-[8px]`}
        title="日本全図表示にリセット"
        aria-label="日本全図表示にリセット"
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
  const config = METRIC_CONFIGS[currentMetric];

  const [geoJsonData, setGeoJsonData] = useState<PrefFeatureCollection | null>(null);
  const [geoJsonError, setGeoJsonError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    loadGeoJson()
      .then((json) => {
        if (!cancelled) setGeoJsonData(json);
      })
      .catch((err: unknown) => {
        console.error('Failed to load geojson:', err);
        geoJsonPromise = null; // 次回マウント時に再試行できるようにする
        if (!cancelled) setGeoJsonError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // prefCode → データの O(1) ルックアップ (ポリゴンごとの線形探索を回避)
  const dataByCode = useMemo(() => new Map(data.map((d) => [d.prefCode, d])), [data]);
  const selectedSet = useMemo(() => new Set(selectedPrefCodes), [selectedPrefCodes]);

  const scoreOf = (prefData: PrefectureData | undefined): number | undefined =>
    prefData && config.scoreKey ? (prefData[config.scoreKey] as number | undefined) : undefined;

  const getFeatureStyle = (feature?: PrefFeature): PathOptions => {
    const prefCode = feature?.properties.id ?? -1;
    const isSelected = selectedSet.has(prefCode);
    return {
      fillColor: getColorForScore(scoreOf(dataByCode.get(prefCode))),
      fillOpacity: isSelected ? 0.85 : 0.7,
      color: isSelected ? '#4f46e5' : '#94a3b8', // 選択されている都道府県は太いインディゴで囲む
      weight: isSelected ? 2.5 : 0.8,
      dashArray: isSelected ? '' : '3',
    };
  };

  const generateTooltipContent = (feature: PrefFeature): string => {
    const prefData = dataByCode.get(feature.properties.id);
    const prefName = prefData?.prefName || feature.properties.nam_ja || feature.properties.nam || '不明';
    const value = prefData?.[currentMetric];
    const score = scoreOf(prefData);

    return `
      <div class="p-1 text-slate-800 dark:text-slate-800 font-sans">
        <strong class="text-sm font-bold block mb-1 border-b pb-0.5 border-slate-200">${escapeHtml(prefName)}</strong>
        <span class="text-xs text-slate-500 block">${escapeHtml(config.label)}</span>
        <span class="text-sm font-black text-indigo-600 block">${escapeHtml(formatMetricValue(value, currentMetric, config.unit))}</span>
        ${
          score !== undefined && Number.isFinite(score)
            ? `<span class="text-[10px] text-slate-400 font-semibold block mt-0.5">偏差値: ${score.toFixed(1)}</span>`
            : ''
        }
      </div>
    `;
  };

  // Leaflet のイベントハンドラは初回バインド時のクロージャを保持し続ける。
  // 最新の props から計算した関数を ref 経由で参照し、「マウスアウトで古い指標の色に戻る」問題を防ぐ。
  const latestRef = useRef({ getFeatureStyle, selectedSet, onSelectPrefecture });
  useEffect(() => {
    latestRef.current = { getFeatureStyle, selectedSet, onSelectPrefecture };
  });

  // レイヤーを作り直さず、スタイルとツールチップだけを差し替える (47 ポリゴンの再生成を回避)
  const refreshLayers = useEffectEvent(() => {
    geoJsonLayerRef.current?.eachLayer((layer: Layer) => {
      const path = layer as PrefLayer;
      if (!path.feature) return;
      path.setStyle(getFeatureStyle(path.feature));
      if (path.getTooltip()) path.setTooltipContent(generateTooltipContent(path.feature));
    });
  });
  useEffect(() => {
    refreshLayers();
  }, [dataByCode, currentMetric, selectedSet, geoJsonData]);

  const onEachFeature = (feature: PrefFeature, layer: Layer) => {
    const path = layer as PrefLayer;
    const prefCode = feature.properties.id;

    path.bindTooltip(generateTooltipContent(feature), {
      sticky: true,
      direction: 'top',
      opacity: 0.95,
      className: 'rounded-lg border-none shadow-md bg-white dark:bg-white',
    });

    path.on({
      mouseover: () => {
        const isSelected = latestRef.current.selectedSet.has(prefCode);
        path.setStyle({
          fillOpacity: 0.95,
          weight: isSelected ? 3.0 : 2.5,
          color: isSelected ? '#a855f7' : '#38bdf8',
        });
      },
      mouseout: () => path.setStyle(latestRef.current.getFeatureStyle(feature)),
      click: () => latestRef.current.onSelectPrefecture(prefCode),
    });
  };

  return (
    <motion.div
      className={`h-full w-full relative group rounded-2xl overflow-hidden shadow-inner border-[6px] ${
        isRetroMode ? 'border-transparent' : 'border-slate-200/50 dark:border-slate-800/50'
      } ${flashEffect ? `flash-${flashEffect}` : ''}`}
      style={{ perspective: 1200 }}
    >
      <div className="w-full h-full relative">
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
            100% { transform: translateY(400%); }
          }
          .animate-scanline {
            animation: scanline 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
            height: 30%;
          }
          @media (prefers-reduced-motion: reduce) {
            .animate-scanline, .flash-lehman, .flash-covid { animation: none; }
            .animate-scanline { display: none; }
          }
        `}</style>
        <MapContainer
          center={INITIAL_CENTER}
          zoom={INITIAL_ZOOM}
          zoomControl={false}
          scrollWheelZoom={true}
          doubleClickZoom={true}
          dragging={true}
          className="w-full h-full bg-slate-50/50 dark:bg-slate-900/50"
          style={{ minHeight: '100%', minWidth: '100%' }}
          attributionControl={true}
        >
          {/* ベースマップ: 国土地理院 淡色地図 (API キー不要・出典表示が利用条件) */}
          <TileLayer
            url="https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png"
            attribution='<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank" rel="noopener noreferrer">出典: 国土地理院</a>'
            maxNativeZoom={18}
            className="opacity-40 grayscale"
          />
          {geoJsonData && (
            <GeoJSON ref={geoJsonLayerRef} data={geoJsonData} style={getFeatureStyle} onEachFeature={onEachFeature} />
          )}
          <MapController />
        </MapContainer>

        {/* Initial Loading Skeleton / Error */}
        {!geoJsonData && (
          <div className="absolute inset-0 z-[400] flex flex-col items-center justify-center bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm" role="status">
            {geoJsonError ? (
              <p className="text-sm font-bold text-red-500">日本地図データの読み込みに失敗しました。再読み込みしてください。</p>
            ) : (
              <>
                <div className="w-12 h-12 border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin mb-4" />
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 animate-pulse">日本地図データを読み込み中...</p>
              </>
            )}
          </div>
        )}

        {/* スキャナー（データアート効果）: key の変化で再マウントし、CSS アニメーションを 1 回再生する */}
        <div
          key={`${currentMetric}-${selectedYear}`}
          className="absolute inset-0 pointer-events-none z-[2000] overflow-hidden rounded-xl mix-blend-overlay"
          aria-hidden="true"
        >
          <div className="w-full bg-gradient-to-b from-transparent via-indigo-500/80 to-transparent animate-scanline border-b-2 border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.5)]" />
        </div>

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
      </div>
    </motion.div>
  );
});
JapanMap.displayName = 'JapanMap';
