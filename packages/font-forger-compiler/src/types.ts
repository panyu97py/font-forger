import { Flavor, SubsetFontOpt } from '@font-forger/tools'

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
