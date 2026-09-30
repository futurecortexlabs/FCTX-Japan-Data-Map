import { type PrefectureData } from '../types/prefecture';

export type GachaRarity = 'SSR' | 'SR' | 'R';

export interface Catchphrase {
  text: string;
  rarity: GachaRarity;
  advice: string;
}

export function generatePrefectureCatchphrase(pref: PrefectureData): Catchphrase {
  
  // Determine rarity
  let rarity: GachaRarity = 'R';
  if (pref.prefCode === 13 || pref.prefCode === 27 || pref.prefCode === 14) {
    rarity = 'SSR'; // Big 3
  } else if (
    pref.prefCode === 1 || // Hokkaido
    pref.prefCode === 23 || // Aichi
    pref.prefCode === 26 || // Kyoto
    pref.prefCode === 40 || // Fukuoka
    pref.prefCode === 47 || // Okinawa
    pref.prefCode === 6 || // Yamagata (Ramen)
    pref.prefCode === 19 // Yamanashi (Sun/Starbucks)
  ) {
    rarity = 'SR';
  }

  // Find the highest score among variables
  const scores = [
    { name: '住居費の安さ', val: pref.landPriceScore || 50, suffix: '驚くほどローコストで広々としたマイホーム暮らし' },
    { name: '生活利便性', val: pref.populationScore || 50, suffix: '都会的で活気に満ちた便利でアクティブな暮らし' },
    { name: '雇用の豊富さ', val: pref.listedCompanyScore || 50, suffix: 'キャリアアップのチャンスと豊かなビジネス環境' },
    { name: 'カフェ充実度', val: pref.starbucksScore || 50, suffix: 'おしゃれなサードプレイスに囲まれたクリエイティブな日々' },
    { name: 'グルメ充実度', val: pref.ramenScore || 50, suffix: '極上グルメ・絶品ラーメンに囲まれる食い倒れライフ' },
    { name: '観光・レジャー魅力度', val: pref.attractivenessScore || 50, suffix: '毎週末がまるで旅行気分の観光・レジャースローライフ' },
    { name: '気候の快適さ', val: pref.sunshineHoursScore || 50, suffix: '太陽がいっぱいで気持ちの良い天気に恵まれた健やかな日々' },
    { name: '温泉の多さ', val: pref.onsenScore || 50, suffix: '名湯・秘湯が身近にある極上の温泉ライフ' },
    { name: '医療の充実度', val: pref.hospitalScore || 50, suffix: '医療機関が充実した安心・安全の暮らし' },
    { name: '花粉の少なさ', val: pref.pollenScore || 50, suffix: '花粉症のストレスから解放された快適なシーズン' },
    { name: '子育てのしやすさ', val: pref.childcareScoreScore || 50, suffix: '子どもに優しく、のびのびと子育てができる素晴らしい環境' }
  ];

  // Sort scores desc
  scores.sort((a, b) => b.val - a.val);
  const best = scores[0];
  const second = scores[1];

  let text: string;
  let advice: string;

  if (pref.prefCode === 13) {
    text = `地価・家賃は日本一高いが、無数のカフェと最先端のキャリアが全て手に入る「究極の都会ユートピア」`;
    advice = '家賃・生活費が非常に高いため、キャリアの最大化や都会の最先端文化をフルに享受したいアクティブ層向けです。';
  } else if (pref.prefCode === 6) {
    text = `日本一のラーメン熱量を誇る「麺類巡りの聖地」。美味しいご当地そば・ラーメンと穏やかなスローライフ`;
    advice = '生活費が非常に安く抑えられます。冬場の積雪対策や暖房費の確保、自家用車の所有が快適な生活の鍵になります。';
  } else if (pref.prefCode === 19) {
    text = `富士山を望み、日照時間トップクラス！「太陽の恵みと豊かな名水、そして極上カフェの隠れ家ユートピア」`;
    advice = '首都圏へのアクセスが良く、2拠点生活の入門に最適。冬は氷点下になるエリアもあるため、住まいの断熱性がポイントです。';
  } else if (pref.prefCode === 47) {
    text = `青い海とゆったり流れる島時間。圧倒的な観光魅力度を誇る「南国リゾート移住の金字塔」`;
    advice = '花粉がなく年中温かいリゾート地。ただし、本州との往来にかかる交通費や配送料、潮風による塩害対策に留意が必要です。';
  } else if (pref.prefCode === 1) {
    text = `広大な大地が生み出す絶品グルメと圧倒的な観光魅力度！「大自然と美味しい食材に包まれる北の大地」`;
    advice = '食と観光は最強。ただ面積が広いため車移動が基本となり、冬の本格的な除雪作業や高額な暖房・燃料費の試算が必須です。';
  } else if (pref.prefCode === 26) {
    text = `千年の歴史が息づく古都。独自の文化と高いブランド力を誇る「歴史と伝統が日常に溶け込む雅な暮らし」`;
    advice = '歴史ある美しい景観と、大学が多く活気ある街。古い木造物件も多いため、冬の底冷え対策や景観条例のルールを確認しましょう。';
  } else {
    text = `【${best.name}】が最大の魅力！さらに【${second.name}】も高水準で、${best.suffix}が叶います。`;
    
    if (best.name === '住居費の安さ') {
      advice = '固定費（住宅費）を圧倒的に低く抑えられるエリアです。浮いた予算を多拠点ライフの移動費や趣味に回すプランに向いています。';
    } else if (best.name === '生活利便性' || best.name === '雇用の豊富さ') {
      advice = '都市機能や公共交通、仕事の選択肢が揃っており、移住後も生活環境のギャップが少ない安定したエリアです。初めての地方都市移住におすすめ。';
    } else if (best.name === '気候の快適さ') {
      advice = '晴天率が高く日当たりに恵まれています。洗濯物の乾きやすさや、暖かな日光による健やかなメンタル維持にとても良い影響があります。';
    } else if (best.name === '温泉の多さ') {
      advice = '温泉地数や源泉数が非常に豊富なエリアです。日々の健康維持や趣味としての温泉めぐりを存分に楽しめます。';
    } else if (best.name === '医療の充実度') {
      advice = '人口あたりの総合病院や診療所が多く、万が一の病気やケガ、持病があるシニア層・子育て世帯にも非常に安心です。';
    } else if (best.name === '花粉の少なさ') {
      advice = 'スギやヒノキの花粉飛散量が極めて少なく、春先の鼻炎やアレルギーによるストレスが大幅に軽減される奇跡の環境です。';
    } else if (best.name === '子育てのしやすさ') {
      advice = '待機児童問題が少なく、自然豊かな中で支援制度を受けながらのびのび子育てに専念できる自治体が揃っています。';
    } else {
      advice = '観光やローカルなグルメ・カフェ文化が発達しています。毎週末のレジャーや名店開拓など、飽きのこないアクティブな週末を過ごせます。';
    }
  }

  return { text, rarity, advice };
}
