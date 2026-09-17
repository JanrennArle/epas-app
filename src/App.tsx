import { createHashRouter, RouterProvider } from 'react-router'
import { Shell } from './ui/Shell'
import ModuleMap from './routes/ModuleMap'
import ModuleOverview from './routes/ModuleOverview'
import LessonReader from './routes/LessonReader'
import Consent from './routes/Consent'
import Assessment from './routes/Assessment'
import Evaluate from './routes/Evaluate'
import Progress from './routes/Progress'
import Teacher from './routes/Teacher'
import TaskSheet from './routes/TaskSheet'
import { LabFullScreen, LabsGallery } from './routes/Labs'
import { Tape } from './ui/board/Tape'

function NotBuiltYet() {
  return (
    <>
      <Tape as="h1">Not built yet</Tape>
      <p style={{ fontSize: '1rem', color: 'var(--ink-2)', margin: '10px 0 0' }}>
        This part of the app is coming in a later version.
      </p>
    </>
  )
}

const router = createHashRouter([
  { path: '/', element: <Shell><ModuleMap /></Shell> },
  { path: '/m/:moduleId', element: <Shell><ModuleOverview /></Shell> },
  { path: '/m/:moduleId/lo/:outcomeId', element: <Shell><LessonReader /></Shell> },
  { path: '/m/:moduleId/test/:phase', element: <Shell><Assessment /></Shell> },
  { path: '/consent', element: <Shell><Consent /></Shell> },
  { path: '/evaluate', element: <Shell><Evaluate /></Shell> },
  { path: '/progress', element: <Shell><Progress /></Shell> },
  { path: '/teacher', element: <Shell><Teacher /></Shell> },
  { path: '/tasks/:taskId', element: <Shell><TaskSheet /></Shell> },
  { path: '/labs', element: <Shell><LabsGallery /></Shell> },
  { path: '/labs/:labId', element: <Shell><LabFullScreen /></Shell> },
  { path: '*', element: <Shell><NotBuiltYet /></Shell> },
])

export default function App() {
  return <RouterProvider router={router} />
}
