import { type MetricWeights, type PrefectureData } from '../types/prefecture';

export interface PersonalityStyle {
  name: string;
  emoji: string;
  description: string;
  advice: string;
}

export function classifyPersonality(weights: MetricWeights, topPref: PrefectureData): PersonalityStyle {
  const entries = Object.entries(weights) as [keyof MetricWeights, number][];
  entries.sort((a, b) => b[1] - a[1]);
  const primaryWeightKey = entries[0][0];

  if (primaryWeightKey === 'onsenCount' || (topPref.onsenScore || 50) > 65) {
    return {
      name: '温泉三昧スローライファー',
      emoji: '♨️',
      description: '日々の疲れを上質な温泉とゆったりした時の流れで癒やしたい wellness 志向。',
      advice: '別府（大分）や草津（群馬）など、名湯が生活圏にある環境が極上の日常を作ります。',
    };
  }

  if (primaryWeightKey === 'pollenLevel' || (topPref.pollenScore || 50) > 65) {
    return {
      name: '花粉ゼロの健康ウェルビーインガー',
      emoji: '🌲',
      description: 'スギ花粉の飛散ストレスから完全に解放され、春を心ゆくまで楽しみたい健康志向。',
      advice: '花粉が極めて少ない沖縄や北海道をメイン拠点にすると、春の QOL が劇的に向上します。',
    };
  }

  if (primaryWeightKey === 'childcareScore' || primaryWeightKey === 'hospitalCount') {
    return {
      name: '安心第一ファミリーサポーター',
      emoji: '👶',
      description: '子どもの教育・遊び場環境や、医療機関へのアクセスを最優先する堅実な家族思いタイプ。',
      advice: '待機児童ゼロや子育て支援制度が手厚い地方都市は、のびのびとした育児を応援してくれます。',
    };
  }

  if (primaryWeightKey === 'starbucksCount' || primaryWeightKey === 'ramenCount') {
    return {
      name: 'カフェ＆グルメ放浪家',
      emoji: '🍜',
      description: '日常のちょっとした贅沢や美味しい食事、小粋なサードプレイスが活力源になるカルチャー派。',
      advice: 'グルメ店や大手カフェチェーンが集う地方主要都市の駅近エリアがライフラインになります。',
    };
  }

  if (primaryWeightKey === 'sunshineHours' || primaryWeightKey === 'attractiveness') {
    return {
      name: '太陽大好きアクティブ・アウトドア派',
      emoji: '☀️',
      description: '晴天率の高さや、休日の自然レジャー、観光アクティビティが人生の幸福度に直結する行動派。',
      advice: '日照時間の長い瀬戸内エリアや、マリンレジャーが盛んな南国エリアが最高の舞台になります。',
    };
  }

  if ([13, 14, 27, 28].includes(topPref.prefCode)) {
    return {
      name: '都会派インテリジェント・ノマド',
      emoji: '💼',
      description: '利便性や仕事のチャンス、最新トレンドを妥協せず、機能的な生活を求める都会志向。',
      advice: '都市の恩恵を最大化しつつ、時折近隣の自然へリフレッシュに出かけるハイブリッド生活が合っています。',
    };
  }

  return {
    name: 'バランス重視型ライフデザイナー',
    emoji: '🏡',
    description: '都会の利便性と地方の穏やかさ、家計コストの安さを均等に満たそうとする賢い設計者。',
    advice: '地価が手頃でありながら、新幹線や主要都市へのアクセスが良いベッドタウンが狙い目です。',
  };
}
