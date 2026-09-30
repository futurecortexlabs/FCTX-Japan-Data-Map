import confettiLib from 'canvas-confetti';

/**
 * アプリ共通の紙吹雪。
 * - ライブラリ既定の OffscreenCanvas ワーカー経路は、ビューポートが 0×0 のとき
 *   (非表示タブやプレビュー環境) に `canvas.getBoundingClientRect is not a function` で落ちるため、
 *   メインスレッド描画のインスタンスを 1 つだけ生成して共有する
 * - OS の「視差効果を減らす」設定を尊重する
 */
const cannon = confettiLib.create(undefined, { resize: true, useWorker: false, disableForReducedMotion: true });

export const confetti = (options: confettiLib.Options) => cannon(options);
