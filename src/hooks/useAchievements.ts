import { useCallback, useEffect, useState } from 'react';
import { confetti } from '../utils/confetti';
import { checkNewAchievements, mergeUserStats, parseUserStats, DEFAULT_USER_STATS, type Achievement, type UserStats } from '../utils/achievements';
import { usePersistentState } from './usePersistentState';

const parseStringArray = (v: unknown): string[] | null =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : null;

const TOAST_DURATION_MS = 5000;

/**
 * 実績 (アチーブメント) の解除判定・永続化・通知をまとめたフック。
 *
 * @param derivedStats 画面状態から導出できる統計 (選択中の県のスコアなど)。
 *   保存済みの統計と「最大値」でマージされるため、呼び出し側で state 同期の effect を書く必要がない。
 */
export function useAchievements(derivedStats: Partial<UserStats>) {
  const [unlocked, setUnlocked] = usePersistentState<string[]>('fctx_unlocked_achievements', [], parseStringArray);
  const [storedStats, setStoredStats] = usePersistentState<UserStats>('fctx_user_stats', DEFAULT_USER_STATS, parseUserStats);
  const [toast, setToast] = useState<Achievement | null>(null);

  const stats = mergeUserStats(storedStats, derivedStats);

  // 導出統計が保存値を更新した / 新しい実績の条件を満たした場合は、レンダー中に state を調整する。
  // (React 公式の「props 変化に応じた state 調整」パターン。effect 経由より再レンダーが 1 回少ない)
  if (stats !== storedStats) {
    setStoredStats(stats);
  }
  const newlyUnlocked = checkNewAchievements(stats, unlocked);
  if (newlyUnlocked.length > 0) {
    setUnlocked([...unlocked, ...newlyUnlocked.map((a) => a.id)]);
    setToast(newlyUnlocked[0]);
  }

  // トースト表示時の演出 (外部システムとの同期のみ)
  useEffect(() => {
    if (!toast) return;
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#4f46e5', '#10b981', '#f59e0b'] });
    const timer = setTimeout(() => setToast(null), TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  /** イベント起点の統計更新 (ガチャ回数など) */
  const recordStats = useCallback(
    (update: (prev: UserStats) => Partial<UserStats>) => setStoredStats((prev) => ({ ...prev, ...update(prev) })),
    [setStoredStats],
  );

  /** 統計に依らない隠し実績の解除 */
  const unlock = useCallback(
    (id: string) => setUnlocked((prev) => (prev.includes(id) ? prev : [...prev, id])),
    [setUnlocked],
  );

  return { unlocked, stats, toast, recordStats, unlock };
}
