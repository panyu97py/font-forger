import type { IPluginContext } from '@tarojs/service'
import { FontForgerPlugin, FontForgerPluginOptions } from '@font-forger/compiler'
import { InjectSplitFontFacePlugin, InjectSplitFontFacePluginOpts } from './inject-split-font-face'

export type Opt = FontForgerPluginOptions&InjectSplitFontFacePluginOpts

export default (ctx: IPluginContext, opt: Opt) => {
  ctx.modifyWebpackChain(({ chain }) => {
    chain.plugin(FontForgerPlugin.pluginName).use(FontForgerPlugin, [opt])
    chain.plugin(InjectSplitFontFacePlugin.pluginName).use(InjectSplitFontFacePlugin, [opt])
  })
}
