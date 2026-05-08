import { getFontChars, subsetFont, SubsetFontOpt } from '@font-forger/tools'
import { SplitFontOpt, SplitFontPlan } from './types'
import { DEFAULT_REMAINING_CHUNK_SIZE, SPLIT_FONT_ASSET_PATH } from './constants'
import objectHash from 'object-hash'
import path from 'path'
import fs from 'fs'
import { fileHash } from './utils'

const splitFontByPlan = (options: SplitFontOpt) => {
  const { fontPath, plans = [] } = options
  return Promise.all(plans.map(async plan => {
    const fontHash = await fileHash(fontPath)
    fs.mkdirSync(path.join(SPLIT_FONT_ASSET_PATH, fontHash), { recursive: true })
    const output = path.join(SPLIT_FONT_ASSET_PATH, fontHash, objectHash(plan))
    return subsetFont({ ...plan, fontPath, output } as SubsetFontOpt)
  }))
}

const generateSplitPlan = async (options: SplitFontOpt): Promise<SplitFontPlan[]> => {
  const { fontPath, plans: currentPlans = [], remainingChunkSize = DEFAULT_REMAINING_CHUNK_SIZE } = options

  // 获取字体所有字符
  const fontTexts = await getFontChars(fontPath)

  // 合并所有计划中的字符
  const currentChunkTexts = new Set(currentPlans.reduce((result, item) => {
    const { test, textFile, unicodes = '' } = item
    const textFileContent = fs.readFileSync(textFile, 'utf-8')
    const unicodeChars = unicodes.split(',').flatMap((item:string) => {
      const segment = item.trim().replace(/^U\+|\s+/gi, '')
      // 单个: U+4E00
      if (!segment.includes('-')) return [String.fromCodePoint(parseInt(segment, 16))]
      // 范围: U+4E00-U+9FA5
      const [start, end] = segment.split('-')
      const startCode = parseInt(start, 16)
      const endCode = parseInt(end, 16)
      const length = endCode - startCode + 1
      return Array.from({ length }, (_, i) => String.fromCodePoint(startCode + i))
    })
    return result.concat(unicodeChars, textFileContent, test)
  }, ''))

  // 剩余字符
  const remainingChunkTexts = new Set(fontTexts.split('').filter(char => !currentChunkTexts.has(char)))
  // 剩余字符排序
  const remainingChunkTextSorted = Array.from(remainingChunkTexts).sort((a, b) => a.codePointAt(0)! - b.codePointAt(0)!)
  // 剩余字符计划数量
  const remainingChunkPlanCount = Math.ceil(remainingChunkTexts.size / remainingChunkSize)
  // 剩余字符计划
  const remainingChunkPlan = Array.from({ length: remainingChunkPlanCount }, (_, index) => {
    const text = remainingChunkTextSorted.slice(index * remainingChunkSize, (index + 1) * remainingChunkSize).join('')
    return { text }
  })

  return [...currentPlans, ...remainingChunkPlan]
}

export const splitFont = async (options: SplitFontOpt) => {
  const finalSplitPlan = await generateSplitPlan(options)
  return splitFontByPlan({ ...options, plans: finalSplitPlan })
}
