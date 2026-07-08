import { type PrefectureData, type MetricWeights } from '../types/prefecture';

export interface AIConsultationResult {
  diagnosis: string;
  steps: string[];
  warning: string;
}

export function generateAIConciergeAdvice(
  weights: MetricWeights,
  topPref: PrefectureData
): AIConsultationResult {
  // Analyze weights profile
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0) || 1;
  const isFamilySenior = ((weights.hospitalCount + weights.childcareScore) / totalWeight) > 0.35;
  const isNatureSlow = ((weights.attractiveness + weights.sunshineHours + weights.pollenLevel) / totalWeight) > 0.4;
  const isFoodCulture = ((weights.starbucksCount + weights.ramenCount + weights.onsenCount) / totalWeight) > 0.4;

  let diagnosis = '';
  let steps: string[] = [];
  let warning = '';

  // 1. Diagnosis
  if (isFamilySenior) {
    diagnosis = `あなたは「家族の安心と子育て・生活環境」を最優先する【ファミリー＆ウェルビーイング志向】です。医療アクセスや地域のサポート制度が充実した、生活インフラが安定している自治体への移住が非常にお勧めです。`;
    steps = [
      `まずは候補地（${topPref.prefName}など）の待機児童状況や子育て支援金制度を自治体HPでチェックする`,
      `地域の主要な総合病院・休日診療所へのアクセスとマイカー購入の予算を試算する`,
      `現地での住環境を確保するため、ファミリー向け物件の相場を地元の不動産サイトで調査する`
    ];
  } else if (isNatureSlow) {
    diagnosis = `あなたは「気候の快適さや豊かな自然、快適な健康環境」を重視する【リゾート＆スローライフ志向】です。天気が良く花粉のストレスが少ない場所や、自然豊かなエリアで心身を癒やす理想郷ライフがマッチしています。`;
    steps = [
      `季節による気候の変化や花粉飛散データを調べ、最も快適に過ごせる「滞在シーズン」を計画する`,
      `週末や有給休暇を利用して、現地の古民家カフェやキャンプ場などのリフレッシュスポットを開拓する`,
      `都市部との2拠点居住を行う場合、高速道路や新幹線などの交通アクセスと往復コストを見積もる`
    ];
  } else if (isFoodCulture) {
    diagnosis = `あなたは「美食や温泉、カフェカルチャーなどの趣味」を大切にする【カルチャー＆ホスピタリティ志向】です。名物グルメや源泉かけ流しの温泉、オシャレなカフェに囲まれ、趣味に没頭する週末が送れる場所が向いています。`;
    steps = [
      `お気に入りの温泉地（${topPref.prefName}など）に近いエリアで、日帰り温泉のサブスクや割引パスがないか調べる`,
      `地元のラーメン店やローカルカフェなど、自分の趣味を最大限満喫できる飲食コミュニティにアクセスしてみる`,
      `初期費用を抑えるため、家具付きのお試し移住用住宅やゲストハウスに数日間滞在してみる`
    ];
  } else {
    diagnosis = `あなたは「利便性と趣味のバランス」を綺麗に整えた【スマートライフ志向】です。程よく都会の利便性（仕事・カフェ・商業施設）を残しつつ、生活コストを抑えた地方都市の中心部でのハイブリッドな暮らしが適しています。`;
    steps = [
      `大都市近郊の地方中核都市（${topPref.prefName}など）の駅前エリアを中心に、徒歩＆自転車生活が可能か調べる`,
      `リモートワークが可能なワークスペース（コワーキング）の有無とネット回線の安定性を確認する`,
      `週末のアクティビティと平日のビジネス環境のシームレスな移行プランを作る`
    ];
  }

  // 2. Warnings and tips based on prefecture region characteristics
  const code = topPref.prefCode;
  if ([1, 2, 3, 5, 6, 7, 15].includes(code)) {
    // Snow regions (Hokkaido, Tohoku, Niigata)
    warning = `冬の厳しい降雪と、それに関連する生活コスト（除雪費、暖房費、車の冬用タイヤ等）の試算が必須です。特に本州の都市部から移住する場合、住宅の断熱性能と冬の運転スキルが重要なポイントになります。`;
  } else if ([13, 27, 14].includes(code)) {
    // Mega cities (Tokyo, Osaka, Kanagawa)
    warning = `地価や家賃などの固定費が極めて高いため、生活防衛のための予算計画が欠かせません。ビジネスチャンスは無限ですが、静寂なスローライフや温泉・大自然は近隣県まで足を伸ばす必要があります。`;
  } else if (code === 47) {
    // Okinawa
    warning = `離島ならではの物流コスト（通販の配送料やガソリン代など）や、夏の強い紫外線・潮風による塩害（エアコンやサッシのサビ）に留意が必要です。また、台風の上陸が多いため、停電対策を想定しておくのが賢明です。`;
  } else if ([19, 20, 21].includes(code)) {
    // Alpine mountain regions (Yamanashi, Nagano, Gifu)
    warning = `山間部は標高によって冬場の最低気温が大きく異なります。夏は大変涼しく快適ですが、マイナス10度を下回る冬の冷え込みに備えた薪ストーブや寒冷地仕様の給湯器、凍結防止帯の管理方法などを学習しておきましょう。`;
  } else {
    // Standard rural/suburban
    warning = `公共交通機関の運行頻度が低いため、基本的に大人一人につき一台の「自家用車」が必要となる車社会です。車検や任意保険、ガソリン代を含めたランニングコストを見込んでおきましょう。`;
  }

  return { diagnosis, steps, warning };
}
