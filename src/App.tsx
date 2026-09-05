import { createHashRouter, RouterProvider } from 'react-router'
import { Shell } from './ui/Shell'
import ModuleMap from './routes/ModuleMap'
import ModuleOverview from './routes/ModuleOverview'
import LessonReader from './routes/LessonReader'

function NotBuiltYet() {
  return (
    <>
      <h1 style={{ fontSize: 22, fontWeight: 680, letterSpacing: '-0.02em', margin: '0 0 6px', color: 'var(--ink)' }}>
        Not built yet
      </h1>
      <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: 0 }}>
        This part of the app is coming in a later version.
      </p>
    </>
  )
}

const router = createHashRouter([
  { path: '/', element: <Shell><ModuleMap /></Shell> },
  { path: '/m/:moduleId', element: <Shell><ModuleOverview /></Shell> },
  { path: '/m/:moduleId/lo/:outcomeId', element: <Shell><LessonReader /></Shell> },
  { path: '*', element: <Shell><NotBuiltYet /></Shell> },
])

export default function App() {
  return <RouterProvider router={router} />
}
