import type { IPluginContext } from '@tarojs/service'
import { RunnerType } from '@tarojs/taro/types/compile'

import { modifyMiniWebpackChain } from './webpack.mini'
import { modifyH5WebpackChain } from './webpack.h5'

import { modifyMiniViteConfig } from './vite.mini'
import { modifyH5ViteConfig } from './vite.h5'

export type Frameworks = 'react' | 'preact' | 'nerv'

export default (ctx: IPluginContext) => {
  const { framework, runner } = ctx.initialConfig

  if (framework !== 'react' && framework !== 'nerv' && framework !== 'preact') return
  if (runner === RunnerType.Vite) {
    ctx.modifyBuildConfig(({ buildConfig }) => {
      const { defineConstants, alias } = buildConfig
      defineConstants.__TARO_FRAMEWORK__ = `"${framework}"`
      setAliasVite(framework, alias)
      if (process.env.TARO_ENV !== 'h5') {
        modifyMiniViteConfig(ctx, framework, buildConfig)
      } else {
        modifyH5ViteConfig(ctx, framework, buildConfig)
      }
    })
  } else if (runner === RunnerType.Webpack) {
    ctx.modifyWebpackChain(({ chain }) => {
      // 通用
      setAlias(framework, chain)
      chain
        .plugin('definePlugin')
        .tap(args => {
          const config = args[0]
          config.__TARO_FRAMEWORK__ = `"${framework}"`
          return args
        })
      if (process.env.TARO_ENV === 'h5') {
        // H5
        modifyH5WebpackChain(ctx, framework, chain)
      } else {
        // 小程序
        modifyMiniWebpackChain(ctx, framework, chain)
      }
    })
  }
}

function setAliasVite (framework: Frameworks, alias) {
  switch (framework) {
    case 'preact':
      alias.push({
        find: /react$/,
        replacement: 'preact/compat'
      })
      alias.push({
        find: /react-dom\/test-utils$/,
        replacement: 'preact/test-utils'
      })
      alias.push({
        find: /react-dom$/,
        replacement: 'preact/compat'
      })
      alias.push({
        find: /react\/jsx-runtime$/,
        replacement: 'preact/jsx-runtime'
      })
      break
    case 'nerv':
      alias.push({
        find: /react$/,
        replacement: 'nervjs'
      })
      alias.push({
        find: /react-dom$/,
        replacement: 'nervjs'
      })
      break
  }
}

function setAlias (framework: Frameworks, chain) {
  const alias = chain.resolve.alias

  switch (framework) {
    case 'preact':
      alias.set('react', 'preact/compat')
      alias.set('react-dom/test-utils', 'preact/test-utils')
      alias.set('react-dom', 'preact/compat')
      alias.set('react/jsx-runtime', 'preact/jsx-runtime')
      break
    case 'nerv':
      alias.set('react$', 'nervjs')
      alias.set('react-dom$', 'nervjs')
      break
  }
}
