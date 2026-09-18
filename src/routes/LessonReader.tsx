import { Link, useParams, useNavigate } from 'react-router'
import { ArrowLeft } from '@phosphor-icons/react'
import { getModule } from '../content'
import { loadState, markOutcomeComplete } from '../lib/store'
import { BlockRenderer } from '../ui/blocks/BlockRenderer'
import { Quiz } from '../ui/Quiz'
import { Tape } from '../ui/board/Tape'
import { toolFor } from '../ui/board/tools'

export default function LessonReader() {
  const { moduleId = '', outcomeId = '' } = useParams()
  const navigate = useNavigate()
  const m = getModule(moduleId)
  const outcome = m?.outcomes.find(o => o.id === outcomeId)

  if (!m || !outcome) {
    return <p style={{ color: 'var(--ink-2)' }}>Not found. <Link to="/">Back to modules</Link></p>
  }

  const state = loadState()
  const done = state.modules[m.id]?.completedOutcomes.length ?? 0
  const Tool = toolFor(m.id)

  return (
    <div className="lesson-layout">
      <div>
        <Link to={`/m/${m.id}`} className="back">
          <ArrowLeft weight="bold" aria-hidden />
          {m.title}
        </Link>
        <div style={{ margin: '0 0 18px' }}>
          <Tape as="h1">{outcome.title}</Tape>
        </div>

        {outcome.lessons.map(l => (
          <section key={l.id} style={{ marginBottom: 'calc(var(--pitch) * 1.2)' }}>
            <h2 className="label" style={{ fontSize: '1.25rem', color: 'var(--ink)', margin: '0 0 10px' }}>{l.title}</h2>
            <BlockRenderer blocks={l.blocks} moduleId={m.id} />
          </section>
        ))}

        <Quiz
          items={outcome.quiz}
          moduleId={m.id}
          onFinish={() => {
            markOutcomeComplete(m.id, outcome.id)
            navigate(`/m/${m.id}`)
          }}
        />
      </div>

      {/*
        Above 1100px the reading column leaves the rest of the board bare, so
        this rail carries the module itself back into that space: a painted
        outline of its tool, which module and week this is, and how far
        through it the student already is. Decorative and duplicate of what
        the back link and route already say, so it is hidden from assistive
        tech rather than announced twice.
      */}
      <aside className="lesson-rail" aria-hidden="true">
        <Tool weight="regular" aria-hidden />
        <span style={{
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.15rem',
          lineHeight: 1.25, color: 'var(--ink)',
        }}>{m.title}</span>
        <span style={{ fontSize: '0.92rem', color: 'var(--ink-2)', fontVariantNumeric: 'tabular-nums' }}>
          {m.week} · {done} of {m.outcomes.length} outcomes
        </span>
      </aside>
    </div>
  )
}
