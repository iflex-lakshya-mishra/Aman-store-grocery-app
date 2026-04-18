import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [react(), tailwindcss(), VitePWA({
    registerType: 'prompt',
    devOptions: { enabled: false },
    manifestFilename: 'manifest.webmanifest',
    workbox: {
      navigateFallback: null,
      runtimeCaching: [],
    },
    includeAssets: ['Applogo.png', '180.png', 'pwa-192x192.png', 'pwa-512x512.png'],
    manifest: {
      name: 'Gupta Mart & Stationery',
      short_name: 'Gupta Mart',
      description: 'Gupta Mart & Stationery grocery and stationery store',
      theme_color: '#10b981',
      background_color: '#ffffff',
      display: 'standalone',
      icons: [
        { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
      ]
    }
  })],
})