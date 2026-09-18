import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { Warning } from '@phosphor-icons/react'
import { getTask } from '../content/tasks'
import { setTaskProgress, taskProgress } from '../lib/store'
import type { PerformanceTask } from '../lib/types'
import { Tape } from '../ui/board/Tape'

/**
 * Resolving the task is all this does. The sheet below is keyed on the task
 * id, so moving from one sheet to the next mounts a fresh one rather than
 * reusing the old one's state: the router keeps a component alive when only
 * the params change, and without the key t1's ticks and notes would appear on
 * t2 and then be written under t2. The same defect shipped on the assessment
 * route and is fixed there the same way.
 *
 * The split also keeps every hook out of the component that can return early.
 * Hooks called past a conditional return break the rules of hooks; the
 * valid-to-unknown transition was expected to throw "Rendered fewer hooks
 * than expected" and does not, neither in the browser nor in jsdom on React
 * 19, so the reason to keep them out is the rule rather than a crash anyone
 * has seen. `tests/task-sheet.test.tsx` holds the transition either way.
 */
export default function TaskSheet() {
  const { taskId = '' } = useParams()
  const task = getTask(taskId)

  if (!task) {
    return <p style={{ fontSize: 15, color: 'var(--ink-3)' }}>That task sheet does not exist.</p>
  }

  return <Sheet key={task.id} task={task} />
}

function Sheet({ task }: { task: PerformanceTask }) {
  const [progress, setProgress] = useState(() => taskProgress(task.id))

  // Opening a sheet and reading it is not progress. Nothing is written until
  // the student ticks a step or types a note, so a sheet that was only looked
  // at leaves no record at all. The export reports 0 of n either way, which is
  // the deliberate choice made when those columns were added; what this buys
  // is that `state.tasks` holds only sheets the student actually worked on,
  // so the JSON a teacher collects says which sheets were opened in earnest.
  // Nothing reads the stored `at` yet.
  const touched = useRef(false)

  const total = task.rubric.reduce((n, r) => n + r.points, 0)

  function toggle(i: number) {
    const checked = progress.checked.includes(i)
      ? progress.checked.filter(n => n !== i)
      : [...progress.checked, i]
    const next = { ...progress, checked }
    touched.current = true
    setProgress(next)
    setTaskProgress(task.id, next)
  }

  function note(text: string) {
    touched.current = true
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
    if (!touched.current) return
    const t = setTimeout(() => setTaskProgress(task.id, progress), 600)
    return () => clearTimeout(t)
  }, [progress, task.id])

  const latest = useRef(progress)
  latest.current = progress
  useEffect(() => () => {
    if (touched.current) setTaskProgress(task.id, latest.current)
  }, [task.id])

  return (
    <div style={{ maxWidth: '62ch' }}>
      <p className="label" style={{ margin: '0 0 8px' }}>{task.kind === 'group' ? 'Group task' : 'Individual task'}</p>
      <Tape as="h1">{task.title}</Tape>

      <blockquote className="sign" style={{
        margin: '18px 0 18px', fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-2)',
      }}>
        {task.brief}
      </blockquote>

      <div role="note" className="callout callout--safety">
        <strong><Warning weight="bold" aria-hidden />Safety</strong>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, lineHeight: 1.55, color: 'var(--ink)' }}>
          {task.safety.map(s => <li key={s} style={{ marginBottom: 5 }}>{s}</li>)}
        </ul>
      </div>

      <Tape as="h2" size="section">How you are marked</Tape>
      <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--ink-3)', margin: '10px 0 10px' }}>
        Your teacher scores this by watching you work. It is here before the steps so you know
        what you are aiming at, out of {total}.
      </p>
      <div style={{ overflowX: 'auto', margin: '0 0 22px' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 13, width: '100%', minWidth: 420 }}>
          <thead>
            <tr>
              {['What is marked', 'What full marks looks like', 'Points'].map(h => (
                <th key={h} className="label" style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid var(--line)' }}>{h}</th>
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

      <Tape as="h2" size="section">Steps</Tape>
      <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--ink-3)', margin: '10px 0 10px' }}>
        Tick these as you go. They are your own record of what you did; your teacher marks
        the work itself, not the ticks.
      </p>
      <ol style={{ listStyle: 'none', padding: 0, margin: '0 0 22px' }}>
        {task.steps.map((s, i) => (
          <li key={s}>
            <label style={{
              display: 'flex', gap: 10, alignItems: 'flex-start', minHeight: 44,
              padding: '8px 10px', borderRadius: 3, cursor: 'pointer',
              fontSize: 13.5, lineHeight: 1.55,
              color: progress.checked.includes(i) ? 'var(--ink-3)' : 'var(--ink-2)',
            }}>
              <input type="checkbox" checked={progress.checked.includes(i)}
                onChange={() => toggle(i)}
                style={{ marginTop: 3, accentColor: 'var(--chrome)' }} />
              <span><strong style={{ color: 'var(--ink-3)' }}>{i + 1}.</strong> {s}</span>
            </label>
          </li>
        ))}
      </ol>

      <Tape as="h2" size="section">Your notes</Tape>
      <textarea
        value={progress.notes ?? ''}
        onChange={e => note(e.target.value)}
        rows={5}
        placeholder="What you measured, what you found, what you changed"
        style={{
          width: '100%', padding: '10px 12px', borderRadius: 3,
          border: '2px solid var(--line)', background: 'var(--surface)',
          font: 'inherit', fontSize: 13.5, lineHeight: 1.5, color: 'var(--ink)',
          margin: '10px 0 18px', resize: 'vertical',
        }} />

      <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--ink-3)', margin: 0 }}>
        Saved on this device as you go. It reaches your teacher when you hand in from{' '}
        <Link to="/progress" style={{ color: 'var(--chrome)', textDecoration: 'underline' }}>Progress</Link>.
      </p>
    </div>
  )
}
