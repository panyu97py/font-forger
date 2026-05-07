import { subsetFont, SubsetFontOpt } from '@font-forger/tools'
import { SplitFontOpt, SplitFontPlan } from './types'
import { SPLIT_FONT_ASSET_PATH } from './constants'
import objectHash from 'object-hash'
import path from 'path'
import fs from 'fs'
import { fileHash } from './utils'

export const splitFontByPlan = (options: Required<SplitFontOpt>) => {
  const { fontPath, plans } = options
  return Promise.all(plans.map(async plan => {
    const fontHash = await fileHash(fontPath)
    fs.mkdirSync(path.join(SPLIT_FONT_ASSET_PATH, fontHash), { recursive: true })
    const output = path.join(SPLIT_FONT_ASSET_PATH, fontHash, objectHash(plan))
    return subsetFont({ ...plan, fontPath, output } as SubsetFontOpt)
  }))
}

export const generateSplitPlan = (options: SplitFontOpt): SplitFontPlan[] => {
  return []
}
