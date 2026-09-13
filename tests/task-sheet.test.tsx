import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, vi } from 'vitest'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router'
import TaskSheet from '../src/routes/TaskSheet'
import { TASKS } from '../src/content/tasks'
import { loadState, setConsent, setTaskProgress } from '../src/lib/store'

/**
 * The one UI suite on this project, and it earns its place: the defect it
 * guards has now shipped twice. React Router keeps a component mounted when
 * only the params change, so a route that seeds state from its param in a
 * `useState` initialiser shows the previous record and then writes it back
 * under the new id. That shipped on the assessment route in plan 6 and again
 * on this route in plan 8, fixed both times with a keyed inner component, and
 * nothing in the test suite noticed either time.
 *
 * Rendered through a real router rather than by calling the component,
 * because reusing-on-param-change is the router's own behaviour and a direct
 * render would not reproduce it. The move runs through a button inside the
 * tree, which is the same client-side transition a student makes.
 */
function Go({ to }: { to: string }) {
  const navigate = useNavigate()
  return <button onClick={() => navigate(`/tasks/${to}`)}>go to {to}</button>
}

function openSheet(startAt: string, goTo: string[] = []) {
  render(
    <MemoryRouter initialEntries={[`/tasks/${startAt}`]}>
      <Routes>
        <Route path="/tasks/:taskId" element={
          <>
            <TaskSheet />
            {goTo.map(id => <Go key={id} to={id} />)}
          </>
        } />
      </Routes>
    </MemoryRouter>,
  )
}

function go(to: string) {
  fireEvent.click(screen.getByRole('button', { name: `go to ${to}` }))
}

function ticked() {
  return screen.getAllByRole('checkbox').filter(b => (b as HTMLInputElement).checked)
}

const [t1, t2] = TASKS

describe('the task sheet route', () => {
  beforeEach(() => {
    vi.useRealTimers()
    localStorage.clear()
    setConsent(undefined, true)
  })

  afterEach(() => vi.useRealTimers())

  it('shows a clean sheet when the student moves to the next task', () => {
    if (!t1 || !t2) throw new Error('needs two tasks')
    openSheet(t1.id, [t2.id])

    fireEvent.click(screen.getAllByRole('checkbox')[0] as HTMLElement)
    expect(ticked()).toHaveLength(1)

    go(t2.id)

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(t2.title)
    expect(ticked()).toHaveLength(0)
    expect(screen.getByRole('textbox')).toHaveValue('')
  })

  it("does not write the first task's ticks under the second task", () => {
    if (!t1 || !t2) throw new Error('needs two tasks')
    openSheet(t1.id, [t2.id])
    fireEvent.click(screen.getAllByRole('checkbox')[0] as HTMLElement)

    go(t2.id)

    expect(loadState().tasks?.[t1.id]?.checked).toEqual([0])
    expect(loadState().tasks?.[t2.id]).toBeUndefined()
  })

  // A sheet the student only read is not work they did, and a record written
  // on sight would make every opened sheet look started in the class table.
  // The write this guards against is debounced, so the clock has to be run
  // past the debounce or the test passes on the timer never having fired.
  it('writes nothing when a sheet is opened and not touched', () => {
    if (!t1) throw new Error('needs a task')
    vi.useFakeTimers()
    openSheet(t1.id)
    act(() => { vi.advanceTimersByTime(5000) })
    expect(loadState().tasks).toBeUndefined()
  })

  it('writes nothing when a sheet with stored progress is opened and not touched', () => {
    if (!t1) throw new Error('needs a task')
    setTaskProgress(t1.id, { checked: [1], notes: 'from last lesson' })
    const before = loadState().tasks?.[t1.id]?.at
    vi.useFakeTimers()
    openSheet(t1.id)
    act(() => { vi.advanceTimersByTime(5000) })
    expect(loadState().tasks?.[t1.id]?.at).toBe(before)
    expect(loadState().tasks?.[t1.id]?.notes).toBe('from last lesson')
  })

  // The transition the review expected to throw "Rendered fewer hooks than
  // expected". It does not on React 19, verified by putting a hook back below
  // the early return and driving it in both jsdom and a browser, so this is a
  // behaviour guard rather than a crash guard: whatever React does with the
  // hook counts, the student gets the message and their tick is kept.
  it('survives moving from a real sheet to one that does not exist', () => {
    if (!t1) throw new Error('needs a task')
    openSheet(t1.id, ['no-such-task'])
    fireEvent.click(screen.getAllByRole('checkbox')[0] as HTMLElement)

    go('no-such-task')

    expect(screen.getByText('That task sheet does not exist.')).toBeInTheDocument()
    // The tick was still flushed on the way out.
    expect(loadState().tasks?.[t1.id]?.checked).toEqual([0])
  })
})
