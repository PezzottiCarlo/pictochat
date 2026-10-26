/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

// GitHub Pages serves the app from /pictochat/
const base = process.env.VITE_BASE ?? '/pictochat/';

export default defineConfig({
  base,
  plugins: [
    react(),
    // GramJS (MTProto client) still relies on a few Node built-ins
    nodePolyfills({
      include: ['buffer', 'process', 'util', 'os', 'path', 'stream', 'events', 'net', 'fs'],
      globals: { Buffer: true, process: true, global: true },
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.ico', 'icon/*.png', 'fonts/*.otf'],
      manifest: {
        name: 'PictoChat',
        short_name: 'PictoChat',
        description: 'Messaggistica con pittogrammi per comunicare in modo semplice',
        lang: 'it-IT',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '.',
        scope: '.',
        theme_color: '#0a84ff',
        background_color: '#f2f2f7',
        icons: [
          { src: 'icon/logo_64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'icon/logo_128x128.png', sizes: '128x128', type: 'image/png' },
          { src: 'icon/logo_256x256.png', sizes: '256x256', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,otf,woff2,json}'],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        runtimeCaching: [
          {
            // ARASAAC pictogram images: cache-first so pictograms work offline once seen
            urlPattern: /^https:\/\/static\.arasaac\.org\/pictograms\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'arasaac-images',
              expiration: { maxEntries: 4000, maxAgeSeconds: 60 * 60 * 24 * 180 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/api\.arasaac\.org\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'arasaac-api',
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: [
      { find: /^@\//, replacement: fileURLToPath(new URL('./src/', import.meta.url)) },
      // GramJS needs Node's crypto only through CryptoFile.js; its own browser implementation
      // is API-compatible and ~800 KB lighter than crypto-browserify.
      {
        find: /^crypto$/,
        replacement: fileURLToPath(new URL('./node_modules/telegram/crypto/crypto.js', import.meta.url)),
      },
    ],
  },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1500,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
