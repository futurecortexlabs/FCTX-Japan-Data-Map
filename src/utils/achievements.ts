export interface Achievement {
  id: string;
  name: string;
  emoji: string;
  description: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'gacha_5', name: 'ガチャ信者', emoji: '🎰', description: 'ガチャを累計5回以上引く' },
  { id: 'keep_3', name: '理想郷コレクター', emoji: '📂', description: 'キープリストに3箇所以上登録する' },
  { id: 'savings_50k', name: '節約マスター', emoji: '💰', description: '東京より月額50,000円以上節約できる拠点を見つける' },
  { id: 'onsen_champ', name: '極楽の湯治客', emoji: '♨️', description: '温泉偏差値が65以上の都道府県を選択する' },
  { id: 'pollen_free', name: '避粉の達人', emoji: '🌲', description: '花粉偏差値が65以上の都道府県を選択する' },
  { id: 'history_buff', name: '歴史の観測者', emoji: '🎓', description: '重大事件発生年（2008年/2020年）を表示する' },
];

export interface UserStats {
  gachaCount: number;
  keepCount: number;
  maxSavings: number;
  maxOnsenScore: number;
  maxPollenScore: number;
  historyChecked: boolean;
}

export const DEFAULT_USER_STATS: UserStats = {
  gachaCount: 0,
  keepCount: 0,
  maxSavings: 0,
  maxOnsenScore: 0,
  maxPollenScore: 0,
  historyChecked: false,
};

/** localStorage 由来の値を検証し、不正なフィールドは既定値で補う */
export function parseUserStats(value: unknown): UserStats | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  const num = (k: keyof UserStats) => (typeof v[k] === 'number' && Number.isFinite(v[k]) ? (v[k] as number) : 0);
  return {
    gachaCount: num('gachaCount'),
    keepCount: num('keepCount'),
    maxSavings: num('maxSavings'),
    maxOnsenScore: num('maxOnsenScore'),
    maxPollenScore: num('maxPollenScore'),
    historyChecked: v.historyChecked === true,
  };
}

/**
 * 保存済み統計に、画面状態から導出した統計を「単調増加」でマージする。
 * 変化がなければ同一参照を返す (呼び出し側で参照比較による更新判定ができる)。
 */
export function mergeUserStats(stored: UserStats, derived: Partial<UserStats>): UserStats {
  const merged: UserStats = {
    gachaCount: Math.max(stored.gachaCount, derived.gachaCount ?? 0),
    keepCount: Math.max(stored.keepCount, derived.keepCount ?? 0),
    maxSavings: Math.max(stored.maxSavings, derived.maxSavings ?? -Infinity),
    maxOnsenScore: Math.max(stored.maxOnsenScore, derived.maxOnsenScore ?? 0),
    maxPollenScore: Math.max(stored.maxPollenScore, derived.maxPollenScore ?? 0),
    historyChecked: stored.historyChecked || derived.historyChecked === true,
  };
  const changed = (Object.keys(merged) as (keyof UserStats)[]).some((k) => merged[k] !== stored[k]);
  return changed ? merged : stored;
}

export function checkNewAchievements(stats: UserStats, unlockedIds: string[]): Achievement[] {
  const newlyUnlocked: Achievement[] = [];

  const checkAndUnlock = (id: string, condition: boolean) => {
    if (condition && !unlockedIds.includes(id)) {
      const ach = ACHIEVEMENTS.find(a => a.id === id);
      if (ach) newlyUnlocked.push(ach);
    }
  };

  checkAndUnlock('gacha_5', stats.gachaCount >= 5);
  checkAndUnlock('keep_3', stats.keepCount >= 3);
  checkAndUnlock('savings_50k', stats.maxSavings >= 50000);
  checkAndUnlock('onsen_champ', stats.maxOnsenScore >= 65);
  checkAndUnlock('pollen_free', stats.maxPollenScore >= 65);
  checkAndUnlock('history_buff', stats.historyChecked);

  return newlyUnlocked;
}
