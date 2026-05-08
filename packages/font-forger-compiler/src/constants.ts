import findCacheDirectory from 'find-cache-directory'
import path from 'path'

export const CACHE_DIR = findCacheDirectory({ name: '@font-forger/compiler' }) || path.join(__dirname, '../node_modules/.cache')
/**
 * 原始字体资源路径
 */
export const SOURCE_FONT_ASSET_PATH = path.join(CACHE_DIR, 'source-font')

/**
 * 已分割的字体资源路径
 */
export const SPLIT_FONT_ASSET_PATH = path.join(CACHE_DIR, 'split-font')

export const DEFAULT_REMAINING_CHUNK_SIZE = 1000
