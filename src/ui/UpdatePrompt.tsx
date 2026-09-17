import { useLocation } from 'react-router'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { mayPrompt } from '../lib/updates'
import { PlateButton } from './board/Plate'

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
 *
 * Rendered in normal document flow, not `position: fixed`. A fixed bar at
 * the bottom of a short viewport sits on top of whatever else is down there:
 * on `/progress` that is "Save my results for my teacher", on `/teacher` the
 * rubric and class-table downloads, and on a task sheet the notes textarea a
 * student is typing into. Those are the controls this whole app exists to
 * be used through, so a notice about software versions must never cover one.
 * In flow, the bar can only ever push content down, never over it, at any
 * viewport size or content length, which a fixed bar with a measured spacer
 * would have to keep re-proving as the app grows.
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
    <div role="status" className="sign" style={{
      position: 'sticky', bottom: 0, borderRadius: 0, zIndex: 1,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        maxWidth: 1100, margin: '0 auto',
      }}>
        <p style={{ margin: 0, flex: 1, minWidth: 200, fontSize: 13.5, lineHeight: 1.5, color: 'var(--ink)' }}>
          A newer version of the app is ready. Your work is saved on this device
          either way, so you can update whenever it suits you.
        </p>
        {/* The `true` argument is what the plugin's type signature accepts,
            but vite-plugin-pwa's registerType: 'prompt' client ignores it: the
            reload always happens, driven by the `controlling` listener the
            plugin sets up internally, not by this argument. There is no way
            to update without reloading through this API. */}
        <PlateButton variant="primary" onClick={() => { void updateServiceWorker(true) }}>
          Update now
        </PlateButton>
      </div>
    </div>
  )
}
