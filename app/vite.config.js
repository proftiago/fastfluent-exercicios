import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false, // já temos public/manifest.webmanifest configurado
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,jpg,jpeg,svg,woff2}'],
        runtimeCaching: [
          {
            // Conteúdo de lições/materiais: usa cache se já visitou antes,
            // atualiza em segundo plano quando online
            urlPattern: /^https:\/\/kockwinynfpaenxmzagu\.supabase\.co\/rest\/v1\/(materiais_aula|exercicios)/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'ff-conteudo-cache' },
          },
          {
            // Capas dos livros
            urlPattern: /\/capas\/.*\.png$/,
            handler: 'CacheFirst',
            options: { cacheName: 'ff-capas-cache', expiration: { maxEntries: 20 } },
          },
          {
            // Fontes do Google Fonts
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
            handler: 'CacheFirst',
            options: { cacheName: 'ff-fontes-cache' },
          },
        ],
      },
    }),
  ],
})
