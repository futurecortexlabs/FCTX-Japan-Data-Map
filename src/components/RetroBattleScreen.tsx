import React, { useState, useEffect, useMemo } from 'react';
import { type PrefectureData } from '../types/prefecture';
import { playRetroAttack, playRetroDamage, playRetroVictory } from '../utils/audio';

interface RetroBattleScreenProps {
  pref1: PrefectureData;
  pref2: PrefectureData;
  onClose: () => void;
}

type BattleScoreKey =
  | 'starbucksScore'
  | 'ramenScore'
  | 'attractivenessScore'
  | 'landPriceScore'
  | 'childcareScoreScore';

const metricsToCompare: readonly { key: BattleScoreKey; label: string }[] = [
  { key: 'starbucksScore', label: 'スタバ充実度' },
  { key: 'ramenScore', label: 'ラーメン充実度' },
  { key: 'attractivenessScore', label: '魅力度' },
  { key: 'landPriceScore', label: '地価の安さ' },
  { key: 'childcareScoreScore', label: '子育て環境' }
];

const MAX_HP = 100;
/** メッセージウィンドウに収まる最大行数 */
const VISIBLE_MESSAGE_LINES = 4;

// 演出タイミング (ms)
const INTRO_DELAY = 2000;
const STEP_DELAY = 1500;
const RESULT_DELAY = 1000;

type BattleSound = 'attack' | 'damage' | 'victory';

/** バトルの 1 コマ。delay 経過後に表示され、その時点の HP スナップショットを持つ */
interface BattleEvent {
  delay: number;
  messages: string[];
  sound?: BattleSound;
  hp1: number;
  hp2: number;
  /** 決着イベントのみ設定（1: 1P 勝利, 2: 2P 勝利, 0: 引き分け） */
  winner?: number;
}

const playBattleSound = (sound: BattleSound) => {
  switch (sound) {
    case 'attack':
      playRetroAttack();
      break;
    case 'damage':
      playRetroDamage();
      break;
    case 'victory':
      playRetroVictory();
      break;
  }
};

/** 偏差値スコアが未設定（または 0）の場合は平均値 50 として扱う */
const getBattleValue = (pref: PrefectureData, key: BattleScoreKey): number => pref[key] || 50;

/**
 * バトルの進行は 2 県のデータだけで決まるため、全イベントを純粋関数で事前に組み立てる。
 * コンポーネント側はタイマーで再生位置 (step) を進めるだけにし、
 * 多重タイマーや effect の再実行による二重攻撃を構造的に防ぐ。
 */
const buildBattleScript = (pref1: PrefectureData, pref2: PrefectureData): BattleEvent[] => {
  let hp1 = MAX_HP;
  let hp2 = MAX_HP;
  const events: BattleEvent[] = [
    { delay: 0, messages: [`やせいの ${pref2.prefName} が あらわれた！`], hp1, hp2 },
  ];

  // 攻撃開始までの待ち時間（初回は登場演出の分だけ長い）
  let attackDelay = INTRO_DELAY + STEP_DELAY;
  // 最終ターンを終えた場合は、ターン切り替え後に決着演出へ移る
  let resultDelay = STEP_DELAY + RESULT_DELAY;

  for (const metric of metricsToCompare) {
    const val1 = getBattleValue(pref1, metric.key);
    const val2 = getBattleValue(pref2, metric.key);

    // 1P の攻撃
    events.push({
      delay: attackDelay,
      messages: [`${pref1.prefName} の こうげき！`, `${metric.label} で しょうぶだ！`],
      sound: 'attack',
      hp1,
      hp2,
    });
    if (val1 - val2 > 0) {
      const damage = Math.floor(10 + (val1 - val2));
      hp2 = Math.max(0, hp2 - damage);
      events.push({ delay: STEP_DELAY, messages: [`${pref2.prefName} に ${damage} の ダメージ！`], sound: 'damage', hp1, hp2 });
    } else {
      events.push({ delay: STEP_DELAY, messages: ['しかし こうか は なかった！'], hp1, hp2 });
    }
    if (hp2 <= 0) {
      resultDelay = RESULT_DELAY;
      break;
    }

    // 2P の攻撃
    events.push({
      delay: STEP_DELAY * 2,
      messages: [`${pref2.prefName} の こうげき！`],
      sound: 'attack',
      hp1,
      hp2,
    });
    if (val2 - val1 > 0) {
      const damage = Math.floor(10 + (val2 - val1));
      hp1 = Math.max(0, hp1 - damage);
      events.push({ delay: STEP_DELAY, messages: [`${pref1.prefName} に ${damage} の ダメージ！`], sound: 'damage', hp1, hp2 });
    } else {
      events.push({ delay: STEP_DELAY, messages: ['しかし こうか は なかった！'], hp1, hp2 });
    }
    if (hp1 <= 0) {
      resultDelay = RESULT_DELAY;
      break;
    }

    attackDelay = STEP_DELAY * 2;
  }

  let resultMessage: string;
  let winner: number;
  if (hp1 > hp2) {
    resultMessage = `${pref1.prefName} は しょうぶに かった！`;
    winner = 1;
  } else if (hp2 > hp1) {
    resultMessage = `${pref2.prefName} は しょうぶに かった！`;
    winner = 2;
  } else {
    resultMessage = 'しょうぶは ひきわけだ！';
    winner = 0;
  }
  events.push({ delay: resultDelay, messages: [resultMessage], sound: 'victory', hp1, hp2, winner });

  return events;
};

export const RetroBattleScreen: React.FC<RetroBattleScreenProps> = ({ pref1, pref2, onClose }) => {
  const script = useMemo(() => buildBattleScript(pref1, pref2), [pref1, pref2]);
  // 再生済みイベント数（登場メッセージはマウント時点で表示済み）
  const [step, setStep] = useState(1);

  useEffect(() => {
    const next = script[step];
    if (!next) return;

    const timer = setTimeout(() => {
      if (next.sound) playBattleSound(next.sound);
      setStep(step + 1);
    }, next.delay);
    return () => clearTimeout(timer);
  }, [script, step]);

  const playedEvents = script.slice(0, step);
  const current = playedEvents[playedEvents.length - 1];
  const { hp1, hp2 } = current;
  const winner = current.winner ?? null;
  const messages = playedEvents.flatMap((e) => e.messages).slice(-VISIBLE_MESSAGE_LINES);

  return (
    <div className="fixed inset-0 z-[7000] bg-black text-white font-['DotGothic16'] flex flex-col items-center justify-between py-12 px-8">
      {/* 画面上部：敵（2P）ステータス */}
      <div className="w-full max-w-4xl flex justify-start">
        <div className="border-4 border-white bg-black p-4 inline-block w-80">
          <div className="text-xl mb-2">{pref2.prefName}</div>
          <div className="text-lg flex justify-between">
            <span>ＨＰ</span>
            <span>{hp2} / 100</span>
          </div>
          <div className="w-full h-4 border-2 border-white mt-1 p-0.5">
            <div className="h-full bg-white transition-all duration-300" style={{ width: `${Math.max(0, hp2)}%` }} />
          </div>
        </div>
      </div>

      {/* 中央：グラフィック（簡易表現） */}
      <div className="flex-1 flex items-center justify-center relative w-full max-w-4xl">
        <div className="w-64 h-64 border-4 border-white bg-black flex flex-col items-center justify-center animate-[pulse_3s_infinite]">
          <div className="text-6xl mb-4">👾</div>
          <div className="text-2xl">{pref2.prefName}</div>
        </div>
      </div>

      {/* 画面下部：味方（1P）ステータスとメッセージウィンドウ */}
      <div className="w-full max-w-4xl flex flex-col gap-4">
        <div className="flex justify-end">
          <div className="border-4 border-white bg-black p-4 inline-block w-80">
            <div className="text-xl mb-2">{pref1.prefName}</div>
            <div className="text-lg flex justify-between">
              <span>ＨＰ</span>
              <span>{hp1} / 100</span>
            </div>
            <div className="w-full h-4 border-2 border-white mt-1 p-0.5">
              <div className="h-full bg-white transition-all duration-300" style={{ width: `${Math.max(0, hp1)}%` }} />
            </div>
          </div>
        </div>

        <div className="border-4 border-white bg-black h-40 p-4 text-xl leading-relaxed flex flex-col justify-end relative">
          {messages.map((m, i) => (
            <div key={i} className="min-h-[1.5em]">{m}</div>
          ))}
          {winner !== null && (
            <button 
              onClick={onClose}
              className="absolute bottom-4 right-4 animate-bounce hover:text-yellow-300 cursor-pointer"
            >
              ▼ つぎへ
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
