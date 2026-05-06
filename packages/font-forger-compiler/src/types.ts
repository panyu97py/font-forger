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
