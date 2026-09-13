import { Link, useParams } from 'react-router'
import { SIMS, getSim } from '../interactives/registry'

/**
 * What each simulation is called and what it is for, in a student's words.
 * Keyed by the same simId the lesson blocks use, so adding a simulation is
 * still one registry entry plus one component plus one line here.
 */
const ABOUT: Record<string, { title: string; blurb: string }> = {
  multimeter: {
    title: 'Multimeter and component testing',
    blurb: 'Measure resistance, continuity, diode drop and voltage on good and faulty parts.',
  },
  psu: {
    title: 'Power supply assembly',
    blurb: 'Build a supply stage by stage and watch what each one does to the waveform.',
  },
  troubleshoot: {
    title: 'System troubleshooter',
    blurb: 'Work a fault on a real appliance, choosing which tests to run before you name it.',
  },
  match: { title: 'Matching', blurb: 'Pair each part with what it does.' },
  hotspot: { title: 'Find the part', blurb: 'Point to the part being described on a diagram.' },
  sequence: { title: 'Put it in order', blurb: 'Arrange the steps of a procedure into a workable order.' },
}

export const ABOUT_KEYS = Object.keys(ABOUT)

export function LabsGallery() {
  return (
    <div style={{ maxWidth: '70ch' }}>
      <h1 style={{ fontSize: 22, fontWeight: 680, letterSpacing: '-0.02em', margin: '0 0 2px' }}>Labs</h1>
      <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-2)', margin: '0 0 18px' }}>
        Every simulation in the app, on its own, with no lesson around it. Practise as often as
        you like. These runs are recorded as practice and are kept apart from your pre-test and
        post-test, which are the only things your learning gain is worked out from.
      </p>

      <ul style={{
        listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 12,
        gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
      }}>
        {Object.keys(SIMS).map(simId => {
          const about = ABOUT[simId]
          return (
            <li key={simId}>
              <Link to={`/labs/${simId}`} className="tile" style={{
                display: 'flex', flexDirection: 'column', gap: 6,
                background: 'var(--surface)', border: '1px solid var(--line)',
                borderRadius: 14, padding: 14, minHeight: 110, textDecoration: 'none',
              }}>
                <span style={{ fontSize: 14, fontWeight: 640, color: 'var(--ink)', lineHeight: 1.3 }}>
                  {about?.title ?? simId}
                </span>
                <span style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5 }}>
                  {about?.blurb ?? 'Open this simulation.'}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function LabFullScreen() {
  const { simId = '' } = useParams()
  const Sim = getSim(simId)
  const about = ABOUT[simId]

  if (!Sim) {
    return (
      <div style={{ maxWidth: '60ch' }}>
        <p style={{ fontSize: 15, color: 'var(--ink-3)', margin: '0 0 12px' }}>
          There is no simulation by that name.
        </p>
        <Link to="/labs" style={{ fontSize: 14, color: 'var(--accent)' }}>Back to Labs</Link>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '62ch' }}>
      <Link to="/labs" style={{ fontSize: 13, color: 'var(--accent)' }}>Back to Labs</Link>
      <h1 style={{ fontSize: 22, fontWeight: 680, letterSpacing: '-0.02em', margin: '8px 0 14px' }}>
        {about?.title ?? simId}
      </h1>
      {/*
        `moduleId` is 'labs' rather than a real module. A practice run is not
        work on any module, and the export's engagement columns count runs
        without attributing them to one.
      */}
      <Sim moduleId="labs" />
    </div>
  )
}
