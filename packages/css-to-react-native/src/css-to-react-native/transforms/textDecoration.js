import { regExpToken, tokens } from '../tokenTypes'

const { SPACE, LINE, COLOR } = tokens

const STYLE = regExpToken(/^(solid|double|dotted|dashed)$/)

const defaultTextDecorationLine = 'none'
const defaultTextDecorationStyle = 'solid'
const defaultTextDecorationColor = 'black'

export default tokenStream => {
  let line
  let style
  let color

  let didParseFirst = false
  while (tokenStream.hasTokens()) {
    if (didParseFirst) tokenStream.expect(SPACE)

    if (typeof line === 'undefined' && tokenStream.matches(LINE)) {
      const lines = [tokenStream.lastValue.toLowerCase()]

      tokenStream.saveRewindPoint()
      if (
        lines[0] !== 'none' &&
        tokenStream.matches(SPACE) &&
        tokenStream.matches(LINE)
      ) {
        lines.push(tokenStream.lastValue.toLowerCase())
        // Underline comes before line-through
        lines.sort().reverse()
      } else {
        tokenStream.rewind()
      }

      line = lines.join(' ')
    } else if (typeof style === 'undefined' && tokenStream.matches(STYLE)) {
      style = tokenStream.lastValue
    } else if (typeof color === 'undefined' && tokenStream.matches(COLOR)) {
      color = tokenStream.lastValue
    } else {
      tokenStream.throw()
    }

    didParseFirst = true
  }

  const $merge = {
    textDecorationLine: typeof line !== 'undefined' ? line : defaultTextDecorationLine,
    textDecorationColor:
      typeof color !== 'undefined' ? color : defaultTextDecorationColor,
    textDecorationStyle:
      typeof style !== 'undefined' ? style : defaultTextDecorationStyle
  }
  return { $merge }
}
