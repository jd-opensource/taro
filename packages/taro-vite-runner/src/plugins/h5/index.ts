import reactPlugin from '@vitejs/plugin-react'

import configPlugin from './config'
import entryPlugin from './entry'

export default (appPath: string, config) => {
  return [
    reactPlugin(),
    configPlugin(appPath, config),
    entryPlugin(appPath, config)
  ]
}
