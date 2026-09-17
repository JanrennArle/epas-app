import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { LIKERT, SURVEY, SURVEY_CATEGORIES } from '../content/survey'
import { inStudy, setSurvey, surveyAnswers } from '../lib/store'
import type { RespondentType } from '../lib/types'
import { Tape } from '../ui/board/Tape'

const RESPONDENTS: { value: RespondentType; label: string }[] = [
  { value: 'student', label: 'Student' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'expert', label: 'Expert validator' },
]

export default function Evaluate() {
  const [answers, setAnswers] = useState<Record<string, number | string>>(() => surveyAnswers())

  const answered = SURVEY.filter(i => typeof answers[i.id] === 'number').length
  const ready = answered === SURVEY.length && typeof answers.respondent === 'string'

  function set(key: string, value: number | string) {
    const next = { ...answers, [key]: value }
    setAnswers(next)
    setSurvey(next)
  }

  // Typed text is written a short moment after typing stops. Writing on every
  // keystroke would serialise the whole store per character, which on the low
  // end Android phones these students use shows up as typing lag. Writing only
  // when the field is left loses text whenever the page goes without a focus
  // change first, which is what the back button, a closed tab and the phone
  // backgrounding the app all do. A radio click is saved immediately above and
  // this simply rewrites the same record, which is harmless.
  useEffect(() => {
    const t = setTimeout(() => setSurvey(answers), 600)
    return () => clearTimeout(t)
  }, [answers])

  // The debounce above cancels its timer on every change, including the last
  // one before this screen goes away, so text typed and followed by tapping a
  // link inside 600ms was written nowhere. Flush whatever is current on the
  // way out. The ref exists because an unmount effect must not depend on
  // `answers`, or it would run on every keystroke.
  const latest = useRef(answers)
  latest.current = answers
  useEffect(() => () => { setSurvey(latest.current) }, [])

  return (
    <div style={{ maxWidth: '60ch' }}>
      <Tape as="h1">Evaluate this app</Tape>
      <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--ink-2)', margin: '18px 0 4px' }}>
        Twenty statements about the app itself, not about what you learned. Say how far you
        agree with each one. Your answers stay on this device until you export them.
      </p>
      {!inStudy() && (
        <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--ink-3)', margin: '0 0 4px' }}>
          You chose not to take part in the study, so these answers stay on this device and
          will not be in what your teacher reports. You are welcome to answer them anyway.
        </p>
      )}
      <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--ink-3)', margin: '0 0 4px' }}>
        The statements are written from a student's point of view. If you are a teacher or
        an expert validator, answer them as you would for the students who will use this.
      </p>
      <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: '0 0 18px' }}>
        {answered} of {SURVEY.length} answered
      </p>

      <fieldset className="sign" style={{ border: 0, margin: '0 0 16px' }}>
        <legend className="label" style={{ padding: '0 6px' }}>
          Answering as
        </legend>
        {RESPONDENTS.map(r => (
          <label key={r.value} style={{
            display: 'flex', gap: 9, alignItems: 'center', minHeight: 44,
            padding: '4px 6px', borderRadius: 3, cursor: 'pointer',
            fontSize: 13.5, color: 'var(--ink-2)',
          }}>
            <input type="radio" name="respondent"
              checked={answers.respondent === r.value}
              onChange={() => set('respondent', r.value)}
              style={{ accentColor: 'var(--paint)' }} />
            <span>{r.label}</span>
          </label>
        ))}
      </fieldset>

      {SURVEY_CATEGORIES.map(category => (
        <section key={category} style={{ margin: '0 0 16px' }}>
          <h2 className="label" style={{ margin: '0 0 8px' }}>{category}</h2>

          {SURVEY.filter(i => i.category === category).map(item => (
            <fieldset key={item.id} className="sign" style={{ border: 0, margin: '0 0 10px' }}>
              <legend style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.5, padding: '0 6px', color: 'var(--ink)' }}>
                {item.text}
              </legend>
              {LIKERT.map((label, n) => (
                <label key={label} style={{
                  display: 'flex', gap: 9, alignItems: 'center', minHeight: 44,
                  padding: '4px 6px', borderRadius: 3, cursor: 'pointer',
                  fontSize: 13.5, color: 'var(--ink-2)',
                }}>
                  <input type="radio" name={item.id}
                    checked={answers[item.id] === n + 1}
                    onChange={() => set(item.id, n + 1)}
                    style={{ accentColor: 'var(--paint)' }} />
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
        onChange={e => setAnswers(a => ({ ...a, comments: e.target.value }))}
        rows={4}
        style={{
          width: '100%', padding: '10px 12px', borderRadius: 3,
          border: '1px solid var(--line)', background: 'var(--surface)',
          font: 'inherit', fontSize: 13.5, lineHeight: 1.5, color: 'var(--ink)',
          margin: '0 0 18px', resize: 'vertical',
        }} />

      <p role="status" style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-2)', margin: 0 }}>
        {ready
          ? 'All twenty answered. Your answers are saved on this device.'
          : 'Your answers are saved on this device as you go. There is nothing to submit here.'}
      </p>

      <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--ink-3)', margin: '18px 0 0' }}>
        Your answers go to your teacher only when you hand them in from{' '}
        <Link to="/progress" style={{ color: 'var(--accent)' }}>Progress</Link>.
      </p>
    </div>
  )
}
