export const normalizePath = url => {
  let _isRelative
  let _leadingParents = ''
  let _parent, _pos

  // handle relative paths
  if (url.charAt(0) !== '/') {
    _isRelative = true
    url = '/' + url
  }

  // handle relative files (as opposed to directories)
  if (url.substring(-3) === '/..' || url.slice(-2) === '/.') {
    url += '/'
  }

  // resolve simples
  url = url.replace(/(\/(\.\/)+)|(\/\.$)/g, '/').replace(/\/{2,}/g, '/')

  // remember leading parents
  if (_isRelative) {
    _leadingParents = url.substring(1).match(/^(\.\.\/)+/) || ''
    if (_leadingParents) {
      _leadingParents = _leadingParents[0]
    }
  }

  // resolve parents
  while (true) {
    _parent = url.search(/\/\.\.(\/|$)/)
    if (_parent === -1) {
      // no more ../ to resolve
      break
    } else if (_parent === 0) {
      // top level cannot be relative, skip it
      url = url.substring(3)
      continue
    }

    _pos = url.substring(0, _parent).lastIndexOf('/')
    if (_pos === -1) {
      _pos = _parent
    }
    url = url.substring(0, _pos) + url.substring(_parent + 3)
  }

  // revert to relative
  if (_isRelative) {
    url = _leadingParents + url.substring(1)
  }

  return url
}

export const splitUrl = _url => {
  let url = _url || ''
  let pos
  const res = {
    path: null,
    query: null,
    fragment: null
  }

  pos = url.indexOf('#')
  if (pos > -1) {
    res.fragment = url.substring(pos + 1)
    url = url.substring(0, pos)
  }

  pos = url.indexOf('?')
  if (pos > -1) {
    res.query = url.substring(pos + 1)
    url = url.substring(0, pos)
  }

  res.path = url

  return res
}
