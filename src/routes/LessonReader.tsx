import { Link, useParams, useNavigate } from 'react-router'
import { getModule } from '../content'
import { markOutcomeComplete } from '../lib/store'
import { BlockRenderer } from '../ui/blocks/BlockRenderer'
import { Quiz } from '../ui/Quiz'

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
      <Link to={`/m/${m.id}`} style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>
        {m.title}
      </Link>
      <h1 style={{ fontSize: 20, fontWeight: 680, letterSpacing: '-0.02em', margin: '8px 0 16px', maxWidth: '30ch' }}>
        {outcome.title}
      </h1>

      {outcome.lessons.map(l => (
        <section key={l.id} style={{ marginBottom: 26 }}>
          <h2 style={{ fontSize: 15, fontWeight: 660, margin: '0 0 10px' }}>{l.title}</h2>
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
