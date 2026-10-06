import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      manifest: {
        name: 'Hydrate — ricordati di bere acqua',
        short_name: 'Hydrate',
        description: 'Reminder, statistiche e costanza per bere acqua.',
        lang: 'it',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        theme_color: '#0b1220',
        background_color: '#0b1220',
        icons: [
          { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }
        ]
      }
    })
  ],
  server: { host: true, port: 5173 },
  test: {
    environment: 'node',
    include: ['src/**/*.test.js']
  }
})
