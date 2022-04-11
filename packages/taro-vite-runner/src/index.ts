import { build, createServer } from 'vite'

import { convertBuildConfig, makeViteBaseConfig } from './config'
import miniVitePlugin from './plugins/mini'
import h5VitePlugin from './plugins/h5'

export async function buildMini (appPath: string, config) {
  const viteConfig = makeViteBaseConfig(appPath, config)
  const miniConfig = Object.assign({}, viteConfig, {
    plugins: [
      miniVitePlugin(appPath, config)
    ]
  })
  build(miniConfig)
}

export async function buildH5 (appPath: string, config) {
  const viteConfig = makeViteBaseConfig(appPath, config)
  if (config.isWatch) {
    const server = await createServer(Object.assign({}, viteConfig, {
      base: config.publicPath,
      server: config.server,
      plugins: [
        h5VitePlugin(appPath, config)
      ]
    }))
    await server.listen()
    server.printUrls()
  } else {

  }
}

export default async (appPath: string, config) => {
  const newConfig = convertBuildConfig(config)
  if (typeof newConfig.modifyBuildConfig === 'function') {
    await newConfig.modifyBuildConfig(newConfig)
  }
  if (config.platform === 'h5') {
    await buildH5(appPath, newConfig)
  } else {
    await buildMini(appPath, newConfig)
  }
}
