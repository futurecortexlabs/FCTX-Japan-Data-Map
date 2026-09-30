import { useEffect, useRef } from 'react';

export const KONAMI_CODE = [
  'arrowup', 'arrowup',
  'arrowdown', 'arrowdown',
  'arrowleft', 'arrowright',
  'arrowleft', 'arrowright',
  'b', 'a',
] as const;

/**
 * 入力履歴の末尾がコナミコマンドと一致するかを判定する純粋関数。
 * 一致しなかった場合も「次の入力で一致し得る」末尾部分を残すため、途中で打ち間違えても復帰できる。
 */
export function advanceKonamiSequence(sequence: readonly string[], key: string): { sequence: string[]; matched: boolean } {
  const next = [...sequence, key.toLowerCase()].slice(-KONAMI_CODE.length);
  const matched = next.length === KONAMI_CODE.length && next.every((k, i) => k === KONAMI_CODE[i]);
  return { sequence: matched ? [] : next, matched };
}

export const useKonamiCode = (onUnlock: () => void) => {
  // コールバックは最新のものを参照しつつ、リスナーは 1 回だけ登録する
  const onUnlockRef = useRef(onUnlock);
  useEffect(() => {
    onUnlockRef.current = onUnlock;
  }, [onUnlock]);

  useEffect(() => {
    let sequence: string[] = [];
    const handleKeyDown = (e: KeyboardEvent) => {
      const result = advanceKonamiSequence(sequence, e.key);
      sequence = result.sequence;
      if (result.matched) onUnlockRef.current();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
};
