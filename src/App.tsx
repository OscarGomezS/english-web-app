import { Navigate, Outlet, RouterProvider, createBrowserRouter } from 'react-router'
import { Layout } from './components/Layout'
import { WakeGate } from './components/WakeGate'
import { useAuth } from './lib/auth'
import { CategoryView, LevelView } from './pages/Browse'
import { CalendarPage } from './pages/CalendarPage'
import { Landing } from './pages/Landing'
import { TopicPage } from './pages/TopicPage'

function RequireAuth() {
  const { user } = useAuth()
  return user ? <Outlet /> : <Landing />
}

function Home() {
  const { user } = useAuth()
  return user ? <Navigate to="/levels/A1" replace /> : <Landing />
}

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <WakeGate>
        <Outlet />
      </WakeGate>
    ),
    children: [
      { index: true, element: <Home /> },
      {
        element: <RequireAuth />,
        children: [
          {
            element: <Layout />,
            children: [
              { path: 'levels/:level', element: <LevelView /> },
              { path: 'categories/:category', element: <CategoryView /> },
              { path: 'topics/:id', element: <TopicPage /> },
              { path: 'calendar', element: <CalendarPage /> },
            ],
          },
        ],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
