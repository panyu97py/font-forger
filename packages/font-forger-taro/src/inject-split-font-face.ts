import webpack, { Compilation, Compiler } from 'webpack'
import { FontForgerPlugin, ProcessFontFaceSplitOpt } from '@font-forger/compiler'
import { InjectDynamicStylePlugin } from '@taro-minify-pack/plugin-async-pack'
import postcss from 'postcss'

export interface InjectSplitFontFacePluginOpts {
  dynamic?: boolean
}

export class InjectSplitFontFacePlugin {
  private readonly options: InjectSplitFontFacePluginOpts

  public static readonly pluginName = 'InjectSplitFontFacePlugin'

  constructor (opts: Partial<InjectSplitFontFacePluginOpts>) {
    this.options = opts || {}
  }

  apply (compiler: Compiler) {
    compiler.hooks.thisCompilation.tap(InjectSplitFontFacePlugin.pluginName, (compilation: Compilation) => {
      const fontForgerPluginHooks = FontForgerPlugin.getCompilationHooks(compilation)
      const injectDynamicStylePluginHooks = InjectDynamicStylePlugin.getCompilationHooks(compilation)
      fontForgerPluginHooks?.processFontFaceSplit.tap(InjectSplitFontFacePlugin.pluginName, (processFontFaceSplitOpt: ProcessFontFaceSplitOpt) => {
        const { fontFaceSplitAssets = [], match } = processFontFaceSplitOpt
        fontFaceSplitAssets.forEach((fontFaceSplitAsset) => {
          const { assetName, splitFontFace } = fontFaceSplitAsset
          const asset = compilation.getAsset(assetName)
          const cssSource = asset?.source?.source().toString() || ''

          if (!cssSource) return
          const root = postcss.parse(cssSource)
          root.walkAtRules('font-face', (rule) => {
            rule.walkDecls(decl => {
              if (decl.prop === 'font-family' && match(decl.value)) rule.remove()
            })
          })
          if (!this.options.dynamic) splitFontFace.forEach(fontFace => root.append(fontFace.rule))
          compilation.updateAsset(assetName, new webpack.sources.RawSource(root.toString()))
        })

        if (!this.options.dynamic) return
        const dynamicStyleSheet = fontFaceSplitAssets.reduce((result, item) => {
          return result.concat(item.splitFontFace.map(item => item.code).join('/n'))
        }, '')
        injectDynamicStylePluginHooks?.emitDynamicStyle.call({ stylesheet: dynamicStyleSheet, key: 'font-face-split' })
      })
    })
  }
}
