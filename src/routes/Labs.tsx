import { Link, useParams } from 'react-router'
import { getSim } from '../interactives/registry'
import { LABS, getLab } from '../content/labs'

export function LabsGallery() {
  return (
    <div style={{ maxWidth: '70ch' }}>
      <h1 style={{ fontSize: 22, fontWeight: 680, letterSpacing: '-0.02em', margin: '0 0 2px' }}>Labs</h1>
      <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-2)', margin: '0 0 18px' }}>
        Every exercise in the app, on its own, with no lesson around it. Practise as often as
        you like. These runs are recorded as practice and are kept apart from your pre-test and
        post-test, which are the only things your learning gain is worked out from.
      </p>

      <ul style={{
        listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 12,
        gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
      }}>
        {LABS.map(lab => (
          <li key={lab.id}>
            <Link to={`/labs/${lab.id}`} className="tile" style={{
              display: 'flex', flexDirection: 'column', gap: 6,
              background: 'var(--surface)', border: '1px solid var(--line)',
              borderRadius: 14, padding: 14, minHeight: 110, textDecoration: 'none',
            }}>
              <span style={{ fontSize: 14, fontWeight: 640, color: 'var(--ink)', lineHeight: 1.3 }}>
                {lab.title}
              </span>
              <span style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5 }}>
                {lab.blurb}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function LabFullScreen() {
  const { labId = '' } = useParams()
  const lab = getLab(labId)
  const Sim = lab ? getSim(lab.simId) : undefined

  if (!lab || !Sim) {
    return (
      <div style={{ maxWidth: '60ch' }}>
        <p style={{ fontSize: 15, color: 'var(--ink-3)', margin: '0 0 12px' }}>
          There is no lab by that name.
        </p>
        <Link to="/labs" style={{ fontSize: 14, color: 'var(--accent)' }}>Back to Labs</Link>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '62ch' }}>
      <Link to="/labs" style={{ fontSize: 13, color: 'var(--accent)' }}>Back to Labs</Link>
      <h1 style={{ fontSize: 22, fontWeight: 680, letterSpacing: '-0.02em', margin: '8px 0 14px' }}>
        {lab.title}
      </h1>
      {/*
        `moduleId` is 'labs' rather than a real module. A practice run is not
        work on any module, and the export's engagement columns count runs
        without attributing them to one. The sim is keyed on the lab id so
        moving between two labs that share a shell remounts it rather than
        leaving the first exercise's answers on screen.
      */}
      <Sim key={lab.id} moduleId="labs" config={lab.config} />
    </div>
  )
}
