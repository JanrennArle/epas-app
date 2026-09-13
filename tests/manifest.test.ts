import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { MANIFEST } from '../src/pwa/manifest'

describe('the web app manifest', () => {
  // An installed app opens at start_url. `src/ui/Shell.tsx` lets exactly two
  // routes through without consent, and a start_url landing past the gate
  // would let an installed icon reach a lesson, or a test that writes attempt
  // records, before any student agreed to anything. A deep link did that once.
  it('starts on a route the consent gate covers', () => {
    expect(MANIFEST.start_url).toBe('./')
    expect(MANIFEST.start_url).not.toContain('#')
  })

  // Absolute paths break the moment the app is served from a project
  // subdirectory, which is what a GitHub Pages URL is, and `base: './'`
  // exists for the same reason.
  it('is relative throughout, like the build', () => {
    expect(MANIFEST.start_url.startsWith('/')).toBe(false)
    expect(MANIFEST.scope.startsWith('/')).toBe(false)
    for (const icon of MANIFEST.icons) {
      expect(icon.src.startsWith('/'), icon.src).toBe(false)
    }
  })

  // Chrome will not offer to install without a 192 and a 512, and an Android
  // launcher crops the corners off anything that is not maskable.
  it('carries what an install prompt needs', () => {
    const sizes = MANIFEST.icons.map(i => i.sizes)
    expect(sizes).toContain('192x192')
    expect(sizes).toContain('512x512')
    expect(MANIFEST.icons.some(i => i.purpose === 'maskable')).toBe(true)
  })

  // An icon named here and not emitted by scripts/make-icons.mjs installs as
  // a blank tile, and nothing else in the app would render it to show you.
  it('names only icons that exist', () => {
    for (const icon of MANIFEST.icons) {
      expect(() => readFileSync(`public/${icon.src}`), icon.src).not.toThrow()
    }
  })

  // docs/DESIGN.md is the visual authority and allows exactly one accent.
  it('uses the app palette', () => {
    expect(MANIFEST.theme_color).toBe('#0E6E63')
    expect(MANIFEST.background_color).toBe('#FAFAF9')
  })

  it('has no em dash in anything a student reads', () => {
    for (const text of [MANIFEST.name, MANIFEST.short_name, MANIFEST.description]) {
      expect(text, text).not.toContain('—')
    }
  })

  // apple-touch-icon.png ships through `includeAssets` in vite.config.ts, not
  // through MANIFEST.icons, so nothing above proves anything links to it. iOS
  // Safari looks for it at the domain root by convention when no link tag
  // names one, which 404s the moment the app is served from a project
  // subdirectory. That shipped once: the file was precached and never
  // referenced, and nothing in the app would ever show anyone a blank home
  // screen icon.
  it('links the apple touch icon from index.html', () => {
    const html = readFileSync('index.html', 'utf8')
    const tag = html.match(/<link[^>]*rel="apple-touch-icon"[^>]*>/)?.[0]
    expect(tag, 'index.html should have a <link rel="apple-touch-icon"> tag').toBeDefined()
    const href = tag?.match(/href="([^"]+)"/)?.[1]
    expect(href, 'apple-touch-icon link should have an href').toBeDefined()
    // Relative, to match `base: './'`, for the same reason as MANIFEST above.
    expect(href?.startsWith('/'), href).toBe(false)
    const relativeSrc = href!.replace(/^\.\//, '')
    expect(() => readFileSync(`public/${relativeSrc}`), relativeSrc).not.toThrow()
  })
})
