#!/usr/bin/env node
/**
 * 都道府県 GeoJSON を配信用に最適化する。
 *
 *   node scripts/optimize-geojson.mjs [input] [output]
 *
 * 1. 座標を小数点以下 PRECISION 桁に丸める (4 桁 ≒ 11m。地図の表示縮尺では判別不能)
 * 2. Douglas–Peucker 法で各リングを単純化する (許容誤差 TOLERANCE 度)
 * 3. 単純化後に面積が極小になった離島リングを除去する (外周リングは必ず残す)
 * 4. インデントなしで出力する
 *
 * 丸めは単純化の「前」に行うため、隣接県が共有する境界点は同じ座標に丸められる。
 * 許容誤差は表示最大ズームでも境界の隙間が 1px 未満になる値に設定している。
 */
import { readFileSync, writeFileSync } from 'node:fs';

const PRECISION = 4;
const TOLERANCE = 0.0008; // 度 (≒ 80m)
const MIN_ISLAND_AREA = 1e-6; // 平方度 (≒ 0.01 km²)

const [input = 'src/data/prefectures.json', output = input] = process.argv.slice(2);

const factor = 10 ** PRECISION;
const round = (v) => Math.round(v * factor) / factor;

/** 点 p と線分 ab の距離の二乗 */
function segmentDistanceSq([px, py], [ax, ay], [bx, by]) {
  let dx = bx - ax;
  let dy = by - ay;
  if (dx !== 0 || dy !== 0) {
    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
    ax += t * dx;
    ay += t * dy;
  }
  dx = px - ax;
  dy = py - ay;
  return dx * dx + dy * dy;
}

/** 反復版 Douglas–Peucker (巨大なリングでもスタックオーバーフローしない) */
function simplify(points, tolerance) {
  if (points.length <= 4) return points;
  const tolSq = tolerance * tolerance;
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [first, last] = stack.pop();
    let maxDist = 0;
    let index = -1;
    for (let i = first + 1; i < last; i++) {
      const d = segmentDistanceSq(points[i], points[first], points[last]);
      if (d > maxDist) {
        maxDist = d;
        index = i;
      }
    }
    if (maxDist > tolSq) {
      keep[index] = 1;
      stack.push([first, index], [index, last]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

const ringArea = (ring) => {
  let sum = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    sum += (ring[j][0] - ring[i][0]) * (ring[j][1] + ring[i][1]);
  }
  return Math.abs(sum / 2);
};

function optimizeRing(ring) {
  const rounded = [];
  for (const [x, y] of ring) {
    const p = [round(x), round(y)];
    const prev = rounded[rounded.length - 1];
    if (!prev || prev[0] !== p[0] || prev[1] !== p[1]) rounded.push(p);
  }
  const simplified = simplify(rounded, TOLERANCE);
  // 閉じたリングは最低 4 点 (三角形 + 始点) 必要
  return simplified.length >= 4 ? simplified : rounded.length >= 4 ? rounded : null;
}

function optimizePolygon(polygon) {
  const [outer, ...holes] = polygon.map(optimizeRing);
  if (!outer) return null;
  return [outer, ...holes.filter((h) => h && ringArea(h) >= MIN_ISLAND_AREA)];
}

const geojson = JSON.parse(readFileSync(input, 'utf8'));
const stats = { before: 0, after: 0, droppedPolygons: 0 };
const countPoints = (polys) => polys.flat().reduce((n, ring) => n + ring.length, 0);

for (const feature of geojson.features) {
  const { geometry } = feature;
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  stats.before += countPoints(polygons);

  const optimized = polygons.map(optimizePolygon).filter(Boolean);
  // 各県で最大のポリゴン (本土) は必ず残し、極小の離島のみを除去する
  const largest = Math.max(...optimized.map((p) => ringArea(p[0])));
  const kept = optimized.filter((p) => ringArea(p[0]) === largest || ringArea(p[0]) >= MIN_ISLAND_AREA);
  stats.droppedPolygons += polygons.length - kept.length;
  stats.after += countPoints(kept);

  feature.geometry = kept.length === 1 ? { type: 'Polygon', coordinates: kept[0] } : { type: 'MultiPolygon', coordinates: kept };
  feature.properties = { id: feature.properties.id, nam: feature.properties.nam, nam_ja: feature.properties.nam_ja };
}

const json = JSON.stringify(geojson);
writeFileSync(output, json);
console.log(
  `points: ${stats.before.toLocaleString()} → ${stats.after.toLocaleString()}, ` +
    `dropped tiny islands: ${stats.droppedPolygons}, size: ${(Buffer.byteLength(json) / 1024).toFixed(0)} KB → ${output}`,
);
