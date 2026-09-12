import { useState } from 'react'
import { codebookRows, csvHeader, csvRow, parseBundle } from '../lib/export'
import { setTeacherPin, teacherPin } from '../lib/store'
import { downloadCsv } from '../ui/download'
import type { StoreV1 } from '../lib/store'
import type { CSSProperties } from 'react'

interface Loaded {
  file: string
  code: string
  state: StoreV1
  included: boolean
  why?: string
}

interface Rejected {
  file: string
  reason: string
}

const note: CSSProperties = {
  fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-2)', margin: '0 0 4px',
}

export default function Teacher() {
  const [unlocked, setUnlocked] = useState(false)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [loaded, setLoaded] = useState<Loaded[]>([])
  const [rejected, setRejected] = useState<Rejected[]>([])

  function unlock() {
    const stored = teacherPin()
    if (stored === undefined) {
      if (pin.length < 4) { setPinError('Choose at least four characters.'); return }
      setTeacherPin(pin)
      setUnlocked(true)
      return
    }
    if (pin === stored) { setUnlocked(true); setPinError('') }
    else setPinError('That does not match the PIN set on this device.')
  }

  async function take(files: FileList | null) {
    if (!files) return
    const ok: Loaded[] = []
    const bad: Rejected[] = []
    for (const file of Array.from(files)) {
      const result = parseBundle(await file.text())
      if (!result.ok) { bad.push({ file: file.name, reason: result.reason }); continue }
      const state = result.bundle.state
      const research = state.participant.research
      ok.push({
        file: file.name,
        code: state.participant.code,
        state,
        included: research === true,
        why: research === false
          ? 'This student chose not to take part in the study'
          : research === undefined
            ? 'This file predates the consent choice, so it is not treated as agreement'
            : undefined,
      })
    }
    setLoaded(ok)
    setRejected(bad)
  }

  const included = loaded.filter(l => l.included)
  const excluded = loaded.filter(l => !l.included)
  const codes = included.map(l => l.code)
  const duplicates = [...new Set(codes.filter((c, i) => codes.indexOf(c) !== i))]

  if (!unlocked) {
    const first = teacherPin() === undefined
    return (
      <div style={{ maxWidth: '48ch' }}>
        <h1 style={{ fontSize: 22, fontWeight: 680, letterSpacing: '-0.02em', margin: '0 0 6px' }}>Teacher tools</h1>
        <p style={note}>
          {first
            ? 'Choose a PIN for this device. It keeps a student who wanders in from seeing this screen. It is not a password and it protects nothing else.'
            : 'Enter the PIN set on this device.'}
        </p>
        <input value={pin} onChange={e => { setPin(e.target.value); setPinError('') }}
          type="password" inputMode="numeric" autoComplete="off"
          style={{
            width: '100%', maxWidth: 220, minHeight: 44, padding: '10px 12px',
            borderRadius: 10, border: '1px solid var(--line)', background: 'var(--surface)',
            font: 'inherit', fontSize: 14, color: 'var(--ink)', margin: '10px 0',
          }} />
        {pinError && <p role="alert" style={{ fontSize: 13, color: 'var(--caution)', margin: '0 0 10px' }}>{pinError}</p>}
        <div>
          <button onClick={unlock} className="tile" style={{
            minHeight: 44, padding: '11px 18px', borderRadius: 10, border: 0,
            background: 'var(--accent)', color: 'var(--on-accent)',
            font: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>{first ? 'Set this PIN' : 'Unlock'}</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '70ch' }}>
      <h1 style={{ fontSize: 22, fontWeight: 680, letterSpacing: '-0.02em', margin: '0 0 6px' }}>Merge a class</h1>
      <p style={note}>
        Select the JSON files your students handed in. Everything happens on this device;
        nothing is uploaded. You get one table with a row per student, and a codebook that
        explains what each column means.
      </p>

      <input type="file" accept="application/json,.json" multiple
        onChange={e => { void take(e.target.files) }}
        style={{ font: 'inherit', fontSize: 13.5, margin: '14px 0 18px', color: 'var(--ink-2)' }} />

      {loaded.length + rejected.length > 0 && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--line)',
          borderRadius: 14, padding: 16, margin: '0 0 18px',
        }}>
          <p style={{ ...note, color: 'var(--ink)', fontWeight: 600 }}>
            {included.length} student{included.length === 1 ? '' : 's'} will be in the table.
          </p>

          {excluded.length > 0 && (
            <>
              <p style={{ ...note, margin: '12px 0 4px', fontWeight: 600 }}>Left out on purpose</p>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, lineHeight: 1.6, color: 'var(--ink-2)' }}>
                {excluded.map(l => (
                  <li key={l.file} style={{ marginBottom: 4 }}>
                    <strong style={{ fontFamily: 'var(--font-mono)' }}>{l.code}</strong> from {l.file}. {l.why}.
                  </li>
                ))}
              </ul>
            </>
          )}

          {duplicates.length > 0 && (
            <p role="alert" style={{ ...note, margin: '12px 0 0', color: 'var(--caution)' }}>
              The same participant code appears more than once: {duplicates.join(', ')}. That is
              usually one student handing in twice, or two students who were never given separate
              codes on a shared machine. Check before you analyse.
            </p>
          )}

          {rejected.length > 0 && (
            <>
              <p style={{ ...note, margin: '12px 0 4px', fontWeight: 600 }}>Could not be read</p>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, lineHeight: 1.6, color: 'var(--ink-2)' }}>
                {rejected.map(r => <li key={r.file} style={{ marginBottom: 4 }}>{r.file}. {r.reason}</li>)}
              </ul>
            </>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          onClick={() => downloadCsv('epas-class.csv', [csvHeader(), ...included.map(l => csvRow(l.state))])}
          disabled={included.length === 0}
          className="tile"
          style={{
            minHeight: 44, padding: '11px 18px', borderRadius: 10, border: 0,
            background: included.length ? 'var(--accent)' : 'var(--line)',
            color: included.length ? 'var(--on-accent)' : 'var(--ink-3)',
            font: 'inherit', fontSize: 14, fontWeight: 600,
            cursor: included.length ? 'pointer' : 'default',
          }}>
          Save the class table
        </button>
        <button onClick={() => downloadCsv('epas-codebook.csv', codebookRows())} className="tile" style={{
          minHeight: 44, padding: '11px 18px', borderRadius: 10,
          border: '1px solid var(--line)', background: 'var(--surface)',
          color: 'var(--ink)', font: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}>
          Save the codebook
        </button>
      </div>
    </div>
  )
}
