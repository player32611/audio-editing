import { createBrowserRouter } from 'react-router'

import App from '../App'
import Settings from '../pages/Settings'
import Workspace from '@renderer/pages/Workspace'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: '/workspace',
        element: <Workspace />
      },
      {
        path: '/settings',
        element: <Settings />
      }
    ]
  }
])

export default router
