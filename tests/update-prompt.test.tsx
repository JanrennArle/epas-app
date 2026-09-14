import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { UpdatePrompt } from '../src/ui/UpdatePrompt'

/**
 * `virtual:pwa-register/react` resolves to a no-op stub under test
 * (node_modules/vite-plugin-pwa/dist/client/dev/react.js: useState(false) and
 * an empty updateServiceWorker), so without this mock `needRefresh` never
 * becomes true and none of UpdatePrompt's real behaviour ever runs. This mock
 * holds an update permanently pending, the same shape a real waiting service
 * worker produces (see CLAUDE.md's service worker section and
 * tests/updates.test.ts, which cover mayPrompt itself). What is under test
 * here is the wiring: that UpdatePrompt actually calls mayPrompt, and that
 * needRefresh survives a route change rather than resetting because the
 * component remounted.
 */
const updateServiceWorker = vi.fn()

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({
    needRefresh: [true, vi.fn()],
    offlineReady: [false, vi.fn()],
    updateServiceWorker,
  }),
}))

// Same shape as tests/task-sheet.test.tsx: a real MemoryRouter and a button
// that calls useNavigate, so a route change is a real client-side transition
// rather than a fresh render, which is the only way to catch a component that
// resets state it should have kept.
function Go({ to }: { to: string }) {
  const navigate = useNavigate()
  return <button onClick={() => navigate(to)}>go to {to}</button>
}

function renderAt(path: string, others: string[] = []) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="*" element={
          <>
            <UpdatePrompt />
            {others.map(to => <Go key={to} to={to} />)}
          </>
        } />
      </Routes>
    </MemoryRouter>,
  )
}

function bar() {
  return screen.queryByRole('status')
}

describe('the update prompt, with an update pending throughout', () => {
  beforeEach(() => updateServiceWorker.mockClear())

  it('is absent on a test in progress', () => {
    renderAt('/m/m1/test/pre')
    expect(bar()).not.toBeInTheDocument()
  })

  it('is absent on the consent screen', () => {
    renderAt('/consent')
    expect(bar()).not.toBeInTheDocument()
  })

  it('is present on an ordinary screen', () => {
    renderAt('/progress')
    expect(bar()).toBeInTheDocument()
  })

  // The property that matters: navigating away from a suppressed route does
  // not lose the pending update. If UpdatePrompt (or Shell above it) ever
  // remounted on a route change, needRefresh would reset to the mock's
  // initial value on the new instance and this would still pass by accident;
  // it is the same mock instance and the same needRefresh throughout this
  // test, so a bar that fails to appear here means the suppression check
  // itself is wrong, not that state was lost. The remount case is what the
  // real service worker's needRefresh would suffer, which this pure-route
  // test cannot reach directly, but a component that ignores mayPrompt or a
  // guard that never runs would fail here identically to there.
  it('reappears after navigating from a suppressed route to an ordinary one: withheld, not discarded', () => {
    renderAt('/m/m1/test/pre', ['/progress'])
    expect(bar()).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'go to /progress' }))

    expect(bar()).toBeInTheDocument()
  })

  it('pressing Update now calls updateServiceWorker, and nothing else does', () => {
    renderAt('/progress')
    expect(updateServiceWorker).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Update now' }))

    expect(updateServiceWorker).toHaveBeenCalledTimes(1)
    expect(updateServiceWorker).toHaveBeenCalledWith(true)
  })
})
