import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

const effectConfig: Record<EffectType, { emojis: string[], count: number, direction: 'down' | 'up' | 'drift', minSize: number, maxSize: number }> = {
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

export const WeatherEffects: React.FC<WeatherEffectsProps> = ({ currentMetric }) => {
  const [particles, setParticles] = useState<any[]>([]);
  const effectType = metricToEffectMap[currentMetric] || 'none';
  const config = effectConfig[effectType];

  useEffect(() => {
    if (config.count === 0) {
      setParticles([]);
      return;
    }

    const newParticles = Array.from({ length: config.count }).map((_, i) => {
      const emoji = config.emojis[Math.floor(Math.random() * config.emojis.length)];
      const size = Math.random() * (config.maxSize - config.minSize) + config.minSize;
      const startX = Math.random() * 100;
      const delay = Math.random() * 5;
      const duration = Math.random() * 5 + 5; // 5s to 10s
      const swayAmount = Math.random() * 20 - 10;
      
      return { id: `${effectType}-${i}`, emoji, size, startX, delay, duration, swayAmount };
    });

    setParticles(newParticles);
  }, [effectType, config]);

  if (effectType === 'none' || particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[4500] overflow-hidden">
      <AnimatePresence>
        {particles.map((p) => {
          let initial: any = { opacity: 0, x: `${p.startX}vw` };
          let animate: any = { opacity: [0, 1, 1, 0] };
          
          if (config.direction === 'down') {
            initial.y = '-10vh';
            initial.rotate = 0;
            animate.y = '110vh';
            animate.x = [`${p.startX}vw`, `${p.startX + p.swayAmount}vw`, `${p.startX - p.swayAmount}vw`, `${p.startX}vw`];
            animate.rotate = [0, 90, 180, 360];
          } else if (config.direction === 'up') {
            initial.y = '110vh';
            initial.rotate = 0;
            animate.y = '-10vh';
            animate.x = [`${p.startX}vw`, `${p.startX + p.swayAmount}vw`, `${p.startX - p.swayAmount}vw`, `${p.startX}vw`];
            animate.rotate = [0, -90, -180, -360];
          } else if (config.direction === 'drift') {
            // Pollen drifting horizontally
            initial.x = '-10vw';
            initial.y = `${Math.random() * 100}vh`;
            animate.x = '110vw';
            animate.y = [`${initial.y}`, `calc(${initial.y} + ${p.swayAmount}vh)`, `${initial.y}`];
            animate.rotate = [0, 45, 90];
          }

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
