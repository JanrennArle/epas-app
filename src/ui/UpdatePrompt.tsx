import { useLocation } from 'react-router'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { mayPrompt } from '../lib/updates'

/**
 * Offers a new version, and never takes it.
 *
 * `registerType: 'prompt'` means the new worker waits rather than taking
 * over, so the page a student is on keeps running the version it started
 * with until they press Update. That is the spec's promise, and the reason
 * it matters is `Assessment.tsx`: a sitting lives in React state until
 * submit, and a reload loses it.
 *
 * When the route is one that must not be interrupted, the bar is not
 * rendered. The update is not discarded, only withheld: `needRefresh` stays
 * true, so the bar appears the moment the student is somewhere it costs
 * nothing.
 */
export function UpdatePrompt() {
  const { pathname } = useLocation()
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(error: unknown) {
      // Registration fails on `file://` and on plain http, which are both
      // supported ways to run this: a lab PC opening dist/index.html, and a
      // teacher serving the folder off a laptop. The app works in both, it
      // just has no offline cache, so this must not reach the student.
      console.info('Service worker not registered, the app still works.', error)
    },
  })

  if (!needRefresh || !mayPrompt(pathname)) return null

  return (
    <div role="status" style={{
      position: 'fixed', left: 12, right: 12, bottom: 12, zIndex: 50,
      display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      background: 'var(--surface)', border: '1px solid var(--line)',
      borderLeft: '3px solid var(--accent)', borderRadius: '0 12px 12px 0',
      padding: '12px 14px', boxShadow: '0 6px 24px rgba(0,0,0,0.14)',
      maxWidth: 520, margin: '0 auto',
    }}>
      <p style={{ margin: 0, flex: 1, minWidth: 200, fontSize: 13.5, lineHeight: 1.5, color: 'var(--ink)' }}>
        A newer version of the app is ready. Your work is saved on this device
        either way, so you can update whenever it suits you.
      </p>
      <button
        onClick={() => { void updateServiceWorker(true) }}
        className="tile"
        style={{
          minHeight: 44, padding: '10px 16px', borderRadius: 10, border: 0,
          background: 'var(--accent)', color: 'var(--on-accent)',
          font: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}>
        Update now
      </button>
    </div>
  )
}
