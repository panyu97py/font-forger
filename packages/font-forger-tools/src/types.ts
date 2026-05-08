export enum Flavor{
    WOFF2 = 'woff2',
    WOFF = 'woff3',
}
export interface SubsetFontOpt extends Record<string, any> {
    fontPath:string
    outputFile:string
    textFile?:string
    text?:string
    flavor?:Flavor
    unicodes?:string
}
