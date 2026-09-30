import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion, type TargetAndTransition } from 'framer-motion';
import { type MetricType } from '../types/prefecture';

interface WeatherEffectsProps {
  currentMetric: MetricType;
}

type EffectType = 'sakura' | 'money' | 'pollen' | 'sun' | 'steam' | 'food' | 'medical' | 'kids' | 'none';

const metricToEffectMap: Record<MetricType, EffectType> = {
  attractiveness: 'sakura',
  landPrice: 'money',
  pollenLevel: 'pollen',
  sunshineHours: 'sun',
  onsenCount: 'steam',
  ramenCount: 'food',
  starbucksCount: 'food',
  hospitalCount: 'medical',
  childcareScore: 'kids',
  totalScore: 'none',
  population: 'none',
  listedCompanies: 'none'
};

interface EffectConfig {
  emojis: string[];
  count: number;
  direction: 'down' | 'up' | 'drift';
  minSize: number;
  maxSize: number;
}

const effectConfig: Record<EffectType, EffectConfig> = {
  sakura: { emojis: ['🌸', '💮', '🌸', '✨'], count: 35, direction: 'down', minSize: 10, maxSize: 25 },
  money: { emojis: ['💴', '💸', '💰', '💴'], count: 25, direction: 'down', minSize: 20, maxSize: 35 },
  pollen: { emojis: ['🤧', '🌼', '😷', '🟡'], count: 40, direction: 'drift', minSize: 10, maxSize: 20 },
  sun: { emojis: ['☀️', '🌻', '✨', '🟡'], count: 20, direction: 'up', minSize: 15, maxSize: 30 },
  steam: { emojis: ['♨️', '💨', '💭'], count: 25, direction: 'up', minSize: 20, maxSize: 40 },
  food: { emojis: ['🍜', '🍥', '☕', '🥤'], count: 25, direction: 'down', minSize: 20, maxSize: 35 },
  medical: { emojis: ['🏥', '💊', '💖', '💉'], count: 20, direction: 'down', minSize: 15, maxSize: 30 },
  kids: { emojis: ['👶', '🍼', '🎈', '🧸'], count: 25, direction: 'up', minSize: 20, maxSize: 35 },
  none: { emojis: [], count: 0, direction: 'down', minSize: 0, maxSize: 0 }
};

interface Particle {
  id: string;
  emoji: string;
  size: number;
  startX: number;
  /** drift（横流れ）用の開始高さ (vh)。レンダーごとに変わらないよう生成時に確定させる */
  startY: number;
  delay: number;
  duration: number;
  swayAmount: number;
}

const createParticles = (effectType: EffectType, config: EffectConfig): Particle[] =>
  Array.from({ length: config.count }, (_, i) => ({
    id: `${effectType}-${i}`,
    emoji: config.emojis[Math.floor(Math.random() * config.emojis.length)],
    size: Math.random() * (config.maxSize - config.minSize) + config.minSize,
    startX: Math.random() * 100,
    startY: Math.random() * 100,
    delay: Math.random() * 5,
    duration: Math.random() * 5 + 5, // 5s to 10s
    swayAmount: Math.random() * 20 - 10,
  }));

const getParticleMotion = (
  p: Particle,
  direction: EffectConfig['direction'],
): { initial: TargetAndTransition; animate: TargetAndTransition } => {
  const swayX = [`${p.startX}vw`, `${p.startX + p.swayAmount}vw`, `${p.startX - p.swayAmount}vw`, `${p.startX}vw`];

  switch (direction) {
    case 'down':
      return {
        initial: { opacity: 0, x: `${p.startX}vw`, y: '-10vh', rotate: 0 },
        animate: { opacity: [0, 1, 1, 0], y: '110vh', x: swayX, rotate: [0, 90, 180, 360] },
      };
    case 'up':
      return {
        initial: { opacity: 0, x: `${p.startX}vw`, y: '110vh', rotate: 0 },
        animate: { opacity: [0, 1, 1, 0], y: '-10vh', x: swayX, rotate: [0, -90, -180, -360] },
      };
    case 'drift': {
      // Pollen drifting horizontally
      const startY = `${p.startY}vh`;
      return {
        initial: { opacity: 0, x: '-10vw', y: startY },
        animate: {
          opacity: [0, 1, 1, 0],
          x: '110vw',
          y: [startY, `calc(${startY} + ${p.swayAmount}vh)`, startY],
          rotate: [0, 45, 90],
        },
      };
    }
  }
};

interface ParticleFieldProps {
  effectType: Exclude<EffectType, 'none'>;
}

/**
 * パーティクルはマウント時に一度だけ生成する。
 * エフェクト種別が変わると親が key を変えて再マウントするため、effect 内での再生成は不要。
 */
const ParticleField: React.FC<ParticleFieldProps> = ({ effectType }) => {
  const config = effectConfig[effectType];
  const [particles] = useState(() => createParticles(effectType, config));

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[4500] overflow-hidden">
      <AnimatePresence>
        {particles.map((p) => {
          const { initial, animate } = getParticleMotion(p, config.direction);

          return (
            <motion.div
              key={p.id}
              initial={initial}
              animate={animate}
              transition={{
                duration: p.duration,
                repeat: Infinity,
                delay: p.delay,
                ease: 'linear'
              }}
              style={{
                position: 'absolute',
                fontSize: `${p.size}px`,
                filter: effectType === 'pollen' ? 'drop-shadow(0 0 8px rgba(234,179,8,0.8)) blur(1px)' : 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))'
              }}
            >
              {p.emoji}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export const WeatherEffects: React.FC<WeatherEffectsProps> = ({ currentMetric }) => {
  const effectType = metricToEffectMap[currentMetric] || 'none';
  // 「視差効果を減らす」設定のユーザーには全画面パーティクルを表示しない
  const reduceMotion = useReducedMotion();
  if (effectType === 'none' || reduceMotion) return null;

  // key で種別ごとに再マウントし、パーティクルを作り直す
  return <ParticleField key={effectType} effectType={effectType} />;
};
