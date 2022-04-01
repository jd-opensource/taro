import * as path from 'path'
import * as fs from 'fs'

import { recursiveMerge, resolveMainFilePath } from '@tarojs/helper'
import { partial } from 'lodash'
import { mapKeys } from 'lodash/fp'

import { IOption } from './types'

export function getAppEntry (entry) {
  const app = entry.app
  if (Array.isArray(app)) {
    return app[0]
  }
  return app
}

export function getTargetFilePath (filePath: string, targetExtname: string) {
  const extname = path.extname(filePath)
  if (extname) {
    return filePath.replace(extname, targetExtname)
  }
  return filePath + targetExtname
}

export function getConfigFilePath (filePath: string) {
  return resolveMainFilePath(`${filePath.replace(path.extname(filePath), '')}.config`)
}

export function getIsBuildPluginPath (filePath, isBuildPlugin) {
  return isBuildPlugin ? `plugin/${filePath}` : filePath
}

export function getRuntimeConstants (runtime) {
  const constants: Record<string, boolean> = {}

  constants.ENABLE_INNER_HTML = runtime.enableInnerHTML ?? true

  constants.ENABLE_ADJACENT_HTML = runtime.enableAdjacentHTML ?? false

  constants.ENABLE_SIZE_APIS = runtime.enableSizeAPIs ?? false

  constants.ENABLE_TEMPLATE_CONTENT = runtime.enableTemplateContent ?? false

  constants.ENABLE_CLONE_NODE = runtime.enableCloneNode ?? false

  constants.ENABLE_CONTAINS = runtime.enableContains ?? false

  constants.ENABLE_MUTATION_OBSERVER = runtime.enableMutationObserver ?? false

  return constants
}

export const processEnvOption = partial(mapKeys as any, (key: string) => `process.env.${key}`) as any

export const mergeOption = ([...options]: IOption[]): IOption => {
  return recursiveMerge({}, ...options)
}

export function isNativePageORComponent (templatePath: string): boolean {
  return fs.existsSync(templatePath)
}
