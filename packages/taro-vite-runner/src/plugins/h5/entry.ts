import * as path from 'path'

import type { Plugin } from 'vite'
import { AppConfig } from '@tarojs/taro'
import { promoteRelativePath, readConfig, resolveScriptPath } from '@tarojs/helper'

import { getAppEntry, getConfigFilePath } from '../../utils'
import { VITE_PLUGIN_ENTRY_H5 } from '../../utils/constants'
import { getPageFromName, getPagesInfo, setAppConfig } from '../../utils/project'

function genResource (sourceDir: string, pagePath: string, config) {
  return `
  Object.assign({
      path: '${pagePath}',
      load: function() {
        return import('${resolveScriptPath(path.join(sourceDir, pagePath))}')
      }
  }, ${JSON.stringify(config)}),
`
}

export default (appPath: string, config) => {
  const sourceDir = path.join(appPath, config.sourceRoot)
  const {
    loaderMeta,
    useHtmlComponents,
    designWidth,
    deviceRatio,
    router = {}
  } = config
  const {
    importFrameworkStatement,
    frameworkArgs,
    creator,
    creatorLocation,
    importFrameworkName,
    extraImportForWeb,
    execBeforeCreateWebApp,
    compatComponentImport,
    compatComponentExtra
  } = loaderMeta
  const appEntry = getAppEntry(config.entry)
  const appConfigPath = getConfigFilePath(appEntry)
  const webComponents = `
  import { defineCustomElements, applyPolyfills } from '@tarojs/components/loader'
  import '@tarojs/components/dist/taro-components/taro-components.css'
  ${extraImportForWeb || ''}
  applyPolyfills().then(function () {
    defineCustomElements(window)
  })
  `
  const components = useHtmlComponents ? compatComponentImport || '' : webComponents
  const pxTransformConfig = {
    designWidth: designWidth || 750,
    deviceRatio: deviceRatio || {
      750: 1
    }
  }
  return {
    name: VITE_PLUGIN_ENTRY_H5,
    enforce: 'pre',
    load (id) {
      if (id === appConfigPath) {
        const appConfig = readConfig(appConfigPath) as AppConfig
        const appConfigRelativePath = promoteRelativePath(path.relative(appConfigPath, appEntry))
        setAppConfig(appConfig)
        getPagesInfo(sourceDir)
        this.addWatchFile(appEntry)
        let tabBarCode = `var tabbarIconPath = []
        var tabbarSelectedIconPath = []
        `
        if (appConfig.tabBar) {
          const tabbarList = appConfig.tabBar.list
          for (let i = 0; i < tabbarList.length; i++) {
            const t = tabbarList[i]
            if (t.iconPath) {
              const iconPath = path.join(appPath, t.iconPath)
              tabBarCode += `tabbarIconPath[${i}] = typeof require(${iconPath}) === 'object' ? require(${iconPath}).default : require(${iconPath})\n`
            }
            if (t.selectedIconPath) {
              const iconPath = path.join(appPath, t.selectedIconPath)
              tabBarCode += `tabbarSelectedIconPath[${i}] = typeof require(${iconPath}) === 'object' ? require(${iconPath}).default : require(${iconPath})\n`
            }
          }
        }
        const code = `import { createRouter, initPxTransform } from '@tarojs/taro'
        import component from '${appConfigRelativePath}'
        import { window } from '@tarojs/runtime'
        import { ${creator} } from '${creatorLocation}'
        ${importFrameworkStatement}
        ${components}
        var config = ${JSON.stringify({ router, ...appConfig })}
        window.__taroAppConfig = config
        ${appConfig.tabBar ? tabBarCode : ''}
        if (config.tabBar) {
          var tabbarList = config.tabBar.list
          for (var i = 0; i < tabbarList.length; i++) {
            var t = tabbarList[i]
            if (t.iconPath) {
              t.iconPath = tabbarIconPath[i]
            }
            if (t.selectedIconPath) {
              t.selectedIconPath = tabbarSelectedIconPath[i]
            }
          }
        }
        config.routes = [
${appConfig.pages?.map(p => {
  const page = getPageFromName(p)
  return genResource(sourceDir, p, page?.config)
}).join('')}
        ]
        ${useHtmlComponents ? compatComponentExtra : ''}
        ${execBeforeCreateWebApp || ''}
        var inst = ${creator}(component, ${frameworkArgs})
        createRouter(inst, config, ${importFrameworkName})
        initPxTransform({
          designWidth: ${pxTransformConfig.designWidth},
          deviceRatio: ${JSON.stringify(pxTransformConfig.deviceRatio)}
        })
        `
        return {
          code
        }
      }
    }
  } as Plugin
}
