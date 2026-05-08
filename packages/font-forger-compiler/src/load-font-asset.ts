import got from 'got'
import path from 'path'
import crypto from 'crypto'
import fs from 'fs'
import { pipeline } from 'stream/promises'
import { SOURCE_FONT_ASSET_PATH } from './constants'

const loadRemoteFontAsset = async (assetPath: string) => {
  const ext = path.extname(assetPath)
  const pathHash = crypto.createHash('sha256').update(assetPath).digest('hex')
  const tempFilePath = path.join(SOURCE_FONT_ASSET_PATH, `${pathHash}${ext}`)

  // 下载字体资产
  const stream = got.stream(assetPath)
  await fs.promises.mkdir(SOURCE_FONT_ASSET_PATH, { recursive: true })
  await pipeline(stream, fs.createWriteStream(tempFilePath))

  // 重命名临时资产到目标路径
  const buffer = fs.readFileSync(tempFilePath)
  const fileHash = crypto.createHash('sha256').update(buffer).digest('hex')
  const finalFilePath = path.join(SOURCE_FONT_ASSET_PATH, `${fileHash}${ext}`)
  fs.renameSync(tempFilePath, finalFilePath)
  return finalFilePath
}

const loadLocalFontAsset = (assetPath: string) => {
  const ext = path.extname(assetPath)
  const filePath = path.isAbsolute(assetPath) ? assetPath : path.resolve(process.cwd(), assetPath)
  const isFilePathAccessible = fs.existsSync(filePath)
  if (!isFilePathAccessible) throw new Error(`splitFontFile: local source does not exist: ${filePath}`)

  // 拷贝文件
  const buffer = fs.readFileSync(filePath)
  const fileHash = crypto.createHash('sha256').update(buffer).digest('hex')
  const finalFilePath = path.join(SOURCE_FONT_ASSET_PATH, `${fileHash}${ext}`)
  fs.copyFileSync(filePath, finalFilePath)
  return finalFilePath
}

const extMap:Record<string, string> = {
  'font/woff2': 'woff2',
  'font/woff': 'woff',
  'font/ttf': 'ttf'
}

const loadBase64Asset = (assetPath: string) => {
  const [_, mime, base64] = assetPath.match(/^data:([^;]+);base64,(.+)$/) || []
  if (!mime || !base64) throw new Error(`splitFontFile: base64 asset path is invalid: ${assetPath}`)
  const buffer = Buffer.from(base64, 'base64')
  const fileHash = crypto.createHash('sha256').update(buffer).digest('hex')
  const finalFilePath = path.join(SOURCE_FONT_ASSET_PATH, `${fileHash}${extMap[mime!] || ''}`)
  fs.writeFileSync(finalFilePath, buffer)
  return finalFilePath
}

export const loadFontAsset = (assetPath: string) => {
  if (/^https?:\/\//i.test(assetPath)) return loadRemoteFontAsset(assetPath)
  if (/^data:[^;]+;base64,/.test(assetPath)) return loadBase64Asset(assetPath)
  return loadLocalFontAsset(assetPath)
}
