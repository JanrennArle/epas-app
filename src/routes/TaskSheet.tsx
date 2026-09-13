import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { getTask } from '../content/tasks'
import { setTaskProgress, taskProgress } from '../lib/store'
import type { CSSProperties } from 'react'

const label: CSSProperties = {
  fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase',
  color: 'var(--ink-3)', margin: '0 0 8px',
}

export default function TaskSheet() {
  const { taskId = '' } = useParams()
  const task = getTask(taskId)
  const [progress, setProgress] = useState(() => taskProgress(taskId))

  if (!task) {
    return <p style={{ fontSize: 15, color: 'var(--ink-3)' }}>That task sheet does not exist.</p>
  }

  const total = task.rubric.reduce((n, r) => n + r.points, 0)

  function toggle(i: number) {
    const checked = progress.checked.includes(i)
      ? progress.checked.filter(n => n !== i)
      : [...progress.checked, i]
    const next = { ...progress, checked }
    setProgress(next)
    setTaskProgress(taskId, next)
  }

  function note(text: string) {
    setProgress(p => ({ ...p, notes: text }))
  }

  // Typed text is written a short moment after typing stops. Writing on every
  // keystroke serialises the whole store per character, which on the low end
  // Android phones these students use shows as typing lag; writing only when
  // the field is left loses text whenever the page goes without a focus change
  // first, which is what the back button, a closed tab and the phone
  // backgrounding the app all do. This is the same conclusion the evaluation
  // survey reached, for the same reason.
  useEffect(() => {
    const t = setTimeout(() => setTaskProgress(taskId, progress), 600)
    return () => clearTimeout(t)
  }, [progress, taskId])

  const latest = useRef(progress)
  latest.current = progress
  useEffect(() => () => { setTaskProgress(taskId, latest.current) }, [taskId])

  return (
    <div style={{ maxWidth: '62ch' }}>
      <p style={label}>{task.kind === 'group' ? 'Group task' : 'Individual task'}</p>
      <h1 style={{ fontSize: 22, fontWeight: 680, letterSpacing: '-0.02em', margin: '0 0 10px' }}>
        {task.title}
      </h1>

      <blockquote style={{
        margin: '0 0 18px', padding: '12px 14px', borderRadius: 14,
        background: 'var(--surface)', border: '1px solid var(--line)',
        fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-2)',
      }}>
        {task.brief}
      </blockquote>

      <div role="note" style={{
        background: 'var(--surface)', border: '1px solid var(--line)',
        borderLeft: '3px solid var(--danger)', borderRadius: '0 10px 10px 0',
        padding: '11px 13px', margin: '0 0 20px',
      }}>
        <strong style={{
          display: 'block', fontSize: 11, letterSpacing: '0.06em',
          textTransform: 'uppercase', color: 'var(--danger)', marginBottom: 6,
        }}>Safety</strong>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, lineHeight: 1.55, color: 'var(--ink)' }}>
          {task.safety.map(s => <li key={s} style={{ marginBottom: 5 }}>{s}</li>)}
        </ul>
      </div>

      <h2 style={{ fontSize: 15, fontWeight: 660, margin: '0 0 4px' }}>How you are marked</h2>
      <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--ink-3)', margin: '0 0 10px' }}>
        Your teacher scores this by watching you work. It is here before the steps so you know
        what you are aiming at, out of {total}.
      </p>
      <div style={{ overflowX: 'auto', margin: '0 0 22px' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 13, width: '100%', minWidth: 420 }}>
          <thead>
            <tr>
              {['What is marked', 'What full marks looks like', 'Points'].map(h => (
                <th key={h} style={{ ...label, textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid var(--line)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {task.rubric.map(r => (
              <tr key={r.criterion}>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--line)', color: 'var(--ink)', fontWeight: 600 }}>{r.criterion}</td>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--line)', color: 'var(--ink-2)', lineHeight: 1.5 }}>{r.descriptor}</td>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--line)', fontVariantNumeric: 'tabular-nums' }}>{r.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 style={{ fontSize: 15, fontWeight: 660, margin: '0 0 4px' }}>Steps</h2>
      <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--ink-3)', margin: '0 0 10px' }}>
        Tick these as you go. They are your own record of what you did; your teacher marks
        the work itself, not the ticks.
      </p>
      <ol style={{ listStyle: 'none', padding: 0, margin: '0 0 22px' }}>
        {task.steps.map((s, i) => (
          <li key={s}>
            <label style={{
              display: 'flex', gap: 10, alignItems: 'flex-start', minHeight: 44,
              padding: '8px 10px', borderRadius: 10, cursor: 'pointer',
              fontSize: 13.5, lineHeight: 1.55,
              color: progress.checked.includes(i) ? 'var(--ink-3)' : 'var(--ink-2)',
            }}>
              <input type="checkbox" checked={progress.checked.includes(i)}
                onChange={() => toggle(i)}
                style={{ marginTop: 3, accentColor: 'var(--accent)' }} />
              <span><strong style={{ color: 'var(--ink-3)' }}>{i + 1}.</strong> {s}</span>
            </label>
          </li>
        ))}
      </ol>

      <h2 style={{ fontSize: 15, fontWeight: 660, margin: '0 0 6px' }}>Your notes</h2>
      <textarea
        value={progress.notes ?? ''}
        onChange={e => note(e.target.value)}
        rows={5}
        placeholder="What you measured, what you found, what you changed"
        style={{
          width: '100%', padding: '10px 12px', borderRadius: 10,
          border: '1px solid var(--line)', background: 'var(--surface)',
          font: 'inherit', fontSize: 13.5, lineHeight: 1.5, color: 'var(--ink)',
          margin: '0 0 18px', resize: 'vertical',
        }} />

      <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--ink-3)', margin: 0 }}>
        Saved on this device as you go. It reaches your teacher when you hand in from{' '}
        <Link to="/progress" style={{ color: 'var(--accent)' }}>Progress</Link>.
      </p>
    </div>
  )
}
