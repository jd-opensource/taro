import type { Plugin } from 'vite'

import { createFilter } from 'rollup-pluginutils'

import { VITE_PLUGIN_STYLE_MINI } from '../../utils/constants'
import { getTargetFilePath } from '../../utils'

export default (_: string, config) => {
  const cssCodeMap: Map<string, {
    code: string
  }> = new Map()
  const {
    fileType = {
      templ: '.wxml',
      style: '.wxss',
      config: '.json',
      script: '.js',
      xs: '.wxs'
    }
  } = config
  const scssfilter = createFilter(/\.scss$/i, [])
  const nativeStyleFilter = createFilter(new RegExp(`${fileType.style}$`), [])
  return {
    name: VITE_PLUGIN_STYLE_MINI,
    transform (code: string, id: string) {
      if (!scssfilter(id) && !nativeStyleFilter(id)) return null
      cssCodeMap.set(id, {
        code
      })
      return {
        code: '',
        map: null,
        meta: {
          transformedByCSSChunks: true
        }
      }
    },
    generateBundle (_, bundle) {
      for (const chunk of Object.values(bundle).reverse()) {
        if (chunk.type === 'asset') continue
        let code = ''
        const cssChunks: string[] = []
        for (const f of Object.keys(chunk.modules)) {
          this.getModuleInfo(f)?.importedIds
            ?.filter(v => this.getModuleInfo(v)?.meta.transformedByCSSChunks === true)
            .forEach(v => cssChunks.push(v))
        }
        for (const f of cssChunks) {
          code += cssCodeMap.get(f)?.code + '\n'
        }
        if (code === '') continue
        const fileName = getTargetFilePath(chunk.fileName, fileType.style)
        this.emitFile({
          type: 'asset',
          fileName: fileName,
          source: code
        })
        chunk.imports.push(fileName)
      }
    }
  } as Plugin
}
