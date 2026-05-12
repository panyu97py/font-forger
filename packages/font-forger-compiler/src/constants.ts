import path from 'path'
import { findCacheDirectory } from '@font-forger/helper'

/**
 * 缓存目录
 */
export const CACHE_DIR = findCacheDirectory({ name: '@font-forger/compiler' }) || path.join(__dirname, '../node_modules/.cache')

/**
 * 原始字体资源路径
 */
export const SOURCE_FONT_ASSET_PATH = path.join(CACHE_DIR, 'source-font')

/**
 * 已分割的字体资源路径
 */
export const SPLIT_FONT_ASSET_PATH = path.join(CACHE_DIR, 'split-font')

/**
 * 默认剩余字符块大小
 */
export const DEFAULT_REMAINING_CHUNK_SIZE = 1000
