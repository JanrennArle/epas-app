/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { MANIFEST } from './src/pwa/manifest'

/**
 * Three builds from one codebase, chosen with `vite build --mode <name>`:
 *
 * - `production` (the default) is the website at janrennarle.github.io, an
 *   installable PWA with a service worker. Everything below the ternaries is
 *   exactly what it was before the other two existed.
 * - `file` is one self-contained HTML file for school computers with no
 *   internet. `scripts/make-single-file.mjs` inlines the output into it.
 * - `apk` is the web bundle Capacitor wraps into the Android app.
 *
 * A mode rather than an environment variable, because `--mode` is a Vite
 * flag and works the same from cmd, PowerShell and Git Bash, and npm runs
 * scripts through cmd on Windows, where `VAR=x command` does not work.
 *
 * Neither offline build gets a service worker. A `file://` page cannot
 * register one, so it would only fail. Inside the Android app it would be
 * worse than useless: the APK already carries every file, and a worker left
 * holding an old bundle after a student installs a newer APK is the exact
 * stale-bundle hazard CLAUDE.md describes, with no update prompt to escape
 * it. `disable` also turns `virtual:pwa-register/react` into a stub that
 * never registers, so `UpdatePrompt` renders nothing in either build.
 */
export default defineConfig(({ mode }) => {
  const offline = mode === 'file' || mode === 'apk'

  return {
    base: './',
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        disable: offline,
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
          // phone with no signal, which looks like the app is broken. `woff`
          // is here too because the Shadow Board's display faces
          // (barlow-condensed, dotgothic16) ship a woff fallback alongside
          // their woff2, and both must survive with no signal.
          globPatterns: ['**/*.{js,css,html,woff2,woff,png,svg,json,ico,webmanifest}'],
          // A student on a shared phone can carry three generations of this
          // app in storage otherwise.
          cleanupOutdatedCaches: true,
          // The app is hash routed, so every route is the same document and
          // this only ever answers for the document itself. It is here for a
          // hand typed URL and for a host that serves a directory index.
          navigateFallback: 'index.html',
          // The main chunk is over half a megabyte. `vite-plugin-pwa` defaults
          // `throwMaximumFileSizeToCacheInBytes` to true, so the Workbox
          // default of 2 MiB would fail the build loudly, not silently drop the
          // bundle, the first time a module pushes it over. Raising the
          // ceiling buys headroom before that loud failure, not protection
          // from a silent one.
          maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        },
      }),
    ],
    build: mode === 'file'
      ? {
          outDir: 'dist-file',
          // Every font and image becomes a data URI inside the CSS or JS, so
          // the single file carries its own typeface. A file opened from a
          // USB stick has no folder of assets beside it to fetch from.
          assetsInlineLimit: 100 * 1024 * 1024,
          cssCodeSplit: false,
          // One JS file, so the inliner has exactly one script to embed.
          rollupOptions: { output: { inlineDynamicImports: true } },
          // The icons in public/ only matter to an installed PWA.
          copyPublicDir: false,
        }
      : mode === 'apk'
        ? { outDir: 'dist-apk' }
        : {},
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./tests/setup.ts'],
      include: ['tests/**/*.test.{ts,tsx}'],
    },
  }
})
