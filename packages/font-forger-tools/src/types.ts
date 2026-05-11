export enum Flavor{
    WOFF2 = 'woff2',
    WOFF = 'woff3',
}
export interface SubsetFontOpt {
    fontPath:string
    outputFile:string
    textFile?:string
    text?:string
    flavor?:Flavor
    unicodes?:string
}
