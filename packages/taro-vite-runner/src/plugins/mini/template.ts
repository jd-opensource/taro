import * as path from 'path'

import type { Plugin } from 'vite'
import { UnRecursiveTemplate } from '@tarojs/shared/dist/template'
import { isNodeModule, promoteRelativePath } from '@tarojs/helper'
import { Config } from '@tarojs/taro'
import { minify } from 'html-minifier'

import { VITE_PLUGIN_NAME_TEMPLATE } from '../../utils/constants'
import { getIsBuildPluginPath, getTargetFilePath } from '../../utils'
import { componentConfig } from '../../config/template/component'
import { getPagesInfo } from '../../utils/project'

function getComponentName (appPath, sourceDir, componentPath) {
  let componentName: string
  if (isNodeModule(componentPath)) {
    componentName = componentPath.replace(appPath, '').replace(/\\/g, '/').replace(path.extname(componentPath), '')
    componentName = componentName.replace(/node_modules/gi, 'npm')
  } else {
    componentName = componentPath.replace(sourceDir, '').replace(/\\/g, '/').replace(path.extname(componentPath), '')
  }

  return componentName.replace(/^(\/|\\)/, '')
}

export default (appPath: string, config) => {
  const sourceDir = path.join(appPath, config.sourceRoot)
  const {
    template,
    baseLevel,
    isBuildPlugin = false,
    fileType = {
      templ: '.wxml',
      style: '.wxss',
      config: '.json',
      script: '.js',
      xs: '.wxs'
    },
    minifyXML
  } = config
  function generateTemplateFile (emitFn, filePath: string, templateFn: (...args) => string, ...options) {
    let templStr = templateFn(...options)
    const fileTemplName = getTargetFilePath(getComponentName(appPath, sourceDir, filePath), fileType.templ)
    if (minifyXML?.collapseWhitespace) {
      templStr = minify(templStr, {
        collapseWhitespace: true,
        keepClosingSlash: true
      })
    }
    emitFn({
      type: 'asset',
      fileName: fileTemplName,
      source: templStr
    })
  }

  function generateConfigFile (emitFn, filePath: string, config: Config & { component?: boolean }) {
    const fileConfigName = getTargetFilePath(getComponentName(appPath, sourceDir, filePath), fileType.config)
    const unOfficalConfigs = ['enableShareAppMessage', 'enableShareTimeline', 'components']
    unOfficalConfigs.forEach(item => {
      delete config[item]
    })
    const fileConfigStr = JSON.stringify(config)
    emitFn({
      type: 'asset',
      fileName: fileConfigName,
      source: fileConfigStr
    })
  }

  function generateXSFile (emitFn, xsPath, xsFn) {
    const ext = fileType.xs
    if (ext == null) {
      return
    }

    const xs = xsFn()
    const fileXsName = getTargetFilePath(xsPath, ext)
    const filePath = getIsBuildPluginPath(fileXsName, isBuildPlugin)
    emitFn({
      type: 'asset',
      fileName: filePath,
      source: xs
    })
  }

  const baseTemplateName = getIsBuildPluginPath('base', isBuildPlugin)
  const compName = 'comp'
  const customWrapperName = 'custom-wrapper'
  const compNamePath = getIsBuildPluginPath(compName, isBuildPlugin)
  const customWrapperNamePath = getIsBuildPluginPath(customWrapperName, isBuildPlugin)

  if (template.isSupportRecursive === false && baseLevel > 0) {
    (template as UnRecursiveTemplate).baseLevel = baseLevel
  }
  return {
    name: VITE_PLUGIN_NAME_TEMPLATE,
    enforce: 'post',
    buildStart () {
      this.emitFile({
        type: 'chunk',
        id: path.resolve(__dirname, '../../..', 'src/config/template/comp.ts'),
        fileName: 'comp.js'
      })
      this.emitFile({
        type: 'chunk',
        id: path.resolve(__dirname, '../../..', 'src/config/template/custom-wrapper.ts'),
        fileName: 'custom-wrapper.js'
      })
    },
    generateBundle () {
      const pagesInfo = getPagesInfo(sourceDir, fileType.templ)
      if (!template.isSupportRecursive) {
        // 如微信、QQ 不支持递归模版的小程序，需要使用自定义组件协助递归
        generateTemplateFile(this.emitFile, compNamePath, template.buildBaseComponentTemplate, fileType.templ)
        generateConfigFile(this.emitFile, compNamePath, {
          component: true,
          usingComponents: {
            [compName]: `./${compName}`,
            [customWrapperName]: `./${customWrapperName}`
          }
        })
        generateConfigFile(this.emitFile, customWrapperNamePath, {
          component: true,
          usingComponents: {
            [compName]: `./${compName}`,
            [customWrapperName]: `./${customWrapperName}`
          }
        })
      } else {
        generateConfigFile(this.emitFile, customWrapperNamePath, {
          component: true,
          usingComponents: {
            [customWrapperName]: `./${customWrapperName}`
          }
        })
      }
      generateTemplateFile(this.emitFile, baseTemplateName, template.buildTemplate, componentConfig)
      generateTemplateFile(this.emitFile, customWrapperNamePath, template.buildCustomComponentTemplate, fileType.templ)
      generateXSFile(this.emitFile, 'utils', template.buildXScript)
      pagesInfo.forEach(page => {
        const importBaseTemplatePath = promoteRelativePath(path.relative(page.path, path.join(sourceDir, getTargetFilePath(baseTemplateName, fileType.templ))))
        const config = page.config
        if (config) {
          const importBaseCompPath = promoteRelativePath(path.relative(page.path, path.join(sourceDir, getTargetFilePath(compNamePath, ''))))
          const importCustomWrapperPath = promoteRelativePath(path.relative(page.path, path.join(sourceDir, getTargetFilePath(customWrapperNamePath, ''))))
          if (!page.isNative) {
            config.usingComponents = {
              [customWrapperName]: importCustomWrapperPath,
              ...config.usingComponents
            }
            if (!template.isSupportRecursive) {
              config.usingComponents[compName] = importBaseCompPath
            }
          }
          generateConfigFile(this.emitFile, page.path, config)
        }
        if (!page.isNative) {
          generateTemplateFile(this.emitFile, page.path, template.buildPageTemplate, importBaseTemplatePath)
        }
      })
    }
  } as Plugin
}
