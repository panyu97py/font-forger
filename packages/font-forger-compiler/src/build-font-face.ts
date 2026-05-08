import postcss from 'postcss'
import { FontConfig } from './types'

export const buildFontFace = (fontFaceConfigList: FontConfig[]) => {
  return fontFaceConfigList.map((fontFaceConfig) => {
    const root = postcss.root()
    const fontFaceRule = postcss.atRule({ name: 'font-face' })
    root.append(fontFaceRule)
    fontFaceRule.append(postcss.decl({ prop: 'font-family', value: fontFaceConfig.family }))
    if (fontFaceConfig.weight) fontFaceRule.append(postcss.decl({ prop: 'font-weight', value: fontFaceConfig.weight }))
    if (fontFaceConfig.style) fontFaceRule.append(postcss.decl({ prop: 'font-style', value: fontFaceConfig.style }))
    if (fontFaceConfig.variant) fontFaceRule.append(postcss.decl({ prop: 'font-variant', value: fontFaceConfig.variant }))
    if (fontFaceConfig.unicodeRange) fontFaceRule.append(postcss.decl({ prop: 'unicode-range', value: fontFaceConfig.unicodeRange }))

    const sourceText = fontFaceConfig.sources.map((source) => {
      if (!source.url) return ''
      if (!source.format) return `url('${source.url}')`
      return `url('${source.url}') format('${source.format}')`
    }).filter(Boolean).join(', ')

    if (sourceText) fontFaceRule.append(postcss.decl({ prop: 'src', value: sourceText }))

    const code = root.toString()

    return { ...fontFaceConfig, code, rule: fontFaceRule }
  })
}
