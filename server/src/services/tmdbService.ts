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

    private async fetchGenres() {
        if (!this.apiKey) return;
        try {
            const response = await axios.get(`${TMDB_BASE_URL}/genre/movie/list`, {
                params: { api_key: this.apiKey },
            });
            this.genreList = response.data.genres;
            this.genreList.forEach((g) => {
                this.genres.set(g.name.toLowerCase(), g.id);
            });
            console.log(`Loaded ${this.genres.size} genres from TMDb`);
        } catch (error) {
            console.error('Failed to fetch genres:', error);
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
            });
            return response.data;
        } catch (error) {
            console.error('TMDb discover error:', error);
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
