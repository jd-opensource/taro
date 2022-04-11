import * as path from 'path'

import type { Plugin } from 'vite'

import { mergeOption, processEnvOption } from '../../utils'
import { VITE_PLUGIN_MAIN_H5 } from '../../utils/constants'

export default (appPath: string, config) => {
  const {
    env = {},
    defineConstants = {},
    modifyViteConfig
  } = config
  const constantsReplaceList = mergeOption([processEnvOption(env), defineConstants])
  return {
    name: VITE_PLUGIN_MAIN_H5,
    enforce: 'pre',
    config: () => {
      return {
        logLevel: 'info',
        define: constantsReplaceList,
        resolve: {
          alias: [
            ...config.alias,
            {
              find: /@tarojs\/taro$/,
              replacement: '@tarojs/taro-h5'
            }
          ],
          extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.vue'],
          mainFields: ['main:h5', 'browser', 'jsnext:main', 'module', 'main'],
          preserveSymlinks: true,
          modules: [path.join(appPath, 'node_modules'), 'node_modules']
        }
      }
    },
    async configResolved (userConfig) {
      if (typeof modifyViteConfig === 'function') {
        await modifyViteConfig(userConfig)
      }
    }
  } as Plugin
}
