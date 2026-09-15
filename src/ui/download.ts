import { toCsv } from '../lib/export'
import type { Cell } from '../lib/export'

/**
 * Every export in the app, the student's results and the teacher's class
 * table alike, leaves through here, so this is the one place that has to know
 * which kind of app is running.
 *
 * In a browser, and in the single HTML file school computers use, a hidden
 * `<a download>` link saves the file. Inside the Android app it does nothing
 * at all: an app's WebView ignores download links. Left alone, "Save my
 * results for my teacher" would be a button that silently fails on every
 * phone, and a phone's results would never reach the teacher. So the APK
 * build writes the file with Capacitor and opens Android's share sheet,
 * which offers Bluetooth, Xender, Files and anything else installed.
 *
 * The native code is loaded only when `import.meta.env.MODE` is 'apk', which
 * Vite replaces with a constant at build time. In every other build the
 * branch is dead, and the Capacitor plugins never reach the bundle.
 */
function save(filename: string, text: string, mime: string): void {
  if (import.meta.env.MODE === 'apk') {
    void import('./download-native').then(m => m.saveNative(filename, text))
    return
  }
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/**
 * The leading byte order mark is deliberate. Excel opens a UTF-8 CSV as the
 * local codepage without it, which mangles any accented character in a
 * student's name or comment, and the teacher has no way to tell that
 * happened from looking at the file.
 */
export function downloadCsv(filename: string, rows: Cell[][]): void {
  save(filename, '﻿' + toCsv(rows), 'text/csv;charset=utf-8')
}

export function downloadJson(filename: string, value: unknown): void {
  save(filename, JSON.stringify(value, null, 2), 'application/json')
}
