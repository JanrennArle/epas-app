import { Link } from 'react-router'
import { allModules } from '../content'
import { competencyGains } from '../lib/assess'
import { csvHeader, csvRow, toBundle } from '../lib/export'
import { attemptsFor, hasTaken, loadState } from '../lib/store'
import { downloadCsv, downloadJson } from '../ui/download'
import { SURVEY } from '../content/survey'
import type { CSSProperties } from 'react'

const label: CSSProperties = {
  fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)',
}

export default function Progress() {
  const state = loadState()
  const modules = allModules()
  const code = state.participant.code
  const answeredCount = SURVEY.filter(i => typeof state.survey?.[i.id] === 'number').length
  const surveyDone = answeredCount === SURVEY.length && typeof state.survey?.respondent === 'string'

  return (
    <div style={{ maxWidth: '70ch' }}>
      <h1 style={{ fontSize: 22, fontWeight: 680, letterSpacing: '-0.02em', margin: '0 0 2px' }}>
        Progress
      </h1>
      <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: '0 0 18px' }}>
        Working as <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink)' }}>{code}</strong>
      </p>

      <div style={{ overflowX: 'auto', margin: '0 0 22px' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 13, width: '100%', minWidth: 460 }}>
          <thead>
            <tr>
              {['Module', 'Lessons done', 'Pre-test', 'Post-test', 'Competencies gained'].map(h => (
                <th key={h} style={{ ...label, textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid var(--line)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {modules.map(m => {
              const done = state.modules[m.id]?.completedOutcomes.length ?? 0
              const pre = hasTaken(m.id, 'pretest')
              const post = hasTaken(m.id, 'posttest')
              const gains = competencyGains(attemptsFor(m.id, 'pretest'), attemptsFor(m.id, 'posttest'))
              const gained = gains.filter(g => g.gained).length
              const measured = gains.filter(g => g.ordered && g.pre !== null && g.post !== null).length
              return (
                <tr key={m.id}>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--line)' }}>
                    <Link to={`/m/${m.id}`} style={{ color: 'var(--ink)', textDecoration: 'none' }}>{m.title}</Link>
                  </td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--line)', fontVariantNumeric: 'tabular-nums' }}>
                    {done} of {m.outcomes.length}
                  </td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--line)', color: pre ? 'var(--pass)' : 'var(--ink-3)' }}>
                    {pre ? 'Taken' : 'Not yet'}
                  </td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--line)', color: post ? 'var(--pass)' : 'var(--ink-3)' }}>
                    {post ? 'Taken' : 'Not yet'}
                  </td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--line)', fontVariantNumeric: 'tabular-nums' }}>
                    {measured > 0 ? `${gained} of ${measured}` : ''}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <h2 style={{ fontSize: 15, fontWeight: 660, margin: '0 0 6px' }}>Hand your results in</h2>
      <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-2)', margin: '0 0 4px' }}>
        Nothing has left this device. Saving a file is how your work reaches your teacher.
        Send them the JSON file; it holds everything. The CSV is the same results as one
        row of a table, for you to keep.
      </p>
      {!surveyDone && (
        <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--ink-3)', margin: '0 0 4px' }}>
          You have answered {answeredCount} of {SURVEY.length} statements in the{' '}
          <Link to="/evaluate" style={{ color: 'var(--accent)' }}>evaluation survey</Link>.
          You can still hand in, but the unanswered ones will be blank.
        </p>
      )}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '14px 0 0' }}>
        <button onClick={() => downloadJson(`epas-${code}.json`, toBundle(state))} className="tile" style={{
          minHeight: 44, padding: '11px 18px', borderRadius: 10, border: 0,
          background: 'var(--accent)', color: 'var(--on-accent)',
          font: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}>
          Save my results for my teacher
        </button>
        <button onClick={() => downloadCsv(`epas-${code}.csv`, [csvHeader(), csvRow(state)])} className="tile" style={{
          minHeight: 44, padding: '11px 18px', borderRadius: 10,
          border: '1px solid var(--line)', background: 'var(--surface)',
          color: 'var(--ink)', font: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}>
          Save a spreadsheet copy
        </button>
      </div>
    </div>
  )
}
