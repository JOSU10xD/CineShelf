export interface ParsedConstraints {
    input: string;
    languages: string[];
    genres: { name: string; confidence: number }[];
    yearRange: { from: number; to: number };
    moods: string[];
    keywords: string[];
    confidence: number;
    explain: string;
}

export interface TasteProvider {
    parseTaste(text: string): Promise<ParsedConstraints>;
}
