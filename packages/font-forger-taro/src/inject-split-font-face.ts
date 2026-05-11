import { Compilation, Compiler } from 'webpack'
import { FontForgerPlugin, ProcessFontFaceSplitOpt } from '@font-forger/compiler'

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
      const hooks = FontForgerPlugin.getCompilationHooks(compilation)
      hooks?.processFontFaceSplit.tap(InjectSplitFontFacePlugin.pluginName, (processFontFaceSplitOpt: ProcessFontFaceSplitOpt) => {
        console.log({ processFontFaceSplitOpt })
      })
    })
  }
}
