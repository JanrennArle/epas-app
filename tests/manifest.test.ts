import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { MANIFEST } from '../src/pwa/manifest'

// The source `index.html`, not `dist/index.html`. It is what a person edits,
// and the build was already verified (see task-3-report.md, fix round 1) to
// carry its link tags through into dist/ unchanged, relative hrefs intact.
// Reading dist/ here would mean building before every test run for no gain.
function readIndexHtml(): string {
  return readFileSync('index.html', 'utf8')
}

function linkTag(html: string, rel: string): string | undefined {
  return html.match(new RegExp(`<link[^>]*rel="${rel}"[^>]*>`))?.[0]
}

function hrefOf(tag: string | undefined): string | undefined {
  return tag?.match(/href="([^"]+)"/)?.[1]
}

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
  //
  // "points at *a* file that exists" is not enough here: a first version of
  // this test passed with the href repointed at icon-512.png, a real file
  // that is simply the wrong icon for an iOS home screen. Pin the exact name.
  it('links the apple touch icon to itself, not some other icon', () => {
    const html = readIndexHtml()
    const tag = linkTag(html, 'apple-touch-icon')
    expect(tag, 'index.html should have a <link rel="apple-touch-icon"> tag').toBeDefined()
    const href = hrefOf(tag)
    expect(href, 'apple-touch-icon link should have an href').toBeDefined()
    // Relative, to match `base: './'`: an absolute href works from a host
    // root and 404s from a GitHub Pages project subdirectory, which is the
    // failure this whole fix exists to prevent.
    expect(href?.startsWith('/'), href).toBe(false)
    expect(href?.replace(/^\.\//, '')).toBe('apple-touch-icon.png')
  })

  // A browser tab with no favicon link shows a blank document icon, and a
  // bookmark on a shared lab PC becomes unidentifiable. Pinned to the exact
  // file this project ships as its favicon (icon-192.png), for the same
  // reason as the apple-touch-icon above: a link present and pointed at some
  // existing file is not the same claim as pointed at the right one.
  it('links a favicon', () => {
    const html = readIndexHtml()
    const tag = linkTag(html, 'icon')
    expect(tag, 'index.html should have a <link rel="icon"> tag').toBeDefined()
    const href = hrefOf(tag)
    expect(href, 'favicon link should have an href').toBeDefined()
    expect(href?.startsWith('/'), href).toBe(false)
    expect(href?.replace(/^\.\//, '')).toBe('icon-192.png')
  })

  // The class of defect, not the instance: a file sitting in public/ that
  // nothing points at ships into the precache and installs invisibly, the
  // way apple-touch-icon.png did before this fix. Reads the directory
  // instead of listing filenames, so an icon added later and wired to
  // nothing fails this test rather than silently repeating the defect.
  it('references every file in public/ from somewhere that will find it', () => {
    const html = readIndexHtml()
    const linkHrefs = [...html.matchAll(/<link[^>]*href="([^"]+)"[^>]*>/g)].map(m =>
      m[1]!.replace(/^\.\//, ''),
    )
    const manifestSrcs = MANIFEST.icons.map(i => i.src)
    const referenced = new Set([...linkHrefs, ...manifestSrcs])

    const files = readdirSync('public', { withFileTypes: true })
      .filter(entry => entry.isFile())
      .map(entry => entry.name)
    expect(files.length, 'public/ should not be empty').toBeGreaterThan(0)

    for (const file of files) {
      expect(referenced.has(file), `${file} is referenced by nothing`).toBe(true)
    }
  })
})
