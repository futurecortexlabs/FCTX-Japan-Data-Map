/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/FCTX-Japan-Data-Map/',
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'react-vendor';
            if (id.includes('leaflet')) return 'leaflet-vendor';
            if (id.includes('framer-motion') || id.includes('canvas-confetti')) return 'animation-vendor';
            if (id.includes('recharts') || id.includes('d3')) return 'chart-vendor';
            return 'vendor';
          }
        }
      }
    }
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
