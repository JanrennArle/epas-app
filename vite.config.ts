/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { MANIFEST } from './src/pwa/manifest'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // The spec: the worker "prompts to update rather than reloading, so it
      // never interrupts a quiz in progress". Never change this to
      // 'autoUpdate'. A student mid pre-test cannot sit it again honestly.
      registerType: 'prompt',
      // src/ui/UpdatePrompt.tsx registers it through the virtual module, so
      // the plugin must not also inject a registration script.
      injectRegister: null,
      // Off in dev, or every reload of `npm run dev` serves yesterday's bundle.
      devOptions: { enabled: false },
      // Spread into a mutable copy: `MANIFEST` is `as const` so its guard
      // test (tests/manifest.test.ts) can pin literal values, but the
      // plugin's `ManifestOptions` wants a mutable `icons` array.
      manifest: { ...MANIFEST, icons: [...MANIFEST.icons] },
      includeAssets: ['apple-touch-icon.png'],
      workbox: {
        // Everything the app is made of. The fonts matter as much as the
        // code: a missing woff2 is a lesson rendered in a fallback face on a
        // phone with no signal, which looks like the app is broken.
        globPatterns: ['**/*.{js,css,html,woff2,png,svg,json,ico,webmanifest}'],
        // A student on a shared phone can carry three generations of this
        // app in storage otherwise.
        cleanupOutdatedCaches: true,
        // The app is hash routed, so every route is the same document and
        // this only ever answers for the document itself. It is here for a
        // hand typed URL and for a host that serves a directory index.
        navigateFallback: 'index.html',
        // The main chunk is over half a megabyte. The Workbox default of 2
        // MiB would pass today and silently drop the bundle the first time a
        // module pushes it over.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
  },
})
