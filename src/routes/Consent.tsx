import { useState } from 'react'
import { useNavigate } from 'react-router'
import { loadState, setConsent } from '../lib/store'

export default function Consent() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const code = loadState().participant.code

  function agree(research: boolean) {
    setConsent(research ? name : undefined, research)
    navigate('/', { replace: true })
  }

  return (
    <div style={{ maxWidth: '60ch' }}>
      <h1 style={{ fontSize: 22, fontWeight: 680, letterSpacing: '-0.02em', margin: '0 0 6px', color: 'var(--ink)' }}>
        Before you start
      </h1>
      <p style={{ fontSize: 15, lineHeight: 1.62, color: 'var(--ink-2)', margin: '0 0 18px' }}>
        This app is part of a study your teacher is running on how well an interactive
        resource helps you learn Electronics Products Assembly and Servicing.
      </p>

      <div style={{
        background: 'var(--surface)', border: '1px solid var(--line)',
        borderRadius: 14, padding: 16, margin: '0 0 18px',
      }}>
        <h2 style={{ fontSize: 13, fontWeight: 660, margin: '0 0 10px' }}>What is recorded</h2>
        <ul style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-2)', margin: 0, paddingLeft: 20 }}>
          <li style={{ marginBottom: 6 }}>Your answers to the quizzes and the tests, and how you used the simulations.</li>
          <li style={{ marginBottom: 6 }}>A participant code, <strong style={{ color: 'var(--ink)' }}>{code}</strong>, which identifies your work.</li>
          <li style={{ marginBottom: 6 }}>Your name, only if you choose to give it below.</li>
        </ul>
        <h2 style={{ fontSize: 13, fontWeight: 660, margin: '16px 0 10px' }}>Where it goes</h2>
        <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-2)', margin: 0 }}>
          Everything stays on this device. Nothing is sent anywhere. Your teacher receives
          your results only when you choose to export them and hand them in. You can take
          part without giving your name, and you can ask your teacher to remove your results at any time.
        </p>
        <h2 style={{ fontSize: 13, fontWeight: 660, margin: '16px 0 10px' }}>If you would rather not take part</h2>
        <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-2)', margin: 0 }}>
          You can still use the whole app. It is your coursework either way. Your work simply
          stays out of the study, and nothing of yours is included in what your teacher reports.
        </p>
      </div>

      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, margin: '0 0 6px', color: 'var(--ink)' }}>
        Your name (optional)
      </label>
      <input value={name} onChange={e => setName(e.target.value)}
        placeholder="Leave blank to stay anonymous"
        style={{
          width: '100%', maxWidth: 320, minHeight: 44, padding: '10px 12px',
          borderRadius: 10, border: '1px solid var(--line)', background: 'var(--surface)',
          font: 'inherit', fontSize: 14, color: 'var(--ink)', margin: '0 0 18px',
        }} />

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button onClick={() => agree(true)} className="tile" style={{
          minHeight: 44, padding: '11px 18px', borderRadius: 10, border: 0,
          background: 'var(--accent)', color: 'var(--on-accent)',
          font: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}>
          I agree to take part
        </button>
        <button onClick={() => agree(false)} className="tile" style={{
          minHeight: 44, padding: '11px 18px', borderRadius: 10,
          border: '1px solid var(--line)', background: 'var(--surface)',
          color: 'var(--ink)', font: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}>
          Use the app without taking part
        </button>
      </div>
    </div>
  )
}
