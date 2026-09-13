/**
 * The web app manifest.
 *
 * It lives in `src/` rather than inline in `vite.config.ts` so that
 * `tests/manifest.test.ts` reads the same object that ships. A manifest
 * asserted in one place and written in another is a test that passes while
 * the installed app is wrong.
 */
export const MANIFEST = {
  name: 'EPAS Grade 12',
  short_name: 'EPAS',
  description:
    'Electronics Products Assembly and Servicing for Grade 12. Works with no internet once installed.',
  // Relative, to match `base: './'`. An absolute '/' breaks the app the
  // moment it is served from a project subdirectory, which is what a GitHub
  // Pages URL is.
  start_url: './',
  scope: './',
  display: 'standalone',
  orientation: 'portrait',
  // docs/DESIGN.md: the light surface and the one accent.
  background_color: '#FAFAF9',
  theme_color: '#0E6E63',
  lang: 'en',
  icons: [
    { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
} as const
