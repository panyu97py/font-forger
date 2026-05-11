import { ensurePythonRuntime, Flavor, getFontChars, subsetFont, SubsetFontOpt } from '@font-forger/tools'
import { SplitFontOpt, SplitFontPlan } from './types'
import { createLoading, fileHash } from './utils'
import { DEFAULT_REMAINING_CHUNK_SIZE, SPLIT_FONT_ASSET_PATH } from './constants'
import objectHash from 'object-hash'
import path from 'path'
import fs from 'fs'

export const textToUnicodeRange = (text: string): string => {
  if (!text) return ''

  const codePoints = Array.from(text).map(c => c.charCodeAt(0))

  const sorted = [...new Set(codePoints)].sort((a, b) => a - b)

  const toHex = (n: number) => n.toString(16).toUpperCase()

  const ranges = sorted.reduce<{ start: number; end: number }[]>((acc, curr) => {
    if (acc.length === 0) return [{ start: curr, end: curr }]

    const [last] = acc.slice(-1)!

    // ✅ 是否连续
    const isContinuous = curr === last.end + 1

    // 扩展最后一个区间（immutable）
    if (isContinuous) return [...acc.slice(0, -1), { start: last.start, end: curr }]

    // 新开区间
    return [...acc, { start: curr, end: curr }]
  }, [])

  const hexRanges = ranges.map(({ start, end }) => {
    return start === end ? `U+${toHex(start)}` : `U+${toHex(start)}-${toHex(end)}`
  })

  return hexRanges.join(',')
}

const splitFontByPlan = (options: SplitFontOpt) => {
  const { fontPath, plans = [], flavor = Flavor.WOFF2 } = options
  return Promise.all(plans.map(async plan => {
    const planId = objectHash(plan)
    const sourceId = await fileHash(fontPath)
    fs.mkdirSync(path.join(SPLIT_FONT_ASSET_PATH, sourceId), { recursive: true })
    const outputFile = path.join(SPLIT_FONT_ASSET_PATH, sourceId, `${planId}.${flavor}`)
    await subsetFont({ ...plan, fontPath, outputFile } as SubsetFontOpt)
    return { sourceId, planId, outputFile, plan }
  }))
}

const generateSplitPlan = async (options: SplitFontOpt): Promise<SplitFontPlan[]> => {
  const { fontPath, plans: currentPlans = [], splitRemainder = true, remainingChunkSize = DEFAULT_REMAINING_CHUNK_SIZE } = options

  // 获取字体所有字符
  const fontTexts = await getFontChars(fontPath)

  const fontTextsSet = new Set<string>(fontTexts)

  const currentChunkPlan = currentPlans.map<SplitFontPlan>((item:SplitFontPlan) => {
    const { text = '', textFile, unicodes = '' } = item
    const textFileContent = textFile ? fs.readFileSync(textFile, 'utf-8') : ''
    const unicodeChars:string[] = unicodes.split(',').filter(Boolean).flatMap((item:string) => {
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

    const matchCharts:string = text.concat(unicodeChars.join(''), textFileContent)

    const matchChartsFiltered = Array.from(matchCharts).filter(char => fontTextsSet.has(char)).join('')

    // 过滤出字体字符
    return { text: matchChartsFiltered, unicodes: textToUnicodeRange(matchChartsFiltered) }
  })

  const currentChunkUnicodePlan = currentChunkPlan.map<SplitFontPlan>(item => ({ unicodes: item.unicodes }))

  if (!splitRemainder) return currentChunkUnicodePlan

  // 合并所有计划中的字符
  const currentChunkTexts = new Set(currentChunkPlan.reduce((result, item) => result.concat(item.text || ''), ''))

  // 剩余字符
  const remainingChunkTexts = new Set(fontTexts.split('').filter(char => !currentChunkTexts.has(char)))
  // 剩余字符排序
  const remainingChunkTextSorted = Array.from(remainingChunkTexts).sort((a, b) => a.codePointAt(0)! - b.codePointAt(0)!)
  // 剩余字符计划数量
  const remainingChunkPlanCount = Math.ceil(remainingChunkTexts.size / remainingChunkSize)
  // 剩余字符计划
  const remainingChunkPlan = Array.from({ length: remainingChunkPlanCount }, (_, index) => {
    const text = remainingChunkTextSorted.slice(index * remainingChunkSize, (index + 1) * remainingChunkSize).join('')
    return { unicodes: textToUnicodeRange(text) }
  })

  return [...currentChunkUnicodePlan, ...remainingChunkPlan]
}

export const splitFont = async (options: SplitFontOpt) => {
  await ensurePythonRuntime()
  const { startLoading, stopLoading } = createLoading()
  try {
    startLoading('Split font...')
    const finalSplitPlan = await generateSplitPlan(options)
    const outputFiles = await splitFontByPlan({ ...options, plans: finalSplitPlan })
    stopLoading('Split font done', true)
    return outputFiles
  } catch (error) {
    stopLoading('Split font failed', false)
    throw error
  }
}
