import React, { useMemo } from 'react';
import { type PrefectureData } from '../types/prefecture';

interface NewsTickerProps {
  allPrefectures: PrefectureData[];
  selectedYear: number;
}

export const NewsTicker: React.FC<NewsTickerProps> = ({ allPrefectures, selectedYear }) => {
  const newsItems = useMemo(() => {
    if (!allPrefectures || allPrefectures.length === 0) return ['データを読み込んでいます...'];

    const currentYearData = allPrefectures.filter((p) => p.year === selectedYear);
    if (currentYearData.length === 0) return ['FCTX UTOPIA FINDER SYSTEM ONLINE'];

    const items: string[] = [];
    
    // Sort logic to find tops
    const topPop = [...currentYearData].sort((a, b) => (b.population || 0) - (a.population || 0))[0];
    const topRamen = [...currentYearData].sort((a, b) => (b.ramenScore || 0) - (a.ramenScore || 0))[0];
    const topSunshine = [...currentYearData].sort((a, b) => (b.sunshineHours || 0) - (a.sunshineHours || 0))[0];
    const cheapLand = [...currentYearData].sort((a, b) => (a.landPrice || 999999) - (b.landPrice || 999999))[0];
    
    if (topPop) items.push(`【速報】${selectedYear}年、${topPop.prefName}の人口が圧倒的トップを維持！都市機能の集中が止まらない模様です。`);
    if (topRamen) items.push(`【グルメ】ラーメン好き必見！今年のラーメン充実度No.1は『${topRamen.prefName}』に決定。今週末はラーメン巡りで決まり！？`);
    if (topSunshine) items.push(`【気象】太陽の恵み！${topSunshine.prefName}の年間日照時間が全国トップクラスを記録。移住者の心も晴れやかに。`);
    if (cheapLand) items.push(`【不動産】驚愕の地価！${cheapLand.prefName}なら都心のワンルーム家賃で広大な土地が手に入る！？今すぐFIREシミュレーションをチェック。`);
    
    // Random flavor texts
    items.push('【FCTX AI】「直感でガチャを回すのも、意外な理想郷に出会うコツですよ。」');
    items.push('【お知らせ】右上の「Keep」ボタンで、気になる都道府県をリストアップしてみましょう。');
    items.push('【Utopia Finder】日本のどこかに、あなただけの理想郷が必ずあります。データがそれを証明しています。');

    // Shuffle
    return items.sort(() => Math.random() - 0.5);
  }, [allPrefectures, selectedYear]);

  return (
    <div className="w-full bg-slate-900/95 dark:bg-black/90 border-t border-indigo-500/30 overflow-hidden flex items-center relative z-[6000] h-8 shadow-[0_-5px_15px_rgba(0,0,0,0.3)]">
      <div className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-slate-900 dark:from-black to-transparent w-16 z-10" />
      
      <div className="flex whitespace-nowrap animate-ticker items-center h-full">
        <span className="text-[11px] font-bold text-amber-400 tracking-widest mx-8 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          FCTX NEWS NETWORK
        </span>
        
        {newsItems.map((item, idx) => (
          <React.Fragment key={idx}>
            <span className="text-[11px] font-medium text-slate-300 mx-6">
              {item}
            </span>
            <span className="text-indigo-500/50">◆</span>
          </React.Fragment>
        ))}
        
        {/* Duplicate for seamless looping if items are too short */}
        {newsItems.map((item, idx) => (
          <React.Fragment key={`dup-${idx}`}>
            <span className="text-[11px] font-medium text-slate-300 mx-6">
              {item}
            </span>
            <span className="text-indigo-500/50">◆</span>
          </React.Fragment>
        ))}
      </div>

      <div className="absolute right-0 top-0 bottom-0 bg-gradient-to-l from-slate-900 dark:from-black to-transparent w-16 z-10" />

      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker {
          animation: ticker 40s linear infinite;
        }
        .animate-ticker:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};
