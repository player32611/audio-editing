import { createBrowserRouter } from 'react-router'

import App from '../App'
import Settings from '../pages/Settings'
import Workspace from '@renderer/pages/Workspace'
import Appearance from '@renderer/pages/Settings/Systems/Appearance'
import AudioExtract from '@renderer/pages/Workspace/AudioExtract'

const router = createBrowserRouter([
  {
    path: '',
    element: <App />,
    children: [
      {
        path: 'workspace',
        element: <Workspace />,
        children: [
          {
            path: 'extract',
            element: <AudioExtract />
          }
        ]
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
