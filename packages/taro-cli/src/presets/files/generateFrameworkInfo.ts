import { getPkgVersion } from '../../util'

import type { IPluginContext } from '@tarojs/service'

export default (ctx: IPluginContext) => {
  ctx.registerMethod('generateFrameworkInfo', () => {
    const { getInstalledNpmPkgVersion, processTypeEnum, printLog, chalk } = ctx.helper
    const { nodeModulesPath } = ctx.paths
    const { date, outputRoot } = ctx.initialConfig
    const frameworkInfoFileName = '.frameworkinfo'
    const frameworkName = '@tarojs/runtime'
    const frameworkVersion = getInstalledNpmPkgVersion(frameworkName, nodeModulesPath)

    if (frameworkVersion) {
      const frameworkinfo = {
        toolName: 'Taro',
        toolCliVersion: getPkgVersion(),
        toolFrameworkVersion: frameworkVersion,
        createTime: date ? new Date(date).getTime() : Date.now()
      }
      ctx.writeFileToDist({
        filePath: frameworkInfoFileName,
        content: JSON.stringify(frameworkinfo, null, 2)
      })
      printLog(processTypeEnum.GENERATE, '框架信息', `${outputRoot}/${frameworkInfoFileName}`)
    } else {
      printLog(processTypeEnum.WARNING, '依赖安装', chalk.red(`项目依赖 ${frameworkName} 未安装，或安装有误！`))
    }
  })
}
