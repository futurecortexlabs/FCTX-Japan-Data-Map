import { useEffect, useRef } from 'react';

/**
 * 宣言的な setInterval。`delayMs` に null を渡すと停止する。
 * コールバックは ref 経由で常に最新のものを呼ぶため、コールバックが変わってもタイマーはリセットされない。
 *
 * 注: useEffectEvent は使わない。React 19.2 の本番ビルドでは React.memo 化されたコンポーネント内で
 * effect event が更新されない (初回クロージャのまま) ため、汎用フックでは ref パターンを採用する。
 */
export function useInterval(callback: () => void, delayMs: number | null) {
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delayMs === null) return;
    const id = window.setInterval(() => callbackRef.current(), delayMs);
    return () => window.clearInterval(id);
  }, [delayMs]);
}
