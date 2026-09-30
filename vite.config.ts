/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * ベンダーチャンクの割り当て (priority が高いグループから順にモジュールを確保する)。
 *
 * Rolldown のグループは「確保したモジュールの依存も一緒に取り込む」のが既定動作のため、
 * 旧設定 (`id.includes('react')` 等の部分一致) では recharts 側のグループが react-dom の一部を取り込み、
 * 遅延ロードのはずの chart-vendor (~400KB) が初回ロードで preload されていた。
 * パッケージ名の完全一致 + 優先度で、共有基盤 (React) を先に確保させる。
 */
const VENDOR_GROUPS: { name: string; packages: string[]; priority: number }[] = [
  { name: 'react-vendor', packages: ['react', 'react-dom', 'scheduler'], priority: 40 },
  { name: 'leaflet-vendor', packages: ['leaflet', 'react-leaflet', '@react-leaflet/core'], priority: 30 },
  { name: 'animation-vendor', packages: ['framer-motion', 'motion-dom', 'motion-utils', 'canvas-confetti'], priority: 20 },
  {
    name: 'chart-vendor',
    packages: [
      'recharts', '@reduxjs/toolkit', 'react-redux', 'redux', 'redux-thunk', 'reselect', 'immer', 'victory-vendor',
      'decimal.js-light', 'es-toolkit', 'eventemitter3', 'tiny-invariant', 'use-sync-external-store', 'clsx',
    ],
    priority: 10,
  },
];

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
const packageTest = (packages: string[]) =>
  new RegExp(`[\\\\/]node_modules[\\\\/](${packages.map(escapeRegExp).join('|')})[\\\\/]`);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/FCTX-Japan-Data-Map/',
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: VENDOR_GROUPS.map(({ name, packages, priority }) => ({ name, priority, test: packageTest(packages) })),
        },
      },
    },
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      // カバレッジ指標はドメインロジック層に限定する (フック・UI は Testing Library と Playwright E2E で検証)
      include: ['src/utils/**', 'src/constants/**', 'src/components/detail-panel/logic.ts'],
      // Web Audio / Web Speech / Canvas に依存する薄いラッパーはブラウザでのみ検証する
      exclude: ['src/utils/audio.ts', 'src/utils/speech.ts', 'src/utils/confetti.ts', 'src/**/*.test.{ts,tsx}'],
      reporter: ['text', 'html'],
    },
  },
})
