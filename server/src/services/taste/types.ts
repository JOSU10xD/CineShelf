export interface ParsedConstraints {
    input: string;
    languages: string[];
    genres?: { name: string; id?: number; confidence: number }[];
    yearRange?: { from: number; to: number };
    moods?: string[];
    keywords?: string[];
    confidence: number;
    explain: string;
    randomize?: boolean;
    suggestedTitles?: string[];
}

export interface TasteProvider {
    parseTaste(text: string): Promise<ParsedConstraints>;
}
