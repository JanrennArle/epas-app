import { toCsv } from '../lib/export'
import type { Cell } from '../lib/export'

function save(filename: string, text: string, mime: string): void {
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
  save(filename, '\uFEFF' + toCsv(rows), 'text/csv;charset=utf-8')
}

export function downloadJson(filename: string, value: unknown): void {
  save(filename, JSON.stringify(value, null, 2), 'application/json')
}
