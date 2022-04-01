import { getLoaderMeta } from './loader-meta'

import type { IPluginContext } from '@tarojs/service'
import type { Frameworks } from './index'

export function modifyMiniViteConfig (ctx: IPluginContext, framework: Frameworks, buildConfig) {
  setAlias(ctx, framework, buildConfig.alias)
  setLoader(framework, buildConfig)
}

function setAlias (ctx: IPluginContext, framework: Frameworks, alias) {
  const config = ctx.initialConfig
  if (framework === 'react') {
    alias.push({
      find: /react-dom$/,
      replacement: '@tarojs/react'
    })
    if (process.env.NODE_ENV !== 'production' && config.mini?.debugReact !== true) {
      // 不是生产环境，且没有设置 debugReact，则使用压缩版本的 react 依赖，减少体积
      alias.push({
        find: /react-reconciler$/,
        replacement: 'react-reconciler/cjs/react-reconciler.production.min.js'
      })
      alias.push({
        find: /react$/,
        replacement: 'react/cjs/react.production.min.js'
      })
      alias.push({
        find: /scheduler$/,
        replacement: 'scheduler/cjs/scheduler.production.min.js'
      })
      alias.push({
        find: /react\/jsx-runtime$/,
        replacement: 'react/cjs/react-jsx-runtime.production.min.js'
      })
    }
  }
}

function setLoader (framework: Frameworks, buildConfig) {
  buildConfig.loaderMeta = getLoaderMeta(framework)
}
