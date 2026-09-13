import { useMemo, useRef, useState } from 'react'
import { classTable, codebookRows, parseBundle, rubricRows } from '../lib/export'
import { setTeacherPin, teacherPin } from '../lib/store'
import { addLoaded, excludedStudents, groupByStudent, includedStudents, markingList, whyLeftOut } from '../lib/merge'
import type { LoadedFile, StudentGroup } from '../lib/merge'
import { downloadCsv } from '../ui/download'
import type { CSSProperties } from 'react'

interface Rejected {
  file: string
  reason: string
}

const note: CSSProperties = {
  fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-2)', margin: '0 0 4px',
}

/** What `classTable` needs from a merged student, and nothing more. */
function forExport(g: StudentGroup) {
  return {
    code: g.code,
    state: g.newest.state,
    from: {
      inStudy: 'yes',
      exportedAt: g.newest.exportedAt,
      filesFromStudent: g.files.length,
    },
  }
}

export default function Teacher() {
  const [unlocked, setUnlocked] = useState(false)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [loaded, setLoaded] = useState<LoadedFile[]>([])
  const [rejected, setRejected] = useState<Rejected[]>([])
  // Students whose file was read and accepted but could not be turned into a
  // row. Kept in state so the teacher is told on screen; a table that
  // silently replaced a student with blanks would be found in the analysis,
  // months later, by someone who could no longer ask them to hand in again.
  const [unreadable, setUnreadable] = useState<string[]>([])

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
    if (!files || files.length === 0) return
    const ok: LoadedFile[] = []
    const bad: Rejected[] = []
    for (const file of Array.from(files)) {
      let text: string
      try {
        text = await file.text()
      } catch {
        bad.push({ file: file.name, reason: 'This file could not be read from the disk.' })
        continue
      }
      const result = parseBundle(text)
      if (!result.ok) { bad.push({ file: file.name, reason: result.reason }); continue }
      const state = result.bundle.state
      ok.push({
        file: file.name,
        code: state.participant.code,
        state,
        research: state.participant.research,
        exportedAt: result.bundle.exportedAt,
      })
    }
    const failedNames = bad.map(b => b.file)
    setLoaded(prev => addLoaded(prev, ok))
    setRejected(prev => [
      ...prev.filter(p => !failedNames.includes(p.file) && !ok.some(o => o.file === p.file)),
      ...bad,
    ])
  }

  const fileInput = useRef<HTMLInputElement>(null)

  function clearAll() {
    setLoaded([])
    setRejected([])
    // Or the gaps panel keeps naming students from the class that just left.
    setUnreadable([])
    // Otherwise the browser keeps showing "3 files" beside an empty screen.
    if (fileInput.current) fileInput.current.value = ''
  }

  const groups = useMemo(() => groupByStudent(loaded), [loaded])
  const included = includedStudents(groups)
  const excluded = excludedStudents(groups)
  // Who the blank marking grid covers is a consent question, so merge.ts
  // decides it, next to the filter the class table uses.
  const marking = markingList(groups)
  const repeated = groups.filter(g => g.files.length > 1)

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
        nothing is uploaded. You can select more than once if your files sit in different
        folders. You get one table with a row per student, and a codebook that explains
        what each column means.
      </p>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', margin: '14px 0 18px' }}>
        <input ref={fileInput} type="file" accept="application/json,.json" multiple
          onChange={e => { void take(e.target.files) }}
          style={{ font: 'inherit', fontSize: 13.5, color: 'var(--ink-2)' }} />
        {loaded.length + rejected.length > 0 && (
          <button onClick={clearAll} style={{
            background: 'none', border: 0, padding: 0, font: 'inherit', fontSize: 13,
            color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline',
          }}>Start again</button>
        )}
      </div>

      {loaded.length + rejected.length > 0 && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--line)',
          borderRadius: 14, padding: 16, margin: '0 0 18px',
        }}>
          <p style={{ ...note, color: 'var(--ink)', fontWeight: 600 }}>
            {included.length} student{included.length === 1 ? '' : 's'} will be in the table,
            from {loaded.length} file{loaded.length === 1 ? '' : 's'}.
          </p>

          {excluded.length > 0 && (
            <>
              <p style={{ ...note, margin: '12px 0 4px', fontWeight: 600 }}>Left out on purpose</p>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, lineHeight: 1.6, color: 'var(--ink-2)' }}>
                {excluded.map(g => (
                  <li key={g.code} style={{ marginBottom: 4 }}>
                    <strong style={{ fontFamily: 'var(--font-mono)' }}>{g.code}</strong> {whyLeftOut(g)}.{' '}
                    <span style={{ color: 'var(--ink-3)' }}>({[...new Set(g.files.map(f => f.file))].join(', ')})</span>
                  </li>
                ))}
              </ul>
            </>
          )}

          {repeated.length > 0 && (
            <p role="alert" style={{ ...note, margin: '12px 0 0', color: 'var(--caution)' }}>
              {repeated.map(g => g.code).join(', ')} appear{repeated.length === 1 ? 's' : ''} in more
              than one file. Where the files agree, the most recent one is used. Check before you
              analyse: this is usually one student handing in twice, or two students who were never
              given separate codes on a shared machine.
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
          onClick={() => {
            const table = classTable(included.map(forExport))
            setUnreadable(table.unreadable)
            downloadCsv('epas-class.csv', table.rows)
          }}
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
        <button
          onClick={() => downloadCsv('epas-rubric-sheet.csv', rubricRows(marking))}
          disabled={marking.length === 0}
          className="tile"
          style={{
            minHeight: 44, padding: '11px 18px', borderRadius: 10,
            border: '1px solid var(--line)', background: 'var(--surface)',
            color: marking.length ? 'var(--ink)' : 'var(--ink-3)',
            font: 'inherit', fontSize: 14, fontWeight: 600,
            cursor: marking.length ? 'pointer' : 'default',
          }}>
          Save the rubric scoring sheet
        </button>
      </div>

      {marking.length > 0 && (
        <p style={{ ...note, marginTop: 12, color: 'var(--ink-3)', fontSize: 12.5 }}>
          The class table holds the {included.length === 1 ? 'one student' : `${included.length} students`} who
          agreed to take part. The rubric scoring sheet is a blank marking grid and covers
          all {marking.length}, because a student who declined the study is still a student
          whose performance tasks you mark.
        </p>
      )}

      {unreadable.length > 0 && (
        <div role="status" style={{
          fontSize: 13, lineHeight: 1.6, color: 'var(--ink-2)', marginTop: 14,
          background: 'var(--surface)', border: '1px solid var(--line)',
          borderLeft: '3px solid var(--caution)', borderRadius: '0 10px 10px 0',
          padding: '11px 13px',
        }}>
          <strong style={{
            display: 'block', fontSize: 11, letterSpacing: '0.06em',
            textTransform: 'uppercase', color: 'var(--caution)', marginBottom: 6,
          }}>Saved, with gaps</strong>
          <p style={{ margin: '0 0 6px' }}>
            The table saved, but {unreadable.length === 1 ? 'one student' : `${unreadable.length} students`} could
            not be read into a row. Those rows carry the code and nothing else, so the table is
            still usable. Ask them to export and hand in again.
          </p>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {unreadable.map(code => <li key={code} style={{ marginBottom: 2 }}>{code}</li>)}
          </ul>
        </div>
      )}
    </div>
  )
}
