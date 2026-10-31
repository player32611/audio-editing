import { createHashRouter } from 'react-router'

import App from '../App'
import Settings from '../pages/Settings'
import Workspace from '@renderer/pages/Workspace'
import Appearance from '@renderer/pages/Settings/Systems/Appearance'
import AudioExtract from '@renderer/pages/Workspace/AudioExtract'
import List from '@renderer/pages/Workspace/List'
import File from '@renderer/pages/Settings/Systems/File'
import AudioTrim from '@renderer/pages/Workspace/AudioTrim'
import AudioEdit from '@renderer/pages/Workspace/AudioEdit'
import SpeechRecognition from '@renderer/pages/Workspace/SpeechRecognition'
import ImportModel from '@renderer/pages/Workspace/ImportModel'
import RealtimeRecognition from '@renderer/pages/Workspace/RealtimeRecognition'
import Home from '@renderer/pages/Home'
import Whisper from '@renderer/pages/Settings/Systems/Whisper'
import Gpu from '@renderer/pages/Settings/Systems/Gpu'

const router = createHashRouter([
  {
    path: '',
    element: <App />,
    children: [
      {
        index: true,
        element: <Home />
      },
      {
        path: 'workspace',
        element: <Workspace />,
        children: [
          {
            index: true,
            element: <List />
          },
          {
            path: 'audioExtract',
            element: <AudioExtract />
          },
          {
            path: 'audioTrim',
            element: <AudioTrim />
          },
          {
            path: 'audioEdit',
            element: <AudioEdit />
          },
          {
            path: 'speechRecognition',
            element: <SpeechRecognition />
          },
          {
            path: 'importModel',
            element: <ImportModel />
          },
          {
            path: 'realtimeRecognition',
            element: <RealtimeRecognition />
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
          },
          {
            path: 'file',
            element: <File />
          },
          {
            path: 'whisper',
            element: <Whisper />
          },
          {
            path: 'gpu',
            element: <Gpu />
          }
        ]
      }
    ]
  }
])

export default router
