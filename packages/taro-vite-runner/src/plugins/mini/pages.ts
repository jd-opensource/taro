import * as path from 'path'
import * as fs from 'fs'

import type { Plugin } from 'vite'
import { promoteRelativePath } from '@tarojs/helper'

import { VITE_PLUGIN_PAGES_MINI } from '../../utils/constants'
import { getPageFromConfigPath, getPageFromPath, isPage, isPageConfig } from '../../utils/project'
import { getTargetFilePath } from '../../utils'

export default (_: string, config) => {
  const {
    loaderMeta,
    hot,
    fileType = {
      templ: '.wxml',
      style: '.wxss',
      config: '.json',
      script: '.js',
      xs: '.wxs'
    }
  } = config
  const { modifyInstantiate } = loaderMeta
  return {
    name: VITE_PLUGIN_PAGES_MINI,
    enforce: 'post',
    resolveId (id) {
      if (isPageConfig(id)) {
        const page = getPageFromConfigPath(id)!
        if (!page.isNative) {
          return id
        }
        return page.path
      }
    },
    load (id) {
      if (isPageConfig(id)) {
        const page = getPageFromConfigPath(id)!
        const pagePath = page.path
        const pageConfigRelativePath = promoteRelativePath(path.relative(id, pagePath))
        const pageConfig = page.config
        const pageConfigString = JSON.stringify(pageConfig)
        const hmr = !hot ? '' : `if (process.env.NODE_ENV !== 'production') {
          const cache = __webpack_require__.c
          Object.keys(cache).forEach(item => {
            if (item.indexOf('${page.name}') !== -1) delete cache[item]
          })
        }`
        // if (typeof loaderMeta.modifyConfig === 'function') {
        //   const pageCode = fs.readFileSync(pagePath).toString()
        //   loaderMeta.modifyConfig(pageConfig, pageCode)
        // }
        let instantiatePage = `var inst = Page(createPageConfig(component, '${page.name}', {root:{cn:[]}}, config || {}))`
        if (typeof modifyInstantiate === 'function') {
          instantiatePage = modifyInstantiate(instantiatePage, 'page')
        }
        return {
          code: `
          import { createPageConfig } from '@tarojs/runtime'
          import component from '${pageConfigRelativePath}'
          var config = ${pageConfigString};
          ${pageConfig.enableShareTimeline ? 'component.enableShareTimeline = true' : ''}
          ${pageConfig.enableShareAppMessage ? 'component.enableShareAppMessage = true' : ''}
          ${instantiatePage}
          ${hmr}
          `
        }
      } else if (isPage(id)) {
        const page = getPageFromPath(id)!
        const pageTemplatePath = page.templ
        const pageStylePath = getTargetFilePath(page.path, fileType.style)
        if (pageTemplatePath) {
          this.emitFile({
            type: 'asset',
            fileName: page.name + fileType.templ,
            source: fs.readFileSync(pageTemplatePath).toString()
          })
          if (fs.existsSync(pageStylePath)) {
            const code = fs.readFileSync(page.path).toString()
            return {
              code: `
              import '${pageStylePath}';
              ${code}
              `
            }
          }
        }
      }
    }
  } as Plugin
}
