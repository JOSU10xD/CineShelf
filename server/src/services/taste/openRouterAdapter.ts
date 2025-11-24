import axios from 'axios';
import { ParsedConstraints, TasteProvider } from './types';

export class OpenRouterAdapter implements TasteProvider {
    private apiKey: string;
    private url: string;

    private cache: Map<string, { data: ParsedConstraints; timestamp: number }> = new Map();
    private CACHE_TTL = (parseInt(process.env.RECOMM_CACHE_TTL_HOURS || '12') * 60 * 60 * 1000);

    constructor() {
        this.apiKey = process.env.OPENROUTER_API_KEY || '';
        this.url = process.env.OPENROUTER_URL || 'https://openrouter.ai/api/v1/chat/completions';
    }

    private getCacheKey(text: string): string {
        return text.trim().toLowerCase();
    }

    async parseTaste(text: string): Promise<ParsedConstraints> {
        const cacheKey = this.getCacheKey(text);
        const cached = this.cache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp < this.CACHE_TTL)) {
            console.log('Returning cached taste parse result');
            return cached.data;
        }

        const prompt = `
    Analyze the following movie taste description and extract structured constraints.
    Return ONLY valid JSON with this schema:
    {
      "input": "${text}",
      "languages": ["<iso-639-1>"],
      "genres": [{"name": "<genre>", "confidence": 0.0-1.0}],
      "yearRange": {"from": <year>, "to": <year>},
      "moods": ["<mood>"],
      "keywords": ["<keyword>"],
      "confidence": 0.0-1.0,
      "explain": "<short explanation>"
    }
    
    Input: "${text}"
    `;

        let retries = 0;
        const maxRetries = 3;

        while (retries <= maxRetries) {
            try {
                const response = await axios.post(
                    this.url,
                    {
                        model: process.env.OPENROUTER_MODEL || 'mistralai/mistral-7b-instruct:free',
                        messages: [{ role: 'user', content: prompt }],
                        temperature: 0.1,
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${this.apiKey}`,
                            'Content-Type': 'application/json',
                            'HTTP-Referer': 'https://cineshelf.app', // Required by OpenRouter
                            'X-Title': 'CineShelf', // Required by OpenRouter
                        },
                    }
                );

                const content = response.data.choices[0].message.content;
                // Basic cleanup to ensure JSON
                const jsonStr = content.replace(/```json/g, '').replace(/```/g, '').trim();
                const result = JSON.parse(jsonStr);

                // Cache success
                this.cache.set(cacheKey, { data: result, timestamp: Date.now() });

                // Prune cache if too big (simple check)
                if (this.cache.size > 100) {
                    const firstKey = this.cache.keys().next().value;
                    if (firstKey) this.cache.delete(firstKey);
                }

                return result;
            } catch (error: any) {
                if (error.response?.status === 429 && retries < maxRetries) {
                    const delay = Math.pow(2, retries) * 1000;
                    console.warn(`OpenRouter 429, retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    retries++;
                    continue;
                }
                console.error('OpenRouter parse error:', error?.response?.data || error.message);
                throw new Error('Failed to parse taste');
            }
        }
        throw new Error('Failed to parse taste after retries');
    }
}
