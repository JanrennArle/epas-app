// Folds the `--mode file` build into ONE html file a student can double-click
// on a school computer with no internet and no install.
//
// Why a single file rather than the dist folder: a browser opening a page
// from the filesystem refuses to load a separate module script from beside
// it. The page has an opaque origin, and a `type="module"` script is always
// fetched in CORS mode, so the student gets a blank white page. An INLINE
// script is never fetched, so it runs. The same goes for the stylesheet, and
// the fonts are already data URIs inside it (vite.config.ts sets
// assetsInlineLimit for this mode), so the typeface travels with the file.
//
// Run through `npm run build:file`, which builds first.
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = join(ROOT, 'dist-file')
const OUT_DIR = join(ROOT, 'release')
const OUT = join(OUT_DIR, 'EPAS-Grade-12.html')

function fail(message) {
  console.error(`make-single-file: ${message}`)
  process.exit(1)
}

let html
try {
  html = readFileSync(join(DIST, 'index.html'), 'utf8')
} catch {
  fail('no dist-file/index.html. Run `npm run build:file`, which builds first.')
}

const scripts = [...html.matchAll(/<script type="module" crossorigin src="\.\/(assets\/[^"]+\.js)"><\/script>/g)]
const styles = [...html.matchAll(/<link rel="stylesheet" crossorigin href="\.\/(assets\/[^"]+\.css)">/g)]

// Exactly one of each, or the build produced chunks this script does not
// know how to order, and inlining some of them would ship a broken app that
// looks complete.
if (scripts.length !== 1) fail(`expected exactly one module script in index.html, found ${scripts.length}`)
if (styles.length !== 1) fail(`expected exactly one stylesheet in index.html, found ${styles.length}`)

const assets = readdirSync(join(DIST, 'assets'))
if (assets.length !== 2) {
  fail(`expected dist-file/assets to hold one .js and one .css, found: ${assets.join(', ')}`)
}

const js = readFileSync(join(DIST, scripts[0][1]), 'utf8')
const css = readFileSync(join(DIST, styles[0][1]), 'utf8')

// A literal closing tag inside the code would end the element early. The
// build emits none today; escaping keeps it that way if a dependency changes.
const safeJs = js.replace(/<\/script/gi, '<\\/script')
const safeCss = css.replace(/<\/style/gi, '<\\/style')

const icon = readFileSync(join(ROOT, 'public', 'icon-192.png')).toString('base64')

// Function replacers throughout, never replacement strings. Minified code is
// full of `$&` and `$1`, which a replacement string would interpret as
// back-references and silently corrupt.
let out = html
  .replace(scripts[0][0], () => `<script type="module">${safeJs}</script>`)
  .replace(styles[0][0], () => `<style>${safeCss}</style>`)
  // Only an installed PWA uses the Apple icon, and it would point at a file
  // that does not exist beside this one.
  .replace(/\s*<link rel="apple-touch-icon"[^>]*>/, () => '')
  .replace(/<link rel="icon" href="[^"]*"/, () => `<link rel="icon" href="data:image/png;base64,${icon}"`)

// The whole point is that nothing is fetched. Fail rather than ship a file
// that works on this machine because the dist folder happens to sit beside it.
//
// Scanned on the page with the inlined bodies taken out, not on the whole
// output. Minified React builds HTML strings such as `href="'+o+'"`, and
// scanning the code itself flagged those as outside files on the first run.
// The closing tags inside both bodies were escaped above, so the first real
// `</script>` and `</style>` are the ones that close them.
const shell = out
  .replace(/<script type="module">[\s\S]*?<\/script>/, () => '<script></script>')
  .replace(/<style>[\s\S]*?<\/style>/, () => '<style></style>')
const leftovers = [...shell.matchAll(/(?:src|href)="(?!data:)([^"#]+)"/g)].map(m => m[1])
if (leftovers.length > 0) fail(`the file still references outside files: ${leftovers.join(', ')}`)
if (/serviceWorker\.register/.test(js)) fail('the bundle contains a service worker registration; it cannot run from a file and must not be there')

mkdirSync(OUT_DIR, { recursive: true })
writeFileSync(OUT, out)
const kb = Math.round(statSync(OUT).size / 1024)
console.log(`wrote ${OUT}  ${kb} KB`)
