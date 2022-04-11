import * as fs from 'fs'

import loader from './api-loader'

export default function () {
  return {
    name: 'taro:vite_api_loader',
    enforce: 'pre',
    load (id) {
      if (/taro-h5[\\/]dist[\\/]index/.test(id)) {
        const code = fs.readFileSync(id).toString()
        return {
          code: loader(code)
        }
      }
    }
  }
}
