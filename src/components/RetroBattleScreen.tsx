import React, { useState, useEffect } from 'react';
import { type PrefectureData } from '../types/prefecture';
import { playRetroAttack, playRetroDamage, playRetroVictory } from '../utils/audio';

interface RetroBattleScreenProps {
  pref1: PrefectureData;
  pref2: PrefectureData;
  onClose: () => void;
}

type TurnState = 'start' | 'p1_attack' | 'p2_attack' | 'end';

export const RetroBattleScreen: React.FC<RetroBattleScreenProps> = ({ pref1, pref2, onClose }) => {
  const [hp1, setHp1] = useState(100);
  const [hp2, setHp2] = useState(100);
  const [messages, setMessages] = useState<string[]>([]);
  const [turn, setTurn] = useState<number>(0);
  const [turnState, setTurnState] = useState<TurnState>('start');
  const [winner, setWinner] = useState<number | null>(null);
  
  const metricsToCompare = [
    { key: 'starbucksScore', label: 'スタバ充実度' },
    { key: 'ramenScore', label: 'ラーメン充実度' },
    { key: 'attractivenessScore', label: '魅力度' },
    { key: 'landPriceScore', label: '地価の安さ' },
    { key: 'childcareScoreScore', label: '子育て環境' }
  ];

  const addMessage = (msg: string) => {
    setMessages(prev => [...prev.slice(-3), msg]); // Keep only last 4 lines to fit in window
  };

  useEffect(() => {
    if (turnState === 'start') {
      addMessage(`やせいの ${pref2.prefName} が あらわれた！`);
      setTimeout(() => setTurnState('p1_attack'), 2000);
    }
  }, []);

  useEffect(() => {
    if (winner !== null) return;
    if (hp1 <= 0 || hp2 <= 0 || turn >= metricsToCompare.length) {
      setTimeout(() => {
        setTurnState('end');
        if (hp1 > hp2) {
          addMessage(`${pref1.prefName} は しょうぶに かった！`);
          setWinner(1);
        } else if (hp2 > hp1) {
          addMessage(`${pref2.prefName} は しょうぶに かった！`);
          setWinner(2);
        } else {
          addMessage(`しょうぶは ひきわけだ！`);
          setWinner(0);
        }
        playRetroVictory();
      }, 1000);
      return;
    }

    if (turnState === 'p1_attack') {
      const metric = metricsToCompare[turn];
      const timer = setTimeout(() => {
        addMessage(`${pref1.prefName} の こうげき！`);
        addMessage(`${metric.label} で しょうぶだ！`);
        playRetroAttack();
        
        setTimeout(() => {
          const val1 = (pref1 as any)[metric.key] || 50;
          const val2 = (pref2 as any)[metric.key] || 50;
          const diff = val1 - val2;
          
          if (diff > 0) {
            playRetroDamage();
            const damage = Math.floor(10 + diff);
            addMessage(`${pref2.prefName} に ${damage} の ダメージ！`);
            setHp2(prev => Math.max(0, prev - damage));
          } else {
            addMessage(`しかし こうか は なかった！`);
          }
          
          setTimeout(() => setTurnState('p2_attack'), 1500);
        }, 1500);
      }, 1500);
      return () => clearTimeout(timer);
    }

    if (turnState === 'p2_attack') {
      const metric = metricsToCompare[turn];
      const timer = setTimeout(() => {
        addMessage(`${pref2.prefName} の こうげき！`);
        playRetroAttack();
        
        setTimeout(() => {
          const val1 = (pref1 as any)[metric.key] || 50;
          const val2 = (pref2 as any)[metric.key] || 50;
          const diff = val2 - val1;
          
          if (diff > 0) {
            playRetroDamage();
            const damage = Math.floor(10 + diff);
            addMessage(`${pref1.prefName} に ${damage} の ダメージ！`);
            setHp1(prev => Math.max(0, prev - damage));
          } else {
            addMessage(`しかし こうか は なかった！`);
          }
          
          setTimeout(() => {
            setTurn(prev => prev + 1);
            setTurnState('p1_attack');
          }, 1500);
        }, 1500);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [turnState, turn, hp1, hp2, winner]);

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
