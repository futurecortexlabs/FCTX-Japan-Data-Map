import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
const BASE_PATH = '/FCTX-Japan-Data-Map/';

/**
 * 本番ビルドを `vite preview` で配信し、実ブラウザで主要なユーザーフローを検証する。
 * (GitHub Pages と同じ base path で動かすことで、パス解決の不具合も検出する)
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}${BASE_PATH}`,
    trace: 'retain-on-failure',
    locale: 'ja-JP',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}${BASE_PATH}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
