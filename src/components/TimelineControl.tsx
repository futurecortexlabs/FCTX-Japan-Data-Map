import React, { useEffect, useRef } from 'react';
import { Play, Pause, FastForward, RotateCcw, Calendar } from 'lucide-react';

interface TimelineControlProps {
  years: number[];
  selectedYear: number;
  onYearChange: (year: number) => void;
  isPlaying: boolean;
  onPlayingChange: (isPlaying: boolean) => void;
}

export const TimelineControl: React.FC<TimelineControlProps> = ({
  years,
  selectedYear,
  onYearChange,
  isPlaying,
  onPlayingChange,
}) => {
  const [speed, setSpeed] = React.useState<number>(1500); // ミリ秒単位 (デフォルト1.5秒)
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 自動再生タイマーの制御
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        const currentIndex = years.indexOf(selectedYear);
        const nextIndex = (currentIndex + 1) % years.length;
        onYearChange(years[nextIndex]);
      }, speed);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, selectedYear, years, speed, onYearChange]);

  const togglePlay = () => {
    onPlayingChange(!isPlaying);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onYearChange(Number(e.target.value));
  };

  const cycleSpeed = () => {
    // 1500ms -> 800ms -> 2500ms -> 1500ms のサイクル
    if (speed === 1500) setSpeed(800);
    else if (speed === 800) setSpeed(2500);
    else setSpeed(1500);
  };

  const getSpeedLabel = () => {
    if (speed === 1500) return '1.0x';
    if (speed === 800) return '2.0x';
    return '0.5x';
  };

  const restartTimeline = () => {
    onYearChange(years[0]);
  };

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 py-4 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-800/50 flex flex-col sm:flex-row items-center gap-4">
      {/* 再生コントロールボタン群 */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={togglePlay}
          className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md transition-all duration-300 hover:scale-105 cursor-pointer ${
            isPlaying
              ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20'
              : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
          }`}
          title={isPlaying ? '一時停止' : '再生'}
        >
          {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
        </button>

        <button
          onClick={restartTimeline}
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          title="最初に戻る"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={cycleSpeed}
          className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer transition-colors min-w-[65px]"
          title="再生速度"
        >
          <FastForward className="w-3.5 h-3.5" />
          <span>{getSpeedLabel()}</span>
        </button>
      </div>

      {/* スライダーとタイムライン表示 */}
      <div className="flex-1 w-full flex items-center gap-4">
        {/* 現在の年表示 */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100/50 dark:border-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400 font-black text-sm tabular-nums">
          <Calendar className="w-4 h-4" />
          <span>{selectedYear}年</span>
        </div>

        {/* シークスライダー */}
        <div className="flex-1 relative flex flex-col gap-1">
          <input
            type="range"
            min={years[0]}
            max={years[years.length - 1]}
            step="1"
            value={selectedYear}
            onChange={handleSliderChange}
            className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-400"
          />
          {/* 目盛りラベル */}
          <div className="flex justify-between text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500 px-1 mt-0.5 select-none">
            {years.map((y) => {
              const isMilestone = y === years[0] || y === years[years.length - 1] || y % 5 === 0;
              const isSelected = y === selectedYear;
              return (
                <span
                  key={y}
                  onClick={() => onYearChange(y)}
                  className={`cursor-pointer transition-all duration-200 flex flex-col items-center ${
                    isSelected
                      ? 'text-indigo-700 dark:text-indigo-500 font-black scale-110'
                      : 'hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                  title={`${y}年`}
                >
                  {isMilestone ? (
                    <span>{y}</span>
                  ) : (
                    <span className={`text-xs -mt-[1px] ${isSelected ? 'text-indigo-600 dark:text-indigo-400 font-extrabold scale-125' : 'text-slate-300 dark:text-slate-700'}`}>•</span>
                  )}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
