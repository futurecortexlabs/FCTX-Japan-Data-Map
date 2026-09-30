import { type PrefectureData } from '../types/prefecture';

export interface NomadSeason {
  season: '春 (Spring)' | '夏 (Summer)' | '秋・冬 (Autumn/Winter)';
  pref: PrefectureData;
  reason: string;
  icon: string;
}

/**
 * 3つの都道府県から、季節ごとの最適な滞在地を割り当てる
 */
export function generateNomadRoute(prefectures: PrefectureData[]): NomadSeason[] {
  if (prefectures.length !== 3) {
    return [];
  }

  // クローンして操作
  const available = [...prefectures];
  const route: NomadSeason[] = [];

  // 1. 春 (Spring) - 花粉の少なさ(pollenScore)が高い場所を優先
  // 花粉スコアは高いほど「花粉が少なくて快適」
  available.sort((a, b) => (b.pollenScore || 50) - (a.pollenScore || 50));
  const springPref = available.shift()!;
  route.push({
    season: '春 (Spring)',
    pref: springPref,
    reason: `花粉が少なく春先の滞在に最も適しています。(花粉スコア: ${springPref.pollenScore || 50})`,
    icon: '🌸'
  });

  // 2. 夏 (Summer) - 避暑地として北日本や自然豊かな場所を優先
  // 寒冷地フラグや、単純に人口密度が低い（都会すぎない）場所を選ぶ
  const coldPrefs = [1, 2, 3, 4, 5, 6, 7, 15, 20];
  available.sort((a, b) => {
    const aIsCold = coldPrefs.includes(a.prefCode) ? 1 : 0;
    const bIsCold = coldPrefs.includes(b.prefCode) ? 1 : 0;
    if (aIsCold !== bIsCold) return bIsCold - aIsCold;
    
    // 寒冷地で差がつかない場合は、都会度が低い(自然が多い)方を夏にする
    return (a.populationScore || 50) - (b.populationScore || 50);
  });
  const summerPref = available.shift()!;
  route.push({
    season: '夏 (Summer)',
    pref: summerPref,
    reason: `避暑や大自然のリフレッシュに最適です。都会の喧騒から離れた涼しい夏を。`,
    icon: '🎐'
  });

  // 3. 秋・冬 (Autumn/Winter) - 残った場所。温泉や日照時間の良さをアピール
  const winterPref = available.shift()!;
  const hasOnsen = (winterPref.onsenScore || 50) > 55;
  route.push({
    season: '秋・冬 (Autumn/Winter)',
    pref: winterPref,
    reason: hasOnsen 
      ? `豊富な名湯で芯まで温まり、冬の寒さを極上のリラックスタイムに変えます。`
      : `日照時間や充実した生活インフラを活かして、秋から冬にかけての長期滞在拠り所として活躍します。`,
    icon: '♨️'
  });

  // 季節順に並び替え
  const order = ['春 (Spring)', '夏 (Summer)', '秋・冬 (Autumn/Winter)'];
  route.sort((a, b) => order.indexOf(a.season) - order.indexOf(b.season));

  return route;
}
