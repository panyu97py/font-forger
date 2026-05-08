import { FontConfig, FontSource } from './types'
import postcss from 'postcss'
import valueParser, { FunctionNode as ParsedValueFunctionNode, Node as ParsedValueNode } from 'postcss-value-parser'

export const parseFontFace = (source: string) => {
  const root = postcss.parse(source)
  const fontConfigs:Array<Partial<FontConfig>> = []
  root.walkAtRules('font-face', (rule) => {
    const config: Partial<FontConfig> = {}
    rule.walkDecls(decl => {
      if (decl.prop === 'font-family') config.family = decl.value
      if (decl.prop === 'font-weight') config.weight = decl.value
      if (decl.prop === 'font-style') config.style = decl.value
      if (decl.prop === 'font-variant') config.variant = decl.value
      if (decl.prop === 'unicode-range') config.unicodeRange = decl.value
      if (decl.prop === 'src') {
        const parsedVal = valueParser(decl.value)

        const { splitRes } = parsedVal.nodes.reduce((result, item, currentIndex, nodes) => {
          const isSplitNode = item.type === 'div' && item.value === ','
          const isLastNode = currentIndex === nodes.length - 1
          if (isSplitNode) return { splitRes: [...result.splitRes, result.cur], cur: [] }
          if (isLastNode) return { splitRes: [...result.splitRes, [...result.cur, item]], cur: [] }
          return { ...result, cur: [...result.cur, item] }
        }, { splitRes: [] as ParsedValueNode[][], cur: [] as ParsedValueNode[] })

        config.sources = splitRes.map<FontSource>((item: ParsedValueNode[]) => {
          return item.reduce<FontSource>((result, it) => {
            const [valueNode] = (it as ParsedValueFunctionNode).nodes || []

            const isUrlNode = it.type === 'function' && it.value === 'url'
            if (isUrlNode) return { ...result, url: valueNode.value } as FontSource

            const isFormatNode = it.type === 'function' && it.value === 'format'
            if (isFormatNode) return { ...result, format: valueNode.value } as FontSource

            return result
          }, {})
        })
      }
    })
    fontConfigs.push(config)
  })
  return fontConfigs
}
