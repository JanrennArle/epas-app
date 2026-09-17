import type { CSSProperties, ReactNode } from 'react'
import { Info, Warning } from '@phosphor-icons/react'
import type { Block } from '../../lib/types'
import type { SimEvent } from '../../interactives/types'
import { getSim } from '../../interactives/registry'

const text: CSSProperties = {
  fontSize: '1.0625rem', lineHeight: 1.65, color: 'var(--ink)',
  maxWidth: '62ch', margin: '0 0 14px',
}

function Callout({ tone, children }: { tone: 'safety' | 'note'; children: ReactNode }) {
  return (
    <div role="note" className={`callout callout--${tone}`}>
      <strong>
        {tone === 'safety' ? <Warning weight="fill" aria-hidden /> : <Info weight="bold" aria-hidden />}
        {tone === 'safety' ? 'Safety' : 'Note'}
      </strong>
      {children}
    </div>
  )
}

export function BlockRenderer({ blocks, moduleId, onSimEvent }: {
  blocks: Block[]
  moduleId: string
  onSimEvent?: (e: SimEvent) => void
}) {
  return (
    <>
      {blocks.map((b, i) => {
        switch (b.kind) {
          case 'text':
            return <p key={i} style={text}>{b.md}</p>

          case 'safety':
            return <Callout key={i} tone="safety">{b.md}</Callout>

          case 'note':
            return <Callout key={i} tone="note">{b.md}</Callout>

          case 'steps':
            return (
              <ol key={i} style={{ ...text, paddingLeft: 20 }}>
                {b.items.map((s, j) => <li key={j} style={{ marginBottom: 6 }}>{s}</li>)}
              </ol>
            )

          case 'table':
            return (
              <div key={i} className="sign" style={{ padding: 0, overflowX: 'auto', margin: '0 0 18px' }}>
                <table style={{ borderCollapse: 'collapse', fontSize: 13, width: '100%', minWidth: 420 }}>
                  <thead>
                    <tr>{b.headers.map(h => (
                      <th key={h} className="label" style={{
                        textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid var(--line)',
                      }}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {b.rows.map((row, ri) => (
                      <tr key={ri}>{row.map((cell, ci) => (
                        <td key={ci} style={{ padding: '9px 10px', borderBottom: '1px solid var(--line)', color: 'var(--ink-2)', lineHeight: 1.5 }}>{cell}</td>
                      ))}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )

          case 'figure':
            return (
              <figure key={i} style={{ margin: '0 0 18px' }}>
                <img src={b.src} alt={b.alt} style={{ maxWidth: '100%', borderRadius: 6 }} />
                {b.caption && <figcaption style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 6 }}>{b.caption}</figcaption>}
              </figure>
            )

          case 'interactive': {
            const Sim = getSim(b.simId)
            if (Sim) {
              return <Sim key={i} moduleId={moduleId} config={b.config} onEvent={onSimEvent} />
            }
            return (
              <p key={i} style={{ ...text, color: 'var(--ink-3)' }}>
                This activity is not available yet.
              </p>
            )
          }
        }
      })}
    </>
  )
}
