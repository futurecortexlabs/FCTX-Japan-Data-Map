import { useEffect, useEffectEvent } from 'react';

/**
 * 宣言的な setInterval。`delayMs` に null を渡すと停止する。
 * コールバックは useEffectEvent で常に最新の props/state を参照するため、
 * コールバックが変わってもタイマーはリセットされない。
 */
export function useInterval(callback: () => void, delayMs: number | null) {
  const onTick = useEffectEvent(callback);
  useEffect(() => {
    if (delayMs === null) return;
    const id = window.setInterval(() => onTick(), delayMs);
    return () => window.clearInterval(id);
  }, [delayMs]);
}
