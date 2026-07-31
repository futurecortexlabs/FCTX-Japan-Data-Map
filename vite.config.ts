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
  }
})
