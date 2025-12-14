import axios from 'axios';
import dotenv from 'dotenv';
import NodeCache from 'node-cache';
import { ParsedConstraints, TasteProvider } from './types';

dotenv.config();

export class OpenRouterAdapter implements TasteProvider {
    private apiKey: string;
    private cache: NodeCache;
    private url = 'https://openrouter.ai/api/v1/chat/completions';

    constructor() {
        this.apiKey = process.env.OPENROUTER_API_KEY || '';
        this.cache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour

        if (!this.apiKey) {
            console.warn('OPENROUTER_API_KEY is not set. AI features will fail.');
        }
    }

    async parseTaste(text: string): Promise<ParsedConstraints> {
        const cacheKey = `taste_${text.toLowerCase().trim()}`;
        const cached = this.cache.get(cacheKey);
        if (cached) {
            // @ts-ignore
            return cached.data;
        }

        const models = [
            process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-exp:free',
            'meta-llama/llama-3.1-8b-instruct:free',
            'qwen/qwen-2-7b-instruct:free',
            'huggingfaceh4/zephyr-7b-beta:free'
        ];

        let lastError: any = null;

        for (const model of models) {
            try {
                console.log(`Using model: ${model}`);
                const response = await axios.post(
                    this.url,
                    {
                        model: model,
                        messages: [
                            {
                                role: 'system',
                                content: `You are a movie recommendation expert. Extract constraints from the user's taste text into JSON.
                                Output JSON ONLY. No markdown, no "json" tags.
                                Format:
                                {
                                    "input": "original text",
                                    "languages": ["iso-639-1 code"],
                                    "genres": [{"name": "genre name", "confidence": 0-1}],
                                    "yearRange": {"from": YYYY, "to": YYYY},
                                    "moods": ["mood"],
                                    "keywords": ["keyword"],
                                    "confidence": 0-1,
                                    "explain": "reasoning"
                                }
                                Detect "Mallu" or "Malayalam" as "ml". "Kollywood" or "Tamil" as "ta".
                                `
                            },
                            {
                                role: 'user',
                                content: text
                            }
                        ],
                        temperature: 0.1
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${this.apiKey}`,
                            'Content-Type': 'application/json',
                            'HTTP-Referer': 'https://cineshelf.app',
                            'X-Title': 'CineShelf'
                        },
                        timeout: 10000
                    }
                );

                let content = response.data.choices[0].message.content;
                // Clean code blocks
                if (content) {
                    content = content.replace(/```json/g, '').replace(/```/g, '').trim();
                }

                if (!content) {
                    throw new Error('Empty response from OpenRouter');
                }

                let result;
                try {
                    result = JSON.parse(content);
                } catch (parseError) {
                    console.log('Direct JSON parse failed, trying regex extraction...');
                    const jsonMatch = content.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        try {
                            result = JSON.parse(jsonMatch[0]);
                        } catch (e) {
                            throw new Error("Failed to parse extracted JSON");
                        }
                    } else {
                        throw new Error("No JSON found in response");
                    }
                }

                if (!result.yearRange) result.yearRange = { from: 1900, to: 2025 };

                // Cache success
                this.cache.set(cacheKey, { data: result, timestamp: Date.now() });
                return result;

            } catch (error: any) {
                console.warn(`Model ${model} failed (${error.message}), switching to fallback...`);
                lastError = error;
                // Continue to next model
            }
        }

        console.error("All AI models failed. Using Request-Based Local Fallback.");
        return this.parseConstraintsLocally(text);
    }

    private parseConstraintsLocally(text: string): ParsedConstraints {
        const lower = text.toLowerCase();

        // 1. Language Detection (Rule-based)
        const languages: string[] = [];
        if (lower.includes('mallu') || lower.includes('malayalam') || lower.includes('kerala')) languages.push('ml');
        if (lower.includes('tamil') || lower.includes('kollywood')) languages.push('ta');
        if (lower.includes('hindi') || lower.includes('bollywood')) languages.push('hi');
        if (lower.includes('english') || lower.includes('hollywood')) languages.push('en');
        if (lower.includes('korean') || lower.includes('kdrama')) languages.push('ko');
        if (lower.includes('japanese') || lower.includes('japan') || lower.includes('anime')) languages.push('ja');
        if (lower.includes('italian') || lower.includes('italy')) languages.push('it');
        if (lower.includes('french') || lower.includes('france')) languages.push('fr');
        if (lower.includes('spanish') || lower.includes('spain')) languages.push('es');
        if (lower.includes('german') || lower.includes('germany')) languages.push('de');
        if (lower.includes('chinese') || lower.includes('china')) languages.push('zh');
        if (lower.includes('russian') || lower.includes('russia')) languages.push('ru');
        if (lower.includes('telugu') || lower.includes('tollywood')) languages.push('te');

        // 2. Year/Decade Detection
        let from = 1970; // Default to somewhat modern
        let to = 2025;

        if (lower.includes('classic') || lower.includes('old') || lower.includes('vintage')) {
            from = 1950;
            to = 1999;
        } else if (lower.includes('90s')) {
            from = 1990;
            to = 1999;
        } else if (lower.includes('80s')) {
            from = 1980;
            to = 1989;
        } else if (lower.includes('70s')) {
            from = 1970;
            to = 1979;
        } else if (lower.includes('60s')) {
            from = 1960;
            to = 1969;
        } else if (lower.includes('2000s')) {
            from = 2000;
            to = 2009;
        } else if (lower.includes('2010s')) {
            from = 2010;
            to = 2019;
        } else if (lower.includes('new') || lower.includes('latest') || lower.includes('2024') || lower.includes('2025')) {
            from = 2023;
            to = 2025;
        }

        // 3. Genre/Keyword Detection (Simple inclusion)
        const genres = [];
        const knownGenres = ['action', 'adventure', 'animation', 'comedy', 'crime', 'documentary', 'drama', 'family', 'fantasy', 'history', 'horror', 'music', 'mystery', 'romance', 'science fiction', 'thriller', 'war', 'western'];

        for (const g of knownGenres) {
            if (lower.includes(g)) {
                genres.push({ name: g, confidence: 0.8 });
            }
        }

        // Special mappings
        // "sad" -> Drama
        if ((lower.includes('sad') || lower.includes('emotional') || lower.includes('tearjerker')) && !genres.some(g => g.name === 'drama')) genres.push({ name: 'drama', confidence: 0.8 });
        // "funny" -> Comedy
        if ((lower.includes('funny') || lower.includes('laugh') || lower.includes('humor')) && !genres.some(g => g.name === 'comedy')) genres.push({ name: 'comedy', confidence: 0.8 });
        // "happy ending" / "feel good" -> Comedy + Romance or Family
        if (lower.includes('happy ending') || lower.includes('feel good') || lower.includes('wholesome')) {
            if (!genres.some(g => g.name === 'comedy')) genres.push({ name: 'comedy', confidence: 0.6 });
            if (!genres.some(g => g.name === 'family')) genres.push({ name: 'family', confidence: 0.6 });
        }

        return {
            input: text,
            languages,
            genres,
            yearRange: { from, to },
            moods: [],
            keywords: [],
            confidence: 0.5,
            explain: "AI was busy, so we used keyword matching to find these."
        };
    }
}
