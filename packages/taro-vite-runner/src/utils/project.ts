import * as path from 'path'

import { readConfig, resolveScriptPath } from '@tarojs/helper'
import { AppConfig } from '@tarojs/taro'

import { getConfigFilePath, getTargetFilePath, isNativePageORComponent } from '.'

export interface IFileInfo {
  name: string
  path: string
  isNative: boolean
  configPath: string
  config?: any
  templ?: string
}

let appConfig: AppConfig
let pagesInfo: IFileInfo[]

export function getAppConfig () {
  return appConfig
}

export function setAppConfig (config: AppConfig) {
  appConfig = config
}

export function getPagesInfo (sourceDir: string, templType): IFileInfo[] {
  if (pagesInfo) return pagesInfo
  const { pages } = getAppConfig()
  if (!pages || !pages.length) return []
  pagesInfo = pages.map(item => {
    const pagePath = resolveScriptPath(path.resolve(sourceDir, item))
    const pageConfigPath = getConfigFilePath(pagePath)
    const pageTemplatePath = getTargetFilePath(pagePath, templType)
    const isNative = isNativePageORComponent(pageTemplatePath)
    const pageConfig = readConfig(pageConfigPath)
    return Object.assign({}, {
      name: item,
      path: pagePath,
      configPath: pageConfigPath,
      config: pageConfig,
      isNative
    }, isNative ? {
      templ: pageTemplatePath
    } : {})
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

export function getPageFromPath (id): IFileInfo | null {
  for (const item of pagesInfo) {
    if (item.path === id) {
      return item
    }
  }
  return null
}
