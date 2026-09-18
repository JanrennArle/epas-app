import { Link, useParams } from 'react-router'
import type { Icon } from '@phosphor-icons/react'
import {
  ArrowLeft, ArrowsLeftRight, Crosshair, Gauge, Lightning, ListNumbers, Toolbox, Wrench,
} from '@phosphor-icons/react'
import { getSim } from '../interactives/registry'
import { LABS, getLab } from '../content/labs'
import { Tape } from '../ui/board/Tape'

/**
 * The tool that stands for each lab on the board, keyed on the real simId
 * from `src/interactives/registry.ts` rather than a guessed one: the power
 * supply simulation registers as `psu`, not `power-supply`.
 */
const LAB_TOOLS: Record<string, Icon> = {
  troubleshoot: Wrench,
  multimeter: Gauge,
  psu: Lightning,
  sequence: ListNumbers,
  match: ArrowsLeftRight,
  hotspot: Crosshair,
}

function toolFor(simId: string): Icon {
  return LAB_TOOLS[simId] ?? Toolbox
}

function LabRack({ labs }: { labs: typeof LABS }) {
  return (
    <ul className="rack rack--labs" style={{ marginTop: 'calc(var(--pitch) * 0.6)', marginBottom: 'calc(var(--pitch) * 1.2)' }}>
      {labs.map(lab => {
        const Tool = toolFor(lab.simId)
        return (
          <li key={lab.id} style={{ ['--span' as string]: 4 }}>
            <Link to={`/labs/${lab.id}`}>
              <Tool weight="regular" aria-hidden />
              <span>
                <span className="t">{lab.title}</span>
                <span className="w">{lab.blurb}</span>
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

export function LabsGallery() {
  // Order within a group follows LABS order; only the grouping is new.
  const findFault = LABS.filter(lab => lab.simId === 'troubleshoot')
  const practice = LABS.filter(lab => lab.simId !== 'troubleshoot')

  return (
    <div style={{ maxWidth: '70ch' }}>
      <Tape as="h1">Labs</Tape>
      <p style={{ fontSize: '1.0625rem', lineHeight: 1.6, color: 'var(--ink)', margin: '10px 0 0' }}>
        Every exercise in the app, on its own, with no lesson around it. Practise as often as
        you like. These runs are recorded as practice and are kept apart from your pre-test and
        post-test, which are the only things your learning gain is worked out from.
      </p>

      <Tape as="h2" size="section">Find the fault</Tape>
      <LabRack labs={findFault} />

      <Tape as="h2" size="section">Practice</Tape>
      <LabRack labs={practice} />
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
        <Link to="/labs" className="back"><ArrowLeft weight="bold" aria-hidden />Back to Labs</Link>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: lab.simId === 'troubleshoot' ? 'none' : '62ch' }}>
      <Link to="/labs" className="back"><ArrowLeft weight="bold" aria-hidden />Back to Labs</Link>
      <div style={{ margin: '10px 0 20px' }}>
        <Tape as="h1">{lab.title}</Tape>
      </div>
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
