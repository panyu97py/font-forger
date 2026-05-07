import { SplitFontPlan } from '../types'
import path from 'path'

export const defaultSplitPlan: SplitFontPlan[] = [
  { textFile: path.resolve(__dirname, './default/chinese_level_1.txt') },
  { textFile: path.resolve(__dirname, './default/chinese_level_2.txt') },
  { textFile: path.resolve(__dirname, './default/chinese_level_3.txt') },
  { textFile: path.resolve(__dirname, './default/num_letter_symbol.txt') }
]
