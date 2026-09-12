import { useState } from 'react'
import { Link } from 'react-router'
import { LIKERT, SURVEY, SURVEY_CATEGORIES } from '../content/survey'
import { setSurvey, surveyAnswers } from '../lib/store'
import type { RespondentType } from '../lib/types'

const RESPONDENTS: { value: RespondentType; label: string }[] = [
  { value: 'student', label: 'Student' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'expert', label: 'Expert validator' },
]

export default function Evaluate() {
  const [answers, setAnswers] = useState<Record<string, number | string>>(() => surveyAnswers())
  const [saved, setSaved] = useState(false)

  const answered = SURVEY.filter(i => typeof answers[i.id] === 'number').length
  const ready = answered === SURVEY.length && typeof answers.respondent === 'string'

  function set(key: string, value: number | string) {
    setSaved(false)
    setAnswers(a => ({ ...a, [key]: value }))
  }

  function save() {
    setSurvey(answers)
    setSaved(true)
  }

  return (
    <div style={{ maxWidth: '60ch' }}>
      <h1 style={{ fontSize: 22, fontWeight: 680, letterSpacing: '-0.02em', margin: '0 0 6px' }}>
        Evaluate this app
      </h1>
      <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--ink-2)', margin: '0 0 4px' }}>
        Twenty statements about the app itself, not about what you learned. Say how far you
        agree with each one. Your answers stay on this device until you export them.
      </p>
      <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: '0 0 18px' }}>
        {answered} of {SURVEY.length} answered
      </p>

      <fieldset style={{
        border: '1px solid var(--line)', borderRadius: 14, padding: 16,
        margin: '0 0 16px', background: 'var(--surface)',
      }}>
        <legend style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)', padding: '0 6px' }}>
          Answering as
        </legend>
        {RESPONDENTS.map(r => (
          <label key={r.value} style={{
            display: 'flex', gap: 9, alignItems: 'center', minHeight: 44,
            padding: '4px 6px', borderRadius: 10, cursor: 'pointer',
            fontSize: 13.5, color: 'var(--ink-2)',
          }}>
            <input type="radio" name="respondent"
              checked={answers.respondent === r.value}
              onChange={() => set('respondent', r.value)}
              style={{ accentColor: 'var(--accent)' }} />
            <span>{r.label}</span>
          </label>
        ))}
      </fieldset>

      {SURVEY_CATEGORIES.map(category => (
        <section key={category} style={{ margin: '0 0 16px' }}>
          <h2 style={{
            fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase',
            color: 'var(--ink-3)', margin: '0 0 8px',
          }}>{category}</h2>

          {SURVEY.filter(i => i.category === category).map(item => (
            <fieldset key={item.id} style={{
              border: '1px solid var(--line)', borderRadius: 14, padding: 14,
              margin: '0 0 10px', background: 'var(--surface)',
            }}>
              <legend style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.5, padding: '0 6px', color: 'var(--ink)' }}>
                {item.text}
              </legend>
              {LIKERT.map((label, n) => (
                <label key={label} style={{
                  display: 'flex', gap: 9, alignItems: 'center', minHeight: 44,
                  padding: '4px 6px', borderRadius: 10, cursor: 'pointer',
                  fontSize: 13.5, color: 'var(--ink-2)',
                }}>
                  <input type="radio" name={item.id}
                    checked={answers[item.id] === n + 1}
                    onChange={() => set(item.id, n + 1)}
                    style={{ accentColor: 'var(--accent)' }} />
                  <span>{label}</span>
                </label>
              ))}
            </fieldset>
          ))}
        </section>
      ))}

      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, margin: '0 0 6px', color: 'var(--ink)' }}>
        Anything else you want to say (optional)
      </label>
      <textarea
        value={typeof answers.comments === 'string' ? answers.comments : ''}
        onChange={e => set('comments', e.target.value)}
        rows={4}
        style={{
          width: '100%', padding: '10px 12px', borderRadius: 10,
          border: '1px solid var(--line)', background: 'var(--surface)',
          font: 'inherit', fontSize: 13.5, lineHeight: 1.5, color: 'var(--ink)',
          margin: '0 0 18px', resize: 'vertical',
        }} />

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={save} disabled={!ready} className="tile" style={{
          minHeight: 44, padding: '11px 18px', borderRadius: 10, border: 0,
          background: ready ? 'var(--accent)' : 'var(--line)',
          color: ready ? 'var(--on-accent)' : 'var(--ink-3)',
          font: 'inherit', fontSize: 14, fontWeight: 600,
          cursor: ready ? 'pointer' : 'default',
        }}>
          {ready ? 'Save my answers' : 'Answer every statement to save'}
        </button>
        {saved && (
          <span role="status" style={{ fontSize: 13, color: 'var(--pass)' }}>
            Saved on this device.
          </span>
        )}
      </div>

      <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--ink-3)', margin: '18px 0 0' }}>
        Your answers go to your teacher only when you hand them in from{' '}
        <Link to="/progress" style={{ color: 'var(--accent)' }}>Progress</Link>.
      </p>
    </div>
  )
}
