import * as path from 'path'

import type { BuildOptions, Plugin } from 'vite'
import { isNodeModule, PLATFORMS, taroJsComponents } from '@tarojs/helper'
import { IPostcssOption } from '@tarojs/taro/types/compile'
import * as inject from '@rollup/plugin-inject'

import {
  getAppEntry,
  getConfigFilePath,
  getRuntimeConstants,
  mergeOption,
  processEnvOption
} from '../../utils'
import { OUTPUT_MAIN_JS_NAME, VITE_PLUGIN_NAME_MAIN } from '../../utils/constants'
import { getPagesInfo } from '../../utils/project'
import { getPostcssPlugins } from '../../postcss'

export default (appPath: string, config) => {
  const {
    buildAdapter = PLATFORMS.WEAPP,
    sourceRoot = 'src',
    defineConstants = {},
    runtime = {},
    env = {},
    framework,
    isBuildQuickapp = false,
    designWidth,
    deviceRatio,
    postcss = {},
    fileType = {
      templ: '.wxml',
      style: '.wxss',
      config: '.json',
      script: '.js',
      xs: '.wxs'
    }
  } = config
  const sourceDir = path.join(appPath, sourceRoot)
  const appEntry = getAppEntry(config.entry)
  const appConfigPath = getConfigFilePath(appEntry)
  const taroBaseReg = /@tarojs[\\/][a-z]+/
  const runtimeConstants = getRuntimeConstants(runtime)
  env.FRAMEWORK = JSON.stringify(framework)
  env.TARO_ENV = JSON.stringify(buildAdapter)
  const constantsReplaceList = mergeOption([processEnvOption(env), defineConstants, runtimeConstants])
  const postcssOption: IPostcssOption = postcss || {}
  return {
    name: VITE_PLUGIN_NAME_MAIN,
    enforce: 'pre',
    config: (_, env) => {
      return {
        logLevel: 'info',
        css: {
          postcss: {
            plugins: getPostcssPlugins(appPath, {
              isBuildQuickapp,
              designWidth,
              deviceRatio,
              postcssOption
            })
          }
        },
        define: constantsReplaceList,
        resolve: {
          alias: [
            ...config.alias,
            // 小程序使用 regenerator-runtime@0.11
            {
              find: /regenerator-runtime$/,
              replacement: require.resolve('regenerator-runtime')
            },
            // 开发组件库时 link 到本地调试，runtime 包需要指向本地 node_modules 顶层的 runtime，保证闭包值 Current 一致，shared 也一样
            {
              find: /@tarojs\/runtime$/,
              replacement: require.resolve('@tarojs/runtime')
            },
            {
              find: /@tarojs\/shared$/,
              replacement: require.resolve('@tarojs/shared/dist/shared.esm.js')
            },
            {
              find: new RegExp(`${taroJsComponents}$`),
              replacement: config.taroComponentsPath || `${taroJsComponents}/mini`
            }
          ],
          extensions: ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.vue'],
          mainFields: ['browser', 'module', 'jsnext:main', 'main'],
          preserveSymlinks: true
        },
        build: {
          target: 'esnext',
          lib: {
            entry: appConfigPath,
            formats: ['cjs'],
            fileName: (_) => OUTPUT_MAIN_JS_NAME
          },
          emptyOutDir: false,
          polyfillModulePreload: false,
          watch: env.mode === 'development' ? {} : null,
          minify: env.mode === 'development' ? false : 'terser',
          rollupOptions: {
            output: {
              format: 'cjs',
              assetFileNames: '[name][extname]',
              chunkFileNames (chunkInfo) {
                const pagesInfo = getPagesInfo(sourceDir, fileType.templ)
                for (const item of pagesInfo) {
                  if (item.configPath === chunkInfo.facadeModuleId || item.path === chunkInfo.facadeModuleId) {
                    return `${item.name}.js`
                  }
                }
                return '[name].js'
              },
              manualChunks (id, { getModuleInfo }) {
                if (taroBaseReg.test(id)) {
                  return 'taro'
                }
                if (isNodeModule(id)) {
                  return 'vendors'
                }
                const importersLen = getModuleInfo(id)?.importers.length
                if (importersLen && importersLen > 1) {
                  return 'common'
                }
              }
            }
          }
        } as BuildOptions
      }
    },
    configResolved (userConfig) {
      const plugins = userConfig.plugins as any[]
      /* @ts-ignore */
      plugins.push(inject({
        window: ['@tarojs/runtime', 'window'],
        document: ['@tarojs/runtime', 'document'],
        navigator: ['@tarojs/runtime', 'navigator'],
        requestAnimationFrame: ['@tarojs/runtime', 'requestAnimationFrame'],
        cancelAnimationFrame: ['@tarojs/runtime', 'cancelAnimationFrame'],
        Element: ['@tarojs/runtime', 'TaroElement'],
        SVGElement: ['@tarojs/runtime', 'SVGElement'],
        MutationObserver: ['@tarojs/runtime', 'MutationObserver']
      }))
    }
  } as Plugin
}
