import { FontConfig, SplitFontOpt } from './types'
import { Compilation, Compiler } from 'webpack'
import { SyncHook } from 'tapable'
import { DEFAULT_REMAINING_CHUNK_SIZE } from './constants'
import { defaultSplitPlan } from './split-plan'
import { parseFontFace } from './parse-font-face'
import { loadFontAsset } from './load-font-asset'
import { splitFont } from './split-font'
import { Flavor } from '@font-forger/tools'
import { buildFontFace } from './build-font-face'
import { MapGroupBy } from './utils'

export interface FontFaceSplitAssets{
  assetName:string,
  splitFontFace:ReturnType<typeof buildFontFace>
}

export interface ProcessFontFaceSplitOpt{
  match: (family: string) => boolean
  fontFaceSplitAssets:FontFaceSplitAssets[]
}

export interface Hooks {
  processFontFaceSplit: SyncHook<ProcessFontFaceSplitOpt>;
}

export interface FontForgerPluginOptions extends Omit<SplitFontOpt, 'fontPath'>{
    match: (family: string) => boolean
    resolver:(filePath:string)=>Promise<string>
}

const defaultOptions: FontForgerPluginOptions = {
  plans: defaultSplitPlan,
  splitRemainder: true,
  remainingChunkSize: DEFAULT_REMAINING_CHUNK_SIZE,
  flavor: Flavor.WOFF2,
  resolver: async (filePath) => Promise.resolve(filePath),
  match: (_) => false
}

export class FontForgerPlugin {
  private readonly options: FontForgerPluginOptions

  public static readonly pluginName = 'FontForgerPlugin'

  private static readonly hooksMap: WeakMap<Compilation, Hooks> = new WeakMap<Compilation, Hooks>()

  constructor (options: Partial<FontForgerPluginOptions> = {}) {
    this.options = { ...defaultOptions, ...options }
  }

  public static getCompilationHooks (compilation: Compilation) {
    if (!this.hooksMap.has(compilation)) {
      const processFontFaceSplit = new SyncHook<ProcessFontFaceSplitOpt>(['processFontFaceSplitOpt'])
      this.hooksMap.set(compilation, { processFontFaceSplit })
    }
    return this.hooksMap.get(compilation)
  }

  apply (compiler: Compiler) {
    const { resolver, match, ...splitFontOpt } = this.options
    compiler.hooks.thisCompilation.tap(FontForgerPlugin.pluginName, (compilation: Compilation) => {
      const hooks = FontForgerPlugin.getCompilationHooks(compilation)

      const stage = compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL

      compilation.hooks.processAssets.tapPromise({ name: FontForgerPlugin.pluginName, stage }, async (assets) => {
        // 解析 font-face 配置
        const fontFaceConfigListGroupByAsset = Object.keys(assets).reduce<Record<string, Partial<FontConfig>[]>>((result, assetName) => {
          const asset = compilation.getAsset(assetName)
          if (!asset || !/\.(css|acss|ttss|wxss)$/.test(assetName)) return result
          const cssSource = asset.source.source().toString()
          const tempFontConfigList = parseFontFace(cssSource).filter(item => match(item.family || ''))
          if (!tempFontConfigList.length) return result
          return { ...result, [assetName]: tempFontConfigList }
        }, {})

        // 获取所有 font-face 配置中的字体文件路径
        const fontFaceSourceUrlList = Object.values(fontFaceConfigListGroupByAsset).flatMap(item => {
          return item.flatMap(item => (item.sources || []).map(source => source.url).filter(Boolean)as string[])
        })

        // 分割字体文件
        const fontFaceListSplitRes = await Promise.all(fontFaceSourceUrlList.map(async sourceUrl => {
          const fontPath = await loadFontAsset(sourceUrl)
          const splitSourcePaths = await splitFont({ fontPath, ...splitFontOpt })
          return [sourceUrl, splitSourcePaths] as const
        }))

        const fontFaceListSplitResMap = new Map(fontFaceListSplitRes)

        // 构建 font-face 样式
        const fontFaceSplitAssets: FontFaceSplitAssets[] = await Promise.all(Object.keys(fontFaceConfigListGroupByAsset).map(async (assetName) => {
          const fontConfigList = fontFaceConfigListGroupByAsset[assetName]

          // 按「字体拆分规则&font-face 配置」分组
          const splitSourceList = fontConfigList.flatMap(item => {
            const { sources = [], ...rest } = item

            const splitSources = sources.flatMap(source => {
              if (!source.url) return []
              return fontFaceListSplitResMap.get(source.url) || []
            })

            const planSourceMap = MapGroupBy(splitSources, item => item.planId)

            return Array.from(planSourceMap.values()).map(sourceList => ({ meta: rest, sourceList }))
          })

          // 构建 font-face 配置
          const splitFontConfigList = await Promise.all(splitSourceList.map(async item => {
            const { sourceList, meta } = item
            const [firstSource] = sourceList
            const sources = await Promise.all(sourceList.map(async sourceItem => {
              const sourceUrl = await resolver(sourceItem.outputFile)
              return { url: sourceUrl, format: this.options.flavor }
            }))
            return { ...meta, sources, unicodeRange: firstSource.plan.unicodes }
          }))

          // 构建 font-face 样式
          const splitFontFace = buildFontFace(splitFontConfigList as FontConfig[])

          return { splitFontFace, assetName }
        }))

        hooks?.processFontFaceSplit.call({ match, fontFaceSplitAssets } as ProcessFontFaceSplitOpt)
      })
    })
  }
}
