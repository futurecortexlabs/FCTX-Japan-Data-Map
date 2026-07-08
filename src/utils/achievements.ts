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
