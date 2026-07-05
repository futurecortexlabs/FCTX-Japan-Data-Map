import { type PrefectureData } from '../types/prefecture';

export function generatePrefectureCatchphrase(pref: PrefectureData): { text: string; rarity: 'SSR' | 'SR' | 'R' } {
  
  // Determine rarity
  let rarity: 'SSR' | 'SR' | 'R' = 'R';
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
    { name: '気候の快適さ', val: pref.sunshineHoursScore || 50, suffix: '太陽がいっぱいで気持ちの良い天気に恵まれた健やかな日々' }
  ];

  // Sort scores desc
  scores.sort((a, b) => b.val - a.val);
  const best = scores[0];
  const second = scores[1];

  let text = '';
  if (pref.prefCode === 13) {
    text = `地価・家賃は日本一高いが、無数のカフェと最先端のキャリアが全て手に入る「究極の都会ユートピア」`;
  } else if (pref.prefCode === 6) {
    text = `日本一のラーメン熱量を誇る「麺類巡りの聖地」。美味しいご当地そば・ラーメンと穏やかなスローライフ`;
  } else if (pref.prefCode === 19) {
    text = `富士山を望み、日照時間トップクラス！「太陽の恵みと豊かな名水、そして極上カフェの隠れ家ユートピア」`;
  } else if (pref.prefCode === 47) {
    text = `青い海とゆったり流れる島時間。圧倒的な観光魅力度を誇る「南国リゾート移住の金字塔」`;
  } else if (pref.prefCode === 1) {
    text = `広大な大地が生み出す絶品グルメと圧倒的な観光魅力度！「大自然と美味しい食材に包まれる北の大地」`;
  } else if (pref.prefCode === 26) {
    text = `千年の歴史が息づく古都。独自の文化と高いブランド力を誇る「歴史と伝統が日常に溶け込む雅な暮らし」`;
  } else {
    text = `【${best.name}】が最大の魅力！さらに【${second.name}】も高水準で、${best.suffix}が叶います。`;
  }

  return { text, rarity };
}
