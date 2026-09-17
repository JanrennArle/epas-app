import { Link, useParams, useNavigate } from 'react-router'
import { ArrowLeft } from '@phosphor-icons/react'
import { getModule } from '../content'
import { markOutcomeComplete } from '../lib/store'
import { BlockRenderer } from '../ui/blocks/BlockRenderer'
import { Quiz } from '../ui/Quiz'
import { Tape } from '../ui/board/Tape'

export default function LessonReader() {
  const { moduleId = '', outcomeId = '' } = useParams()
  const navigate = useNavigate()
  const m = getModule(moduleId)
  const outcome = m?.outcomes.find(o => o.id === outcomeId)

  if (!m || !outcome) {
    return <p style={{ color: 'var(--ink-2)' }}>Not found. <Link to="/">Back to modules</Link></p>
  }

  return (
    <>
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
    </>
  )
}
