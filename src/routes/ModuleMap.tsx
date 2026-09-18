import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ArrowRight } from '@phosphor-icons/react'
import { allModules } from '../content'
import { loadState, resetAll } from '../lib/store'
import { nextAction, toolStates } from '../lib/board'
import { Tape } from '../ui/board/Tape'
import { PlateButton, PlateLink } from '../ui/board/Plate'
import { ToolBoard } from '../ui/board/ToolBoard'
import { toolFor } from '../ui/board/tools'

// Each module's outline on the rack is sized by how many outcomes it teaches,
// on a 12-column row: 3 4 2 / 5 2 2 / 2 2 6 outcomes read as 4 4 4 / 6 3 3 / 3 3 6.
const SPAN: Record<string, number> = { m1: 4, m2: 4, m3: 4, m4: 6, m5: 3, m6: 3, m7: 3, m8: 3, m9: 6 }

export default function ModuleMap() {
  const navigate = useNavigate()
  const state = loadState()
  const modules = allModules()
  const [confirming, setConfirming] = useState(false)
  const tools = toolStates(modules, state.modules)
  const next = nextAction(tools)
  const nextModule = next ? modules.find(m => m.id === next.moduleId) : undefined

  function startNewParticipant() {
    resetAll()
    navigate('/consent', { replace: true })
  }

  return (
    <>
      <div className="map-hero">
        <div>
          <Tape as="h1" size="hero">Every tool has its place.</Tape>
          <p className="map-lede">
            Nine modules, eleven weeks. Finish a module and its tool hangs on your board.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'calc(var(--pitch) * 0.4)', marginTop: 'calc(var(--pitch) * 0.8)' }}>
            {next && nextModule ? (
              <PlateLink to={`/m/${next.moduleId}`} variant="primary">
                {next.verb} module {modules.indexOf(nextModule) + 1} <ArrowRight weight="bold" />
              </PlateLink>
            ) : (
              <PlateLink to="/progress" variant="primary">
                See your progress <ArrowRight weight="bold" />
              </PlateLink>
            )}
            <PlateLink to="/labs">Open the labs</PlateLink>
          </div>
        </div>
        <ToolBoard tools={tools} nextId={next?.moduleId} />
      </div>

      <Tape as="h2" size="section" id="rack-h">Your board</Tape>
      <ul className="rack" aria-labelledby="rack-h" style={{ marginTop: 'calc(var(--pitch) * 0.6)' }}>
        {modules.map((m, i) => {
          const t = tools[i]
          const Tool = toolFor(m.id)
          const here = next?.moduleId === m.id
          return (
            <li key={m.id} className={here ? 'here' : t?.hung ? 'hung' : undefined}
              style={{ ['--span' as string]: SPAN[m.id] ?? 4 }}>
              <Link to={`/m/${m.id}`}>
                <Tool weight={t?.hung ? 'fill' : 'regular'} aria-hidden />
                <span>
                  <span className="t">{m.title}</span>
                  <span className="w">
                    Module {i + 1} · {m.week}, {t?.done ?? 0} of {t?.total ?? 0} outcomes
                    {here ? `, ${next?.verb === 'Continue' ? 'Continue here' : 'Start here'}` : ''}
                  </span>
                </span>
              </Link>
            </li>
          )
        })}
      </ul>

      {/*
        These machines are shared. Without a way to hand the app to the next
        student, their work joined the previous student's participant record,
        they never saw the consent screen, and the two sittings resolved as one
        student retaking a test.
      */}
      <div style={{
        marginTop: 'calc(var(--pitch) * 1.5)', paddingTop: 14,
        borderTop: '2px dashed color-mix(in srgb, var(--chrome) 35%, transparent)',
        fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--ink-2)',
      }}>
        {confirming ? (
          <div>
            <p style={{ margin: '0 0 10px', color: 'var(--ink)' }}>
              This clears every answer and result stored on this device and starts a new
              participant. Work that has not been exported cannot be got back.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <PlateButton onClick={startNewParticipant}>Clear and start a new participant</PlateButton>
              <PlateButton onClick={() => setConfirming(false)}>Cancel</PlateButton>
            </div>
          </div>
        ) : (
          <span>
            Working as{' '}
            <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink)', fontWeight: 600 }}>
              {state.participant.code}
            </strong>
            {state.participant.name ? ` (${state.participant.name})` : ''}.{' '}
            <button onClick={() => setConfirming(true)} style={{
              background: 'none', border: 0, padding: 0, minHeight: 44, font: 'inherit',
              color: 'var(--ink)', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 4,
            }}>
              Not you?
            </button>
          </span>
        )}
      </div>
    </>
  )
}
