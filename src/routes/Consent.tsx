import { useState } from 'react'
import { useNavigate } from 'react-router'
import { loadState, setConsent } from '../lib/store'
import { Tape } from '../ui/board/Tape'
import { PlateButton } from '../ui/board/Plate'

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
      <Tape as="h1">Before you start</Tape>
      <p style={{ fontSize: 15, lineHeight: 1.62, color: 'var(--ink-2)', margin: '18px 0 18px' }}>
        This app is part of a study your teacher is running on how well an interactive
        resource helps you learn Electronics Products Assembly and Servicing.
      </p>

      <div className="sign" style={{ margin: '0 0 18px' }}>
        <Tape as="h2" size="section">What is recorded</Tape>
        <ul style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-2)', margin: '10px 0 0', paddingLeft: 20 }}>
          <li style={{ marginBottom: 6 }}>Your answers to the quizzes and the tests, and how you used the simulations.</li>
          <li style={{ marginBottom: 6 }}>A participant code, <strong style={{ color: 'var(--ink)' }}>{code}</strong>, which identifies your work.</li>
          <li style={{ marginBottom: 6 }}>Your name, only if you choose to give it below.</li>
        </ul>
        <Tape as="h2" size="section">Where it goes</Tape>
        <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-2)', margin: '10px 0 0' }}>
          Everything stays on this device. Nothing is sent anywhere. Your teacher receives
          your results only when you choose to export them and hand them in. You can take
          part without giving your name, and you can ask your teacher to remove your results at any time.
        </p>
        <Tape as="h2" size="section">If you would rather not take part</Tape>
        <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-2)', margin: '10px 0 0' }}>
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
          borderRadius: 3, border: '1px solid var(--line)', background: 'var(--surface)',
          font: 'inherit', fontSize: 14, color: 'var(--ink)', margin: '0 0 18px',
        }} />

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <PlateButton variant="primary" onClick={() => agree(true)}>
          I agree to take part
        </PlateButton>
        <PlateButton onClick={() => agree(false)}>
          Use the app without taking part
        </PlateButton>
      </div>
    </div>
  )
}
