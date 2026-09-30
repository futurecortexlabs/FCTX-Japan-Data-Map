/** 右カラム詳細パネルのタブ */
export type DetailPanelTab = 'details' | 'weights' | 'quiz' | 'keep' | 'ai' | 'multibase' | 'fire' | 'nomad';

export interface KeepItem {
  prefCode: number;
  prefName: string;
  year: number;
}
