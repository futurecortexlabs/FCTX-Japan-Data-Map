import { useEffect, useState } from 'react';

/**
 * localStorage に永続化される useState。
 * 保存値は外部入力として扱い、`parse` で検証・補正してから採用する (壊れた値や古いスキーマへの耐性)。
 */
export function usePersistentState<T>(
  key: string,
  fallback: T,
  parse: (stored: unknown) => T | null,
) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) return parse(JSON.parse(raw)) ?? fallback;
    } catch (e) {
      console.warn(`[usePersistentState] "${key}" の読み込みに失敗しました`, e);
    }
    return fallback;
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn(`[usePersistentState] "${key}" の保存に失敗しました`, e);
    }
  }, [key, value]);

  return [value, setValue] as const;
}
