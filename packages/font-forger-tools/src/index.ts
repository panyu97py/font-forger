import { runPython } from './python'
import { PYFTCHARS_PEX, PYFTSUBSET_PEX } from './constants'
import { camelToDash } from './utils'
import { SubsetFontOpt } from './types'

export * from './types'

/**
 * 拆分字体
 * @param opt
 */
export const subsetFont = async (opt:SubsetFontOpt) => {
  const { fontPath, text, ...rest } = opt
  const args = Object.keys(rest).map(key => `--${camelToDash(key)}=${rest[key] || ''}`)
  if (text) args.push(`--text="${text}"`)
  await runPython([PYFTSUBSET_PEX, fontPath, ...args])
}

/**
 * 获取字体所有字符
 * @param fontPath
 */
export const getFontChars = (fontPath: string) => {
  return runPython([PYFTCHARS_PEX, fontPath])
}
