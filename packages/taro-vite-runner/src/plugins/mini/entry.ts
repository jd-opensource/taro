import * as path from 'path'

import type { Plugin } from 'vite'
import type { OutputChunk } from 'rollup'
import { promoteRelativePath, readConfig } from '@tarojs/helper'
import { AppConfig } from '@tarojs/taro'

import { DO_NOT_NEED_CODE, OUTPUT_MAIN_CONFIG_NAME, OUTPUT_MAIN_JS_NAME, VITE_PLUGIN_ENTRY_MINI } from '../../utils/constants'
import { getAppEntry, getConfigFilePath, removeNoNeedCode } from '../../utils'
import { getAppConfig, getPagesInfo, setAppConfig } from '../../utils/project'

export default (appPath: string, config) => {
  const sourceDir = path.join(appPath, config.sourceRoot)
  const {
    runtimePath,
    loaderMeta,
    designWidth,
    deviceRatio,
    blended,
    fileType = {
      templ: '.wxml',
      style: '.wxss',
      config: '.json',
      script: '.js',
      xs: '.wxs'
    }
  } = config
  const { importFrameworkStatement, frameworkArgs, creator, creatorLocation, modifyInstantiate } = loaderMeta
  const pxTransformConfig = {
    designWidth: designWidth || 750,
    deviceRatio: deviceRatio || {
      750: 1
    }
  }
  const appEntry = getAppEntry(config.entry)
  const appConfigPath = getConfigFilePath(appEntry)
  return {
    name: VITE_PLUGIN_ENTRY_MINI,
    enforce: 'pre',
    load (id) {
      if (id === appConfigPath) {
        const appConfig = readConfig(appConfigPath) as AppConfig
        const appConfigRelativePath = promoteRelativePath(path.relative(appConfigPath, appEntry))
        setAppConfig(appConfig)
        this.addWatchFile(appEntry)
        const newRuntimePath = Array.isArray(runtimePath) ? runtimePath : [runtimePath]
        const setReconciler = newRuntimePath.reduce((res, item) => {
          return res + `import '${item}'\n`
        }, '')
        const createApp = `${creator}(component, ${frameworkArgs})`

        let instantiateApp = blended
          ? `
      var app = ${createApp}
      app.onLaunch()
      exports.taroApp = app
      `
          : `var inst = App(${createApp})`

        if (typeof modifyInstantiate === 'function') {
          instantiateApp = modifyInstantiate(instantiateApp, 'app')
        }
        // dynamic import pages
        const pagesInfo = getPagesInfo(sourceDir, fileType.templ)
        const pageImports = pagesInfo.map(item => {
          return `import('${item.configPath}')`
        })
        const pageImportsCode = `if(${DO_NOT_NEED_CODE}) {
          ${pageImports.join('\n')}
        }`
        return {
          code: `${setReconciler}
          import { window } from '@tarojs/runtime'
          import { ${creator} } from '${creatorLocation}'
          import { initPxTransform } from '@tarojs/taro'
          import component from '${appConfigRelativePath}'
          ${importFrameworkStatement}
          ${pageImportsCode}
          var config = ${JSON.stringify(appConfig)};
          window.__taroAppConfig = config
          ${instantiateApp}
          initPxTransform({
            designWidth: ${pxTransformConfig.designWidth},
            deviceRatio: ${JSON.stringify(pxTransformConfig.deviceRatio)}
          })
          `
        }
      }
    },
    generateBundle (_, bundle) {
      Object.keys(bundle).forEach(key => {
        if (key === OUTPUT_MAIN_JS_NAME) {
          const bundleItem = bundle[key] as OutputChunk
          const code = removeNoNeedCode(key, bundleItem.code)
          if (code) {
            bundleItem.code = code
          }
        }
      })
      this.emitFile({
        type: 'asset',
        fileName: OUTPUT_MAIN_CONFIG_NAME,
        source: JSON.stringify(getAppConfig(), null, 2)
      })
    }
  } as Plugin
}
