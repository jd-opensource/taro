import * as path from 'path'

import type { Plugin } from 'vite'
import { promoteRelativePath } from '@tarojs/helper'

import { VITE_PLUGIN_NAME_PAGES } from '../../utils/constants'
import { getPageFromConfigPath, isPageConfig } from '../../utils/project'

export default (_: string, config) => {
  const {
    loaderMeta,
    hot
  } = config
  const { modifyInstantiate } = loaderMeta
  return {
    name: VITE_PLUGIN_NAME_PAGES,
    enforce: 'post',
    async transform (_, id) {
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
      }
    }
  } as Plugin
}
