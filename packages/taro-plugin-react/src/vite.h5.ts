import { IPluginContext } from '@tarojs/service'

import type { Frameworks } from './index'
import { getLoaderMeta } from './loader-meta'
import apiLoaderPlugin from './vite-api-loader'

export function modifyH5ViteConfig (ctx: IPluginContext, framework: Frameworks, buildConfig) {
  setAlias(ctx, buildConfig.alias)
  setLoader(framework, buildConfig)
  ctx.modifyViteConfig(({ viteConfig }) => {
    const plugins = viteConfig.plugins as any[]
    plugins.push(apiLoaderPlugin())
  })
}

function setAlias (ctx: IPluginContext, alias) {
  const config = ctx.initialConfig

  if (config.h5?.useHtmlComponents) {
    alias.push({
      find: /@tarojs\/components$/,
      replacement: '@tarojs/components-react/index'
    })
  } else {
    alias.push({
      find: /@tarojs\/components$/,
      replacement: '@tarojs/components/dist-h5/react'
    })
  }
}

function setLoader (framework: Frameworks, buildConfig) {
  buildConfig.loaderMeta = getLoaderMeta(framework)
}
