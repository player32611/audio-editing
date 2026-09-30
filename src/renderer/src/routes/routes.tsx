import { createBrowserRouter } from 'react-router'

import App from '../App'
import Settings from '../pages/Settings'
import Workspace from '@renderer/pages/Workspace'
import Appearance from '@renderer/pages/Settings/Systems/Appearance'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: 'workspace',
        element: <Workspace />
      },
      {
        path: 'settings',
        element: <Settings />,
        children: [
          {
            path: 'appearance',
            element: <Appearance />
          }
        ]
      }
    ]
  }
])

export default router
