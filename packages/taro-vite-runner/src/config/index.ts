import { isEmptyObject } from '@tarojs/helper'
import type { UserConfig } from 'vite'

import type { IAliasItem } from '../utils/types'

// 构建公共 vite 配置
export function makeViteBaseConfig (appPath: string, config): Partial<UserConfig> {
  return {
    root: appPath,
    mode: process.env.NODE_ENV || 'development',
    publicDir: false,
    clearScreen: config.clearScreen
  }
}

export function convertBuildConfig (buildConfig) {
  const newConfig = Object.assign({}, buildConfig)
  let alias: IAliasItem[] = []
  if (!isEmptyObject(newConfig.alias)) {
    alias = Object.keys(newConfig.alias).map(item => {
      return {
        find: item[item.length - 1] === '$' ? new RegExp(item) : item,
        replacement: newConfig.alias[item]
      }
    })
  }
  newConfig.alias = alias
  return newConfig
}
