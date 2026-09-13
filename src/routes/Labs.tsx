import { Link, useParams } from 'react-router'
import { getSim } from '../interactives/registry'

interface Lab {
  /** What the URL says, and what a student sees named on the card. */
  id: string
  simId: string
  title: string
  blurb: string
  /** Passed straight to the simulation, exactly as a lesson block would. */
  config?: Record<string, unknown>
}

/**
 * Every exercise a student can open on its own, in the order they meet them.
 *
 * A lab is not a simulation. Three of the six registered simulations are
 * shells that need a `config` naming which exercise to run, so listing bare
 * simIds put three dead cards in this gallery: the shell rendered with no
 * activity and said the activity was not available. The entry id is what the
 * URL carries, which keeps `/labs/multimeter` working while letting one shell
 * appear once per exercise it can run.
 */
export const LABS: Lab[] = [
  {
    id: 'multimeter',
    simId: 'multimeter',
    title: 'Multimeter and component testing',
    blurb: 'Measure resistance, continuity, diode drop and voltage on good and faulty parts.',
  },
  {
    id: 'psu',
    simId: 'psu',
    title: 'Power supply assembly',
    blurb: 'Build a supply stage by stage and watch what each one does to the waveform.',
  },
  {
    id: 'troubleshoot',
    simId: 'troubleshoot',
    title: 'System troubleshooter',
    blurb: 'Work a fault on a real appliance, choosing which tests to run before you name it.',
  },
  {
    id: 'flat-iron-parts',
    simId: 'hotspot',
    config: { activity: 'flat-iron-parts' },
    title: 'Parts of a flat iron',
    blurb: 'Point to the element, thermostat, thermal fuse and cord on a cutaway.',
  },
  {
    id: 'tv-boards',
    simId: 'hotspot',
    config: { activity: 'tv-boards' },
    title: 'Boards inside a television',
    blurb: 'Find the power supply, main board, backlight and panel from what each one does.',
  },
  {
    id: 'lighting-parts',
    simId: 'match',
    config: { activity: 'lighting-parts' },
    title: 'Parts of a rechargeable lamp',
    blurb: 'Pair the cell, charger, driver, LEDs and switch with the job each one does.',
  },
  {
    id: 'control-board',
    simId: 'match',
    config: { activity: 'control-board' },
    title: 'Parts on a control board',
    blurb: 'Pair the relay, regulator, optocoupler, capacitor and microcontroller with what they do.',
  },
  {
    id: 'audio-signal',
    simId: 'sequence',
    config: { activity: 'audio-signal' },
    title: 'Audio signal path',
    blurb: 'Put microphone, mixer, amplifier and speaker into the order the sound travels.',
  },
  {
    id: 'cctv-signal',
    simId: 'sequence',
    config: { activity: 'cctv-signal' },
    title: 'CCTV signal path',
    blurb: 'Put camera, cable, recorder and monitor into the order the picture travels.',
  },
  {
    id: 'fas-signal',
    simId: 'sequence',
    config: { activity: 'fas-signal' },
    title: 'Fire alarm signal path',
    blurb: 'Put detector, loop, panel and sounder into the order an alarm travels.',
  },
]

export function getLab(id: string): Lab | undefined {
  return LABS.find(l => l.id === id)
}

/** Which simulations the gallery actually reaches. The guard test pins this. */
export const LAB_SIM_IDS = [...new Set(LABS.map(l => l.simId))]

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

