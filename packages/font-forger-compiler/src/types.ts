import { Flavor, SubsetFontOpt } from '@font-forger/tools'
import { Source } from 'webpack-sources'

export interface FontSource {
    url?: string;
    format?: string;
}

export interface FontConfig {
    sources: FontSource[];
    family: string;
    style?: string;
    variant?: string;
    weight?: string;
    unicodeRange?: string
}

export type SplitFontPlan = Omit<SubsetFontOpt, 'fontPath'|'outputFile'|'flavor'>

export interface SplitFontOpt {
    fontPath:string
    flavor?: Flavor
    plans?: SplitFontPlan[]
    splitRemainder?: boolean
    remainingChunkSize?: number
}

export type CompilationAssets = Record<string, Source>;
