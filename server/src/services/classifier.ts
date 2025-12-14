import { TMDB_GENRES } from '../constants/genres';
import { OpenRouterAdapter } from './taste/openRouterAdapter';

const openRouter = new OpenRouterAdapter();
const AI_CONFIDENCE_THRESHOLD = 0.6;

interface ClassificationResult {
    genres: string[];
    genre_ids: number[];
    period?: {
        start: string;
        end: string;
    };
    confidence: number;
}

interface ClassificationInput {
    title?: string;
    overview?: string;
    release_date?: string;
    user_text?: string;
}

export const classifierService = {
    classify: async (input: ClassificationInput): Promise<ClassificationResult> => {
        // 1. Period Extraction
        let period: { start: string; end: string } | undefined;

        // Try precise release date first
        if (input.release_date) {
            const date = new Date(input.release_date);
            if (!isNaN(date.getTime())) {
                const year = date.getFullYear();
                // Determine decade
                const decadeStart = Math.floor(year / 10) * 10;
                period = {
                    start: `${decadeStart}-01-01`,
                    end: `${decadeStart + 9}-12-31`
                };
            }
        }

        // If no release date, try to parse year/range from text (simple regex)
        // We'll also check AI results later if this fails
        if (!period && (input.overview || input.user_text)) {
            const text = (input.overview || '') + ' ' + (input.user_text || '');
            const decadeMatch = text.match(/\b(19|20)(\d)(0)s?\b/);
            if (decadeMatch) {
                const year = parseInt(decadeMatch[1] + decadeMatch[2] + '0');
                period = {
                    start: `${year}-01-01`,
                    end: `${year + 9}-12-31`
                };
            }
        }

        const matchedGenreIds = new Set<number>();
        const matchedGenreNames: string[] = [];
        let confidence = 0.5;

        // 2. AI Classification (if user_text is present)
        if (input.user_text && input.user_text.trim().length > 5) {
            try {
                const aiResult = await openRouter.parseTaste(input.user_text);

                // Map AI genres to TMDB IDs
                if (aiResult.genres && Array.isArray(aiResult.genres)) {
                    aiResult.genres.forEach(g => {
                        // fuzzy match or direct match?
                        // OpenRouterAdapter prompt asks for "genres", we can map names
                        const genreName = g.name;
                        // Check exact match first
                        Object.entries(TMDB_GENRES).forEach(([name, id]) => {
                            if (name.toLowerCase() === genreName.toLowerCase()) {
                                matchedGenreIds.add(id);
                                if (!matchedGenreNames.includes(name)) matchedGenreNames.push(name);
                            } else if (genreName.toLowerCase().includes(name.toLowerCase())) {
                                // Partial match fallback
                                matchedGenreIds.add(id);
                                if (!matchedGenreNames.includes(name)) matchedGenreNames.push(name);
                            }
                        });
                    });
                }

                // AI period extraction if we missed it earlier
                if (!period && aiResult.yearRange) {
                    period = {
                        start: `${aiResult.yearRange.from}-01-01`,
                        end: `${aiResult.yearRange.to}-12-31`
                    };
                }

                confidence = aiResult.confidence || 0.8;

            } catch (error) {
                console.warn("AI classification failed, falling back to keywords:", error);
            }
        }

        // 3. Keyword Matcher Fallback / Supplement
        // If AI didn't find anything (or wasn't run), we use the keyword matcher on the combined text
        if (matchedGenreIds.size === 0) {
            const combinedText = ((input.title || '') + ' ' + (input.overview || '') + ' ' + (input.user_text || '')).toLowerCase();

            // Map common aliases to TMDB Genre Names
            const aliases: Record<string, string> = {
                "sci-fi": "Science Fiction",
                "scifi": "Science Fiction",
                "sf": "Science Fiction",
                "rom-com": "Romance",
                "romantic comedy": "Romance",
                "musical": "Music",
                "biography": "History",
                "superhero": "Action"
            };

            // Normalize text with aliases
            let processedText = combinedText;
            Object.entries(aliases).forEach(([alias, target]) => {
                if (processedText.includes(alias)) {
                    matchedGenreIds.add(TMDB_GENRES[target]);
                    if (!matchedGenreNames.includes(target)) matchedGenreNames.push(target);
                }
            });

            Object.entries(TMDB_GENRES).forEach(([name, id]) => {
                if (processedText.includes(name.toLowerCase())) {
                    matchedGenreIds.add(id);
                    if (!matchedGenreNames.includes(name)) matchedGenreNames.push(name);
                }
            });
            confidence = 0.5; // heuristic for keywords
        }

        // Default to Drama if nothing found, to ensure we get *some* results
        if (matchedGenreIds.size === 0) {
            matchedGenreIds.add(18); // Drama
            matchedGenreNames.push('Drama');
        }

        return {
            genres: matchedGenreNames,
            genre_ids: Array.from(matchedGenreIds),
            period,
            confidence
        };
    }
};
