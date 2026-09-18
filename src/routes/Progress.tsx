import { Link } from 'react-router'
import { allModules } from '../content'
import { competencyGains } from '../lib/assess'
import { csvHeader, csvRow, toBundle } from '../lib/export'
import { attemptsFor, hasTaken, inStudy, loadState } from '../lib/store'
import { downloadCsv, downloadJson } from '../ui/download'
import { SURVEY } from '../content/survey'
import { Tape } from '../ui/board/Tape'
import { PlateButton } from '../ui/board/Plate'

export default function Progress() {
  const state = loadState()
  const modules = allModules()
  const code = state.participant.code
  const answeredCount = SURVEY.filter(i => typeof state.survey?.[i.id] === 'number').length
  const surveyDone = answeredCount === SURVEY.length && typeof state.survey?.respondent === 'string'

  return (
    <>
      <Tape as="h1">Progress</Tape>
      <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: '10px 0 18px' }}>
        Working as <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink)' }}>{code}</strong>
      </p>

      {/* The results table gets the full width the page already has; only the
          prose below is kept to a reading measure. */}
      <div style={{ overflowX: 'auto', margin: '0 0 22px' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 13, width: '100%', minWidth: 460 }}>
          <thead>
            <tr>
              {['Module', 'Lessons done', 'Pre-test', 'Post-test', 'Competencies gained'].map(h => (
                <th key={h} className="label" style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid var(--line)' }}>
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

      <div style={{ maxWidth: '62ch' }}>
        <Tape as="h2" size="section">Hand your results in</Tape>
        {!inStudy() && (
          <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--ink-3)', margin: '10px 0 4px' }}>
            You chose not to take part in the study. Your teacher can still see your work, and
            it stays out of anything they report. Handing in is your choice either way.
          </p>
        )}
        <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-2)', margin: inStudy() ? '10px 0 4px' : '0 0 4px' }}>
          Nothing has left this device. Saving a file is how your work reaches your teacher.
          Send them the JSON file; it holds everything. The CSV is the same results as one
          row of a table, for you to keep.
        </p>
        {!surveyDone && (
          <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--ink-3)', margin: '0 0 4px' }}>
            You have answered {answeredCount} of {SURVEY.length} statements in the{' '}
            <Link to="/evaluate" style={{ color: 'var(--chrome)' }}>evaluation survey</Link>.
            You can still hand in, but the unanswered ones will be blank.
          </p>
        )}

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '14px 0 0' }}>
          <PlateButton onClick={() => downloadCsv(`epas-${code}.csv`, [csvHeader(), csvRow(state, { exportedAt: new Date().toISOString(), filesFromStudent: 1 })])}>
            Save a spreadsheet copy
          </PlateButton>
          <PlateButton variant="primary" onClick={() => downloadJson(`epas-${code}.json`, toBundle(state))}>
            Save my results for my teacher
          </PlateButton>
        </div>
      </div>
    </>
  )
}
