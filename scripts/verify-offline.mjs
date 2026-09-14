// Fails if anything the build emitted is missing from the service worker's
// precache manifest.
//
// This is the check whose absence is invisible. Everything works on the
// bench, because the bench has a network; the missing file only shows up on
// a student's phone with no signal, as a lesson in the wrong typeface or a
// screen that will not open. Run before every deploy.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const DIST = 'dist'

function walk(dir) {
  const out = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...walk(full))
    else out.push(relative(DIST, full).split(sep).join('/'))
  }
  return out
}

let sw
try {
  sw = readFileSync(join(DIST, 'sw.js'), 'utf8')
} catch {
  console.error('No dist/sw.js. Run `npm run build` first.')
  process.exit(1)
}

// vite-plugin-pwa (generateSW mode) writes the precache manifest inline as
// an array of entry objects passed to precacheAndRoute(). In dist/sw.js this
// is minified JS, not JSON: keys are unquoted, e.g.
//   precacheAndRoute([{url:"index.html",revision:"abc123"},...])
// A hand-written build, or a source map, or a future plugin version, could
// still emit quoted JSON-style keys instead, e.g. {"url":"index.html"}.
// Match both shapes: an optional quote around `url`, then a colon, then a
// double-quoted string value.
const URL_ENTRY = /["']?url["']?\s*:\s*"([^"]+)"/g

// Find the manifest array itself so we can tell "the array is empty" (a
// globPatterns problem) apart from "the array has content but our regex
// found nothing in it" (a parser problem, because the format changed).
const callIndex = sw.indexOf('precacheAndRoute(')
if (callIndex === -1) {
  console.error(
    'Could not find a precacheAndRoute(...) call in dist/sw.js at all.\n' +
      'The service worker format has changed. Fix the parser in scripts/verify-offline.mjs,\n' +
      'not vite.config.ts: this is not a globPatterns problem.'
  )
  process.exit(1)
}

const arrayStart = sw.indexOf('[', callIndex)
let manifestSource = ''
if (arrayStart !== -1) {
  let depth = 0
  let end = -1
  for (let i = arrayStart; i < sw.length; i++) {
    if (sw[i] === '[') depth++
    else if (sw[i] === ']') {
      depth--
      if (depth === 0) {
        end = i
        break
      }
    }
  }
  manifestSource = end !== -1 ? sw.slice(arrayStart, end + 1) : ''
}

const arrayIsEmpty = manifestSource.replace(/\s/g, '') === '[]'

// Scoped to the manifest array we just found the bounds of, not the whole
// file: a `url:"..."` in Workbox's own runtime code outside that array must
// not count as something precached, or a genuinely missing file could hide
// behind an unrelated match. (No such match exists in the current build:
// checked by comparing this scoped scan against a whole-file one.)
const precached = new Set([...manifestSource.matchAll(URL_ENTRY)].map(m => m[1]))

// Not assets: the worker itself, and the files Workbox writes beside it.
const IGNORED = /^(sw\.js|workbox-[^/]+\.js|registerSW\.js|sw\.js\.map|workbox-[^/]+\.js\.map)$/

const emitted = walk(DIST).filter(f => !IGNORED.test(f))
const missing = emitted.filter(f => !precached.has(f))

console.log(`emitted ${emitted.length} files, precached ${precached.size}`)

if (precached.size === 0) {
  if (arrayIsEmpty) {
    console.error(
      'The precache manifest array is empty. globPatterns in vite.config.ts matched nothing.\n' +
        'Fix workbox.globPatterns there.'
    )
  } else {
    console.error(
      'The precache manifest has content but the parser in scripts/verify-offline.mjs found\n' +
        'zero entries in it. The service worker format changed (a plugin upgrade is the usual\n' +
        'cause). Fix the URL_ENTRY regex in scripts/verify-offline.mjs, not vite.config.ts.'
    )
  }
  process.exit(1)
}

if (missing.length > 0) {
  console.error('These files would be missing with no internet:')
  for (const f of missing) console.error(`  ${f}`)
  console.error('\nAdd their extension to workbox.globPatterns in vite.config.ts.')
  process.exit(1)
}

// A font that escapes the manifest is the failure this was written for, and
// it escapes quietly because every other asset is still there.
const fonts = emitted.filter(f => f.endsWith('.woff2'))
if (fonts.length === 0) {
  console.error('No woff2 in the build at all. The fonts are self hosted; something is wrong.')
  process.exit(1)
}

console.log(`offline check passed, including ${fonts.length} fonts`)
