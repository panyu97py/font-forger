import { SubsetFontOpt } from '@font-forger/tools'

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

export type SplitFontPlan = Omit<SubsetFontOpt, 'fontPath'|'output'>

export interface SplitFontOpt {
    fontPath:string
    plans?: SplitFontPlan[]
}
