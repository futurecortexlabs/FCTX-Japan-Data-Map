/**
 * 詳細パネル各タブで使う純粋関数群（React 非依存・単体テスト対象）。
 */
import { METRIC_CONFIGS } from '../../constants/metrics';
import type { MetricType, MetricWeights, PrefectureData } from '../../types/prefecture';
import type { DetailPanelTab } from '../../types/ui';

// ---------------------------------------------------------------------------
// タブの表示可否
// ---------------------------------------------------------------------------

/** 選択県数に応じてタブを表示できるか（タブバーの表示とタブガードの共通ルール） */
export const isDetailTabAvailable = (tab: DetailPanelTab, selectedCount: number): boolean => {
  switch (tab) {
    case 'fire':
    case 'quiz':
      return selectedCount === 1;
    case 'multibase':
      return selectedCount >= 2;
    case 'nomad':
      return selectedCount === 3;
    default:
      return true;
  }
};

/**
 * 選択県数に合わないタブを開いている場合の移動先。
 * 複数選択中は「多拠点設計」、それ以外は「詳細」に戻す。表示可能ならそのまま返す。
 */
export const resolveDetailTab = (tab: DetailPanelTab, selectedCount: number): DetailPanelTab => {
  if (isDetailTabAvailable(tab, selectedCount)) return tab;
  return selectedCount >= 2 ? 'multibase' : 'details';
};

// ---------------------------------------------------------------------------
// 診断クイズ
// ---------------------------------------------------------------------------

export interface QuizQuestion {
  title: string;
  desc: string;
  options: { label: string; value: number }[];
}

export const QUIZ_QUESTIONS: readonly QuizQuestion[] = [
  {
    title: 'Q1: 住宅コストと利便性の希望は？',
    desc: '家賃や地価を極力安く抑えたいか、多少高めでも都会の便利さを優先したいか。',
    options: [
      { label: '固定費（家賃や地価）は安く抑えたい！', value: 0 },
      { label: '利便性重視！お店や職場が近くにほしい', value: 1 },
    ],
  },
  {
    title: 'Q2: 休日のリフレッシュ方法は？',
    desc: 'サードプレイスとしてのカフェでおしゃれに過ごすか、自然や観光地で過ごすか。',
    options: [
      { label: 'カフェや静かなコミュニティでゆったり過ごす', value: 0 },
      { label: '豊かな温泉やキャンプ場、観光地に繰り出す', value: 1 },
    ],
  },
  {
    title: 'Q3: 毎日の食事へのこだわりは？',
    desc: '外食のラーメン店などのグルメを積極的に開拓したいか。',
    options: [
      { label: 'ご当地ラーメンや外食巡りが大好き！', value: 0 },
      { label: '自炊中心で、食費は抑えめにしたい', value: 1 },
    ],
  },
  {
    title: 'Q4: お天気や日照時間の優先度は？',
    desc: '晴れの日が多くからっとした天気を望むか、特に気にしないか。',
    options: [
      { label: 'とにかく晴れの日が多く、気持ち良い環境がいい！', value: 0 },
      { label: '曇りや雨、雪国の情景も好きなので気にしない', value: 1 },
    ],
  },
];

/** 診断クイズの進行状態（タブを切り替えても保持するため、パネル本体が所有する） */
export interface QuizState {
  /** 表示中の設問インデックス */
  step: number;
  /** これまでの回答（設問順） */
  answers: number[];
  finished: boolean;
  /** 診断結果（候補が無ければ undefined） */
  result: PrefectureData | undefined;
}

export const INITIAL_QUIZ_STATE: QuizState = { step: 0, answers: [], finished: false, result: undefined };

/** 回答を1つ追加する。最終設問なら finished=true（結果の決定は呼び出し側が行う） */
export const answerQuiz = (state: QuizState, value: number): QuizState => {
  const answers = [...state.answers, value];
  if (state.step < QUIZ_QUESTIONS.length - 1) {
    return { ...state, step: state.step + 1, answers };
  }
  return { ...state, answers, finished: true };
};

/** 1つ前の設問に戻る（先頭なら何もしない） */
export const backQuiz = (state: QuizState): QuizState =>
  state.step > 0 ? { ...state, step: state.step - 1, answers: state.answers.slice(0, -1) } : state;

/** クイズのルーレット対象とする上位候補数 */
export const QUIZ_CANDIDATE_COUNT = 15;

/** クイズ回答（Q2〜Q4）からライフスタイル指標の重みを算出する */
export const calculateWeightsFromAnswers = (ans: readonly number[]): MetricWeights => {
  const newWeights: MetricWeights = {
    starbucksCount: 10,
    ramenCount: 10,
    attractiveness: 10,
    sunshineHours: 10,
    onsenCount: 10,
    hospitalCount: 10,
    pollenLevel: 10,
    childcareScore: 10,
  };

  // Q2: カフェ(0) vs 自然(1)
  if (ans[1] === 0) {
    newWeights.starbucksCount = 45;
    newWeights.attractiveness = 20;
  } else {
    newWeights.onsenCount = 45;
    newWeights.attractiveness = 20;
  }

  // Q3: グルメ(0) vs 自炊(1)
  if (ans[2] === 0) {
    newWeights.ramenCount = 45;
  } else {
    newWeights.hospitalCount = 20;
    newWeights.childcareScore = 20;
  }

  // Q4: 晴天重視(0) vs こだわらない(1)
  if (ans[3] === 0) {
    newWeights.sunshineHours = 45;
    newWeights.pollenLevel = 5;
  } else {
    newWeights.sunshineHours = 10;
    newWeights.pollenLevel = 30;
  }

  return newWeights;
};

/** 配列から要素をランダムに1つ選ぶ（空配列なら undefined）。random は [0, 1) を返す関数 */
export const pickRandom = <T>(items: readonly T[], random: () => number = Math.random): T | undefined =>
  items.length > 0 ? items[Math.floor(random() * items.length)] : undefined;

/** 診断クイズの回答から、上位候補（エンタメ重視のルーレット対象）を算出する */
export const rankQuizCandidates = (
  allPrefectures: readonly PrefectureData[],
  tempWeights: MetricWeights,
  ans: readonly number[] = [],
): PrefectureData[] => {
  if (allPrefectures.length === 0) return [];

  // 最新年のデータのみを対象とする
  const latestYear = allPrefectures.reduce((max, p) => Math.max(max, p.year), -Infinity);
  const currentYearData = allPrefectures.filter((p) => p.year === latestYear);

  const scored = currentYearData.map((pref) => {
    const baseUrban = pref.baseUrbanScore || 50;
    const landPrice = pref.landPriceScore || 50;

    let weightedSum = 0;
    let weightTotal = 0;

    // Q1: コスト(0) vs 利便性(1)
    if (ans.length > 0 && ans[0] === 0) {
      // 固定費を抑えたい: 地価が低い（= 100 - 偏差値が高い）ほど高スコア
      weightedSum += (100 - landPrice) * 50;
      weightTotal += 50;
      weightedSum += baseUrban * 10;
      weightTotal += 10;
    } else {
      // 利便性重視
      weightedSum += baseUrban * 60;
      weightTotal += 60;
    }

    const scoreMappings = [
      { score: pref.starbucksScore, weight: tempWeights.starbucksCount },
      { score: pref.ramenScore, weight: tempWeights.ramenCount },
      { score: pref.attractivenessScore, weight: tempWeights.attractiveness },
      { score: pref.sunshineHoursScore, weight: tempWeights.sunshineHours },
      { score: pref.onsenScore, weight: tempWeights.onsenCount },
      { score: pref.hospitalScore, weight: tempWeights.hospitalCount },
      { score: pref.pollenScore, weight: tempWeights.pollenLevel },
      { score: pref.childcareScoreScore, weight: tempWeights.childcareScore },
    ];

    for (const item of scoreMappings) {
      if (item.score !== undefined && !isNaN(item.score) && item.weight > 0) {
        weightedSum += item.score * item.weight;
        weightTotal += item.weight;
      }
    }

    return { pref, score: weightTotal > 0 ? weightedSum / weightTotal : 0 };
  });

  // スコア降順に並べ、上位を候補とする（エンタメ重視のルーレット方式）
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, QUIZ_CANDIDATE_COUNT)
    .map((item) => item.pref);
};

// ---------------------------------------------------------------------------
// 詳細タブ（単一県）
// ---------------------------------------------------------------------------

/** 詳細タブの値表示。人口は万人単位を併記、欠損は「データ未登録」 */
export const formatDetailValue = (val?: number, unit?: string, isPopulation = false): string => {
  if (val === undefined || isNaN(val)) return 'データ未登録';
  if (isPopulation) {
    if (val >= 10000) {
      return `${(val / 10000).toLocaleString(undefined, { maximumFractionDigits: 1 })} 万人 (${val.toLocaleString()} 人)`;
    }
    return `${val.toLocaleString()} 人`;
  }
  return `${val.toLocaleString()} ${unit}`;
};

/** 偏差値 30〜70 をプログレスバー幅 0〜100% に写像する（範囲外はクランプ、欠損は 0） */
export const scoreToProgressWidth = (score?: number): number => {
  if (score === undefined || isNaN(score)) return 0;
  const min = 30;
  const max = 70;
  const clamped = Math.max(min, Math.min(max, score));
  return ((clamped - min) / (max - min)) * 100;
};

// ---------------------------------------------------------------------------
// 詳細タブ（2県比較: VSデュエル / 2拠点相性）
// ---------------------------------------------------------------------------

export interface DuelCategory {
  name: string;
  p1: number;
  p2: number;
}

export interface DuelResult {
  categories: DuelCategory[];
  p1Wins: number;
  p2Wins: number;
  /** 勝者（引き分けなら null） */
  winner: PrefectureData | null;
  commentary: string;
}

/** 2県の主要5カテゴリを対戦させ、勝敗と実況コメントを返す（欠損スコアは 50 扱い） */
export const computeDuel = (pref1: PrefectureData, pref2: PrefectureData): DuelResult => {
  const categories: DuelCategory[] = [
    { name: '住居費安さ', p1: pref1.landPriceScore ?? 50, p2: pref2.landPriceScore ?? 50 },
    { name: '生活利便', p1: pref1.populationScore ?? 50, p2: pref2.populationScore ?? 50 },
    { name: 'カフェ充実', p1: pref1.starbucksScore ?? 50, p2: pref2.starbucksScore ?? 50 },
    { name: 'グルメ充実', p1: pref1.ramenScore ?? 50, p2: pref2.ramenScore ?? 50 },
    { name: '気候快適さ', p1: pref1.sunshineHoursScore ?? 50, p2: pref2.sunshineHoursScore ?? 50 },
  ];

  let p1Wins = 0;
  let p2Wins = 0;
  for (const cat of categories) {
    if (cat.p1 > cat.p2) p1Wins++;
    else if (cat.p2 > cat.p1) p2Wins++;
  }

  const winner = p1Wins > p2Wins ? pref1 : p2Wins > p1Wins ? pref2 : null;

  let commentary: string;
  if (winner) {
    const loserName = winner === pref1 ? pref2.prefName : pref1.prefName;
    if (Math.abs(p1Wins - p2Wins) >= 3) {
      commentary = `🏆 【${winner.prefName}】の圧倒的勝利！ 【${loserName}】の追随を許さない特化スペックでねじ伏せました。`;
    } else {
      commentary = `⚔️ 接戦の末、【${winner.prefName}】の勝利！ お互いの強みがぶつかり合う見事なスペックバトルでした。`;
    }
  } else {
    commentary = `🤝 引き分け！ 互角の実力を持つ、非常にバランスの良いライバル関係です。`;
  }

  return { categories, p1Wins, p2Wins, winner, commentary };
};

/** HP バー幅（%）。5〜100 にクランプする */
/**
 * 偏差値を「点」として表示するための 0〜100 へのクランプ。
 * 偏差値は外れ値で範囲外になり得る (例: 東京都の住居費安さ ≒ -13)。勝敗判定は生の値で行い、表示だけを丸める。
 */
export const toDisplayPoints = (score: number): number => Math.round(Math.min(100, Math.max(0, score)));

export const duelBarPercent = (score: number): number => Math.max(Math.min(score, 100), 5);

export type CompatibilityRank = 'SSS' | 'SS' | 'S' | 'A' | 'B' | 'C';

export interface DualCompatibility {
  /** 相性（65〜99%） */
  compatibility: number;
  rank: CompatibilityRank;
  comment: string;
}

/** 相性パーセントからランクを決める */
export const compatibilityRank = (compatibility: number): CompatibilityRank => {
  if (compatibility >= 95) return 'SSS';
  if (compatibility >= 90) return 'SS';
  if (compatibility >= 80) return 'S';
  if (compatibility >= 70) return 'A';
  if (compatibility >= 60) return 'B';
  return 'C';
};

/**
 * 2拠点生活の相性を算出する。
 * 「都会度」と「ゆったり度」の差が大きい（= 互いに補完し合う）ほど相性が高い。
 */
export const computeDualCompatibility = (pref1: PrefectureData, pref2: PrefectureData): DualCompatibility => {
  const urban = (p: PrefectureData) => ((p.populationScore || 50) + (p.listedCompanyScore || 50)) / 2;
  const chill = (p: PrefectureData) =>
    ((p.landPriceScore || 50) + (p.attractivenessScore || 50) + (p.sunshineHoursScore || 50)) / 3;

  const contrast = Math.abs(urban(pref1) - urban(pref2)) + Math.abs(chill(pref1) - chill(pref2));
  const rawCompat = 65 + Math.min(contrast * 0.7, 34);
  const compatibility = Math.min(Math.round(rawCompat), 99);
  const rank = compatibilityRank(compatibility);

  let comment: string;
  if (rank === 'SSS' || rank === 'SS') {
    comment = `🌟 完璧な補完関係！ 平日は大都市の刺激的な環境でキャリアを積み、週末は豊かな自然と穏やかな気候のもう一つの拠点で完全にリフレッシュする、究極のオンオフ切り替え型デュアルライフが実現できます。`;
  } else if (rank === 'S' || rank === 'A') {
    comment = `🏡 バランスの取れた組み合わせ！ 双方に独自の良さがあり、ほどよく生活圏を分けることで、それぞれの都市のカルチャーや自然の恵みをいいとこ取りした心地よい2拠点生活を送れるでしょう。`;
  } else {
    comment = `🎒 同系統のペア！ 両者のスペックや生活環境が似ているため、2拠点生活としてのメリハリは少なめかもしれません。移動コストを考慮しつつ、ローカルカルチャーの違いを楽しむ旅行型滞在がおすすめです。`;
  }

  return { compatibility, rank, comment };
};

// ---------------------------------------------------------------------------
// 多拠点設計タブ
// ---------------------------------------------------------------------------

export interface MultiBaseSlot {
  season: string;
  icon: string;
  pref: PrefectureData;
  reason: string;
}

export interface MultiBasePlan {
  slots: MultiBaseSlot[];
  /** 統合満足度（総合スコア平均、小数1桁の文字列） */
  avgScore: string;
}

const SEASON_SLOTS = [
  { season: '春 (3〜5月)', icon: '🌸', desc: '花粉を避け快適に過ごす時期' },
  { season: '夏 (6〜8月)', icon: '☀️', desc: '避暑地でのアウトドアや自然体験' },
  { season: '秋 (9〜11月)', icon: '🍁', desc: '収穫の秋と美しい景観を楽しむ時期' },
  { season: '冬 (12〜2月)', icon: '❄️', desc: '避寒地・リゾートまたは都市生活' },
] as const;

const HOKKAIDO = 1;
const TOKYO = 13;
const YAMANASHI = 19;
const NAGANO = 20;
const KAGOSHIMA = 46;
const OKINAWA = 47;

/**
 * 2〜3県を四季に割り当てたシーズンローテーション計画を作る。
 * 1県以下なら null。
 */
export const buildMultiBasePlan = (prefectures: readonly PrefectureData[]): MultiBasePlan | null => {
  if (prefectures.length < 2) return null;

  const [p1, p2] = prefectures;
  const p3: PrefectureData | undefined = prefectures[2];
  const targets = prefectures.slice(0, 3);
  const findAny = (codes: readonly number[]) => targets.find((p) => codes.includes(p.prefCode));

  const assignSeason = (season: string): PrefectureData => {
    if (season.startsWith('夏')) return findAny([HOKKAIDO, NAGANO, YAMANASHI]) ?? p2;
    if (season.startsWith('冬')) return findAny([OKINAWA, KAGOSHIMA]) ?? p3 ?? p2;
    if (season.startsWith('春')) return findAny([OKINAWA, HOKKAIDO]) ?? p1;
    return p1;
  };

  const slots = SEASON_SLOTS.map((slot): MultiBaseSlot => {
    const pref = assignSeason(slot.season);
    let reason: string = slot.desc;
    if (slot.season.startsWith('春') && (pref.prefCode === OKINAWA || pref.prefCode === HOKKAIDO)) {
      reason = '🌲 花粉飛散が非常に少ない避粉ユートピア生活';
    } else if (slot.season.startsWith('夏') && (pref.prefCode === HOKKAIDO || pref.prefCode === NAGANO)) {
      reason = '🏕️ 涼しく爽やかな本格派のアウトドア・スローライフ';
    } else if (slot.season.startsWith('冬') && pref.prefCode === OKINAWA) {
      reason = '🌺 本州の凍える冬を避けて過ごす暖かな南国リゾート生活';
    } else if (pref.prefCode === TOKYO) {
      reason = '💼 大都市の最新トレンド、利便性、仕事を楽しむ滞在';
    }
    return { season: slot.season, icon: slot.icon, pref, reason };
  });

  const avgScore = (prefectures.reduce((acc, p) => acc + (p.totalScore || 50), 0) / prefectures.length).toFixed(1);

  return { slots, avgScore };
};

// ---------------------------------------------------------------------------
// FIRE タブ（金額表記: 単位は万円）
// ---------------------------------------------------------------------------

/** 万円単位の値を「◯億」「◯万」に整形する（軸ラベル用） */
export const formatManAxisLabel = (value: number): string =>
  value >= 10000 ? `${(value / 10000).toFixed(1).replace('.0', '')}億` : `${value}万`;

/** 万円単位の値を「◯億円」「◯万円」に整形する（ツールチップ用） */
export const formatManYen = (value: number): string =>
  value >= 10000 ? `${(value / 10000).toFixed(1).replace('.0', '')}億円` : `${value.toLocaleString()}万円`;

// ---------------------------------------------------------------------------
// 25年推移グラフ
// ---------------------------------------------------------------------------

/** 指標の実数値。欠損時は偏差値スコア、それも無ければ平均値 50 で代替する */
export const getTrendMetricValue = (pref: PrefectureData, metric: MetricType): number => {
  const val = pref[metric];
  if (val !== undefined && !isNaN(val)) return val;

  const { scoreKey } = METRIC_CONFIGS[metric];
  const score = scoreKey ? pref[scoreKey] : undefined;
  return typeof score === 'number' ? score : 50;
};

/** グラフの Y 軸範囲。上下に 15% の余白（値が一定なら ±10）を取り、下限は 0 未満にしない */
export const computeTrendRange = (values: readonly number[]): { minVal: number; maxVal: number } => {
  const dataMin = values.length > 0 ? Math.min(...values) : 0;
  const dataMax = values.length > 0 ? Math.max(...values) : 100;
  const diff = dataMax - dataMin;
  if (diff === 0) return { minVal: Math.max(0, dataMin - 10), maxVal: dataMax + 10 };
  return { minVal: Math.max(0, dataMin - diff * 0.15), maxVal: dataMax + diff * 0.15 };
};

/** 推移グラフの軸ラベル（1万以上は「万」、1000 超は「k」） */
export const formatTrendLabel = (val: number): string => {
  if (val >= 10000) return `${(val / 10000).toFixed(0)}万`;
  if (val > 1000) return `${(val / 1000).toFixed(1)}k`;
  return val.toLocaleString(undefined, { maximumFractionDigits: 0 });
};
