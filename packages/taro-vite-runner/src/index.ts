import { build } from 'vite'

import { convertBuildConfig, makeViteBaseConfig } from './config'
import miniVitePlugin from './plugins/mini'

export async function buildMini (appPath: string, config) {
  const newConfig = convertBuildConfig(config)
  if (typeof newConfig.modifyBuildConfig === 'function') {
    await newConfig.modifyBuildConfig(newConfig)
  }
  const viteConfig = makeViteBaseConfig(appPath, newConfig)
  const miniConfig = Object.assign({}, viteConfig, {
    plugins: [
      miniVitePlugin(appPath, newConfig)
    ]
  })
  build(miniConfig)
}

export default async (appPath: string, config) => {
  await buildMini(appPath, config)
}
