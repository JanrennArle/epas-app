import type { CSSProperties, ReactNode } from 'react'
import type { Block } from '../../lib/types'
import { getSim } from '../../interactives/registry'

const text: CSSProperties = {
  fontSize: 15, lineHeight: 1.62, color: 'var(--ink-2)',
  maxWidth: '60ch', margin: '0 0 14px',
}

function Callout({ tone, children }: { tone: 'safety' | 'note'; children: ReactNode }) {
  const colour = tone === 'safety' ? 'var(--danger)' : 'var(--ink-3)'
  return (
    <div role="note" style={{
      background: 'var(--surface)',
      border: '1px solid var(--line)', borderLeft: `3px solid ${colour}`,
      borderRadius: '0 10px 10px 0', padding: '11px 13px', margin: '0 0 16px',
      fontSize: 13.5, lineHeight: 1.55, color: 'var(--ink)', maxWidth: '60ch',
    }}>
      <strong style={{ display: 'block', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: colour, marginBottom: 4 }}>
        {tone === 'safety' ? 'Safety' : 'Note'}
      </strong>
      {children}
    </div>
  )
}

export function BlockRenderer({ blocks, moduleId }: { blocks: Block[]; moduleId: string }) {
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
              <div key={i} style={{ overflowX: 'auto', margin: '0 0 18px' }}>
                <table style={{ borderCollapse: 'collapse', fontSize: 13, width: '100%', minWidth: 420 }}>
                  <thead>
                    <tr>{b.headers.map(h => (
                      <th key={h} style={{
                        textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid var(--line)',
                        fontSize: 11, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--ink-3)',
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
                <img src={b.src} alt={b.alt} style={{ maxWidth: '100%', borderRadius: 14 }} />
                {b.caption && <figcaption style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 6 }}>{b.caption}</figcaption>}
              </figure>
            )

          case 'interactive': {
            const Sim = getSim(b.simId)
            if (Sim) {
              return <Sim key={i} moduleId={moduleId} config={b.config} />
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
