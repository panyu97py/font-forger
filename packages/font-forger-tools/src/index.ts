import { runPython } from './python'
import { PYFTCHARS_PEX, PYFTSUBSET_PEX } from './constants'

/**
 * 拆分字体
 * @param fontPath
 * @param text
 * @param output
 */
export const splitFont = async (fontPath: string, text: string, output: string) => {
  await runPython([PYFTSUBSET_PEX, fontPath, `--text="${text}"`, `--output-file=${output}`])
}

/**
 * 获取字体所有字符
 * @param fontPath
 */
export const getFontChars = (fontPath: string) => {
  return runPython([PYFTCHARS_PEX, fontPath])
}
