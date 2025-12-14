import axios from 'axios';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

interface Genre {
    id: number;
    name: string;
}

class TmdbService {
    private apiKey: string = '';
    private genres: Map<string, number> = new Map();
    private genreList: Genre[] = [];

    initialize() {
        this.apiKey = process.env.TMDB_API_KEY || '';
        if (!this.apiKey) {
            console.warn('TMDB_API_KEY not set.');
        }
        this.fetchGenres();
    }

    private async fetchGenres(retries = 3, delay = 1000) {
        if (!this.apiKey) return;

        const https = require('https');

        const client = axios.create({
            baseURL: TMDB_BASE_URL,
            timeout: 10000,
            params: { api_key: this.apiKey },
            httpsAgent: new https.Agent({ family: 4 }) // Force IPv4
        });

        for (let i = 0; i < retries; i++) {
            try {
                const response = await client.get('/genre/movie/list');
                this.genreList = response.data.genres;
                this.genreList.forEach((g) => {
                    this.genres.set(g.name.toLowerCase(), g.id);
                });
                console.log(`Loaded ${this.genres.size} genres from TMDb`);
                return; // Success
            } catch (error: any) {
                const isLastAttempt = i === retries - 1;
                console.warn(`Attempt ${i + 1}/${retries} to fetch genres failed: ${error.message}`);

                if (isLastAttempt) {
                    console.error('Failed to fetch genres after multiple attempts. Server may not function correctly.');
                    // Don't crash the process, potentially retry later or run with empty genres
                } else {
                    await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i))); // Exponential backoff
                }
            }
        }
    }

    getGenreId(name: string): number | undefined {
        return this.genres.get(name.toLowerCase());
    }

    async discoverMovies(params: any) {
        try {
            const response = await axios.get(`${TMDB_BASE_URL}/discover/movie`, {
                params: {
                    api_key: this.apiKey,
                    include_adult: false,
                    include_video: false,
                    language: 'en-US',
                    sort_by: 'popularity.desc',
                    ...params,
                },
                timeout: 10000
            });
            return response.data;
        } catch (error: any) {
            console.error(`TMDb discover error: ${error.message}`);
            if (error.response) {
                console.error(`Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`);
            }
            return { results: [] };
        }
    }
    async healthCheck(): Promise<boolean> {
        try {
            await axios.get(`${TMDB_BASE_URL}/genre/movie/list`, {
                params: { api_key: this.apiKey },
            });
            return true;
        } catch (error) {
            return false;
        }
    }
}

export const tmdbService = new TmdbService();
