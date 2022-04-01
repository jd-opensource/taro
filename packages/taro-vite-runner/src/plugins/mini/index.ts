import reactPlugin from '@vitejs/plugin-react'

import configPlugin from './config'
import entryPlugin from './entry'
import pagesPlugin from './pages'
import templatePlugin from './template'
import stylePlugin from './style'

export default (appPath: string, config) => {
  return [
    reactPlugin(),
    configPlugin(appPath, config),
    entryPlugin(appPath, config),
    pagesPlugin(appPath, config),
    templatePlugin(appPath, config),
    stylePlugin(appPath, config)
  ]
}
