import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/pickle-game-pair/' : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Pickle Game Pair',
        short_name: 'Pickle Pair',
        description: 'ピックルボールのダブルス組み合わせを自動作成',
        lang: 'ja',
        theme_color: '#1D9E75',
        background_color: '#f4f8f6',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff,woff2}'],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
}))
