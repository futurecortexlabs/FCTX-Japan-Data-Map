import React, { useEffect } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from 'framer-motion';

const PARALLAX_RANGE = 40;

interface OrbProps {
  source: { x: MotionValue<number>; y: MotionValue<number> };
  factor: { x: number; y: number };
  spring: { damping: number; stiffness: number };
  className: string;
}

const Orb: React.FC<OrbProps> = ({ source, factor, spring, className }) => {
  const x = useSpring(useTransform(source.x, (v) => v * factor.x), spring);
  const y = useSpring(useTransform(source.y, (v) => v * factor.y), spring);
  return <motion.div style={{ x, y }} className={className} />;
};

/**
 * マウス位置に追従する背景オーブ。
 * 位置は MotionValue で直接 DOM に反映するため、マウス移動のたびに React の再レンダーが走らない
 * (以前は mousemove ごとに App 全体が再レンダーされていた)。
 */
export const ParallaxOrbs: React.FC = React.memo(() => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    const handleMouseMove = (e: MouseEvent) => {
      x.set((e.clientX / window.innerWidth - 0.5) * PARALLAX_RANGE);
      y.set((e.clientY / window.innerHeight - 0.5) * PARALLAX_RANGE);
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [x, y, reduceMotion]);

  const source = { x, y };
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
      <Orb
        source={source}
        factor={{ x: -1, y: -1 }}
        spring={{ damping: 15, stiffness: 100 }}
        className="absolute -top-20 -left-20 w-64 h-64 bg-indigo-500/30 dark:bg-indigo-600/20 rounded-full blur-[80px] animate-blob"
      />
      <Orb
        source={source}
        factor={{ x: 1.5, y: 1.5 }}
        spring={{ damping: 15, stiffness: 80 }}
        className="absolute top-1/4 -right-20 w-80 h-80 bg-rose-500/20 dark:bg-rose-600/15 rounded-full blur-[100px] animate-blob-reverse animation-delay-2000"
      />
      <Orb
        source={source}
        factor={{ x: -2, y: 2 }}
        spring={{ damping: 10, stiffness: 50 }}
        className="absolute -bottom-32 left-1/3 w-96 h-96 bg-emerald-500/20 dark:bg-emerald-500/15 rounded-full blur-[120px] animate-blob-slow animation-delay-4000"
      />
    </div>
  );
});
ParallaxOrbs.displayName = 'ParallaxOrbs';
