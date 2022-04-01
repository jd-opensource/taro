import * as path from 'path'

import { readConfig, resolveScriptPath } from '@tarojs/helper'
import { AppConfig } from '@tarojs/taro'

import { getConfigFilePath } from '.'

export interface IFileInfo {
  name: string
  path: string
  isNative: boolean
  configPath: string
  config?: any
}

let appConfig: AppConfig
let pagesInfo: IFileInfo[]

export function getAppConfig () {
  return appConfig
}

export function setAppConfig (config: AppConfig) {
  appConfig = config
}

export function getPagesInfo (sourceDir: string): IFileInfo[] {
  if (pagesInfo) return pagesInfo
  const { pages } = getAppConfig()
  if (!pages || !pages.length) return []
  pagesInfo = pages.map(item => {
    const pagePath = resolveScriptPath(path.resolve(sourceDir, item))
    const pageConfigPath = getConfigFilePath(pagePath)
    const pageConfig = readConfig(pageConfigPath)
    return {
      name: item,
      path: pagePath,
      configPath: pageConfigPath,
      config: pageConfig,
      isNative: false
    }
  })
  return pagesInfo
}

export function isPage (id): boolean {
  for (const item of pagesInfo) {
    if (item.path === id) {
      return true
    }
  }
  return false
}

export function isPageConfig (id): boolean {
  for (const item of pagesInfo) {
    if (item.configPath === id) {
      return true
    }
  }
  return false
}

export function getPageFromConfigPath (id): IFileInfo | null {
  for (const item of pagesInfo) {
    if (item.configPath === id) {
      return item
    }
  }
  return null
}
