import { VitePWA } from 'vite-plugin-pwa';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: {
          enabled: true
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
    // Vitest runs the pure-function unit suite under src/__tests__.
    // Playwright owns everything under e2e/ — exclude it so vitest doesn't
    // try to load `test.describe` from @playwright/test.
    test: {
      include: ['src/**/*.test.{ts,tsx}'],
      exclude: ['e2e/**', 'node_modules/**', 'dist/**', 'playwright-report/**'],
      coverage: {
        provider: 'v8',
        // Only measure code we actually own — UI tabs/components are
        // exercised by Playwright, not vitest, so excluding them keeps
        // the threshold meaningful instead of permanently red.
        include: [
          'src/utils/**/*.ts',
          'src/context/**/*.tsx',
          'server.ts',
        ],
        exclude: [
          'src/**/*.test.{ts,tsx}',
          'src/**/*.d.ts',
          // sound.ts: browser-only Web Audio shim, no unit-testable logic.
          'src/utils/sound.ts',
          // PremiumContext.tsx: gated on Razorpay integration that isn't
          // wired yet — `tier` is hardcoded 'free'. Most branches are
          // unreachable until that lands. Re-include when Razorpay ships.
          'src/context/PremiumContext.tsx',
        ],
        reporter: ['text', 'html', 'json-summary'],
        thresholds: {
          // Floor pinned to current measured coverage of the included
          // surface. Bump up as PRs add tests; never relax without
          // explicit reason in the commit message.
          lines: 85,
          functions: 85,
          statements: 85,
          branches: 75,
        },
      },
    },
  };
});
